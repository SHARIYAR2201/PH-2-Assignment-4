import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate';
import { auth } from '../../middlewares/auth';
import { registerSchema, loginSchema } from './auth.validation';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/me', auth('CUSTOMER', 'PROVIDER', 'ADMIN'), AuthController.getMe);

export const AuthRoutes = router;
