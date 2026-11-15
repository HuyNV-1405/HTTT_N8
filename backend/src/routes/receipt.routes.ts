import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Xem danh sách và chi tiết phiếu nhập
router.get('/', authenticate, ReceiptController.getAll);
router.get('/:id', authenticate, ReceiptController.getById);

// Lập phiếu nhập kho (Kho, Mua hàng, Quản lý, Admin)
router.post(
  '/',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO, Role.NHAN_VIEN_KHO, Role.NHAN_VIEN_MUA_HANG]),
  ReceiptController.create
);

// Phê duyệt phiếu nhập (Chỉ Quản lý kho và Admin) - KÍCH HOẠT TRANSACTION CỘNG TỒN
router.post(
  '/:id/approve',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO]),
  ReceiptController.approve
);

// Từ chối duyệt phiếu nhập
router.post(
  '/:id/reject',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO]),
  ReceiptController.reject
);

export default router;

