import express, { Response } from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, MarketItem } from '../types';

const router = express.Router();

// 验证schema
const marketItemSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': '标题不能为空',
    'any.required': '标题是必填项'
  }),
  description: Joi.string().required().messages({
    'string.empty': '描述不能为空',
    'any.required': '描述是必填项'
  }),
  price: Joi.number().positive().required().messages({
    'number.positive': '价格必须大于0',
    'any.required': '价格是必填项'
  }),
  category: Joi.string().required().messages({
    'string.empty': '分类不能为空',
    'any.required': '分类是必填项'
  }),
  imageUrl: Joi.string().optional().allow(''),
  contactInfo: Joi.string().optional().allow(''),
  seller: Joi.string().optional(),
  sellerUserId: Joi.string().optional()
});

// 获取所有市场物品（包含评论和点赞信息）
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  const currentUserId = req.user?.userId;

  db.all(
    'SELECT * FROM market_items ORDER BY posted_date DESC',
    [],
    (err: any, rows: any[]): void => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '获取市场物品失败'
        });
        return;
      }

      // 为每个物品获取评论和点赞信息
      const itemPromises = rows.map((row: any) => {
        return new Promise((resolve) => {
          const itemId = row.id;
          
          // 获取评论
          db.all(
            'SELECT * FROM market_item_comments WHERE market_item_id = ? ORDER BY created_at DESC',
            [itemId],
            (commentErr: any, comments: any[]) => {
              if (commentErr) {
                console.error('获取评论失败:', commentErr);
                comments = [];
              }

              // 获取点赞数量
              db.get(
                'SELECT COUNT(*) as count FROM market_item_likes WHERE market_item_id = ?',
                [itemId],
                (likeCountErr: any, likeCountRow: any) => {
                  if (likeCountErr) {
                    console.error('获取点赞数量失败:', likeCountErr);
                  }

                  const likeCount = likeCountRow?.count || 0;

                  // 检查当前用户是否已点赞
                  if (currentUserId) {
                    db.get(
                      'SELECT id FROM market_item_likes WHERE market_item_id = ? AND user_id = ?',
                      [itemId, currentUserId],
                      (userLikeErr: any, userLikeRow: any) => {
                        const isLikedByCurrentUser = !!userLikeRow;

                        const item = {
                          id: row.id,
                          title: row.title,
                          description: row.description,
                          price: row.price,
                          category: row.category,
                          imageUrl: row.image_url,
                          seller: row.seller,
                          sellerUserId: row.seller_user_id,
                          postedDate: row.posted_date,
                          contactInfo: row.contact_info,
                          comments: comments.map(comment => ({
                            id: comment.id,
                            marketItemId: comment.market_item_id,
                            userId: comment.user_id,
                            userName: comment.user_name,
                            content: comment.content,
                            createdAt: comment.created_at
                          })),
                          likeCount,
                          isLikedByCurrentUser
                        };

                        resolve(item);
                      }
                    );
                  } else {
                    const item = {
                      id: row.id,
                      title: row.title,
                      description: row.description,
                      price: row.price,
                      category: row.category,
                      imageUrl: row.image_url,
                      seller: row.seller,
                      sellerUserId: row.seller_user_id,
                      postedDate: row.posted_date,
                      contactInfo: row.contact_info,
                      comments: comments.map(comment => ({
                        id: comment.id,
                        marketItemId: comment.market_item_id,
                        userId: comment.user_id,
                        userName: comment.user_name,
                        content: comment.content,
                        createdAt: comment.created_at
                      })),
                      likeCount,
                      isLikedByCurrentUser: false
                    };

                    resolve(item);
                  }
                }
              );
            }
          );
        });
      });

      Promise.all(itemPromises).then((items) => {
        res.json({
          success: true,
          data: items
        });
      });
    }
  );
});

