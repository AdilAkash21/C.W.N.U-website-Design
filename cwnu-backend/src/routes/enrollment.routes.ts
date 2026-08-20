import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createEnrollmentSchema, updateEnrollmentSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class EnrollmentController {
  async getEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, search } = result.data.query;

      const where = search
        ? {
            OR: [
              { student: { firstName: { contains: search, mode: 'insensitive' } } },
              { student: { lastName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {};

      const [enrollments, total] = await prisma.$transaction([
        prisma.enrollment.findMany({
          where,
          include: {
            student: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { code: true, name: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { enrolledAt: 'desc' },
        }),
        prisma.enrollment.count({ where }),
      ]);

      res.json({
        success: true,
        data: enrollments,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  async enrollStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = createEnrollmentSchema.safeParse({ ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const { courseId } = result.data.body;
      const studentId = req.user.id; // When staff enrolls a student, studentId would come from somewhere else

      // Check if enrollment already exists
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
      });

      if (existing) {
        throw new AppError(409, 'Student already enrolled in this course', 'DUPLICATE_ENTRY');
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId,
          courseId,
          status: 'PENDING',
        },
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { code: true, name: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: enrollment,
        message: 'Enrollment created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateEnrollmentSchema.safeParse({ params: { id }, ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const enrollment = await prisma.enrollment.update({
        where: { id: result.params.id },
        data: result.data.body,
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { code: true, name: true } },
        },
      });

      res.json({ success: true, data: enrollment, message: 'Enrollment updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const enrollmentRoutes = Router();
export const enrollmentController = new EnrollmentController();

enrollmentRoutes.get('/', asyncHandler(enrollmentController.getEnrollments));
enrollmentRoutes.post('/', asyncHandler(enrollmentController.enrollStudent));
enrollmentRoutes.put('/:id', asyncHandler(enrollmentController.updateEnrollment));