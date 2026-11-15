import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return sendError(res, 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu', 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.login(username, password, ipAddress);

      return sendSuccess(res, result, 'Đăng nhập thành công');
    } catch (error: any) {
      return sendError(res, error.message, 401);
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Chưa xác thực người dùng', 401);
      }
      const user = await AuthService.getProfile(req.user.id);
      return sendSuccess(res, user, 'Lấy thông tin người dùng thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await AuthService.getAllUsers();
      return sendSuccess(res, users, 'Lấy danh sách người dùng thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

