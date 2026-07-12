import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['CONFIRMED', 'CANCELLED', 'PICKED_UP', 'RETURNED'], {
      errorMap: () => ({
        message: 'Status must be one of CONFIRMED, CANCELLED, PICKED_UP, RETURNED',
      }),
    }),
  }),
});
