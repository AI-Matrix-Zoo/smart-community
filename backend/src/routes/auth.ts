import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest, UserRole, LoginRequest, RegisterRequest, SendVerificationCodeRequest, VerifyCodeRequest } from '../types';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'identity-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 JPEG、PNG 和 PDF 格式的文件'));
    }
  }
});

// 验证码缓存
class VerificationCodeCache {
  private static cache = new Map<string, { code: string; expiry: number }>();

  static set(identifier: string, code: string, ttlMinutes: number = 5): void {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(identifier, { code, expiry });
    console.log(`🔐 验证码已设置: ${identifier} -> ${code}, 过期时间: ${new Date(expiry).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  }

  static get(identifier: string): string | null {
    const entry = this.cache.get(identifier);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(identifier);
      return null;
    }
    
    return entry.code;
  }

  static verify(identifier: string, code: string): boolean {
    const storedCode = this.get(identifier);
    console.log(`🔍 验证码验证: ${identifier}, 输入: ${code}, 存储: ${storedCode}`);
    if (!storedCode) return false;
    
    const isValid = storedCode === code;
    if (isValid) {
      this.cache.delete(identifier); // 验证成功后删除验证码
      console.log(`✅ 验证码验证成功: ${identifier}`);
    } else {
      console.log(`❌ 验证码验证失败: ${identifier}`);
    }
    
    return isValid;
  }

  static delete(identifier: string): void {
    this.cache.delete(identifier);
  }
}

// 生成6位数字验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证是否为邮箱
function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

// 验证是否为手机号
function isPhoneNumber(str: string): boolean {
  return /^1[3-9]\d{9}$/.test(str);
}

// 验证schemas
const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'string.empty': '邮箱或手机号不能为空',
    'any.required': '邮箱或手机号是必填项'
  }),
  password: Joi.string().required().messages({
    'string.empty': '密码不能为空',
    'any.required': '密码是必填项'
  })
});

const sendCodeSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'string.empty': '邮箱或手机号不能为空',
    'any.required': '邮箱或手机号是必填项'
  }),
  type: Joi.string().valid('email', 'sms').required().messages({
    'any.only': '验证类型必须是email或sms',
    'any.required': '验证类型是必填项'
  })
});

const registerSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'string.empty': '邮箱或手机号不能为空',
    'any.required': '邮箱或手机号是必填项'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少6位',
    'any.required': '密码是必填项'
  }),
  name: Joi.string().required().messages({
    'string.empty': '姓名不能为空',
    'any.required': '姓名是必填项'
  }),
  building: Joi.string().required().messages({
    'string.empty': '楼栋不能为空',
    'any.required': '楼栋是必填项'
  }),
  unit: Joi.string().required().messages({
    'string.empty': '单元号不能为空',
    'any.required': '单元号是必填项'
  }),
  room: Joi.string().required().messages({
    'string.empty': '房间号不能为空',
    'any.required': '房间号是必填项'
  }),
  verificationCode: Joi.string().length(6).required().messages({
    'string.length': '验证码必须是6位数字',
    'any.required': '验证码是必填项'
  }),
  verificationType: Joi.string().valid('email', 'sms').required().messages({
    'any.only': '验证类型必须是email或sms',
    'any.required': '验证类型是必填项'
  })
});

const updateUserSchema = Joi.object({
  password: Joi.string().min(6).optional().messages({
    'string.min': '密码至少6位'
  })
});

// 发送验证码
router.post('/send-verification-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = sendCodeSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { identifier, type }: SendVerificationCodeRequest = req.body;

    // 验证邮箱格式
    if (!isEmail(identifier) && !isPhoneNumber(identifier)) {
      res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址或手机号'
      });
      return;
    }

    // 检查是否已注册
    db.get(
      `SELECT id FROM users WHERE email = ? OR phone = ?`,
      [identifier, identifier],
      async (err: any, existingUser: any): Promise<void> => {
        if (err) {
          res.status(500).json({
            success: false,
            message: '服务器错误'
          });
          return;
        }

        if (existingUser) {
          res.status(400).json({
            success: false,
            message: '该邮箱或手机号已被注册'
          });
          return;
        }

        // 生成验证码
        const code = generateVerificationCode();
        VerificationCodeCache.set(identifier, code);

        try {
          // 发送邮箱验证码
          const emailSent = isEmail(identifier) ? await emailService.sendVerificationCode(identifier, code) : false;
          const smsSent = isPhoneNumber(identifier) ? await smsService.sendVerificationCode(identifier, code) : false;
          
          if (emailSent || smsSent) {
            res.json({
              success: true,
              message: '验证码已发送到您的邮箱或手机',
              data: { code } // 临时总是返回验证码便于测试
            });
          } else {
            res.status(500).json({
              success: false,
              message: '邮件或短信发送失败，请稍后重试'
            });
          }
        } catch (error) {
          console.error('发送邮件或短信验证码失败:', error);
          res.status(500).json({
            success: false,
            message: '邮件或短信发送失败，请稍后重试'
          });
        }
      }
    );
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 验证验证码
router.post('/verify-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, code, type }: VerifyCodeRequest = req.body;

    if (!identifier || !code || !type) {
      res.status(400).json({
        success: false,
        message: '标识符、验证码和类型不能为空'
      });
      return;
    }

    const isValid = VerificationCodeCache.verify(identifier, code);
    
    if (isValid) {
      res.json({
        success: true,
        message: '验证码验证成功'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '验证码错误或已过期'
      });
    }
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: '请输入姓名和密码'
      });
      return;
    }

    console.log('🔐 登录请求:', {
      body: { identifier, password: '***' },
      headers: 'application/json'
    });

    console.log('🔍 登录尝试:', { identifier, passwordLength: password.length });

    // 查找用户 - 支持姓名、邮箱或手机号登录
    db.get(
      `SELECT * FROM users WHERE name = ? OR email = ? OR phone = ?`,
      [identifier, identifier, identifier],
      async (err: any, user: any): Promise<void> => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({
            success: false,
            message: '服务器错误'
          });
          return;
        }

        if (!user) {
          res.status(401).json({
            success: false,
            message: '用户不存在'
          });
          return;
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          res.status(401).json({
            success: false,
            message: '密码错误'
          });
          return;
        }

        // 生成JWT token
        const jwtSecret = process.env.JWT_SECRET || 'smart-community-secret';
        console.log(`🔍 用户角色信息: ${user.name}, role: "${user.role}", type: ${typeof user.role}`);
        const payload = {
          userId: user.id,
          name: user.name,
          role: user.role || 'user',
          building: user.building,
          unit: user.unit,
          room: user.room
        };
        console.log(`🔑 JWT payload:`, payload);
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        const userResponse = {
          id: user.id,
          name: user.name,
          role: user.role || 'user',
          building: user.building,
          unit: user.unit,
          room: user.room,
          identityImage: user.identity_image
        };
        
        res.json({
          success: true,
          data: {
            user: userResponse,
            token
          },
          message: '登录成功'
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const user = req.user!;
    const { password } = req.body;

    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // 只允许更新密码
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
      return;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(user.userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(updateQuery, updateValues, function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '更新用户信息失败'
        });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 获取更新后的用户信息
      db.get(
        'SELECT id, email, phone, name, role, building, unit, room, identity_image FROM users WHERE id = ?',
        [user.userId],
        (selectErr: any, updatedUser: any): void => {
          if (selectErr) {
            res.status(500).json({
              success: false,
              message: '获取更新后的用户信息失败'
            });
            return;
          }

          res.json({
            success: true,
            data: {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              role: updatedUser.role,
              building: updatedUser.building,
              unit: updatedUser.unit,
              room: updatedUser.room,
              identityImage: updatedUser.identity_image
            },
            message: '用户信息更新成功'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 注册 - 支持JSON和multipart/form-data两种格式
router.post('/register', upload.single('identityImage'), async (req: Request, res: Response): Promise<void> => {
  try {
    // 支持两种数据格式：JSON和form-data
    let { name, email, phone, building, unit, room, password, identifier, verificationCode, verificationType } = req.body;
    const identityImage = req.file;

    // 如果使用identifier字段，判断是邮箱还是手机号
    if (identifier && !email && !phone) {
      if (isEmail(identifier)) {
        email = identifier;
      } else if (isPhoneNumber(identifier)) {
        phone = identifier;
      }
    }

    // 验证必填字段
    if (!name || !building || !unit || !room || !password) {
      res.status(400).json({
        success: false,
        message: '请填写完整的注册信息'
      });
      return;
    }

    // 如果提供了验证码，进行验证
    if (verificationCode && verificationType && identifier) {
      const isValidCode = VerificationCodeCache.verify(identifier, verificationCode);
      if (!isValidCode) {
        res.status(400).json({
          success: false,
          message: '验证码错误或已过期'
        });
        return;
      }
    }

    // 验证邮箱格式（如果提供了）
    if (email && !isEmail(email)) {
      res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
      return;
    }

    // 验证手机号格式（如果提供了）
    if (phone && !isPhoneNumber(phone)) {
      res.status(400).json({
            success: false,
        message: '请输入有效的手机号'
          });
          return;
        }

    // 检查姓名是否已被使用
    const existingUser = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE name = ?',
        [name],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

        if (existingUser) {
          res.status(400).json({
            success: false,
        message: '抱歉，已经有人使用过这个姓名了，请换一个'
          });
          return;
        }

    // 检查邮箱是否已被使用（如果提供了）
    if (email) {
      const existingEmail = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE email = ?',
          [email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: '该邮箱已被注册，请使用其他邮箱'
        });
        return;
      }
    }

    // 检查手机号是否已被使用（如果提供了）
    if (phone) {
      const existingPhone = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE phone = ?',
          [phone],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingPhone) {
        res.status(400).json({
          success: false,
          message: '该手机号已被注册，请使用其他手机号'
        });
        return;
      }
    }

    // 标准化地址格式
    let standardizedBuilding = building.trim();
    let standardizedUnit = unit.trim();
    let standardizedRoom = room.trim();

    // 标准化楼栋格式
    if (standardizedBuilding && !standardizedBuilding.includes('栋') && !standardizedBuilding.includes('座')) {
      standardizedBuilding = standardizedBuilding + '栋';
    }

    // 标准化单元格式
    if (standardizedUnit && !standardizedUnit.includes('单元')) {
      standardizedUnit = standardizedUnit + '单元';
    }

    // 检查房间是否已被注册
    const existingRoom = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE building = ? AND unit = ? AND room = ?',
        [standardizedBuilding, standardizedUnit, standardizedRoom],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingRoom) {
      res.status(400).json({
        success: false,
        message: '该房间已有住户注册，如有疑问请联系管理员'
      });
      return;
    }

    // 处理身份验证图片
    let identityImagePath = null;
    if (identityImage) {
      identityImagePath = `/uploads/${identityImage.filename}`;
    }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

    // 生成用户ID
        const userId = `user${Date.now()}`;

    // 如果没有提供phone，生成一个唯一的phone值
    if (!phone) {
      phone = `temp_${userId}`;
    }

    // 创建用户
    console.log(`🔄 开始插入用户: ${name}, 地址: ${standardizedBuilding}${standardizedUnit}${standardizedRoom}`);
    await new Promise<void>((resolve, reject) => {
        db.run(
        `INSERT INTO users (
          id, name, email, phone, building, unit, room, password, role,
          identity_image, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [userId, name, email || null, phone, standardizedBuilding, standardizedUnit, standardizedRoom, hashedPassword, 'USER', identityImagePath],
        function(err) {
            if (err) {
            console.error(`❌ 数据库插入失败:`, err);
            reject(err);
          } else {
            console.log(`✅ 数据库插入成功: 用户ID ${userId}, 影响行数: ${this.changes}`);
            resolve();
          }
        }
      );
    });

    // 清除验证码缓存
    if (identifier && verificationCode) {
      VerificationCodeCache.delete(identifier);
            }

            // 生成JWT token
    const token = jwt.sign(
      { 
              userId,
        name,
        email: email || null,
        phone: phone || null,
        building: standardizedBuilding,
        unit: standardizedUnit,
        room: standardizedRoom
      },
      process.env.JWT_SECRET || 'smart-community-secret',
      { expiresIn: '7d' }
    );

    console.log(`✅ 用户注册成功: ${name} (${standardizedBuilding}${standardizedUnit}${standardizedRoom})${email ? ` - 邮箱: ${email}` : ''}${phone ? ` - 手机: ${phone}` : ''}`);

            res.status(201).json({
              success: true,
      message: '注册成功！欢迎加入智慧小区',
              data: {
        token,
        user: {
          id: userId,
          name,
          email: email || null,
          phone: phone || null,
          building: standardizedBuilding,
          unit: standardizedUnit,
          room: standardizedRoom,
          identityImage: identityImagePath
        }
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

export default router; 