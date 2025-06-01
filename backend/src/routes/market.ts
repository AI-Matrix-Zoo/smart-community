import express, { Response } from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken } from '../middleware/auth';
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

// 获取所有市场物品
router.get('/', (req, res: Response): void => {
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

      const items = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        category: row.category,
        imageUrl: row.image_url,
        seller: row.seller,
        sellerUserId: row.seller_user_id,
        postedDate: row.posted_date,
        contactInfo: row.contact_info
      }));

      res.json({
        success: true,
        data: items
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
        contactInfo
      };

      res.status(201).json({
        success: true,
        data: newItem,
        message: '物品发布成功'
      });
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
        res.status(500).json({ error: '获取物品失败' });
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

      res.json(items);
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
        res.status(500).json({ error: '删除物品失败' });
        return;
      }

      if (!row) {
        res.status(404).json({ error: '物品不存在' });
        return;
      }

      if (row.seller_user_id !== user.userId) {
        res.status(403).json({ error: '无权删除此物品' });
        return;
      }

      // 删除物品
      db.run(
        `DELETE FROM market_items WHERE id = ?`,
        [itemId],
        function(err: any): void {
        if (err) {
            console.error('删除物品失败:', err);
            res.status(500).json({ error: '删除物品失败' });
          return;
        }

          res.json({ success: true, message: '物品删除成功' });
        }
      );
    }
  );
});

export default router; 