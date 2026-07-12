import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate';
import { createPaymentSchema, confirmPaymentSchema } from './payment.validation';
import { PaymentController } from './payment.controller';

const router = Router();

router.post('/create', auth('CUSTOMER'), validateRequest(createPaymentSchema), PaymentController.create);
router.post('/confirm', auth('CUSTOMER'), validateRequest(confirmPaymentSchema), PaymentController.confirm);
router.get('/', auth('CUSTOMER'), PaymentController.getHistory);
router.get('/:id', auth('CUSTOMER', 'ADMIN'), PaymentController.getById);

export const PaymentRoutes = router;
