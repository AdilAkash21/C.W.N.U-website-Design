import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createNoticeSchema, updateNoticeSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export class NoticeController {
  async getNotices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit } = result.data.query;
      const type = typeof req.query.type === 'string' ? req.query.type : undefined;

      const now = new Date();
      const role = req.user?.role as UserRole | undefined;
      const where = {
        ...(type ? { type: type as any } : {}),
        isPublished: true,
        publishAt: { lte: now },
        OR: [{ expireAt: null }, { expireAt: { gte: now } }],
        ...(role ? { targetRoles: { has: role } } : {}),
      };

      const [notices, total] = await prisma.$transaction([
        prisma.notice.findMany({
          where,
          include: { author: { select: { firstName: true, lastName: true, email: true } } },
          orderBy: { publishAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notice.count({ where }),
      ]);

      res.json({
        success: true,
        data: notices,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notice = await prisma.notice.findUnique({
        where: { id },
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
      });

      if (!notice) {
        throw new AppError(404, 'Notice not found', 'NOT_FOUND');
      }
      const role = req.user?.role as UserRole | undefined;
      const now = new Date();
      if (!notice.isPublished || notice.publishAt > now || (notice.expireAt && notice.expireAt < now) || (role && !notice.targetRoles.includes(role))) {
        throw new AppError(404, 'Notice not found', 'NOT_FOUND');
      }

      res.json({ success: true, data: notice });
    } catch (err) {
      next(err);
    }
  }

  async createNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Staff or Admin access required', 'FORBIDDEN');
      }
      const result = createNoticeSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { title, content, type, targetRoles, publishAt, expireAt, isPinned, isPublished, attachments } = result.data.body;

      const notice = await prisma.notice.create({
        data: {
          title,
          content,
          type: type as any,
          targetRoles,
          authorId: req.user.id,
          publishAt: publishAt ? new Date(publishAt) : undefined,
          expireAt: expireAt ? new Date(expireAt) : undefined,
          isPinned,
          isPublished,
          attachments: attachments ?? [],
        },
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
      });

      res.status(201).json({
        success: true,
        data: notice,
        message: 'Notice created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Staff or Admin access required', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateNoticeSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const notice = await prisma.notice.update({
        where: { id },
        data: result.data,
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
      });

      res.json({ success: true, data: notice, message: 'Notice updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const { id } = req.params;
      await prisma.notice.delete({ where: { id } });
      res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const noticeRoutes = Router();
export const noticeController = new NoticeController();

noticeRoutes.get('/', asyncHandler(noticeController.getNotices));
noticeRoutes.get('/:id', asyncHandler(noticeController.getNotice));
noticeRoutes.post('/', asyncHandler(noticeController.createNotice));
noticeRoutes.put('/:id', asyncHandler(noticeController.updateNotice));
noticeRoutes.delete('/:id', asyncHandler(noticeController.deleteNotice));