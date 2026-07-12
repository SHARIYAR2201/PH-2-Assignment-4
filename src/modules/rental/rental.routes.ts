import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate';
import { createRentalSchema } from './rental.validation';
import { RentalController } from './rental.controller';

const router = Router();

router.post('/', auth('CUSTOMER'), validateRequest(createRentalSchema), RentalController.create);
router.get('/', auth('CUSTOMER'), RentalController.getMyOrders);
router.get('/:id', auth('CUSTOMER', 'PROVIDER', 'ADMIN'), RentalController.getById);
router.patch('/:id/cancel', auth('CUSTOMER'), RentalController.cancel);

export const RentalRoutes = router;
