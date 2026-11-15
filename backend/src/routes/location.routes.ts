import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/warehouses', authenticate, LocationController.getWarehouses);
router.get('/', authenticate, LocationController.getLocations);

router.post(
  '/',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO]),
  LocationController.createLocation
);

router.patch(
  '/:id/status',
  authenticate,
  authorize([Role.ADMIN, Role.QUAN_LY_KHO, Role.NHAN_VIEN_KHO]),
  LocationController.updateStatus
);

export default router;

