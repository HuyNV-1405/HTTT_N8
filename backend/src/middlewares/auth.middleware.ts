import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response.util';

export interface AuthenticatedUser {
  id: string;
  maNV: string;
  username: string;
  hoTen: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_wms_team8_2026';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Chưa đăng nhập hoặc token không hợp lệ', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ', 401);
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Yêu cầu xác thực tài khoản', 401);
    }

    // Role ADMIN luôn có toàn quyền
    if (req.user.role === Role.ADMIN || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return sendError(res, 'Bạn không có quyền thực hiện thao tác này', 403);
  };
};

