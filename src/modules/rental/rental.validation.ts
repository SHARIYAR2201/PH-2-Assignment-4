import { z } from 'zod';

export const createRentalSchema = z.object({
  body: z
    .object({
      startDate: z.coerce.date({ required_error: 'Start date is required' }),
      endDate: z.coerce.date({ required_error: 'End date is required' }),
      items: z
        .array(
          z.object({
            gearItemId: z.string({ required_error: 'gearItemId is required' }).uuid('Invalid gear item id'),
            quantity: z.number().int().positive().default(1),
          })
        )
        .min(1, 'At least one gear item is required'),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: 'endDate must be after startDate',
      path: ['endDate'],
    }),
});
