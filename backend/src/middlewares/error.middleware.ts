import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống nội bộ';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

