import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const entrySchema = z.object({
  month: z.number().int().min(1).max(6),
  week: z.number().int().min(1).max(5),
  topic: z.string().trim().min(1).max(500),
  lesson: z.string().trim().max(2000).optional().nullable(),
  activity: z.string().trim().max(2000).optional().nullable(),
  assignment: z.string().trim().max(2000).optional().nullable(),
  project: z.string().trim().max(2000).optional().nullable(),
  assessment: z.string().trim().max(2000).optional().nullable(),
  milestone: z.string().trim().max(2000).optional().nullable(),
  resource: z.string().trim().max(2000).optional().nullable(),
  completionDate: z.string().datetime().optional().nullable(),
});

const planSchema = z.object({
  objectives: z.array(z.string().trim().min(1).max(1000)).default([]),
  outcomes: z.array(z.string().trim().min(1).max(1000)).default([]),
  resources: z.array(z.string().trim().min(1).max(1000)).default([]),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  completionDate: z.string().datetime().optional().nullable(),
  entries: z.array(entrySchema).max(30).default([]),
});

const includePlan = {
  course: { select: { id: true, code: true, name: true, semester: true, year: true, teacherId: true } },
  entries: { orderBy: [{ month: 'asc' as const }, { week: 'asc' as const }] },
};

function canView(req: AuthenticatedRequest) {
  return ['ADMIN', 'STAFF', 'TEACHER', 'STUDENT'].includes(req.user?.role || '');
}

export const teachingPlanRoutes = Router();

teachingPlanRoutes.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!canView(req)) throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
  let studentCourseIds: string[] | undefined;
  if (req.user!.role === 'STUDENT') {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user!.id },
      orderBy: { enrolledAt: 'desc' },
      select: { courseId: true, status: true },
    });
    studentCourseIds = [...new Map(
      enrollments.map((enrollment) => [enrollment.courseId, enrollment.status]),
    )]
      .filter(([, status]) => status === 'APPROVED')
      .map(([courseId]) => courseId);
  }
  const courses = await prisma.course.findMany({
    where: req.user!.role === 'TEACHER'
      ? { teacherId: req.user!.id }
      : req.user!.role === 'STUDENT'
        ? { id: { in: studentCourseIds } }
        : {},
    include: { teachingPlan: { include: { entries: { orderBy: [{ month: 'asc' }, { week: 'asc' }] } } } },
    orderBy: { name: 'asc' },
  });
  const plans = courses.map(({ teachingPlan, ...course }) => teachingPlan
    ? { ...teachingPlan, course }
    : { courseId: course.id, course, objectives: [], outcomes: [], resources: [], entries: [] });
  res.json({ success: true, data: plans });
}));

teachingPlanRoutes.get('/:courseId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!canView(req)) throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true, teacherId: true } });
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
  if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
    throw new AppError(403, 'You may only view plans for courses assigned to you', 'FORBIDDEN');
  }
  if (req.user!.role === 'STUDENT') {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: req.user!.id, courseId: course.id },
      orderBy: { enrolledAt: 'desc' },
      select: { status: true },
    });
    if (enrollment?.status !== 'APPROVED') {
      throw new AppError(403, 'You may only view plans for approved courses', 'FORBIDDEN');
    }
  }
  const plan = await prisma.teachingPlan.findUnique({ where: { courseId: course.id }, include: includePlan });
  res.json({ success: true, data: plan });
}));

teachingPlanRoutes.put('/:courseId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF', 'TEACHER'].includes(req.user.role)) {
    throw new AppError(403, 'Only the assigned teacher, Staff, or Admin can modify plans', 'FORBIDDEN');
  }
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true, teacherId: true } });
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
  if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
    throw new AppError(403, 'You may only modify plans for courses assigned to you', 'FORBIDDEN');
  }
  const parsed = planSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid teaching plan', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  const data = parsed.data;
  const plan = await prisma.$transaction(async (tx) => {
    const saved = await tx.teachingPlan.upsert({
      where: { courseId: course.id },
      create: {
        courseId: course.id,
        objectives: data.objectives,
        outcomes: data.outcomes,
        resources: data.resources,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        completionDate: data.completionDate ? new Date(data.completionDate) : null,
        createdById: req.user!.id,
        updatedById: req.user!.id,
      },
      update: {
        objectives: data.objectives,
        outcomes: data.outcomes,
        resources: data.resources,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        completionDate: data.completionDate ? new Date(data.completionDate) : null,
        updatedById: req.user!.id,
      },
    });
    await tx.teachingPlanEntry.deleteMany({ where: { planId: saved.id } });
    if (data.entries.length) {
      await tx.teachingPlanEntry.createMany({
        data: data.entries.map((entry) => ({
          planId: saved.id,
          ...entry,
          completionDate: entry.completionDate ? new Date(entry.completionDate) : null,
        })),
      });
    }
    return tx.teachingPlan.findUniqueOrThrow({ where: { id: saved.id }, include: includePlan });
  });
  res.json({ success: true, data: plan, message: 'Teaching plan saved successfully' });
}));
