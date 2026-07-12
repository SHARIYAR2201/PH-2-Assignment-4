import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'CUSTOMER' | 'PROVIDER';
}

interface LoginInput {
  email: string;
  password: string;
}

const register = async (payload: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      phone: payload.phone,
      role: payload.role,
    },
  });

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  const { password, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

const login = async (payload: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.status === 'SUSPENDED') {
    throw ApiError.forbidden('Your account has been suspended. Contact support.');
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  const { password, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  const { password, ...safeUser } = user;
  return safeUser;
};

export const AuthService = { register, login, getMe };
