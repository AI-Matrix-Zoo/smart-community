import express, { Request, Response } from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, requirePropertyOrAdmin } from '../middleware/auth';
import { AuthenticatedRequest, Suggestion, SuggestionStatus, SuggestionProgressUpdate, UserRole } from '../types';

const router = express.Router();

// 验证schemas
const suggestionSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': '标题不能为空',
    'any.required': '标题是必填项'
  }),
  description: Joi.string().required().messages({
    'string.empty': '描述不能为空',
    'any.required': '描述是必填项'
  }),
  category: Joi.string().required().messages({
    'string.empty': '分类不能为空',
    'any.required': '分类是必填项'
  })
});

const progressUpdateSchema = Joi.object({
  updateText: Joi.string().required().messages({
    'string.empty': '更新内容不能为空',
    'any.required': '更新内容是必填项'
  })
});

// 获取所有建议
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const query = `
    SELECT s.*, 
           GROUP_CONCAT(
             json_object(
               'update', sp.update_text,
               'date', sp.date,
               'by', sp.by_user,
               'byRole', sp.by_role
             )
           ) as progress_updates_json
    FROM suggestions s
    LEFT JOIN suggestion_progress sp ON s.id = sp.suggestion_id
    GROUP BY s.id
    ORDER BY s.submitted_date DESC
  `;

  db.all(query, [], (err: any, rows: any[]): void => {
    if (err) {
      res.status(500).json({
        success: false,
        message: '获取建议列表失败'
      });
      return;
    }

    const suggestions = rows.map(row => {
      let progressUpdates: SuggestionProgressUpdate[] = [];
      
      if (row.progress_updates_json) {
        try {
          const updates = row.progress_updates_json.split(',');
          progressUpdates = updates.map((update: string) => JSON.parse(update));
        } catch (e) {
          progressUpdates = [];
        }
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        submittedBy: row.submitted_by,
        submittedByUserId: row.submitted_by_user_id,
        submittedDate: row.submitted_date,
        status: row.status,
        progressUpdates
      };
    });

    res.json({
      success: true,
      data: suggestions
    });
  });
});

// 提交新建议
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = suggestionSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { title, description, category } = req.body;
  const user = req.user!;
  const suggestionId = `s${Date.now()}`;

  db.run(
    `INSERT INTO suggestions (id, title, description, category, submitted_by, submitted_by_user_id, submitted_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [suggestionId, title, description, category, user.name || user.phone, user.userId, new Date().toISOString(), SuggestionStatus.Submitted],
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '提交建议失败'
        });
        return;
      }

      const newSuggestion: Suggestion = {
        id: suggestionId,
        title,
        description,
        category,
        submittedBy: user.name || user.phone,
        submittedByUserId: user.userId,
        submittedDate: new Date().toISOString(),
        status: SuggestionStatus.Submitted,
        progressUpdates: []
      };

      res.status(201).json({
        success: true,
        data: newSuggestion,
        message: '建议提交成功'
      });
    }
  );
});

// 更新建议状态（物业/管理员）
router.put('/:id/status', authenticateToken, requirePropertyOrAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { status, progressUpdateText } = req.body;

  if (!Object.values(SuggestionStatus).includes(status)) {
    res.status(400).json({
      success: false,
      message: '无效的状态值'
    });
    return;
  }

  const user = req.user!;

  db.run(
    'UPDATE suggestions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '更新状态失败'
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

      // 添加进度更新
      if (progressUpdateText) {
        db.run(
          `INSERT INTO suggestion_progress (suggestion_id, update_text, date, by_user, by_role)
           VALUES (?, ?, ?, ?, ?)`,
          [id, progressUpdateText, new Date().toISOString(), user.name || user.phone, user.role],
          (progressErr: any): void => {
            if (progressErr) {
              console.error('Failed to add progress update:', progressErr);
            }
          }
        );
      }

      res.json({
        success: true,
        message: '状态更新成功'
      });
    }
  );
});

// 添加进度更新（物业/管理员）
router.post('/:id/progress', authenticateToken, requirePropertyOrAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = progressUpdateSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { id } = req.params;
  const { updateText } = req.body;
  const user = req.user!;

  // 先检查建议是否存在
  db.get('SELECT id FROM suggestions WHERE id = ?', [id], (err: any, suggestion: any): void => {
    if (err) {
      res.status(500).json({
        success: false,
        message: '服务器错误'
      });
      return;
    }

    if (!suggestion) {
      res.status(404).json({
        success: false,
        message: '建议不存在'
      });
      return;
    }

    // 添加进度更新
    db.run(
      `INSERT INTO suggestion_progress (suggestion_id, update_text, date, by_user, by_role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, updateText, new Date().toISOString(), user.name || user.phone, user.role],
      function(err: any): void {
        if (err) {
          res.status(500).json({
            success: false,
            message: '添加进度更新失败'
          });
          return;
        }

        res.json({
          success: true,
          message: '进度更新添加成功'
        });
      }
    );
  });
});

export default router; 