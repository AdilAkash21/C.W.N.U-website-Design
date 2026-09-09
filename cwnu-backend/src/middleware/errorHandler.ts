import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { randomUUID, createHash } from 'crypto';
import { prisma } from '../config/prisma';
import type { AuthenticatedRequest } from './auth';

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
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as AuthenticatedRequest & { requestId?: string }).requestId || randomUUID();
  const statusCode = err instanceof AppError ? err.statusCode : err instanceof ZodError ? 400 : 500;
  const code = err instanceof AppError ? err.code : err instanceof ZodError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';
  const safeMessage = err instanceof AppError ? err.message : err instanceof ZodError ? 'Validation failed' : 'The request could not be completed.';
  const fingerprint = createHash('sha256')
    .update(`${code}:${req.method}:${req.path}:${err.name}`)
    .digest('hex')
    .slice(0, 32);

  console.error(JSON.stringify({
    referenceId: requestId,
    method: req.method,
    route: req.path,
    statusCode,
    code,
    errorName: err.name,
    message: err.message,
  }));

  void prisma.errorIncident.upsert({
    where: { fingerprint },
    create: {
      referenceId: requestId,
      fingerprint,
      severity: statusCode >= 500 ? 'HIGH' : statusCode >= 400 ? 'MEDIUM' : 'LOW',
      code,
      message: safeMessage,
      method: req.method,
      route: req.path,
      userId: (req as AuthenticatedRequest).user?.id,
      userRole: ((req as AuthenticatedRequest).user?.role || undefined)?.toUpperCase() as 'STUDENT' | 'TEACHER' | 'STAFF' | 'ADMIN' | undefined,
      technicalDetails: process.env.NODE_ENV === 'development' ? err.stack?.slice(0, 4000) : undefined,
    },
    update: {
      occurrenceCount: { increment: 1 },
      lastOccurredAt: new Date(),
      technicalDetails: process.env.NODE_ENV === 'development' ? err.stack?.slice(0, 4000) : undefined,
    },
  }).then(async (incident) => {
    if (statusCode >= 500 && incident.occurrenceCount === 1) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
      if (admins.length) {
        await prisma.activity.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM_ERROR',
            description: `New high-severity system incident ${requestId} requires review.`,
            metadata: { incidentId: incident.id, referenceId: requestId, code },
          })),
        });
      }
    }
  }).catch((reportError) => console.error(JSON.stringify({ referenceId: requestId, reportError: reportError instanceof Error ? reportError.message : 'Incident reporting failed' })));

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
      referenceId: requestId,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_ENTRY',
        referenceId: requestId,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
        referenceId: requestId,
      });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      referenceId: requestId,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      referenceId: requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      referenceId: requestId,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'The request could not be completed. Please try again later.',
    code: 'INTERNAL_ERROR',
    referenceId: requestId,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};