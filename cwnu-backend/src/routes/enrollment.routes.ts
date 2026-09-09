import { Prisma } from '@prisma/client';
import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createEnrollmentSchema, updateEnrollmentSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class EnrollmentController {
  async getEnrollments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, search } = result.data.query;

      const requestedStudentId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
      const requestedStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
      if (!req.user || !['STUDENT', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Student, Staff, or Admin access required', 'FORBIDDEN');
      }
      const where: Prisma.EnrollmentWhereInput = search
        ? {
            OR: [
              { student: { firstName: { contains: search, mode: 'insensitive' } } },
              { student: { lastName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {};
      if (req.user.role === 'STUDENT') where.studentId = req.user.id;
      else if (requestedStudentId) where.studentId = requestedStudentId;
      if (requestedStatus) where.status = requestedStatus as Prisma.EnrollmentWhereInput['status'];

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
      if (!req.user || !['STUDENT', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = createEnrollmentSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { courseId } = result.data.body;
      const studentId = req.user.role === 'STUDENT' ? req.user.id : result.data.body.studentId;
      if (!studentId) throw new AppError(400, 'Student is required', 'VALIDATION_ERROR');
      const student = await prisma.user.findFirst({ where: { id: studentId, role: 'STUDENT', isActive: true } });
      if (!student) throw new AppError(404, 'Student not found', 'NOT_FOUND');
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, isActive: true } });
      if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
      if (!course.isActive) throw new AppError(409, 'This course is not currently available for enrollment', 'COURSE_INACTIVE');

      const existing = await prisma.enrollment.findFirst({
        where: { studentId, courseId, status: { in: ['PENDING', 'APPROVED'] } },
        orderBy: { enrolledAt: 'desc' },
      });

      if (existing) {
        throw new AppError(
          409,
          existing.status === 'APPROVED'
            ? 'Student is already accepted for this course'
            : 'An enrollment request already exists for this course',
          'DUPLICATE_ENTRY',
        );
      }

      const enrollment = await prisma.$transaction(async (tx) => {
        const created = await tx.enrollment.create({
          data: { studentId, courseId, status: 'PENDING' },
          include: {
            student: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { code: true, name: true } },
          },
        });
        await tx.activity.create({
          data: {
            userId: req.user!.id,
            type: 'COURSE_ENROLL',
            description: `${req.user!.role === 'STUDENT' ? 'Applied for' : 'Enrolled'} ${created.course.name} for ${created.student.firstName} ${created.student.lastName}`,
            metadata: { enrollmentId: created.id, studentId, courseId, status: created.status },
          },
        });
        return created;
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
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateEnrollmentSchema.safeParse({ body: req.body, params: { id } });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const enrollment = await prisma.$transaction(async (tx) => {
        const previous = await tx.enrollment.findUnique({
          where: { id },
          include: { course: { select: { id: true, name: true, teacherId: true } }, student: { select: { firstName: true, lastName: true } } },
        });
        if (!previous) throw new AppError(404, 'Enrollment not found', 'NOT_FOUND');
        const isTeacherUpdate = req.user!.role === 'TEACHER';
        if (isTeacherUpdate && (previous.course.teacherId !== req.user!.id || previous.status !== 'APPROVED')) {
          throw new AppError(403, 'You may only manage active students in your assigned courses', 'FORBIDDEN');
        }
        const updated = await tx.enrollment.update({
          where: { id },
          data: { ...result.data.body, reviewedById: req.user!.id, reviewedAt: new Date() },
          include: {
            student: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { code: true, name: true } },
          },
        });
        await tx.activity.create({
          data: {
            userId: req.user!.id,
            type: 'COURSE_ENROLL',
            description: `Updated enrollment for ${updated.student.firstName} ${updated.student.lastName} to ${updated.status}`,
            metadata: { enrollmentId: updated.id, studentId: updated.studentId, courseId: updated.courseId, status: updated.status },
          },
        });
        if (updated.status === 'APPROVED') {
          const activeCount = await tx.enrollment.count({ where: { courseId: updated.courseId, status: 'APPROVED' } });
          await tx.course.update({ where: { id: updated.courseId }, data: { enrolledCount: activeCount } });
          if (previous.course.teacherId) {
            await tx.activity.create({
              data: {
                userId: previous.course.teacherId,
                type: 'COURSE_ENROLL',
                description: `New student enrolled: ${updated.student.firstName} ${updated.student.lastName} has joined ${updated.course.name}.`,
                metadata: {
                  event: 'EnrollmentApproved',
                  enrollmentId: updated.id,
                  studentId: updated.studentId,
                  courseId: updated.courseId,
                  enrollmentDate: updated.enrolledAt,
                  status: updated.status,
                },
              },
            });
          }
        } else if (['REJECTED', 'DROPPED', 'COMPLETED'].includes(updated.status)) {
          const activeCount = await tx.enrollment.count({ where: { courseId: updated.courseId, status: 'APPROVED' } });
          await tx.course.update({ where: { id: updated.courseId }, data: { enrolledCount: activeCount } });
        }
        return updated;
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