import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof Error && err.name === 'ContentUnavailableError') {
    res.status(502).json({
      error: { code: 'CONTENT_UNAVAILABLE', message: err.message },
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Lỗi không xác định';
  console.error('[error]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}
