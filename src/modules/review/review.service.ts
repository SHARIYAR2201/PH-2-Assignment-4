import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

interface CreateReviewInput {
  gearItemId: string;
  rating: number;
  comment?: string;
}

const create = async (customerId: string, payload: CreateReviewInput) => {
  const gear = await prisma.gearItem.findFirst({ where: { id: payload.gearItemId, isDeleted: false } });
  if (!gear) throw ApiError.notFound('Gear item not found.');

  const returnedOrder = await prisma.rentalOrder.findFirst({
    where: {
      customerId,
      status: 'RETURNED',
      items: { some: { gearItemId: payload.gearItemId } },
    },
  });
  if (!returnedOrder) {
    throw ApiError.badRequest('You can only review gear after returning a completed rental.');
  }

  const existing = await prisma.review.findUnique({
    where: { customerId_gearItemId: { customerId, gearItemId: payload.gearItemId } },
  });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this gear item.');
  }

  return prisma.review.create({
    data: {
      customerId,
      gearItemId: payload.gearItemId,
      rating: payload.rating,
      comment: payload.comment,
    },
  });
};

const getForGear = async (gearItemId: string) => {
  return prisma.review.findMany({
    where: { gearItemId },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const ReviewService = { create, getForGear };
