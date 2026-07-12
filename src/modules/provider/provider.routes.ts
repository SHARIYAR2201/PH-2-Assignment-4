import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate';
import { createGearSchema, updateGearSchema } from '../gear/gear.validation';
import { updateOrderStatusSchema } from './provider.validation';
import { ProviderController } from './provider.controller';

const router = Router();

router.use(auth('PROVIDER'));

// Gear inventory
router.post('/gear', validateRequest(createGearSchema), ProviderController.addGear);
router.get('/gear', ProviderController.getMyInventory);
router.put('/gear/:id', validateRequest(updateGearSchema), ProviderController.updateGear);
router.delete('/gear/:id', ProviderController.removeGear);

// Orders
router.get('/orders', ProviderController.getIncomingOrders);
router.patch(
  '/orders/:id',
  validateRequest(updateOrderStatusSchema),
  ProviderController.updateOrderStatus
);

export const ProviderRoutes = router;
