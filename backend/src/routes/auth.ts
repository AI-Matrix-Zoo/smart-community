import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import Joi from 'joi';
import { db } from '../config/database';
import { LoginRequest, RegisterRequest, ApiResponse, User, UserRole } from '../types';

const router = express.Router();

// 验证schemas
const loginSchema = Joi.object({
  phone: Joi.string().required().messages({
    'string.empty': '手机号不能为空',
    'any.required': '手机号是必填项'
  }),
  password: Joi.string().required().messages({
    'string.empty': '密码不能为空',
    'any.required': '密码是必填项'
  })
});

const registerSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '请输入有效的手机号',
    'any.required': '手机号是必填项'
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
  room: Joi.string().required().messages({
    'string.empty': '房间号不能为空',
    'any.required': '房间号是必填项'
  })
});

// 登录
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { phone, password }: LoginRequest = req.body;

    // 查找用户
    db.get(
      'SELECT * FROM users WHERE phone = ?',
      [phone],
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
            message: '手机号或密码错误'
          });
          return;
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          res.status(401).json({
            success: false,
            message: '手机号或密码错误'
          });
          return;
        }

        // 生成JWT token
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const payload = {
          userId: user.id,
          phone: user.phone,
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

    const { phone, password, name, building, room }: RegisterRequest = req.body;

    // 检查手机号是否已存在
    db.get(
      'SELECT id FROM users WHERE phone = ?',
      [phone],
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
            message: '该手机号已被注册'
          });
          return;
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const userId = `user${Date.now()}`;
        const displayName = `${name} (${building}-${room})`;

        db.run(
          `INSERT INTO users (id, phone, password, name, role, building, room)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, phone, hashedPassword, displayName, UserRole.USER, building, room],
          function(err: any): void {
            if (err) {
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
              phone,
              role: UserRole.USER,
              name: displayName
            };
            const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

            const newUser = {
              id: userId,
              phone,
              name: displayName,
              role: UserRole.USER,
              building,
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
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router; 