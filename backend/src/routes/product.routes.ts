import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Lấy danh mục, nhà cung cấp, khách hàng
router.get('/categories', ProductController.getCategories);
router.get('/suppliers', ProductController.getSuppliers);
router.get('/customers', ProductController.getCustomers);

// Quản lý hàng hóa
router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);

// Thêm, sửa, xóa yêu cầu quyền Admin hoặc Quản lý kho, Nhân viên mua hàng
router.post(
  '/',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO, Role.NHAN_VIEN_MUA_HANG]),
  ProductController.create
);
router.put(
  '/:id',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO, Role.NHAN_VIEN_MUA_HANG]),
  ProductController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO]),
  ProductController.delete
);

export default router;

