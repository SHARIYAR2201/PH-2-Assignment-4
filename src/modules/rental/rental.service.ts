import { Prisma, RentalStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

interface RentalItemInput {
  gearItemId: string;
  quantity: number;
}

interface CreateRentalInput {
  startDate: Date;
  endDate: Date;
  items: RentalItemInput[];
}

const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'], // payment moves it to PAID via payment module, not this endpoint
  PAID: ['PICKED_UP'],
  PICKED_UP: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
};

const getDaysBetween = (start: Date, end: Date) => {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const create = async (customerId: string, payload: CreateRentalInput) => {
  const days = getDaysBetween(payload.startDate, payload.endDate);

  return prisma.$transaction(async (tx) => {
    let totalAmount = new Prisma.Decimal(0);
    const itemsData: {
      gearItemId: string;
      quantity: number;
      pricePerDay: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }[] = [];

    for (const item of payload.items) {
      const gear = await tx.gearItem.findFirst({ where: { id: item.gearItemId, isDeleted: false } });
      if (!gear) {
        throw ApiError.badRequest(`Gear item ${item.gearItemId} not found.`);
      }
      if (!gear.isAvailable) {
        throw ApiError.badRequest(`Gear item "${gear.title}" is currently unavailable.`);
      }
      const availableQty = gear.quantityTotal - gear.quantityInUse;
      if (item.quantity > availableQty) {
        throw ApiError.badRequest(
          `Only ${availableQty} unit(s) of "${gear.title}" are available for the selected dates.`
        );
      }

      const subtotal = gear.pricePerDay.mul(item.quantity).mul(days);
      totalAmount = totalAmount.add(subtotal);

      itemsData.push({
        gearItemId: gear.id,
        quantity: item.quantity,
        pricePerDay: gear.pricePerDay,
        subtotal,
      });

      await tx.gearItem.update({
        where: { id: gear.id },
        data: { quantityInUse: { increment: item.quantity } },
      });
    }

    const order = await tx.rentalOrder.create({
      data: {
        customerId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        totalAmount,
        items: { create: itemsData },
      },
      include: { items: { include: { gearItem: true } } },
    });

    return order;
  });
};

const getCustomerOrders = async (customerId: string) => {
  return prisma.rentalOrder.findMany({
    where: { customerId },
    include: { items: { include: { gearItem: true } }, payments: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getOrderById = async (id: string, requester: { userId: string; role: string }) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      items: { include: { gearItem: true } },
      payments: true,
      customer: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) throw ApiError.notFound('Rental order not found.');

  if (requester.role === 'ADMIN') return order;
  if (requester.role === 'CUSTOMER' && order.customerId === requester.userId) return order;
  if (requester.role === 'PROVIDER') {
    const ownsAnItem = order.items.some((i) => i.gearItem.providerId === requester.userId);
    if (ownsAnItem) return order;
  }
  throw ApiError.forbidden('You do not have access to this rental order.');
};

const getProviderOrders = async (providerId: string) => {
  return prisma.rentalOrder.findMany({
    where: { items: { some: { gearItem: { providerId } } } },
    include: {
      items: { include: { gearItem: true } },
      customer: { select: { id: true, name: true, email: true } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateStatusByProvider = async (orderId: string, providerId: string, newStatus: RentalStatus) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    include: { items: { include: { gearItem: true } } },
  });
  if (!order) throw ApiError.notFound('Rental order not found.');

  const ownsAnItem = order.items.some((i) => i.gearItem.providerId === providerId);
  if (!ownsAnItem) throw ApiError.forbidden('You do not have permission to update this order.');

  const allowedNext = RENTAL_TRANSITIONS[order.status];
  if (!allowedNext.includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot change rental status from ${order.status} to ${newStatus}. Allowed next status: ${
        allowedNext.join(', ') || 'none'
      }.`
    );
  }

  return prisma.$transaction(async (tx) => {
    if (newStatus === 'CANCELLED') {
      for (const item of order.items) {
        await tx.gearItem.update({
          where: { id: item.gearItemId },
          data: { quantityInUse: { decrement: item.quantity } },
        });
      }
    }
    if (newStatus === 'RETURNED') {
      for (const item of order.items) {
        await tx.gearItem.update({
          where: { id: item.gearItemId },
          data: { quantityInUse: { decrement: item.quantity } },
        });
      }
    }
    return tx.rentalOrder.update({ where: { id: orderId }, data: { status: newStatus } });
  });
};

const cancelByCustomer = async (orderId: string, customerId: string) => {
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Rental order not found.');
  if (order.customerId !== customerId) throw ApiError.forbidden('You do not own this rental order.');
  if (order.status !== 'PLACED') {
    throw ApiError.badRequest('Only orders with status PLACED can be cancelled by the customer.');
  }

  return prisma.$transaction(async (tx) => {
    const items = await tx.rentalItem.findMany({ where: { rentalOrderId: orderId } });
    for (const item of items) {
      await tx.gearItem.update({
        where: { id: item.gearItemId },
        data: { quantityInUse: { decrement: item.quantity } },
      });
    }
    return tx.rentalOrder.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  });
};

const getAllForAdmin = async () => {
  return prisma.rentalOrder.findMany({
    include: {
      items: { include: { gearItem: true } },
      customer: { select: { id: true, name: true, email: true } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const markPaid = async (orderId: string) => {
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Rental order not found.');
  if (order.status !== 'CONFIRMED' && order.status !== 'PLACED') {
    throw ApiError.badRequest(`Cannot mark order as PAID from status ${order.status}.`);
  }
  return prisma.rentalOrder.update({ where: { id: orderId }, data: { status: 'PAID' } });
};

export const RentalService = {
  create,
  getCustomerOrders,
  getOrderById,
  getProviderOrders,
  updateStatusByProvider,
  cancelByCustomer,
  getAllForAdmin,
  markPaid,
};
