import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { CategoryRoutes } from '../modules/category/category.routes';
import { GearRoutes } from '../modules/gear/gear.routes';
import { RentalRoutes } from '../modules/rental/rental.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { ProviderRoutes } from '../modules/provider/provider.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';

const router = Router();

const moduleRoutes = [
  { path: '/auth', route: AuthRoutes },
  { path: '/categories', route: CategoryRoutes },
  { path: '/gear', route: GearRoutes },
  { path: '/rentals', route: RentalRoutes },
  { path: '/payments', route: PaymentRoutes },
  { path: '/provider', route: ProviderRoutes },
  { path: '/reviews', route: ReviewRoutes },
  { path: '/admin', route: AdminRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export const AppRoutes = router;
