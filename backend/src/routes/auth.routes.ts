import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', authenticate, AuthController.getMe);
router.get('/users', authenticate, authorize([Role.ADMIN, Role.QUAN_LY_KHO]), AuthController.getAllUsers);
router.post('/users', authenticate, authorize([Role.ADMIN]), AuthController.createUser);
router.put('/users/:id/status', authenticate, authorize([Role.ADMIN]), AuthController.toggleUserStatus);

export default router;

