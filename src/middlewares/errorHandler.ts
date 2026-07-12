import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

interface ErrorResponseShape {
  success: false;
  message: string;
  errorDetails: unknown;
  stack?: string;
}

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Something went wrong. Please try again later.';
  let errorDetails: unknown = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails ?? null;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errorDetails = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = `Duplicate value for field(s): ${(err.meta?.target as string[])?.join(', ') ?? 'unknown'}`;
      errorDetails = err.meta ?? null;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested resource was not found.';
      errorDetails = err.meta ?? null;
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference to a related resource.';
      errorDetails = err.meta ?? null;
    } else {
      statusCode = 400;
      message = 'Database request error.';
      errorDetails = { code: err.code };
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data sent to the database.';
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token.';
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  const responseBody: ErrorResponseShape = {
    success: false,
    message,
    errorDetails,
  };

  if (env.nodeEnv === 'development' && err instanceof Error) {
    responseBody.stack = err.stack;
  }

  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err instanceof Error ? err.message : err);

  res.status(statusCode).json(responseBody);
};
