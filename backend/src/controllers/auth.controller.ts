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

  static async register(req: Request, res: Response) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.register(req.body, ipAddress);
      return sendSuccess(res, result, 'Đăng ký tài khoản thành công', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
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

  static async createUser(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Chưa xác thực người dùng', 401);
      const user = await AuthService.createUser(req.body, req.user.id);
      return sendSuccess(res, user, 'Thêm nhân viên mới thành công', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async toggleUserStatus(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Chưa xác thực người dùng', 401);
      const { id } = req.params;
      const updated = await AuthService.toggleUserStatus(id, req.user.id);
      return sendSuccess(res, updated, 'Cập nhật trạng thái người dùng thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

