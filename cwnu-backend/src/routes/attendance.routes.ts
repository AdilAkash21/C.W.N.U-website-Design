import { Prisma } from '@prisma/client';
import { Router, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  recordAttendanceSchema,
  bulkAttendanceSchema,
  paginationSchema,
  createAttendanceSessionSchema,
  attendanceSessionRecordsSchema,
  attendanceSessionIdSchema,
} from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class AttendanceController {
  private async synchronizeSession(session: any) {
    const now = new Date();
    let nextStatus = session.status;
    if (session.status === 'REOPENED' && session.reopenExpiresAt && now >= session.reopenExpiresAt) {
      nextStatus = 'CLOSED';
    } else if (session.status !== 'CLOSED' && session.status !== 'CANCELLED') {
      const start = session.sessionStartAt || session.opensAt || session.date;
      const end = session.sessionEndAt || session.closesAt;
      nextStatus = now < start ? 'SCHEDULED' : end && now >= end ? 'CLOSED' : 'OPEN';
    }
    if (nextStatus !== session.status) {
      await prisma.attendanceSession.update({ where: { id: session.id }, data: { status: nextStatus } });
      return { ...session, status: nextStatus };
    }
    return session;
  }

  private canManageCourse(user: AuthenticatedRequest['user'], teacherId: string | null) {
    return Boolean(
      user
      && (user.role === 'STAFF' || user.role === 'ADMIN' || (user.role === 'TEACHER' && teacherId === user.id))
    );
  }

  async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
      }
      const result = createAttendanceSessionSchema.safeParse({ body: req.body });
      if (!result.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      const { courseId, title, description, date, durationMinutes, opensAt, closesAt, attendanceMode, gracePeriodMinutes, notes } = result.data.body;
      const scheduledDate = new Date(date);
      const startAt = opensAt ? new Date(opensAt) : scheduledDate;
      const sessionDurationMinutes = durationMinutes ?? 60;
      const endAt = closesAt ? new Date(closesAt) : new Date(startAt.getTime() + sessionDurationMinutes * 60 * 1000);
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, name: true, code: true, teacherId: true },
      });
      if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
      if (!this.canManageCourse(req.user, course.teacherId)) {
        throw new AppError(403, 'You may only manage attendance for your assigned courses', 'FORBIDDEN');
      }
      const teacherId = course.teacherId || req.user.id;
      const session = await prisma.$transaction(async (tx) => {
        const created = await tx.attendanceSession.create({
          data: {
            courseId,
            teacherId,
            title,
            description,
            date: scheduledDate,
            sessionStartAt: startAt,
            sessionEndAt: endAt,
            durationMinutes: sessionDurationMinutes,
            opensAt: opensAt ? new Date(opensAt) : null,
            closesAt: endAt,
            attendanceMode: attendanceMode || 'MANUAL',
            gracePeriodMinutes: gracePeriodMinutes ?? 10,
            status: scheduledDate > new Date() ? 'SCHEDULED' : 'OPEN',
            notes,
          },
        });
        const enrollments = await tx.enrollment.findMany({
          where: { courseId, status: 'APPROVED' },
          select: { id: true, studentId: true },
        });
        if (enrollments.length) {
          await tx.attendanceInvitation.createMany({
            data: enrollments.map((enrollment) => ({ sessionId: created.id, enrollmentId: enrollment.id })),
          });
          await tx.activity.createMany({
            data: enrollments.map((enrollment) => ({
              userId: enrollment.studentId,
              type: 'ATTENDANCE_INVITED',
              description: `Attendance session "${title}" is ready for ${course.code}.`,
              metadata: { sessionId: created.id, courseId, enrollmentId: enrollment.id },
            })),
          });
        }
        return created;
      });
      res.status(201).json({ success: true, data: session, message: 'Attendance session created and students notified' });
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const where: Prisma.AttendanceSessionWhereInput = {};
      if (courseId) where.courseId = courseId;
      if (req.user?.role === 'TEACHER') {
        where.course = { teacherId: req.user.id };
      } else if (req.user?.role === 'STUDENT') {
        where.invitations = { some: { enrollment: { studentId: req.user.id, status: 'APPROVED' } } };
      }
      const sessions = await prisma.attendanceSession.findMany({
        where,
        include: {
          course: { select: { id: true, code: true, name: true } },
          invitations: {
            include: { enrollment: { include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
          },
          records: true,
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
      const synchronizedSessions = await Promise.all(sessions.map((session) => this.synchronizeSession(session)));
      if (req.user?.role === 'TEACHER' && courseId && sessions.length === 0) {
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
        if (!course || course.teacherId !== req.user.id) throw new AppError(403, 'Course access denied', 'FORBIDDEN');
      }
      const visibleSessions = req.user?.role === 'STUDENT'
        ? synchronizedSessions.map((session) => {
            const invitations = session.invitations.filter((item: any) => item.enrollment.student.id === req.user!.id && item.enrollment.status === 'APPROVED');
            const enrollmentIds = new Set(invitations.map((item: any) => item.enrollmentId));
            return { ...session, invitations, records: session.records.filter((record: any) => enrollmentIds.has(record.enrollmentId)) };
          })
        : synchronizedSessions;
      res.json({ success: true, data: visibleSessions, serverTime: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = attendanceSessionIdSchema.safeParse({ params: req.params });
      if (!result.success) throw new AppError(400, 'Invalid session id', 'VALIDATION_ERROR');
      const session = await prisma.attendanceSession.findUnique({
        where: { id: req.params.id },
        include: {
          course: { select: { id: true, code: true, name: true, teacherId: true } },
          invitations: {
            include: { enrollment: { include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
          },
          records: true,
        },
      });
      if (!session) throw new AppError(404, 'Attendance session not found', 'NOT_FOUND');
      const synchronizedSession = await this.synchronizeSession(session);
      const isManager = this.canManageCourse(req.user, synchronizedSession.course.teacherId);
      const invitation = synchronizedSession.invitations.find((item: any) => item.enrollment.studentId === req.user?.id && item.enrollment.status === 'APPROVED');
      if (!isManager && (!invitation || req.user?.role !== 'STUDENT')) {
        throw new AppError(403, 'Session access denied', 'FORBIDDEN');
      }
      if (req.user?.role === 'STUDENT') {
        const invitations = synchronizedSession.invitations.filter((item: any) => item.enrollment.studentId === req.user!.id && item.enrollment.status === 'APPROVED');
        const enrollmentIds = new Set(invitations.map((item: any) => item.enrollmentId));
        return res.json({ success: true, data: { ...synchronizedSession, invitations, records: synchronizedSession.records.filter((record: any) => enrollmentIds.has(record.enrollmentId)) }, serverTime: new Date().toISOString() });
      }
      res.json({ success: true, data: synchronizedSession, serverTime: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  async acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STUDENT') throw new AppError(403, 'Student access required', 'FORBIDDEN');
      const result = attendanceSessionIdSchema.safeParse({ params: req.params });
      if (!result.success) throw new AppError(400, 'Invalid invitation id', 'VALIDATION_ERROR');
      const invitation = await prisma.attendanceInvitation.findUnique({
        where: { id: req.params.id },
        include: { enrollment: true, session: { include: { course: { select: { code: true, name: true } } } } },
      });
      if (!invitation || invitation.enrollment.studentId !== req.user.id) {
        throw new AppError(404, 'Attendance invitation not found', 'NOT_FOUND');
      }
      const synchronizedSession = await this.synchronizeSession(invitation.session);
      if (invitation.enrollment.status !== 'APPROVED') throw new AppError(409, 'Only active enrollments can accept attendance', 'INVALID_ENROLLMENT');
      if (synchronizedSession.status === 'CLOSED' || synchronizedSession.status === 'CANCELLED') throw new AppError(409, 'This attendance session has ended', 'SESSION_CLOSED');
      if (invitation.status !== 'PENDING') return res.json({ success: true, data: invitation, message: 'Invitation already responded to' });
      const updated = await prisma.$transaction(async (tx) => {
        const accepted = await tx.attendanceInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
          include: { session: { include: { course: { select: { code: true, name: true } } } } },
        });
        await tx.activity.create({
          data: {
            userId: req.user!.id,
            type: 'ATTENDANCE_ACCEPTED',
            description: `Accepted attendance session for ${accepted.session.course.code}.`,
            metadata: { sessionId: accepted.sessionId, invitationId: accepted.id, courseId: accepted.session.courseId },
          },
        });
        return accepted;
      });
      res.json({ success: true, data: updated, message: 'Attendance invitation accepted' });
    } catch (err) {
      next(err);
    }
  }

  async recordSessionAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
      }
      const result = attendanceSessionRecordsSchema.safeParse({ params: req.params, body: req.body });
      if (!result.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      const session = await prisma.attendanceSession.findUnique({
        where: { id: req.params.id },
        include: { course: { select: { id: true, teacherId: true } }, invitations: { include: { enrollment: { select: { studentId: true } } } } },
      });
      if (!session) throw new AppError(404, 'Attendance session not found', 'NOT_FOUND');
      if (!this.canManageCourse(req.user, session.course.teacherId)) throw new AppError(403, 'Course access denied', 'FORBIDDEN');
      const synchronizedSession = await this.synchronizeSession(session);
      if (!['OPEN', 'ATTENDANCE_IN_PROGRESS', 'SAVED', 'REOPENED'].includes(synchronizedSession.status)) throw new AppError(409, 'This attendance session is permanently closed', 'SESSION_CLOSED');
      const invitedIds = new Set(session.invitations.map((item) => item.enrollmentId));
      for (const record of result.data.body.records) {
        if (!invitedIds.has(record.enrollmentId)) throw new AppError(400, 'Every record must belong to an invited enrollment', 'INVALID_ENROLLMENT');
      }
      const records = await prisma.$transaction(async (tx) => {
        const savedRecords = await Promise.all(result.data.body.records.map((record) =>
          tx.attendanceRecord.upsert({
          where: { sessionId_enrollmentId: { sessionId: session.id, enrollmentId: record.enrollmentId } },
          update: { status: record.status, notes: record.notes, recordedById: req.user!.id, recordedAt: new Date() },
          create: { sessionId: session.id, enrollmentId: record.enrollmentId, status: record.status, notes: record.notes, recordedById: req.user!.id },
          }),
        ));
        await tx.activity.createMany({
        data: result.data.body.records.map((record) => ({
          userId: session.invitations.find((item) => item.enrollmentId === record.enrollmentId)!.enrollment.studentId,
          type: 'ATTENDANCE_RECORDED',
          description: 'Course attendance was recorded.',
          metadata: { sessionId: session.id, enrollmentId: record.enrollmentId, status: record.status },
        })),
        });
        await tx.attendanceSession.update({
          where: { id: session.id },
          data: { status: synchronizedSession.status === 'REOPENED' ? 'REOPENED' : 'SAVED' },
        });
        return savedRecords;
      });
      res.json({ success: true, data: records, message: `${records.length} attendance records saved` });
    } catch (err) {
      next(err);
    }
  }

  async closeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
      const result = attendanceSessionIdSchema.safeParse({ params: req.params });
      if (!result.success) throw new AppError(400, 'Invalid session id', 'VALIDATION_ERROR');
      const session = await prisma.attendanceSession.findUnique({ where: { id: req.params.id }, include: { course: { select: { teacherId: true } } } });
      if (!session) throw new AppError(404, 'Attendance session not found', 'NOT_FOUND');
      if (!this.canManageCourse(req.user, session.course.teacherId)) throw new AppError(403, 'Course access denied', 'FORBIDDEN');
      if (session.status === 'CANCELLED' || session.status === 'CLOSED') throw new AppError(409, 'This session cannot be closed', 'INVALID_SESSION_TRANSITION');
      const updated = await prisma.attendanceSession.update({ where: { id: session.id }, data: { status: 'CLOSED' } });
      res.json({ success: true, data: updated, message: 'Attendance session closed' });
    } catch (err) {
      next(err);
    }

  }

  async openSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
      const session = await prisma.attendanceSession.findUnique({ where: { id: req.params.id }, include: { course: { select: { teacherId: true } } } });
      if (!session) throw new AppError(404, 'Attendance session not found', 'NOT_FOUND');
      if (!this.canManageCourse(req.user, session.course.teacherId)) throw new AppError(403, 'Course access denied', 'FORBIDDEN');
      if (session.status !== 'SCHEDULED') throw new AppError(409, 'This session cannot be opened from its current state', 'INVALID_SESSION_TRANSITION');
      const updated = await prisma.attendanceSession.update({ where: { id: session.id }, data: { status: 'OPEN' } });
      res.json({ success: true, data: updated, message: 'Attendance session opened' });
    } catch (err) {
      next(err);
    }
  }

  async reopenSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
      const session = await prisma.attendanceSession.findUnique({ where: { id: req.params.id }, include: { course: { select: { teacherId: true } } } });
      if (!session) throw new AppError(404, 'Attendance session not found', 'NOT_FOUND');
      if (!this.canManageCourse(req.user, session.course.teacherId)) throw new AppError(403, 'Course access denied', 'FORBIDDEN');
      if (session.status !== 'CLOSED') throw new AppError(409, 'Only closed sessions can be reopened', 'INVALID_SESSION_TRANSITION');
      if (session.reopenUsed) throw new AppError(409, 'This attendance session was already reopened and is permanently closed', 'REOPEN_LIMIT_REACHED');
      const reopenedAt = new Date();
      const updated = await prisma.attendanceSession.update({ where: { id: session.id }, data: { status: 'REOPENED', reopenedAt, reopenExpiresAt: new Date(reopenedAt.getTime() + 60 * 1000), reopenUsed: true } });
      res.json({ success: true, data: updated, message: 'Attendance session reopened' });
    } catch (err) {
      next(err);
    }
  }

  async getStudentAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'STUDENT') throw new AppError(403, 'Student access required', 'FORBIDDEN');
      const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const [invitations, notifications] = await prisma.$transaction([
        prisma.attendanceInvitation.findMany({
          where: { enrollment: { studentId: req.user.id, status: 'APPROVED', ...(courseId ? { courseId } : {}) } },
          include: {
            session: { include: { course: { select: { id: true, code: true, name: true } }, records: { where: { enrollment: { studentId: req.user.id } } } } },
            enrollment: { include: { course: { select: { code: true, name: true } } } },
          },
          orderBy: { invitedAt: 'desc' },
        }),
        prisma.activity.findMany({
          where: {
            userId: req.user.id,
            type: { in: ['ATTENDANCE_INVITED', 'ATTENDANCE_ACCEPTED', 'ATTENDANCE_RECORDED'] },
            ...(courseId ? { metadata: { path: ['courseId'], equals: courseId } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);
      res.json({ success: true, data: { invitations, notifications } });
    } catch (err) {
      next(err);
    }
  }

  async recordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = recordAttendanceSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { enrollmentId, date, status, notes } = result.data.body;
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: { select: { teacherId: true } } },
      });
      if (!enrollment || enrollment.status !== 'APPROVED') {
        throw new AppError(400, 'Attendance requires an active enrollment', 'INVALID_ENROLLMENT');
      }
      if (req.user.role === 'TEACHER' && enrollment.course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only record attendance for assigned courses', 'FORBIDDEN');
      }
      if (new Date(date) < enrollment.enrolledAt) {
        throw new AppError(400, 'Attendance cannot be recorded before enrollment began', 'INVALID_ATTENDANCE_DATE');
      }

      const attendance = await prisma.attendance.upsert({
        where: { enrollmentId_date: { enrollmentId, date: new Date(date) } },
        update: {
          status: status as any,
          notes,
          userId: req.user.id,
        },
        create: {
          enrollmentId,
          date: new Date(date),
          status: status as any,
          notes,
          userId: req.user.id,
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
      if (!req.user || !['TEACHER', 'STAFF', 'ADMIN'].includes(req.user.role)) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      const result = bulkAttendanceSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { courseId, date, records } = result.data.body;
      const actorId = req.user.id;
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new AppError(404, 'Course not found', 'NOT_FOUND');
      }
      if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
        throw new AppError(403, 'You may only record attendance for assigned courses', 'FORBIDDEN');
      }
      const enrollmentIds = records.map((record: any) => record.enrollmentId);
      const enrollments = await prisma.enrollment.findMany({
        where: { id: { in: enrollmentIds }, courseId },
        select: { id: true, status: true, enrolledAt: true },
      });
      const enrollmentById = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
      const attendanceDate = new Date(date);
      for (const enrollmentId of enrollmentIds) {
        const enrollment = enrollmentById.get(enrollmentId);
        if (!enrollment || enrollment.status !== 'APPROVED') {
          throw new AppError(400, 'Bulk attendance can only include active enrollments in this course', 'INVALID_ENROLLMENT');
        }
        if (attendanceDate < enrollment.enrolledAt) {
          throw new AppError(400, 'Attendance cannot be recorded before enrollment began', 'INVALID_ATTENDANCE_DATE');
        }
      }

      const created = await prisma.$transaction(
        records.map((record: any) =>
          prisma.attendance.upsert({
            where: { enrollmentId_date: { enrollmentId: record.enrollmentId, date: attendanceDate } },
            update: {
              status: record.status as any,
              notes: record.notes,
              userId: actorId,
            },
            create: {
              enrollmentId: record.enrollmentId,
              date: attendanceDate,
              status: record.status as any,
              notes: record.notes,
              userId: actorId,
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

  async getAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit } = result.data.query;
      const courseId = typeof req.params.courseId === 'string'
        ? req.params.courseId
        : typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const where: Prisma.AttendanceWhereInput = courseId ? { enrollment: { courseId } } : {};
      if (req.user?.role === 'STUDENT') {
        where.enrollment = { ...(where.enrollment as Prisma.EnrollmentWhereInput || {}), studentId: req.user.id, status: 'APPROVED' };
      } else if (req.user?.role === 'TEACHER') {
        where.enrollment = { ...(where.enrollment as Prisma.EnrollmentWhereInput || {}), course: { teacherId: req.user.id } };
      }

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

attendanceRoutes.post('/', asyncHandler(attendanceController.recordAttendance.bind(attendanceController)));
attendanceRoutes.post('/bulk', asyncHandler(attendanceController.bulkRecordAttendance.bind(attendanceController)));
attendanceRoutes.get('/', asyncHandler(attendanceController.getAttendance.bind(attendanceController)));
attendanceRoutes.post('/sessions', asyncHandler(attendanceController.createSession.bind(attendanceController)));
attendanceRoutes.get('/sessions', asyncHandler(attendanceController.listSessions.bind(attendanceController)));
attendanceRoutes.get('/sessions/:id', asyncHandler(attendanceController.getSession.bind(attendanceController)));
attendanceRoutes.put('/sessions/:id/records', asyncHandler(attendanceController.recordSessionAttendance.bind(attendanceController)));
attendanceRoutes.post('/sessions/:id/open', asyncHandler(attendanceController.openSession.bind(attendanceController)));
attendanceRoutes.post('/sessions/:id/close', asyncHandler(attendanceController.closeSession.bind(attendanceController)));
attendanceRoutes.post('/sessions/:id/reopen', asyncHandler(attendanceController.reopenSession.bind(attendanceController)));
attendanceRoutes.post('/invitations/:id/accept', asyncHandler(attendanceController.acceptInvitation.bind(attendanceController)));
attendanceRoutes.get('/student', asyncHandler(attendanceController.getStudentAttendance.bind(attendanceController)));
attendanceRoutes.get('/:courseId', asyncHandler(attendanceController.getAttendance.bind(attendanceController)));