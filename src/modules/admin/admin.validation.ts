import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED'], {
      errorMap: () => ({ message: 'Status must be either ACTIVE or SUSPENDED' }),
    }),
  }),
});
