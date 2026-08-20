import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createNoticeSchema, updateNoticeSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class NoticeController {
  async getNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, search, type } = result.data.query;

      const where = type
        ? { type: type as any }
        : {};

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

  async getNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notice = await prisma.notice.findUnique({
        where: { id },
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
      });

      if (!notice) {
        throw new AppError(404, 'Notice not found', 'NOT_FOUND');
      }

      res.json({ success: true, data: notice });
    } catch (err) {
      next(err);
    }
  }

  async createNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
      }
      const result = createNoticeSchema.safeParse({ ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
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
          attachments,
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
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
      }
      const { id } = req.params;
      const result = updateNoticeSchema.safeParse({ params: { id }, ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const notice = await prisma.notice.update({
        where: { id: result.params.id },
        data: result.data.body,
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