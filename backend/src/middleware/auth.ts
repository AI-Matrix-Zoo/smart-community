import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload, UserRole } from '../types';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, message: '访问令牌缺失' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ success: false, message: '无效的访问令牌' });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: '权限不足' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requirePropertyOrAdmin = requireRole([UserRole.PROPERTY, UserRole.ADMIN]); 