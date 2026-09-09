import { Prisma } from '@prisma/client';
import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createCourseSchema, updateCourseSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { authMiddleware, optionalAuth } from '../middleware/auth';

export class CourseController {
  async getCourses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, search } = result.data.query;
      const canManageCourses = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';

      const where: Prisma.CourseWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};
      if (!canManageCourses) where.isActive = true;

      const [courses, total] = await prisma.$transaction([
        prisma.course.findMany({
          where,
          include: {
            department: { select: { name: true, code: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
      ]);

      res.json({
        success: true,
        data: courses,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requester = req.user;
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          department: { select: { name: true, code: true } },
          teacher: { select: { firstName: true, lastName: true } },
          schedules: true,
          teachingPlan: {
            include: {
              entries: {
                orderBy: [{ month: 'asc' }, { week: 'asc' }],
              },
            },
          },
          enrollments: {
            where: requester?.role === 'STUDENT'
              ? { studentId: requester.id }
              : requester?.role === 'TEACHER'
                ? { course: { teacherId: requester.id } }
                : requester && ['STAFF', 'ADMIN'].includes(requester.role)
                  ? undefined
                  : { id: '__not_visible__' },
            include: {
              attendances: { orderBy: { date: 'desc' } },
              student: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          assignments: {
            where: requester?.role === 'STUDENT'
              ? { isPublished: true, course: { enrollments: { some: { studentId: requester.id, status: 'APPROVED' } } } }
              : requester?.role === 'TEACHER'
                ? { course: { teacherId: requester.id } }
                : requester && ['STAFF', 'ADMIN'].includes(requester.role)
                  ? undefined
                  : { id: '__not_visible__' },
            include: {
              submissions: {
                where: requester?.role === 'STUDENT' ? { studentId: requester.id } : undefined,
                select: {
                  id: true,
                  studentId: true,
                  enrollmentId: true,
                  content: true,
                  attachments: true,
                  pointsEarned: true,
                  status: true,
                  submittedAt: true,
                  gradedAt: true,
                  feedback: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        throw new AppError(404, 'Course not found', 'NOT_FOUND');
      }
      const canViewInactive = req.user?.role === 'ADMIN'
        || req.user?.role === 'STAFF'
        || (req.user?.role === 'TEACHER' && course.teacherId === req.user.id);
      if (!course.isActive && !canViewInactive) {
        throw new AppError(404, 'Course not found', 'NOT_FOUND');
      }

      res.json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }

  async getStudentWorkspace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STUDENT') {
        throw new AppError(403, 'Student access required', 'FORBIDDEN');
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: { courseId: req.params.id, studentId: req.user.id, status: 'APPROVED' },
        select: { id: true, status: true, enrolledAt: true, grade: true, gradePoints: true },
      });
      if (!enrollment) {
        throw new AppError(403, 'An approved enrollment is required to open this course workspace', 'ENROLLMENT_REQUIRED');
      }

      const course = await prisma.course.findFirst({
        where: { id: req.params.id, isActive: true },
        include: {
          department: { select: { name: true, code: true } },
          teacher: { select: { firstName: true, lastName: true } },
          schedules: true,
          teachingPlan: {
            include: { entries: { orderBy: [{ month: 'asc' }, { week: 'asc' }] } },
          },
          assignments: {
            where: { isPublished: true },
            include: {
              submissions: {
                where: { studentId: req.user.id },
                select: {
                  id: true,
                  studentId: true,
                  enrollmentId: true,
                  content: true,
                  attachments: true,
                  pointsEarned: true,
                  status: true,
                  submittedAt: true,
                  gradedAt: true,
                  feedback: true,
                },
              },
            },
            orderBy: { dueAt: 'asc' },
          },
        },
      });
      if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

      res.json({ success: true, data: { ...course, enrollment } });
    } catch (err) {
      next(err);
    }
  }

  async createCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
        throw new AppError(403, 'Only Staff or Admin can create courses', 'FORBIDDEN');
      }
      const result = createCourseSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { code, name, description, credits, departmentId, teacherId, semester, year, maxStudents, schedule, prerequisites, syllabus } = result.data.body;

      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) {
        throw new AppError(400, 'Department not found', 'NOT_FOUND');
      }

      if (teacherId) {
        const teacher = await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' } });
        if (!teacher) {
          throw new AppError(400, 'Selected teacher not found', 'VALIDATION_ERROR');
        }
      }

      const course = await prisma.course.create({
        data: {
          code,
          name,
          description,
          credits,
          departmentId,
          teacherId,
          semester,
          year,
          maxStudents,
          prerequisites: prerequisites ?? [],
          syllabus,
          isActive: false,
          enrolledCount: 0,
          schedules: schedule ? {
            create: schedule.map((s: any) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room,
              building: s.building,
            })),
          } : undefined,
        },
        include: {
          department: { select: { name: true, code: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateCourseSchema.safeParse(req.body);
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      if (result.data.teacherId !== undefined && result.data.teacherId !== null) {
        const teacher = await prisma.user.findFirst({ where: { id: result.data.teacherId, role: 'TEACHER' } });
        if (!teacher) {
          throw new AppError(400, 'Selected teacher not found', 'VALIDATION_ERROR');
        }
      }

      const course = await prisma.$transaction(async (tx) => {
        const { schedule, ...courseData } = result.data;
        const updated = await tx.course.update({
          where: { id },
          data: {
            ...courseData,
            ...(courseData.teacherId !== undefined
              ? {
                  assignedById: courseData.teacherId ? req.user!.id : null,
                  assignedAt: courseData.teacherId ? new Date() : null,
                }
              : {}),
          },
          include: {
            department: { select: { name: true, code: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        });
        if (schedule !== undefined) {
          await tx.courseSchedule.deleteMany({ where: { courseId: id } });
          if (schedule.length) {
            await tx.courseSchedule.createMany({
              data: schedule.map((item) => ({ ...item, courseId: id })),
            });
          }
        }
        if (courseData.teacherId !== undefined) {
          await tx.activity.create({
            data: {
              userId: req.user!.id,
              type: 'COURSE_ASSIGNMENT',
              description: `${courseData.teacherId ? 'Assigned' : 'Unassigned'} ${updated.name}${updated.teacher ? ` to ${updated.teacher.firstName} ${updated.teacher.lastName}` : ''}`,
              metadata: { courseId: updated.id, teacherId: courseData.teacherId || null },
            },
          });
        }
        return updated;
      });

      res.json({ success: true, data: course, message: 'Course updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deleteCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const { id } = req.params;
      await prisma.course.delete({ where: { id } });
      res.json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const courseRoutes = Router();
export const courseController = new CourseController();

courseRoutes.get('/', optionalAuth, asyncHandler(courseController.getCourses));
courseRoutes.get('/:id/workspace', authMiddleware, asyncHandler(courseController.getStudentWorkspace));
courseRoutes.get('/:id', optionalAuth, asyncHandler(courseController.getCourse));
courseRoutes.post('/', authMiddleware, asyncHandler(courseController.createCourse));
courseRoutes.put('/:id', authMiddleware, asyncHandler(courseController.updateCourse));
courseRoutes.delete('/:id', authMiddleware, asyncHandler(courseController.deleteCourse));