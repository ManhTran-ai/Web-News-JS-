import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from './error.js';

export function validateQuery(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          `Tham số truy vấn không hợp lệ: ${result.error.issues.map((i) => i.message).join(', ')}`,
        ),
      );
      return;
    }
    res.locals.parsedQuery = result.data;
    next();
  };
}
