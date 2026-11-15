import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.getMe);
router.get('/users', authenticate, authorize([Role.ADMIN, Role.QUAN_LY_KHO]), AuthController.getAllUsers);

export default router;

