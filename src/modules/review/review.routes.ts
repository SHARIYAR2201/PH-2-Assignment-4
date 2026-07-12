import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate';
import { createReviewSchema } from './review.validation';
import { ReviewController } from './review.controller';

const router = Router();

router.post('/', auth('CUSTOMER'), validateRequest(createReviewSchema), ReviewController.create);

export const ReviewRoutes = router;
