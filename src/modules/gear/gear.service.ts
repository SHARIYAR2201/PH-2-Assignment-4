import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

interface GearQuery {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  available?: string;
  page?: string;
  limit?: string;
}

interface CreateGearInput {
  title: string;
  description: string;
  brand?: string;
  pricePerDay: number;
  quantityTotal?: number;
  images?: string[];
  categoryId: string;
}

const getAllPublic = async (query: GearQuery) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const where: Prisma.GearItemWhereInput = { isDeleted: false };

  if (query.category) where.categoryId = query.category;
  if (query.brand) where.brand = { contains: query.brand, mode: 'insensitive' };
  if (query.available !== undefined) where.isAvailable = query.available === 'true';
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.minPrice || query.maxPrice) {
    where.pricePerDay = {};
    if (query.minPrice) where.pricePerDay.gte = Number(query.minPrice);
    if (query.maxPrice) where.pricePerDay.lte = Number(query.maxPrice);
  }

  const [items, total] = await Promise.all([
    prisma.gearItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: true, provider: { select: { id: true, name: true, email: true } } },
    }),
    prisma.gearItem.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id: string) => {
  const gear = await prisma.gearItem.findFirst({
    where: { id, isDeleted: false },
    include: {
      category: true,
      provider: { select: { id: true, name: true, email: true } },
      reviews: { include: { customer: { select: { id: true, name: true } } } },
    },
  });
  if (!gear) throw ApiError.notFound('Gear item not found.');
  return gear;
};

const createForProvider = async (providerId: string, payload: CreateGearInput) => {
  const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
  if (!category) throw ApiError.badRequest('Selected category does not exist.');

  return prisma.gearItem.create({
    data: {
      title: payload.title,
      description: payload.description,
      brand: payload.brand,
      pricePerDay: payload.pricePerDay,
      quantityTotal: payload.quantityTotal ?? 1,
      images: payload.images ?? [],
      categoryId: payload.categoryId,
      providerId,
    },
  });
};

const getOwnedGear = async (id: string, providerId: string) => {
  const gear = await prisma.gearItem.findFirst({ where: { id, isDeleted: false } });
  if (!gear) throw ApiError.notFound('Gear item not found.');
  if (gear.providerId !== providerId) {
    throw ApiError.forbidden('You do not own this gear item.');
  }
  return gear;
};

const updateForProvider = async (
  id: string,
  providerId: string,
  payload: Partial<CreateGearInput> & { isAvailable?: boolean }
) => {
  await getOwnedGear(id, providerId);
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
    if (!category) throw ApiError.badRequest('Selected category does not exist.');
  }
  return prisma.gearItem.update({ where: { id }, data: payload });
};

const removeForProvider = async (id: string, providerId: string) => {
  await getOwnedGear(id, providerId);
  return prisma.gearItem.update({ where: { id }, data: { isDeleted: true, isAvailable: false } });
};

const getProviderInventory = async (providerId: string) => {
  return prisma.gearItem.findMany({
    where: { providerId, isDeleted: false },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const GearService = {
  getAllPublic,
  getById,
  createForProvider,
  updateForProvider,
  removeForProvider,
  getProviderInventory,
  getOwnedGear,
};
