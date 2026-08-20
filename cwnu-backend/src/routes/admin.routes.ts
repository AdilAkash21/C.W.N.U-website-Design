import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class AdminController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, search } = result.data.query;

      const where = search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  async getActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit } = result.data.query;

      const [activities, total] = await prisma.$transaction([
        prisma.activity.findMany({
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.activity.count(),
      ]);

      res.json({
        success: true,
        data: activities,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminRoutes = Router();
export const adminController = new AdminController();

adminRoutes.get('/users', asyncHandler(adminController.getUsers));
adminRoutes.get('/activity-log', asyncHandler(adminController.getActivityLog));