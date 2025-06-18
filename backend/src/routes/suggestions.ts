import express, { Request, Response } from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, requirePropertyOrAdmin, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, Suggestion, SuggestionStatus, SuggestionProgressUpdate, SuggestionComment, SuggestionLike, UserRole } from '../types';

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

const commentSchema = Joi.object({
  content: Joi.string().required().messages({
    'string.empty': '评论内容不能为空',
    'any.required': '评论内容是必填项'
  })
});

// 获取建议列表（按点赞数排序）- 支持游客访问
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  const currentUserId = req.user?.userId || '';

  // 获取所有建议
  db.all(
    `SELECT s.*, 
            u.is_verified as submitter_verified,
            COUNT(DISTINCT sl.id) as like_count,
            CASE WHEN EXISTS(
              SELECT 1 FROM suggestion_likes sl2 
              WHERE sl2.suggestion_id = s.id AND sl2.user_id = ?
            ) THEN 1 ELSE 0 END as is_liked_by_current_user
    FROM suggestions s
     LEFT JOIN users u ON s.submitted_by_user_id = u.id
     LEFT JOIN suggestion_likes sl ON s.id = sl.suggestion_id
    GROUP BY s.id
     ORDER BY like_count DESC, s.submitted_date DESC`,
    [currentUserId],
    (err: any, suggestions: any[]): void => {
      if (err) {
        console.error('获取建议列表失败:', err);
        res.status(500).json({
          success: false,
          message: '获取建议列表失败'
        });
        return;
      }

      if (suggestions.length === 0) {
        res.json({
          success: true,
          data: []
        });
        return;
      }

      // 获取所有建议的进度更新
      const suggestionIds = suggestions.map(s => s.id);
      const placeholders = suggestionIds.map(() => '?').join(',');

      db.all(
        `SELECT * FROM suggestion_progress WHERE suggestion_id IN (${placeholders}) ORDER BY date ASC`,
        suggestionIds,
        (progressErr: any, progressUpdates: any[]): void => {
          if (progressErr) {
            console.error('获取进度更新失败:', progressErr);
            res.status(500).json({
              success: false,
              message: '获取进度更新失败'
            });
            return;
          }

          // 获取所有建议的评论
          db.all(
            `SELECT sc.*, u.is_verified as user_verified 
             FROM suggestion_comments sc
             LEFT JOIN users u ON sc.user_id = u.id
             WHERE sc.suggestion_id IN (${placeholders}) 
             ORDER BY sc.created_at ASC`,
            suggestionIds,
            (commentErr: any, comments: any[]): void => {
              if (commentErr) {
                console.error('获取评论失败:', commentErr);
                res.status(500).json({
                  success: false,
                  message: '获取评论失败'
                });
                return;
              }

              // 组织数据
              const result = suggestions.map(suggestion => {
                const suggestionProgressUpdates = progressUpdates
                  .filter(update => update.suggestion_id === suggestion.id)
                  .map(update => ({
                    update: update.update_text,
                    date: update.date,
                    by: update.by_user,
                    byRole: update.by_role
                  }));

                const suggestionComments = comments
                  .filter(comment => comment.suggestion_id === suggestion.id)
                  .map(comment => ({
                    id: comment.id,
                    suggestionId: comment.suggestion_id,
                    userId: comment.user_id,
                    userName: comment.user_name,
                    content: comment.content,
                    createdAt: comment.created_at,
                    userVerified: comment.user_verified === 1
                  }));

                return {
                  id: suggestion.id,
                  title: suggestion.title,
                  description: suggestion.description,
                  category: suggestion.category,
                  submittedBy: suggestion.submitted_by || 'Unknown User',
                  submittedByUserId: suggestion.submitted_by_user_id,
                  submittedByUserVerified: suggestion.submitter_verified === 1,
                  submittedDate: suggestion.submitted_date,
                  status: suggestion.status,
                  progressUpdates: suggestionProgressUpdates,
                  comments: suggestionComments,
                  likeCount: suggestion.like_count,
                  isLikedByCurrentUser: suggestion.is_liked_by_current_user === 1
                };
              });

              res.json({
                success: true,
                data: result
              });
            }
          );
        }
      );
    }
  );
});