// 发布新物品
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { error } = marketItemSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { title, description, price, category, imageUrl, contactInfo } = req.body;
  const user = req.user!;
  const itemId = `m${Date.now()}`;

  db.run(
    `INSERT INTO market_items (id, title, description, price, category, image_url, seller, seller_user_id, posted_date, contact_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [itemId, title, description, price, category, imageUrl, user.name || user.email || 'Unknown User', user.userId, new Date().toISOString(), contactInfo],
    function(err: any): void {
      if (err) {
        res.status(500).json({
          success: false,
          message: '发布物品失败'
        });
        return;
      }

      const newItem: MarketItem = {
        id: itemId,
        title,
        description,
        price,
        category,
        imageUrl: imageUrl || '',
        seller: user.name || user.email || 'Unknown User',
        sellerUserId: user.userId,
        postedDate: new Date().toISOString(),
        contactInfo,
        comments: [],
        likeCount: 0,
        isLikedByCurrentUser: false
      };

      res.status(201).json({
        success: true,
        data: newItem,
        message: '物品发布成功'
      });
    }
  );
});

// 添加评论
router.post('/:id/comments', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const itemId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({
      success: false,
      message: '评论内容不能为空'
    });
    return;
  }

  // 检查物品是否存在
  db.get(
    'SELECT id FROM market_items WHERE id = ?',
    [itemId],
    (err: any, row: any) => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '添加评论失败'
        });
        return;
      }

      if (!row) {
        res.status(404).json({
          success: false,
          message: '物品不存在'
        });
        return;
      }

      // 添加评论
      db.run(
        'INSERT INTO market_item_comments (market_item_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?)',
        [itemId, user.userId, user.name || user.email || 'Unknown User', content.trim(), new Date().toISOString()],
        function(err: any) {
          if (err) {
            res.status(500).json({
              success: false,
              message: '添加评论失败'
            });
            return;
          }

          const comment = {
            id: this.lastID,
            marketItemId: itemId,
            userId: user.userId,
            userName: user.name || user.email || 'Unknown User',
            content: content.trim(),
            createdAt: new Date().toISOString()
          };

          res.status(201).json({
            success: true,
            data: comment,
            message: '评论添加成功'
          });
        }
      );
    }
  );
});

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const itemId = req.params.id;

  // 检查物品是否存在
  db.get(
    'SELECT id FROM market_items WHERE id = ?',
    [itemId],
    (err: any, row: any) => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '点赞操作失败'
        });
        return;
      }

      if (!row) {
        res.status(404).json({
          success: false,
          message: '物品不存在'
        });
        return;
      }

      // 检查用户是否已经点赞
      db.get(
        'SELECT id FROM market_item_likes WHERE market_item_id = ? AND user_id = ?',
        [itemId, user.userId],
        (err: any, likeRow: any) => {
          if (err) {
            res.status(500).json({
              success: false,
              message: '点赞操作失败'
            });
            return;
          }

          if (likeRow) {
            // 已点赞，取消点赞
            db.run(
              'DELETE FROM market_item_likes WHERE market_item_id = ? AND user_id = ?',
              [itemId, user.userId],
              (err: any) => {
                if (err) {
                  res.status(500).json({
                    success: false,
                    message: '取消点赞失败'
                  });
                  return;
                }

                res.json({
                  success: true,
                  data: { isLiked: false },
                  message: '已取消点赞'
                });
              }
            );
          } else {
            // 未点赞，添加点赞
            db.run(
              'INSERT INTO market_item_likes (market_item_id, user_id, created_at) VALUES (?, ?, ?)',
              [itemId, user.userId, new Date().toISOString()],
              (err: any) => {
                if (err) {
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
    }
  );
});

// 获取用户自己的物品
router.get('/my-items', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;

  db.all(
    `SELECT * FROM market_items WHERE seller_user_id = ? ORDER BY posted_date DESC`,
    [user.userId],
    (err: any, rows: any[]): void => {
      if (err) {
        console.error('获取用户物品失败:', err);
        res.status(500).json({ 
          success: false,
          message: '获取物品失败' 
        });
        return;
      }

      const items: MarketItem[] = rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        category: row.category,
        imageUrl: row.image_url || '',
        seller: row.seller,
        sellerUserId: row.seller_user_id,
        postedDate: row.posted_date,
        contactInfo: row.contact_info
      }));

      res.json({
        success: true,
        data: items,
        message: '获取物品成功'
      });
    }
  );
});

// 删除物品
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const itemId = req.params.id;

  // 首先检查物品是否属于当前用户
  db.get(
    `SELECT seller_user_id FROM market_items WHERE id = ?`,
    [itemId],
    (err: any, row: any): void => {
      if (err) {
        console.error('查询物品失败:', err);
        res.status(500).json({ 
          success: false,
          message: '删除物品失败' 
        });
        return;
      }

      if (!row) {
        res.status(404).json({ 
          success: false,
          message: '物品不存在' 
        });
        return;
      }

      if (row.seller_user_id !== user.userId) {
        res.status(403).json({ 
          success: false,
          message: '无权删除此物品' 
        });
        return;
      }

      // 删除相关的评论和点赞
      db.run('DELETE FROM market_item_comments WHERE market_item_id = ?', [itemId]);
      db.run('DELETE FROM market_item_likes WHERE market_item_id = ?', [itemId]);

      // 删除物品
      db.run(
        `DELETE FROM market_items WHERE id = ?`,
        [itemId],
        function(err: any): void {
        if (err) {
            console.error('删除物品失败:', err);
            res.status(500).json({ 
              success: false,
              message: '删除物品失败' 
            });
          return;
        }

          res.json({ 
            success: true, 
            message: '物品删除成功' 
          });
        }
      );
    }
  );
});

export default router; 