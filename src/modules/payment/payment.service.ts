import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { RentalService } from '../rental/rental.service';

const createPaymentSession = async (customerId: string, rentalOrderId: string) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: { items: { include: { gearItem: true } } },
  });
  if (!order) throw ApiError.notFound('Rental order not found.');
  if (order.customerId !== customerId) {
    throw ApiError.forbidden('You do not own this rental order.');
  }
  if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
    throw ApiError.badRequest(`Cannot initiate payment for an order with status ${order.status}.`);
  }

  const existingPending = await prisma.payment.findFirst({
    where: { rentalOrderId, status: 'PENDING' },
  });
  if (existingPending) {
    await prisma.payment.update({ where: { id: existingPending.id }, data: { status: 'FAILED' } });
  }

  const transactionId = `GEARUP-${randomUUID()}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.gearItem.title },
        unit_amount: Math.round(Number(item.pricePerDay) * 100),
      },
      quantity: item.quantity,
    })),
    metadata: { rentalOrderId, transactionId, customerId },
    success_url: `${env.stripe.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: env.stripe.cancelUrl,
  });

  const payment = await prisma.payment.create({
    data: {
      transactionId,
      amount: order.totalAmount,
      provider: 'STRIPE',
      status: 'PENDING',
      gatewaySessionId: session.id,
      rentalOrderId,
      customerId,
    },
  });

  return { payment, checkoutUrl: session.url };
};

const confirmPayment = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const payment = await prisma.payment.findFirst({ where: { gatewaySessionId: sessionId } });
  if (!payment) throw ApiError.notFound('Payment record not found for this session.');

  if (session.payment_status !== 'paid') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    throw ApiError.badRequest('Payment has not been completed yet.');
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
      method: session.payment_method_types?.[0] ?? 'card',
    },
  });

  await RentalService.markPaid(payment.rentalOrderId);

  return updatedPayment;
};

const getHistoryForUser = async (customerId: string) => {
  return prisma.payment.findMany({
    where: { customerId },
    include: { rentalOrder: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getAllForAdmin = async () => {
  return prisma.payment.findMany({
    include: { rentalOrder: true, customer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (id: string, requester: { userId: string; role: string }) => {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { rentalOrder: true } });
  if (!payment) throw ApiError.notFound('Payment not found.');
  if (requester.role !== 'ADMIN' && payment.customerId !== requester.userId) {
    throw ApiError.forbidden('You do not have access to this payment.');
  }
  return payment;
};

export const PaymentService = {
  createPaymentSession,
  confirmPayment,
  getHistoryForUser,
  getAllForAdmin,
  getById,
};
