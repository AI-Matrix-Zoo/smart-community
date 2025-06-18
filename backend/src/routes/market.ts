import express, { Response } from 'express';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../config/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, MarketItem } from '../types';

const router = express.Router();

// 显式处理OPTIONS预检请求
router.options('/', (req, res) => {
  console.log('Market route OPTIONS request from origin:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

router.options('*', (req, res) => {
  console.log('Market route wildcard OPTIONS request from origin:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

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
    cb(null, 'market-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片格式的文件'));
    }
  }
});

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
  imageUrls: Joi.array().items(Joi.string()).optional(), // 多图片数组
  contactInfo: Joi.string().optional().allow(''),
  seller: Joi.string().optional(),
  sellerUserId: Joi.string().optional()
});

// 获取所有市场物品（包含评论和点赞信息）
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  const currentUserId = req.user?.userId;

  db.all(
    `SELECT m.*, u.is_verified as seller_verified, u.building as seller_building, u.unit as seller_unit, u.room as seller_room
     FROM market_items m
     LEFT JOIN users u ON m.seller_user_id = u.id
     ORDER BY m.posted_date DESC`,
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
          
          // 获取评论（包含用户认证状态）
          db.all(
            `SELECT mic.*, u.is_verified as user_verified 
             FROM market_item_comments mic
             LEFT JOIN users u ON mic.user_id = u.id
             WHERE mic.market_item_id = ? 
             ORDER BY mic.created_at DESC`,
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
                          imageUrl: row.image_url || '',
                          imageUrls: (() => {
                            if (row.image_urls) {
                              try {
                                return JSON.parse(row.image_urls);
                              } catch (e) {
                                console.warn('Failed to parse image_urls for item:', row.id, e);
                                return [];
                              }
                            }
                            return [];
                          })(),
                          seller: row.seller,
                          sellerUserId: row.seller_user_id,
                          sellerVerified: row.seller_verified === 1,
                          sellerBuilding: row.seller_building,
                          sellerUnit: row.seller_unit,
                          sellerRoom: row.seller_room,
                          postedDate: row.posted_date,
                          contactInfo: row.contact_info,
                          comments: comments.map(comment => ({
                            id: comment.id,
                            marketItemId: comment.market_item_id,
                            userId: comment.user_id,
                            userName: comment.user_name,
                            userVerified: comment.user_verified === 1,
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
                      imageUrl: row.image_url || '',
                      imageUrls: (() => {
                        if (row.image_urls) {
                          try {
                            return JSON.parse(row.image_urls);
                          } catch (e) {
                            console.warn('Failed to parse image_urls for item:', row.id, e);
                            return [];
                          }
                        }
                        return [];
                      })(),
                      seller: row.seller,
                      sellerUserId: row.seller_user_id,
                      sellerVerified: row.seller_verified === 1,
                      postedDate: row.posted_date,
                      contactInfo: row.contact_info,
                      comments: comments.map(comment => ({
                        id: comment.id,
                        marketItemId: comment.market_item_id,
                        userId: comment.user_id,
                        userName: comment.user_name,
                        userVerified: comment.user_verified === 1,
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
router.post('/', authenticateToken, upload.array('images', 5), (req: AuthenticatedRequest, res: Response): void => {
  const { error } = marketItemSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: error.details[0].message
    });
    return;
  }

  const { title, description, price, category, contactInfo } = req.body;
  const user = req.user!;
  const itemId = `m${Date.now()}`;
  const uploadedFiles = req.files as Express.Multer.File[];

  // 如果没有上传图片，返回错误
  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400).json({
      success: false,
      message: '请至少上传一张物品图片'
    });
    return;
  }

  // 构建图片URL数组
  const imageUrls = uploadedFiles.map(file => `/uploads/${file.filename}`);
  const mainImageUrl = imageUrls[0]; // 第一张图作为主图

  // 序列化imageUrls为JSON字符串
  const imageUrlsJson = JSON.stringify(imageUrls);

  db.run(
    `INSERT INTO market_items (id, title, description, price, category, image_url, image_urls, seller, seller_user_id, posted_date, contact_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [itemId, title, description, price, category, mainImageUrl, imageUrlsJson, user.name || user.email || 'Unknown User', user.userId, new Date().toISOString(), contactInfo],
    function(err: any): void {
      if (err) {
        console.error('发布物品失败:', err);
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
        price: Number(price),
        category,
        imageUrl: mainImageUrl,
        imageUrls: imageUrls,
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

// 获取用户自己的物品 - 必须在 /:id 路由之前
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

      const items: MarketItem[] = rows.map((row: any) => {
        // 解析imageUrls JSON字符串
        let imageUrls: string[] = [];
        if (row.image_urls) {
          try {
            imageUrls = JSON.parse(row.image_urls);
          } catch (e) {
            console.warn('Failed to parse image_urls for item:', row.id, e);
            imageUrls = [];
          }
        }

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          category: row.category,
          imageUrl: row.image_url || '',
          imageUrls: imageUrls,
          seller: row.seller,
          sellerUserId: row.seller_user_id,
          sellerVerified: row.seller_verified === 1,
          postedDate: row.posted_date,
          contactInfo: row.contact_info
        };
      });

      res.json({
        success: true,
        data: items,
        message: '获取物品成功'
      });
    }
  );
});

// 获取单个物品详情（支持分享功能）
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  const itemId = req.params.id;
  const currentUserId = req.user?.userId;

  db.get(
    `SELECT m.*, u.is_verified as seller_verified, u.building as seller_building, u.unit as seller_unit, u.room as seller_room
     FROM market_items m
     LEFT JOIN users u ON m.seller_user_id = u.id
     WHERE m.id = ?`,
    [itemId],
    (err: any, row: any): void => {
      if (err) {
        res.status(500).json({
          success: false,
          message: '获取物品详情失败'
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

      // 获取评论（包含用户认证状态）
      db.all(
        `SELECT mic.*, u.is_verified as user_verified
         FROM market_item_comments mic
         LEFT JOIN users u ON mic.user_id = u.id
         WHERE mic.market_item_id = ?
         ORDER BY mic.created_at DESC`,
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
                      imageUrl: row.image_url || '',
                      imageUrls: (() => {
                        if (row.image_urls) {
                          try {
                            return JSON.parse(row.image_urls);
                          } catch (e) {
                            console.warn('Failed to parse image_urls for item:', row.id, e);
                            return [];
                          }
                        }
                        return [];
                      })(),
                      seller: row.seller,
                      sellerUserId: row.seller_user_id,
                      sellerVerified: row.seller_verified === 1,
                      sellerBuilding: row.seller_building,
                      sellerUnit: row.seller_unit,
                      sellerRoom: row.seller_room,
                      postedDate: row.posted_date,
                      contactInfo: row.contact_info,
                      comments: comments.map(comment => ({
                        id: comment.id,
                        marketItemId: comment.market_item_id,
                        userId: comment.user_id,
                        userName: comment.user_name,
                        userVerified: comment.user_verified === 1,
                        content: comment.content,
                        createdAt: comment.created_at
                      })),
                      likeCount,
                      isLikedByCurrentUser
                    };

                    res.json({
                      success: true,
                      data: item
                    });
                  }
                );
              } else {
                const item = {
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  price: row.price,
                  category: row.category,
                  imageUrl: row.image_url || '',
                  imageUrls: (() => {
                    if (row.image_urls) {
                      try {
                        return JSON.parse(row.image_urls);
                      } catch (e) {
                        console.warn('Failed to parse image_urls for item:', row.id, e);
                        return [];
                      }
                    }
                    return [];
                  })(),
                  seller: row.seller,
                  sellerUserId: row.seller_user_id,
                  sellerVerified: row.seller_verified === 1,
                  sellerBuilding: row.seller_building,
                  sellerUnit: row.seller_unit,
                  sellerRoom: row.seller_room,
                  postedDate: row.posted_date,
                  contactInfo: row.contact_info,
                  comments: comments.map(comment => ({
                    id: comment.id,
                    marketItemId: comment.market_item_id,
                    userId: comment.user_id,
                    userName: comment.user_name,
                    userVerified: comment.user_verified === 1,
                    content: comment.content,
                    createdAt: comment.created_at
                  })),
                  likeCount,
                  isLikedByCurrentUser: false
                };

                res.json({
                  success: true,
                  data: item
                });
              }
            }
          );
        }
      );
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