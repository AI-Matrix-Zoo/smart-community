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

// 可选的身份验证中间件 - 如果有token则验证，没有则继续
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // 没有token，继续处理但不设置用户信息
    next();
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      // token无效，继续处理但不设置用户信息
      next();
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      console.log('❌ 权限检查失败: 用户未认证');
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    console.log(`🔍 权限检查: 用户 ${req.user.name}, 角色 "${req.user.role}" (类型: ${typeof req.user.role}), 需要角色 [${roles.join(', ')}]`);
    console.log(`🔍 角色比较: "${req.user.role}" === "${UserRole.ADMIN}" ? ${req.user.role === UserRole.ADMIN}`);
    console.log(`🔍 includes检查: roles.includes("${req.user.role}") ? ${roles.includes(req.user.role)}`);

    if (!roles.includes(req.user.role)) {
      console.log(`❌ 权限检查失败: 角色 "${req.user.role}" 不在允许列表中`);
      res.status(403).json({ success: false, message: '权限不足' });
      return;
    }

    console.log(`✅ 权限检查通过: 用户 ${req.user.name} 具有 ${req.user.role} 权限`);
    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requirePropertyOrAdmin = requireRole([UserRole.PROPERTY, UserRole.ADMIN]); 