// 获取单个建议详情（支持分享功能）
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  const suggestionId = req.params.id;
  const currentUserId = req.user?.userId || '';

  // 获取建议详情
  db.get(
    `SELECT s.*,
            u.is_verified as submitter_verified,
            COUNT(DISTINCT sl.id) as like_count,
            CASE WHEN EXISTS(
              SELECT 1 FROM suggestion_likes sl2
              WHERE sl2.suggestion_id = s.id AND sl2.user_id = ?
            ) THEN 1 ELSE 0 END as is_liked_by_current_user
    FROM suggestions s
     LEFT JOIN users u ON s.submitted_by_user_id = u.id
     LEFT JOIN suggestion_likes sl ON s.id = sl.suggestion_id
    WHERE s.id = ?
    GROUP BY s.id`,
    [currentUserId, suggestionId],
    (err: any, suggestion: any): void => {
      if (err) {
        console.error('获取建议详情失败:', err);
        res.status(500).json({
          success: false,
          message: '获取建议详情失败'
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

      // 获取进度更新
      db.all(
        `SELECT * FROM suggestion_progress WHERE suggestion_id = ? ORDER BY date ASC`,
        [suggestionId],
        (progressErr: any, progressUpdates: any[]): void => {
          if (progressErr) {
            console.error('获取进度更新失败:', progressErr);
            res.status(500).json({
              success: false,
              message: '获取进度更新失败'
            });
            return;
          }

          // 获取评论
          db.all(
            `SELECT sc.*, u.is_verified as user_verified
             FROM suggestion_comments sc
             LEFT JOIN users u ON sc.user_id = u.id
             WHERE sc.suggestion_id = ?
             ORDER BY sc.created_at ASC`,
            [suggestionId],
            (commentErr: any, comments: any[]): void => {
              if (commentErr) {
                console.error('获取评论失败:', commentErr);
                res.status(500).json({
                  success: false,
                  message: '获取评论失败'
                });
                return;
              }

              // 组织数据
              const suggestionProgressUpdates = progressUpdates.map(update => ({
                update: update.update_text,
                date: update.date,
                by: update.by_user,
                byRole: update.by_role
              }));

              const suggestionComments = comments.map(comment => ({
                id: comment.id,
                suggestionId: comment.suggestion_id,
                userId: comment.user_id,
                userName: comment.user_name,
                content: comment.content,
                createdAt: comment.created_at,
                userVerified: comment.user_verified === 1
              }));

              const result = {
                id: suggestion.id,
                title: suggestion.title,
                description: suggestion.description,
                category: suggestion.category,
                submittedBy: suggestion.submitted_by || 'Unknown User',
                submittedByUserId: suggestion.submitted_by_user_id,
                submittedByUserVerified: suggestion.submitter_verified === 1,
                submittedDate: suggestion.submitted_date,
                status: suggestion.status,
                progressUpdates: suggestionProgressUpdates,
                comments: suggestionComments,
                likeCount: suggestion.like_count,
                isLikedByCurrentUser: suggestion.is_liked_by_current_user === 1
              };

              res.json({
                success: true,
                data: result
              });
            }
          );
        }
      );
    }
  );
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
    [suggestionId, title, description, category, user.name || user.email || 'Unknown User', user.userId, new Date().toISOString(), SuggestionStatus.Submitted],
    function(err: any): void {
      if (err) {
        console.error('提交建议失败:', err);
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
        submittedBy: user.name || user.email || 'Unknown User',
        submittedByUserId: user.userId,
        submittedDate: new Date().toISOString(),
        status: SuggestionStatus.Submitted,
        progressUpdates: [],
        comments: [],
        likeCount: 0,
        isLikedByCurrentUser: false
      };

      res.status(201).json({
        success: true,
        data: newSuggestion,
        message: '建议提交成功'
      });
    }
  );
});

// 添加评论
router.post('/:id/comments', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = commentSchema.validate(req.body);
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

  // 先检查建议是否存在
  db.get('SELECT id FROM suggestions WHERE id = ?', [id], (err: any, suggestion: any): void => {
    if (err) {
      console.error('检查建议存在性失败:', err);
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

    // 添加评论
    db.run(
      `INSERT INTO suggestion_comments (suggestion_id, user_id, user_name, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, user.userId, user.name || user.email || 'Unknown User', content, new Date().toISOString()],
      function(err: any): void {
        if (err) {
          console.error('添加评论失败:', err);
          res.status(500).json({
            success: false,
            message: '添加评论失败'
          });
          return;
        }

        const newComment: SuggestionComment = {
          id: this.lastID,
          suggestionId: id,
          userId: user.userId,
          userName: user.name || user.email || 'Unknown User',
          content,
          createdAt: new Date().toISOString()
        };

        res.status(201).json({
          success: true,
          data: newComment,
          message: '评论添加成功'
        });
      }
    );
  });
});

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const user = req.user!;

  // 先检查建议是否存在
  db.get('SELECT id FROM suggestions WHERE id = ?', [id], (err: any, suggestion: any): void => {
    if (err) {
      console.error('检查建议存在性失败:', err);
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

    // 检查是否已经点赞
    db.get(
      'SELECT id FROM suggestion_likes WHERE suggestion_id = ? AND user_id = ?',
      [id, user.userId],
      (likeErr: any, existingLike: any): void => {
        if (likeErr) {
          console.error('检查点赞状态失败:', likeErr);
          res.status(500).json({
            success: false,
            message: '服务器错误'
          });
          return;
        }

        if (existingLike) {
          // 取消点赞
          db.run(
            'DELETE FROM suggestion_likes WHERE suggestion_id = ? AND user_id = ?',
            [id, user.userId],
            function(deleteErr: any): void {
              if (deleteErr) {
                console.error('取消点赞失败:', deleteErr);
                res.status(500).json({
                  success: false,
                  message: '取消点赞失败'
                });
                return;
              }

              res.json({
                success: true,
                data: { isLiked: false },
                message: '取消点赞成功'
              });
            }
          );
        } else {
          // 添加点赞
          db.run(
            `INSERT INTO suggestion_likes (suggestion_id, user_id, created_at)
             VALUES (?, ?, ?)`,
            [id, user.userId, new Date().toISOString()],
            function(insertErr: any): void {
              if (insertErr) {
                console.error('点赞失败:', insertErr);
                res.status(500).json({
                  success: false,
                  message: '点赞失败'
                });
                return;
              }

              res.json({
                success: true,
                data: { isLiked: true },
                message: '点赞成功'
              });
            }
          );
        }
      }
    );
  });
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
        console.error('更新状态失败:', err);
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
          [id, progressUpdateText, new Date().toISOString(), user.name || user.email, user.role],
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
      console.error('检查建议存在性失败:', err);
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
      [id, updateText, new Date().toISOString(), user.name || user.email, user.role],
      function(err: any): void {
        if (err) {
          console.error('添加进度更新失败:', err);
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