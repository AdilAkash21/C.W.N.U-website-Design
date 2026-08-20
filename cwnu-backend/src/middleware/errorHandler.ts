import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(e.message);
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_ENTRY',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};