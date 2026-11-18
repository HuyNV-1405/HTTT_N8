import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Lấy danh sách thông báo của người dùng hiện tại
router.get('/', authenticate, NotificationController.getMyNotifications);

export default router;
