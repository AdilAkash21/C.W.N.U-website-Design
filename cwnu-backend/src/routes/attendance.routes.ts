import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { recordAttendanceSchema, bulkAttendanceSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class AttendanceController {
  async recordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = recordAttendanceSchema.safeParse({ ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const { enrollmentId, date, status, notes } = result.data.body;

      const attendance = await prisma.attendance.create({
        data: {
          enrollmentId,
          date: new Date(date),
          status: status as any,
          notes,
          recordedBy: req.user.id,
        },
        include: {
          enrollment: {
            include: { student: { select: { firstName: true, lastName: true, email: true } }, course: { select: { code: true, name: true } } },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: attendance,
        message: 'Attendance recorded successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async bulkRecordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = bulkAttendanceSchema.safeParse({ ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const { courseId, date, records } = result.data.body;

      // Verify course exists and user has permission
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError(404, 'Course not found', 'NOT_FOUND');
      }

      // Record all attendance records in a transaction
      const created = await prisma.$transaction(
        records.map((record: any) =>
          prisma.attendance.create({
            data: {
              enrollmentId: record.enrollmentId,
              date: new Date(date),
              status: record.status as any,
              notes: record.notes,
              recordedBy: req.user.id,
            },
          })
        )
      );

      res.json({
        success: true,
        data: { count: created.length },
        message: `${created.length} attendance records recorded successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, courseId } = result.data.query;

      const where = courseId
        ? { enrollment: { courseId } }
        : {};

      const [attendances, total] = await prisma.$transaction([
        prisma.attendance.findMany({
          where,
          include: {
            enrollment: {
              include: { student: { select: { firstName: true, lastName: true, email: true } }, course: { select: { code: true, name: true } } },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { recordedAt: 'desc' },
        }),
        prisma.attendance.count({ where }),
      ]);

      res.json({
        success: true,
        data: attendances,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const attendanceRoutes = Router();
export const attendanceController = new AttendanceController();

attendanceRoutes.post('/', asyncHandler(attendanceController.recordAttendance));
attendanceRoutes.post('/bulk', asyncHandler(attendanceController.bulkRecordAttendance));
attendanceRoutes.get('/', asyncHandler(attendanceController.getAttendance));