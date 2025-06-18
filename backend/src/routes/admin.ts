import express, { Response } from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest, User, UserRole } from '../types';

const router = express.Router();

// 验证schema
const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  building: Joi.string().optional(),
  unit: Joi.string().optional(),
  room: Joi.string().optional()
});

// 获取所有用户（管理员）
router.get('/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  db.all(
    'SELECT id, phone, email, name, role, building, unit, room, identity_image, is_verified, verified_at, verified_by, created_at, updated_at FROM users ORDER BY created_at DESC',
    [],
    (err: any, rows: any[]): void => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '获取用户列表失败'
        });
        return;
      }

      const users = rows.map(row => ({
        id: row.id,
        phone: row.phone,
        email: row.email,
        name: row.name,
        role: row.role,
        building: row.building,
        unit: row.unit,
        room: row.room,
        identity_image: row.identity_image,
        is_verified: Boolean(row.is_verified),
        verified_at: row.verified_at,
        verified_by: row.verified_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({
        success: true,
        data: users
      });
    }
  );
});

// 更新用户信息（管理员）
router.put('/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = updateUserSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { id } = req.params;
  const updates = req.body;

  // 构建动态更新查询
  const updateFields = [];
  const updateValues = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  if (updateFields.length === 0) {
    res.status(400).json({
      success: false,
      message: '没有提供要更新的字段'
    });
    return;
  }

  updateValues.push(id);

  db.run(
    `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    updateValues,
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '更新用户失败'
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

      res.json({
        success: true,
        message: '用户信息更新成功'
      });
    }
  );
});

// 删除用户（管理员）
router.delete('/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const currentUser = req.user!;

  // 防止删除自己
  if (id === currentUser.userId) {
    res.status(400).json({
      success: false,
      message: '不能删除自己的账户'
    });
    return;
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function(err: any): void {
    if (err) {
      res.status(500).json({
        success: false,
        message: '删除用户失败'
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

    res.json({
      success: true,
      message: '用户删除成功'
    });
  });
});

// 删除市场物品（管理员）
router.delete('/market/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  // 删除相关的评论和点赞
  db.run('DELETE FROM market_item_comments WHERE market_item_id = ?', [id]);
  db.run('DELETE FROM market_item_likes WHERE market_item_id = ?', [id]);

  db.run('DELETE FROM market_items WHERE id = ?', [id], function(err: any): void {
    if (err) {
      res.status(500).json({
        success: false,
        message: '删除物品失败'
      });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({
        success: false,
        message: '物品不存在'
      });
      return;
    }

    res.json({
      success: true,
      message: '物品删除成功'
    });
  });
});

// 删除建议（管理员）
router.delete('/suggestions/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  db.run('DELETE FROM suggestions WHERE id = ?', [id], function(err: any): void {
    if (err) {
      res.status(500).json({
        success: false,
        message: '删除建议失败'
      });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({
        success: false,
        message: '建议不存在'
      });
      return;
    }

    res.json({
      success: true,
      message: '建议删除成功'
    });
  });
});

// 认证用户（管理员）
router.post('/users/:id/verify', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const currentUser = req.user!;

  db.run(
    `UPDATE users SET is_verified = 1, verified_at = CURRENT_TIMESTAMP, verified_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [currentUser.name, id],
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '认证用户失败'
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

      res.json({
        success: true,
        message: '用户认证成功'
      });
    }
  );
});

// 取消用户认证（管理员）
router.post('/users/:id/unverify', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  db.run(
    `UPDATE users SET is_verified = 0, verified_at = NULL, verified_by = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id],
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '取消认证失败'
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

      res.json({
        success: true,
        message: '已取消用户认证'
      });
    }
  );
});

// 修改用户密码（管理员）
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: '新密码至少需要6位字符'
    });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    db.run(
      `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hashedPassword, id],
      function(err: any): void {
        if (err) {
          res.status(500).json({
            success: false,
            message: '修改密码失败'
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

        res.json({
          success: true,
          message: '用户密码修改成功'
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '密码加密失败'
    });
  }
});

export default router; 