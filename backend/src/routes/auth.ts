import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest, UserRole, LoginRequest, RegisterRequest, SendVerificationCodeRequest, VerifyCodeRequest } from '../types';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';

const router = express.Router();

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
  name: Joi.string().optional(),
  building: Joi.string().optional(),
  unit: Joi.string().optional(),
  room: Joi.string().optional(),
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
    console.log('🔐 登录请求:', { body: req.body, headers: req.headers['content-type'] });
    
    const { error } = loginSchema.validate(req.body);
    if (error) {
      console.log('❌ 登录验证失败:', error.details[0].message);
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { identifier, password }: LoginRequest = req.body;
    console.log('🔍 登录尝试:', { identifier, passwordLength: password?.length });

    // 验证邮箱格式
    if (!isEmail(identifier) && !isPhoneNumber(identifier)) {
      console.log('❌ 邮箱或手机号格式无效:', identifier);
      res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址或手机号'
      });
      return;
    }

    // 查找用户
    db.get(
      `SELECT * FROM users WHERE email = ? OR phone = ?`,
      [identifier, identifier],
      async (err: any, user: any): Promise<void> => {
        if (err) {
          res.status(500).json({
            success: false,
            message: '服务器错误'
          });
          return;
        }

        if (!user) {
          res.status(401).json({
            success: false,
            message: '账号或密码错误'
          });
          return;
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          res.status(401).json({
            success: false,
            message: '账号或密码错误'
          });
          return;
        }

        // 生成JWT token
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const payload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          data: {
            user: userWithoutPassword,
            token
          }
        });
      }
    );
  } catch (error) {
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
    const { name, building, unit, room, password } = req.body;

    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (building !== undefined) {
      updateFields.push('building = ?');
      updateValues.push(building);
    }
    if (unit !== undefined) {
      updateFields.push('unit = ?');
      updateValues.push(unit);
    }
    if (room !== undefined) {
      updateFields.push('room = ?');
      updateValues.push(room);
    }
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
        'SELECT id, email, name, role, building, unit, room FROM users WHERE id = ?',
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
            data: updatedUser,
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

// 注册
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { identifier, password, name, building, unit, room, verificationCode, verificationType }: RegisterRequest = req.body;

    // 验证验证码
    const isCodeValid = VerificationCodeCache.verify(identifier, verificationCode);
    if (!isCodeValid) {
      res.status(400).json({
        success: false,
        message: '验证码错误或已过期'
      });
      return;
    }

    // 检查是否已存在
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

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const userId = `user${Date.now()}`;
        const displayName = `${name} (${building}-${unit}-${room})`;

        // 确定是邮箱还是手机号
        const isEmailIdentifier = isEmail(identifier);
        const email = isEmailIdentifier ? identifier : null;
        const phone = isEmailIdentifier ? null : identifier;

        db.run(
          `INSERT INTO users (id, email, phone, password, name, role, building, unit, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, email, phone, hashedPassword, displayName, UserRole.USER, building, unit, room],
          function(err: any): void {
            if (err) {
              console.error('Register error:', err);
              res.status(500).json({
                success: false,
                message: '注册失败'
              });
              return;
            }

            // 生成JWT token
            const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
            const payload = {
              userId,
              email: email,
              phone: phone,
              role: UserRole.USER,
              name: displayName
            };
            const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

            const newUser = {
              id: userId,
              email: email,
              phone: phone,
              name: displayName,
              role: UserRole.USER,
              building,
              unit,
              room
            };

            res.status(201).json({
              success: true,
              data: {
                user: newUser,
                token
              },
              message: '注册成功'
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router; 