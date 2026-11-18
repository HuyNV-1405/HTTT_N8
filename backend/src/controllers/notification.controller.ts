import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Yêu cầu đăng nhập', 401);
      }
      const notifications = await NotificationService.getNotificationsForUser(
        req.user.id,
        req.user.role
      );
      return sendSuccess(res, notifications, 'Lấy danh sách thông báo thành công');
    } catch (error: any) {
      return sendError(res, error.message || 'Lỗi khi lấy thông báo', 500);
    }
  }
}
