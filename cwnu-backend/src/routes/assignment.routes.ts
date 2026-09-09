import { Prisma } from '@prisma/client';
import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createAssignmentSchema, updateAssignmentSchema, paginationSchema, submitAssignmentSchema, gradeSubmissionSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class AssignmentController {
  async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit } = result.data.query;
      const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const type = typeof req.query.type === 'string' ? req.query.type : undefined;
      const user = (req as AuthenticatedRequest).user;
      if (!user) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
      const where: Prisma.AssignmentWhereInput = {
        ...(courseId ? { courseId } : {}),
        ...(type ? { type: type as any } : {}),
      };
      if (user.role === 'STUDENT') {
        where.isPublished = true;
        where.course = { enrollments: { some: { studentId: user.id, status: 'APPROVED' } } };
      } else if (user.role === 'TEACHER') {
        where.course = { teacherId: user.id };
      } else if (!['STAFF', 'ADMIN'].includes(user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }

      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          course: { select: { code: true, name: true } },
          submissions: {
            where: user.role === 'STUDENT' ? { studentId: user.id } : undefined,
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
      const user = (req as AuthenticatedRequest).user;
      if (!user) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          course: { select: { id: true, code: true, name: true, teacherId: true, enrollments: { where: { status: 'APPROVED' }, select: { studentId: true } } } },
          submissions: {
            include: { student: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      });

      if (!assignment) {
        throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      }
      const isManager = ['STAFF', 'ADMIN'].includes(user.role);
      const isTeacher = user.role === 'TEACHER' && assignment.course.teacherId === user.id;
      const isStudent = user.role === 'STUDENT'
        && assignment.isPublished
        && assignment.course.enrollments.some((enrollment) => enrollment.studentId === user.id);
      if (!isManager && !isTeacher && !isStudent) {
        throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          ...assignment,
          submissions: isStudent ? assignment.submissions.filter((submission) => submission.studentId === user.id) : assignment.submissions,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = createAssignmentSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { courseId, title, description, type, maxPoints, weight, dueAt, allowLateSubmission, latePenalty, attachments } = result.data.body;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError(400, 'Course not found', 'NOT_FOUND');
      }
      if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only create assignments for courses assigned to you', 'FORBIDDEN');
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
          attachments: attachments ?? [],
          isPublished: false,
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

  async updateAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateAssignmentSchema.safeParse(req.body);
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }
      const existing = await prisma.assignment.findUnique({ where: { id }, include: { course: { select: { teacherId: true } } } });
      if (!existing) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      if (req.user.role === 'TEACHER' && existing.course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only manage assignments for courses assigned to you', 'FORBIDDEN');
      }
      const data = result.data;
      if (data.courseId) {
        const targetCourse = await prisma.course.findUnique({ where: { id: data.courseId }, select: { teacherId: true } });
        if (!targetCourse) throw new AppError(404, 'Course not found', 'NOT_FOUND');
        if (req.user.role === 'TEACHER' && targetCourse.teacherId !== req.user.id) {
          throw new AppError(403, 'You may only manage assignments for courses assigned to you', 'FORBIDDEN');
        }
      }
      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          ...data,
          type: data.type as any,
          dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        },
        include: { course: { select: { code: true, name: true } } },
      });
      res.json({ success: true, data: assignment, message: 'Assignment updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async publishAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const existing = await prisma.assignment.findUnique({
        where: { id },
        include: { course: { select: { id: true, name: true, teacherId: true, enrollments: { where: { status: 'APPROVED' }, select: { studentId: true } } } } },
      });
      if (!existing) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      if (req.user.role === 'TEACHER' && existing.course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only publish assignments for courses assigned to you', 'FORBIDDEN');
      }
      const assignment = await prisma.$transaction(async (tx) => {
        const published = await tx.assignment.update({ where: { id }, data: { isPublished: true } });
        if (!existing.isPublished) {
          await tx.activity.createMany({
            data: existing.course.enrollments.map((enrollment) => ({
              userId: enrollment.studentId,
              type: 'COURSE_ASSIGNMENT',
              description: `New assignment published in ${existing.course.name}: ${existing.title}`,
              metadata: { assignmentId: id, courseId: existing.course.id, event: 'AssignmentPublished' },
            })),
          });
        }
        return published;
      });
      res.json({ success: true, data: assignment, message: existing.isPublished ? 'Assignment is already published' : 'Assignment published successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deleteAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const assignment = await prisma.assignment.findUnique({ where: { id }, include: { course: { select: { teacherId: true } } } });
      if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      if (req.user.role === 'TEACHER' && assignment.course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only delete assignments for courses assigned to you', 'FORBIDDEN');
      }
      await prisma.assignment.delete({ where: { id } });
      res.json({ success: true, message: 'Assignment deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
      const notifications = await prisma.activity.findMany({
        where: {
          userId: req.user.id,
          type: { in: ['COURSE_ASSIGNMENT', 'ASSIGNMENT_SUBMIT', 'GRADE_RECEIVED', 'TEST_PUBLISHED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  async submitAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }
      if (req.user.role !== 'STUDENT') {
        throw new AppError(403, 'Only students can submit assignments', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = submitAssignmentSchema.safeParse({ body: req.body, params: { id } });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: { course: { select: { teacherId: true } } },
      });
      if (!assignment) {
        throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      }
      if (!assignment.isPublished) {
        throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: req.user.id, courseId: assignment.courseId, status: 'APPROVED' },
      });
      if (!enrollment) {
        throw new AppError(403, 'You are not enrolled in this course', 'FORBIDDEN');
      }

      const submittedAt = new Date();
      if (submittedAt > assignment.dueAt && !assignment.allowLateSubmission) {
        throw new AppError(409, 'The assignment deadline has passed', 'DEADLINE_PASSED');
      }
      const status = submittedAt > assignment.dueAt ? 'LATE' : 'SUBMITTED';
      const submission = await prisma.$transaction(async (tx) => {
        const saved = await tx.submission.upsert({
          where: { assignmentId_studentId: { assignmentId: id, studentId: req.user!.id } },
          create: {
            assignmentId: id,
            studentId: req.user!.id,
            enrollmentId: enrollment.id,
            content: result.data.body.content ?? null,
            attachments: result.data.body.attachments ?? [],
            submittedAt,
            status,
          },
          update: {
            content: result.data.body.content ?? null,
            attachments: result.data.body.attachments ?? [],
            submittedAt,
            status,
          },
        });
        await tx.activity.create({
          data: {
            userId: req.user!.id,
            type: 'ASSIGNMENT_SUBMIT',
            description: `Submitted ${assignment.title}`,
            metadata: { assignmentId: id, courseId: assignment.courseId, submissionId: saved.id },
          },
        });
        if (assignment.course.teacherId) {
          await tx.activity.create({
            data: {
              userId: assignment.course.teacherId,
              type: 'ASSIGNMENT_SUBMIT',
              description: `A student submitted ${assignment.title}`,
              metadata: { assignmentId: id, submissionId: saved.id, studentId: req.user!.id },
            },
          });
        }
        return saved;
      });

      res.json({ success: true, data: submission, message: 'Assignment submitted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async gradeSubmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const graderId = req.user.id;
      const { id } = req.params;
      const result = gradeSubmissionSchema.safeParse({ body: req.body, params: { id } });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const existingSubmission = await prisma.submission.findUnique({
        where: { id },
        include: { assignment: { select: { maxPoints: true, course: { select: { teacherId: true } } } } },
      });
      if (!existingSubmission) throw new AppError(404, 'Submission not found', 'NOT_FOUND');
      if (req.user.role === 'TEACHER' && existingSubmission.assignment.course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only grade submissions for courses assigned to you', 'FORBIDDEN');
      }
      if (result.data.body.pointsEarned > existingSubmission.assignment.maxPoints) {
        throw new AppError(400, `Points cannot exceed the assignment maximum of ${existingSubmission.assignment.maxPoints}`, 'INVALID_GRADE');
      }
      const submission = await prisma.$transaction(async (tx) => {
        const updated = await tx.submission.update({
        where: { id },
        data: {
          pointsEarned: result.data.body.pointsEarned,
          feedback: result.data.body.feedback,
          gradedAt: new Date(),
          gradedBy: graderId,
          status: result.data.body.status || 'GRADED',
        },
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          assignment: { select: { title: true, course: { select: { name: true } } } },
        },
        });
        await tx.activity.create({
          data: {
            userId: existingSubmission.studentId,
            type: 'GRADE_RECEIVED',
            description: `Grade posted for ${updated.assignment.title}`,
            metadata: { submissionId: updated.id, assignmentId: updated.assignmentId, pointsEarned: updated.pointsEarned },
          },
        });
        return updated;
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
assignmentRoutes.get('/notifications', asyncHandler(assignmentController.getNotifications));
assignmentRoutes.get('/:id', asyncHandler(assignmentController.getAssignment));
assignmentRoutes.post('/', asyncHandler(assignmentController.createAssignment));
assignmentRoutes.patch('/:id', asyncHandler(assignmentController.updateAssignment));
assignmentRoutes.put('/:id', asyncHandler(assignmentController.updateAssignment));
assignmentRoutes.post('/:id/publish', asyncHandler(assignmentController.publishAssignment));
assignmentRoutes.post('/:id/submit', asyncHandler(assignmentController.submitAssignment));
assignmentRoutes.put('/:id/grade', asyncHandler(assignmentController.gradeSubmission));
assignmentRoutes.delete('/:id', asyncHandler(assignmentController.deleteAssignment));