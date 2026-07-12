import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate';
import { updateUserStatusSchema } from './admin.validation';
import { AdminController } from './admin.controller';

const router = Router();

router.use(auth('ADMIN'));

router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id', validateRequest(updateUserStatusSchema), AdminController.updateUserStatus);
router.get('/gear', AdminController.getAllGear);
router.get('/rentals', AdminController.getAllRentals);

export const AdminRoutes = router;
