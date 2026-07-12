import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from './category.validation';
import { CategoryController } from './category.controller';

const router = Router();

// Public
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);

// Admin only
router.post('/', auth('ADMIN'), validateRequest(createCategorySchema), CategoryController.create);
router.put('/:id', auth('ADMIN'), validateRequest(updateCategorySchema), CategoryController.update);
router.delete('/:id', auth('ADMIN'), CategoryController.remove);

export const CategoryRoutes = router;
