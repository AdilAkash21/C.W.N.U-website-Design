import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';

export class DashboardController {
  async getStudentDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STUDENT') {
        throw new AppError(403, 'Student access required', 'FORBIDDEN');
      }

      // First get approved enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id, status: 'APPROVED' },
        include: { course: { select: { code: true, name: true } } },
        orderBy: { enrolledAt: 'desc' },
      });

      const courseIds = enrollments.map(e => e.courseId);

      const [assignments, notices] = await prisma.$transaction([
        prisma.assignment.findMany({
          where: { courseId: { in: courseIds }, isPublished: true },
          include: { course: { select: { code: true, name: true } } },
          orderBy: { dueAt: 'asc' },
        }),
        prisma.notice.findMany({
          where: { isPublished: true, OR: [{ targetRoles: { has: 'STUDENT' } }, { targetRoles: { has: 'ALL' } }] },
          orderBy: { publishAt: 'desc' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          enrollments,
          upcomingAssignments: assignments,
          notices,
        },
      });
    } catch (err) {
      next(err);
    }
  }
  // ... rest of the file

  async getTeacherDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'TEACHER') {
        throw new AppError(403, 'Teacher access required', 'FORBIDDEN');
      }

      const [courses, pendingEnrollments, recentSubmissions] = await prisma.$transaction([
        prisma.course.findMany({
          where: { teacherId: req.user.id },
          include: { department: { select: { name: true } } },
        }),
        prisma.enrollment.findMany({
          where: { course: { teacherId: req.user.id }, status: 'PENDING' },
          include: { student: { select: { firstName: true, lastName: true, email: true } } },
        }),
        prisma.submission.findMany({
          where: { gradedBy: req.user.id },
          include: { student: { select: { firstName: true, lastName: true, email: true } }, assignment: { select: { title: true, course: { select: { name: true } } } } },
          orderBy: { gradedAt: 'desc' },
          take: 5,
        }),
      ]);

      res.json({
        success: true,
        data: {
          courses,
          pendingEnrollments,
          recentGradedSubmissions: recentSubmissions,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getStaffDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STAFF') {
        throw new AppError(403, 'Staff access required', 'FORBIDDEN');
      }

      const [recentActivities, pendingApprovals] = await prisma.$transaction([
        prisma.activity.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        }),
        prisma.enrollment.count({ where: { status: 'PENDING' } }),
      ]);

      res.json({
        success: true,
        data: {
          recentActivities,
          pendingApprovals,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAdminDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }

      const [userStats, courseStats, noticeStats] = await prisma.$transaction([
        prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),
        prisma.course.count(),
        prisma.notice.count({ where: { isPublished: true } }),
      ]);

      res.json({
        success: true,
        data: {
          userStats,
          totalCourses: courseStats,
          activeNotices: noticeStats,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardRoutes = Router();
export const dashboardController = new DashboardController();

dashboardRoutes.get('/student', asyncHandler(dashboardController.getStudentDashboard));
dashboardRoutes.get('/teacher', asyncHandler(dashboardController.getTeacherDashboard));
dashboardRoutes.get('/staff', asyncHandler(dashboardController.getStaffDashboard));
dashboardRoutes.get('/admin', asyncHandler(dashboardController.getAdminDashboard));