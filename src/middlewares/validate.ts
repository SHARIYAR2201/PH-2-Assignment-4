import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorDetails = err.issues.map((issue) => ({
          field: issue.path.slice(1).join('.') || issue.path.join('.'),
          message: issue.message,
        }));
        return next(ApiError.badRequest('Validation failed', errorDetails));
      }
      next(err);
    }
  };
};
