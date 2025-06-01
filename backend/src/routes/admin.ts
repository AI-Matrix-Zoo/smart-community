import express, { Response } from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest, User, UserRole } from '../types';

const router = express.Router();

// 验证schema
const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  building: Joi.string().optional(),
  room: Joi.string().optional()
});

// 获取所有用户（管理员）
router.get('/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  db.all(
    'SELECT id, phone, name, role, building, room, created_at, updated_at FROM users ORDER BY created_at DESC',
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
        name: row.name,
        role: row.role,
        building: row.building,
        room: row.room,
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

export default router; 