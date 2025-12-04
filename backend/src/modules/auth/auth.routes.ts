import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from './auth.middleware';
import { validate } from '../../common/middleware/validation.middleware';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.me);

export default router;

