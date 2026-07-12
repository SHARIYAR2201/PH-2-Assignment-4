import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { PaymentService } from './payment.service';
import { stripe } from '../../lib/stripe';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { RentalService } from '../rental/rental.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createPaymentSession(req.user!.userId, req.body.rentalOrderId);
  sendResponse(res, {
    statusCode: 201,
    message: 'Payment session created successfully. Redirect the customer to checkoutUrl.',
    data: result,
  });
});

const confirm = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(req.body.sessionId);
  sendResponse(res, { statusCode: 200, message: 'Payment confirmed successfully.', data: result });
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getHistoryForUser(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Payment history retrieved successfully.', data: result });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getById(req.params.id as string, req.user!);
  sendResponse(res, { statusCode: 200, message: 'Payment details retrieved successfully.', data: result });
});

// Optional real Stripe webhook (in addition to the manual /confirm endpoint).
// Requires STRIPE_WEBHOOK_SECRET and the raw body parser mounted on this route only.
const webhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
  } catch (err) {
    res.status(400).json({ success: false, message: `Webhook signature verification failed.`, errorDetails: null });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { id: string };
    const payment = await prisma.payment.findFirst({ where: { gatewaySessionId: session.id } });
    if (payment && payment.status !== 'COMPLETED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });
      await RentalService.markPaid(payment.rentalOrderId);
    }
  }

  res.status(200).json({ received: true });
});

export const PaymentController = { create, confirm, getHistory, getById, webhook };
