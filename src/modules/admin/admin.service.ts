import { User, UserStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

const getAllUsers = async () => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return users.map(({ password, ...rest }: User) => rest);
};

const updateUserStatus = async (id: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found.');
  if (user.role === 'ADMIN') {
    throw ApiError.badRequest('Cannot change status of an admin account.');
  }
  const updated = await prisma.user.update({ where: { id }, data: { status } });
  const { password, ...safeUser } = updated;
  return safeUser;
};

const getAllGear = async () => {
  return prisma.gearItem.findMany({
    include: { category: true, provider: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getAllRentals = async () => {
  return prisma.rentalOrder.findMany({
    include: {
      items: { include: { gearItem: true } },
      customer: { select: { id: true, name: true, email: true } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const AdminService = { getAllUsers, updateUserStatus, getAllGear, getAllRentals };
