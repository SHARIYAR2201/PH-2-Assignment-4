import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const auth = (...allowedRoles: Array<'CUSTOMER' | 'PROVIDER' | 'ADMIN'>) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) {
      throw ApiError.unauthorized('You are not authorized. Please login.');
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token.');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw ApiError.unauthorized('User account no longer exists.');
    }
    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account has been suspended. Contact support.');
    }

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action.');
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  });
};
