import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

const create = async (payload: { name: string; description?: string }) => {
  const existing = await prisma.category.findUnique({ where: { name: payload.name } });
  if (existing) {
    throw ApiError.conflict('A category with this name already exists.');
  }
  return prisma.category.create({ data: payload });
};

const getAll = async () => {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
};

const getById = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found.');
  return category;
};

const update = async (id: string, payload: { name?: string; description?: string }) => {
  await getById(id);
  return prisma.category.update({ where: { id }, data: payload });
};

const remove = async (id: string) => {
  await getById(id);
  const gearCount = await prisma.gearItem.count({ where: { categoryId: id, isDeleted: false } });
  if (gearCount > 0) {
    throw ApiError.badRequest('Cannot delete a category that still has gear items linked to it.');
  }
  return prisma.category.delete({ where: { id } });
};

export const CategoryService = { create, getAll, getById, update, remove };
