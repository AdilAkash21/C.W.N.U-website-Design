import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { createCourseSchema, updateCourseSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class CourseController {
  async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit, search } = result.data.query;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

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

  async getCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          department: { select: { name: true, code: true } },
          teacher: { select: { firstName: true, lastName: true } },
          enrollments: {
            include: { student: { select: { firstName: true, lastName: true, email: true } } },
            select: { status: true, grade: true },
          },
          assignments: { include: { submissions: { select: { student: { select: { firstName: true, lastName: true } }, pointsEarned: true } } } },
        },
      });

      if (!course) {
        throw new AppError(404, 'Course not found', 'NOT_FOUND');
      }

      res.json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }

  async createCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = createCourseSchema.safeParse({ ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const { code, name, description, credits, departmentId, teacherId, semester, year, maxStudents, schedule, prerequisites, syllabus } = result.data.body;

      // Check department exists
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) {
        throw new AppError(400, 'Department not found', 'NOT_FOUND');
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
          prerequisites,
          syllabus,
          isActive: true,
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
      if (!req.user || req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateCourseSchema.safeParse({ params: { id }, ...req });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const course = await prisma.course.update({
        where: { id: result.params.id },
        data: result.data.body,
        include: {
          department: { select: { name: true, code: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
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

courseRoutes.get('/', asyncHandler(courseController.getCourses));
courseRoutes.get('/:id', asyncHandler(courseController.getCourse));
courseRoutes.post('/', asyncHandler(courseController.createCourse));
courseRoutes.put('/:id', asyncHandler(courseController.updateCourse));
courseRoutes.delete('/:id', asyncHandler(courseController.deleteCourse));