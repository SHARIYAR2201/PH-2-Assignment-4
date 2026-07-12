import { z } from 'zod';

export const createGearSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(2),
    description: z.string({ required_error: 'Description is required' }).min(10),
    brand: z.string().optional(),
    pricePerDay: z.number({ required_error: 'Price per day is required' }).positive('Price must be positive'),
    quantityTotal: z.number().int().positive().default(1),
    images: z.array(z.string().url('Each image must be a valid URL')).optional(),
    categoryId: z.string({ required_error: 'Category is required' }).uuid('Invalid category id'),
  }),
});

export const updateGearSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    brand: z.string().optional(),
    pricePerDay: z.number().positive().optional(),
    quantityTotal: z.number().int().positive().optional(),
    images: z.array(z.string().url()).optional(),
    categoryId: z.string().uuid().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const gearQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    search: z.string().optional(),
    available: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
