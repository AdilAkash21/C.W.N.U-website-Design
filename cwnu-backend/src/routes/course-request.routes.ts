import { Router, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { createCourseRequestSchema, updateCourseRequestSchema } from '../validators';

const requestInclude = {
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
  course: { select: { id: true, code: true, name: true, semester: true, year: true, teacherId: true } },
  reviewedBy: { select: { firstName: true, lastName: true } },
};

export class CourseRequestController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
      }
      const where = req.user.role === 'TEACHER' ? { teacherId: req.user.id } : {};
      const requests = await prisma.courseRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'TEACHER') {
        throw new AppError(403, 'Only teachers can request courses', 'FORBIDDEN');
      }
      const result = createCourseRequestSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }
      const uniqueCourseIds = [...new Set(result.data.body.courseIds)];
      const courses = await prisma.course.findMany({
        where: { id: { in: uniqueCourseIds }, isActive: true },
        select: { id: true },
      });
      if (courses.length !== uniqueCourseIds.length) {
        throw new AppError(400, 'One or more selected courses were not found or are inactive', 'VALIDATION_ERROR');
      }
      const requests = await prisma.$transaction(
        uniqueCourseIds.map((courseId) => prisma.courseRequest.upsert({
          where: { teacherId_courseId: { teacherId: req.user!.id, courseId } },
          create: { teacherId: req.user!.id, courseId },
          update: { status: 'PENDING', reviewedById: null, reviewedAt: null },
          include: requestInclude,
        })),
      );
      res.status(201).json({ success: true, data: requests, message: 'Course request submitted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async review(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Staff or Admin access required', 'FORBIDDEN');
      }
      const result = updateCourseRequestSchema.safeParse({ body: req.body, params: req.params });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }
      const request = await prisma.courseRequest.findUnique({ where: { id: req.params.id } });
      if (!request) throw new AppError(404, 'Course request not found', 'NOT_FOUND');
      if (request.status !== 'PENDING') throw new AppError(409, 'This course request has already been reviewed', 'CONFLICT');

      const updated = await prisma.$transaction(async (tx) => {
        if (result.data.body.status === 'ACCEPTED') {
          const course = await tx.course.findUnique({ where: { id: request.courseId }, select: { teacherId: true } });
          if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
          if (course.teacherId && course.teacherId !== request.teacherId) {
            throw new AppError(409, 'This course is already assigned to another teacher', 'CONFLICT');
          }
          await tx.course.update({ where: { id: request.courseId }, data: { teacherId: request.teacherId, assignedById: req.user!.id, assignedAt: new Date() } });
          await tx.activity.create({
            data: {
              userId: req.user!.id,
              type: 'COURSE_ASSIGNMENT',
              description: `Assigned ${request.courseId} to teacher`,
              metadata: { courseId: request.courseId, teacherId: request.teacherId, requestId: request.id },
            },
          });
          await tx.courseRequest.updateMany({
            where: { courseId: request.courseId, id: { not: request.id }, status: 'PENDING' },
            data: { status: 'REJECTED', reviewedById: req.user!.id, reviewedAt: new Date() },
          });
        }
        return tx.courseRequest.update({
          where: { id: request.id },
          data: { status: result.data.body.status, reviewedById: req.user!.id, reviewedAt: new Date() },
          include: requestInclude,
        });
      });
      res.json({ success: true, data: updated, message: `Course request ${result.data.body.status.toLowerCase()}` });
    } catch (err) {
      next(err);
    }
  }
}

export const courseRequestRoutes = Router();
const controller = new CourseRequestController();
courseRequestRoutes.get('/', asyncHandler(controller.list.bind(controller)));
courseRequestRoutes.post('/', asyncHandler(controller.create.bind(controller)));
courseRequestRoutes.put('/:id', asyncHandler(controller.review.bind(controller)));
