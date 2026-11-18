import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import receiptRoutes from './receipt.routes';
import dispatchRoutes from './dispatch.routes';
import transferRoutes from './transfer.routes';
import inventoryRoutes from './inventory.routes';
import locationRoutes from './location.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/receipts', receiptRoutes);
router.use('/dispatches', dispatchRoutes);
router.use('/transfers', transferRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/locations', locationRoutes);
router.use('/notifications', notificationRoutes);

export default router;

