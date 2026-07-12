import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    rentalOrderId: z.string({ required_error: 'rentalOrderId is required' }).uuid('Invalid rental order id'),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    sessionId: z.string({ required_error: 'sessionId is required' }),
  }),
});
