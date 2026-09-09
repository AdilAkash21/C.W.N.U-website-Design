import { Router, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class DashboardController {
  async getStudentDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STUDENT') {
        throw new AppError(403, 'Student access required', 'FORBIDDEN');
      }

      const enrollmentHistory = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        orderBy: { enrolledAt: 'desc' },
      });
      const activeEnrollmentIds = new Set(
        [...new Map(
          enrollmentHistory.map((enrollment) => [enrollment.courseId, enrollment]),
        ).values()]
          .filter((enrollment) => enrollment.status === 'APPROVED')
          .map((enrollment) => enrollment.id),
      );
      const enrollments = enrollmentHistory.filter((enrollment) => activeEnrollmentIds.has(enrollment.id));
      const enrollmentsWithCourses = await prisma.enrollment.findMany({
        where: { id: { in: enrollments.map((enrollment) => enrollment.id) } },
        include: { course: { select: { code: true, name: true } } },
        orderBy: { enrolledAt: 'desc' },
      });

      const courseIds = enrollmentsWithCourses.map((e) => e.courseId);

      const [assignments, notices] = await prisma.$transaction([
        prisma.assignment.findMany({
          where: { courseId: { in: courseIds }, isPublished: true },
          include: { course: { select: { code: true, name: true } } },
          orderBy: { dueAt: 'asc' },
        }),
        prisma.notice.findMany({
          where: { isPublished: true, targetRoles: { hasSome: ['STUDENT', 'TEACHER', 'STAFF', 'ADMIN'] } },
          orderBy: { publishAt: 'desc' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          enrollments: enrollmentsWithCourses,
          upcomingAssignments: assignments,
          notices,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getTeacherDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'TEACHER') {
        throw new AppError(403, 'Teacher access required', 'FORBIDDEN');
      }

      const [courses, pendingEnrollments, recentSubmissions, courseRequests, notifications] = await prisma.$transaction([
        prisma.course.findMany({
          where: { teacherId: req.user.id },
          include: {
            department: { select: { name: true } },
            enrollments: {
              where: { status: 'APPROVED' },
              orderBy: { enrolledAt: 'asc' },
              include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } },
            },
            _count: { select: { enrollments: true } },
          },
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
        prisma.courseRequest.findMany({
          where: { teacherId: req.user.id },
          include: { course: { select: { id: true, code: true, name: true, semester: true, year: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activity.findMany({
          where: { userId: req.user.id, type: { in: ['COURSE_ENROLL', 'ASSIGNMENT_SUBMIT', 'GRADE_RECEIVED'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      res.json({
        success: true,
        data: {
          courses,
          pendingEnrollments,
          recentGradedSubmissions: recentSubmissions,
          courseRequests,
          notifications,
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

      const [recentActivities, pendingApprovals, pendingEnrollmentRecords, pendingCourseRequests, recentEnrollments, recentAssignments] = await prisma.$transaction([
        prisma.activity.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        }),
        prisma.enrollment.count({ where: { status: 'PENDING' } }),
        prisma.enrollment.findMany({
          where: { status: 'PENDING' },
          take: 20,
          orderBy: { enrolledAt: 'asc' },
          include: {
            student: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { id: true, name: true, code: true } },
          },
        }),
        prisma.courseRequest.findMany({ where: { status: 'PENDING' }, take: 20, orderBy: { createdAt: 'asc' }, include: { teacher: { select: { firstName: true, lastName: true, email: true } }, course: { select: { id: true, name: true, code: true, semester: true, year: true } } } }),
        prisma.enrollment.findMany({
          take: 8,
          orderBy: { updatedAt: 'desc' },
          include: { student: { select: { firstName: true, lastName: true } }, course: { select: { name: true, code: true } } },
        }),
        prisma.course.findMany({
          where: { assignedAt: { not: null } },
          take: 8,
          orderBy: { assignedAt: 'desc' },
          include: { teacher: { select: { firstName: true, lastName: true } }, assignedBy: { select: { firstName: true, lastName: true } } },
        }),
      ]);

      res.json({
        success: true,
        data: {
          recentActivities,
          pendingApprovals,
          pendingEnrollmentRecords,
          pendingCourseRequests,
          recentEnrollments,
          recentAssignments,
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

      const [userStats, totalCourses, activeNotices, totalEnrollments, totalSubmissions, pendingEnrollments, pendingEnrollmentRecords, pendingCourseRequests, recentActivities, recentAssignments] = await prisma.$transaction([
        prisma.user.groupBy({ by: ['role'], _count: { id: true }, orderBy: { role: 'asc' } }),
        prisma.course.count(),
        prisma.notice.count({ where: { isPublished: true } }),
        prisma.enrollment.count(),
        prisma.submission.count(),
        prisma.enrollment.count({ where: { status: 'PENDING' } }),
        prisma.enrollment.findMany({
          where: { status: 'PENDING' },
          take: 20,
          orderBy: { enrolledAt: 'asc' },
          include: {
            student: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { id: true, name: true, code: true } },
          },
        }),
        prisma.courseRequest.findMany({ where: { status: 'PENDING' }, take: 20, orderBy: { createdAt: 'asc' }, include: { teacher: { select: { firstName: true, lastName: true, email: true } }, course: { select: { id: true, name: true, code: true, semester: true, year: true } } } }),
        prisma.activity.findMany({
          take: 12,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, role: true } } },
        }),
        prisma.course.findMany({
          where: { assignedAt: { not: null } },
          take: 8,
          orderBy: { assignedAt: 'desc' },
          include: { teacher: { select: { firstName: true, lastName: true } }, assignedBy: { select: { firstName: true, lastName: true } } },
        }),
      ]);

      res.json({
        success: true,
        data: {
          userStats,
          totalCourses,
          activeNotices,
          totalEnrollments,
          totalSubmissions,
          pendingEnrollments,
          pendingEnrollmentRecords,
          pendingCourseRequests,
          recentActivities,
          recentAssignments,
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