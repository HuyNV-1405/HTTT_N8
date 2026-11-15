import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Thao tác thành công',
  statusCode = 200,
  meta?: ApiResponse['meta']
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message = 'Đã có lỗi xảy ra',
  statusCode = 400,
  error?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || undefined,
  });
};

