import { Prisma } from '@prisma/client';
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

      const where: Prisma.UserWhereInput = search
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

  async getErrorIncidents(req: Request, res: Response, next: NextFunction) {
      try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const severity = typeof req.query.severity === 'string' ? req.query.severity : undefined;
        const where: Prisma.ErrorIncidentWhereInput = {
          ...(search ? { OR: [{ message: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }, { referenceId: { contains: search, mode: 'insensitive' } }] } : {}),
          ...(status ? { status: status as Prisma.ErrorIncidentWhereInput['status'] } : {}),
          ...(severity ? { severity: severity as Prisma.ErrorIncidentWhereInput['severity'] } : {}),
        };
        const [data, total] = await prisma.$transaction([
          prisma.errorIncident.findMany({ where, orderBy: { lastOccurredAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
          prisma.errorIncident.count({ where }),
        ]);
        res.json({ success: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
      } catch (err) {
        next(err);
      }
    }

  async updateErrorIncident(req: Request, res: Response, next: NextFunction) {
      try {
        const { status, resolutionNotes } = req.body as { status?: string; resolutionNotes?: string };
        if (!status) throw new AppError(400, 'Status is required', 'VALIDATION_ERROR');
        const incident = await prisma.errorIncident.update({
          where: { id: req.params.id },
          data: { status: status as Prisma.ErrorIncidentUpdateInput['status'], resolutionNotes },
        });
        res.json({ success: true, data: incident, message: 'Incident updated.' });
      } catch (err) {
        next(err);
    }
  }
}

export const adminRoutes = Router();
export const adminController = new AdminController();

adminRoutes.get('/users', requireRole('ADMIN'), asyncHandler(adminController.getUsers));
adminRoutes.get('/activity-log', requireRole('ADMIN'), asyncHandler(adminController.getActivityLog));
adminRoutes.get('/error-incidents', requireRole('ADMIN'), asyncHandler(adminController.getErrorIncidents));
adminRoutes.patch('/error-incidents/:id', requireRole('ADMIN'), asyncHandler(adminController.updateErrorIncident));