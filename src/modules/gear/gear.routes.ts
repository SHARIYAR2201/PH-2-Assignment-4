import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate';
import { gearQuerySchema } from './gear.validation';
import { GearController } from './gear.controller';

const router = Router();

router.get('/', validateRequest(gearQuerySchema), GearController.getAll);
router.get('/:id', GearController.getById);

export const GearRoutes = router;
