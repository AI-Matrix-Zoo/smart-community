import express, { Response } from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, requirePropertyOrAdmin } from '../middleware/auth';
import { AuthenticatedRequest, Announcement } from '../types';

const router = express.Router();

// 验证schema
const announcementSchema = Joi.object({
  content: Joi.string().required().messages({
    'string.empty': '公告内容不能为空',
    'any.required': '公告内容是必填项'
  })
});

// 获取所有公告
router.get('/', (req, res: Response): void => {
  db.all(
    'SELECT * FROM announcements ORDER BY created_at DESC',
    [],
    (err: any, rows: any[]): void => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '获取公告失败'
        });
        return;
      }

      const announcements = rows.map(row => ({
        id: row.id,
        content: row.content,
        authorId: row.author_id,
        authorName: row.author_name,
        roleOfAuthor: row.role_of_author,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({
        success: true,
        data: announcements
      });
    }
  );
});

// 发布新公告（物业/管理员）
router.post('/', authenticateToken, requirePropertyOrAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = announcementSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { content } = req.body;
  const user = req.user!;
  const announcementId = `anno${Date.now()}`;

  db.run(
    `INSERT INTO announcements (id, content, author_id, author_name, role_of_author)
     VALUES (?, ?, ?, ?, ?)`,
    [announcementId, content, user.userId, user.name || user.phone || '未知用户', user.role],
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '发布公告失败'
        });
        return;
      }

      const newAnnouncement: Announcement = {
        id: announcementId,
        content,
        authorId: user.userId,
        authorName: user.name || user.phone || '未知用户',
        roleOfAuthor: user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: newAnnouncement,
        message: '公告发布成功'
      });
    }
  );
});

// 更新公告（仅限公告作者）
router.put('/:id', authenticateToken, requirePropertyOrAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = announcementSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { id } = req.params;
  const { content } = req.body;
  const user = req.user!;

  // 先检查公告是否存在且属于当前用户
  db.get(
    'SELECT author_id FROM announcements WHERE id = ?',
    [id],
    (err: any, announcement: any): void => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '服务器错误'
        });
        return;
      }

      if (!announcement) {
        res.status(404).json({
          success: false,
          message: '公告不存在'
        });
        return;
      }

      if (announcement.author_id !== user.userId) {
        res.status(403).json({
          success: false,
          message: '只能修改自己发布的公告'
        });
        return;
      }

      // 更新公告
      db.run(
        'UPDATE announcements SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, id],
        function(err: any): void {
          if (err) {
            res.status(500).json({
              success: false,
              message: '更新公告失败'
            });
            return;
          }

          res.json({
            success: true,
            message: '公告更新成功'
          });
        }
      );
    }
  );
});

// 删除公告（仅限公告作者）
router.delete('/:id', authenticateToken, requirePropertyOrAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const user = req.user!;

  // 先检查公告是否存在且属于当前用户
  db.get(
    'SELECT author_id FROM announcements WHERE id = ?',
    [id],
    (err: any, announcement: any): void => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '服务器错误'
        });
        return;
      }

      if (!announcement) {
        res.status(404).json({
          success: false,
          message: '公告不存在'
        });
        return;
      }

      if (announcement.author_id !== user.userId) {
        res.status(403).json({
          success: false,
          message: '只能删除自己发布的公告'
        });
        return;
      }

      // 删除公告
      db.run('DELETE FROM announcements WHERE id = ?', [id], function(err: any): void {
        if (err) {
          res.status(500).json({
            success: false,
            message: '删除公告失败'
          });
          return;
        }

        res.json({
          success: true,
          message: '公告删除成功'
        });
      });
    }
  );
});

export default router; 