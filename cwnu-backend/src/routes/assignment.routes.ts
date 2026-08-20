import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createAssignmentSchema, updateAssignmentSchema, paginationSchema, submitAssignmentSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class AssignmentController {
  async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, courseId, type } = result.data.query;

      const where = courseId
        ? { courseId, isPublished: true }
        : {};

      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          course: { select: { code: true, name: true } },
          submissions: {
            where: { studentId: req.user?.id },
            select: { student: { select: { firstName: true, lastName: true } }, pointsEarned: true, status: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignedAt: 'desc' },
      });

      res.json({ success: true, data: assignments });
    } catch (err) {
      next(err);
    }
  }

  async getAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          course: { select: { code: true, name: true } },
          submissions: {
            include: { student: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      });

      if (!assignment) {
        throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      }

      res.json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  }

  async createAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = createAssignmentSchema.safeParse({ ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const { courseId, title, description, type, maxPoints, weight, dueAt, allowLateSubmission, latePenalty, attachments } = result.data.body;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError(400, 'Course not found', 'NOT_FOUND');
      }

      const assignment = await prisma.assignment.create({
        data: {
          courseId,
          title,
          description,
          type: type as any,
          maxPoints,
          weight,
          dueAt: new Date(dueAt),
          allowLateSubmission,
          latePenalty,
          attachments,
          isPublished: true,
        },
        include: { course: { select: { code: true, name: true } } },
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Assignment created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async submitAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }
      const { id } = req.params;
      const result = submitAssignmentSchema.safeParse({ params: { id }, ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const assignment = await prisma.assignment.findUnique({ where: { id } });
      if (!assignment) {
        throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      }

      // Check if student is enrolled in the course
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: req.user.id, courseId: assignment.courseId },
      });
      if (!enrollment) {
        throw new AppError(403, 'You are not enrolled in this course', 'FORBIDDEN');
      }

      const submission = await prisma.submission.upsert({
        where: { assignmentId_studentId: { assignmentId: id, studentId: req.user.id } },
        create: {
          assignmentId: id,
          studentId: req.user.id,
          enrollmentId: enrollment.id,
          content: result.data.body.content,
          attachments: result.data.body.attachments,
          status: 'SUBMITTED',
        },
        update: {
          content: result.data.body.content,
          attachments: result.data.body.attachments,
          submittedAt: new Date(),
          status: 'SUBMITTED',
        },
      });

      res.json({ success: true, data: submission, message: 'Assignment submitted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async gradeSubmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = gradeSubmissionSchema.safeParse({ params: { id }, ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const submission = await prisma.submission.update({
        where: { id: result.params.id },
        data: {
          pointsEarned: result.data.body.pointsEarned,
          feedback: result.data.body.feedback,
          gradedAt: new Date(),
          gradedBy: req.user.id,
          status: 'GRADED',
        },
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          assignment: { select: { title: true, course: { select: { name: true } } } },
        },
      });

      res.json({ success: true, data: submission, message: 'Submission graded successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const assignmentRoutes = Router();
export const assignmentController = new AssignmentController();

assignmentRoutes.get('/', asyncHandler(assignmentController.getAssignments));
assignmentRoutes.get('/:id', asyncHandler(assignmentController.getAssignment));
assignmentRoutes.post('/', asyncHandler(assignmentController.createAssignment));
assignmentRoutes.post('/:id/submit', asyncHandler(assignmentController.submitAssignment));
assignmentRoutes.put('/:id/grade', asyncHandler(assignmentController.gradeSubmission));