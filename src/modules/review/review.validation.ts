import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    gearItemId: z.string({ required_error: 'gearItemId is required' }).uuid('Invalid gear item id'),
    rating: z
      .number({ required_error: 'Rating is required' })
      .int()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    comment: z.string().max(1000).optional(),
  }),
});
