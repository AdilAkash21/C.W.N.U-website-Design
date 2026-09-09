import { Prisma, QuestionType, TestAttemptStatus, TestStatus } from '@prisma/client';
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const choiceSchema = z.object({
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional(),
});

const questionSchema = z.object({
  prompt: z.string().trim().min(1).max(5000),
  type: z.nativeEnum(QuestionType),
  points: z.number().int().min(1).max(1000).default(1),
  order: z.number().int().min(0).optional(),
  answerKey: z.string().max(500).optional().nullable(),
  choices: z.array(choiceSchema).max(20).optional().default([]),
});

const testSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(24 * 60).default(30),
  maxAttempts: z.number().int().min(1).max(20).default(1),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  showResults: z.boolean().default(false),
  questions: z.array(questionSchema).max(200).optional().default([]),
});

const questionUpdateSchema = questionSchema.omit({ choices: true }).partial().extend({
  choices: z.array(choiceSchema).max(20).optional(),
});

const answerSchema = z.object({
  questionId: z.string().cuid(),
  selectedChoiceIds: z.array(z.string().cuid()).max(20).optional().default([]),
  responseText: z.string().max(10000).optional().nullable(),
});

const manualGradeSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().cuid(),
    pointsAwarded: z.number().min(0),
  })).min(1),
});

function user(req: AuthenticatedRequest) {
  if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
  return req.user;
}

function isManager(role: string) {
  return role === 'STAFF' || role === 'ADMIN';
}

async function assertCourseManager(courseId: string, req: AuthenticatedRequest) {
  const currentUser = user(req);
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, code: true, name: true, teacherId: true } });
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
  if (currentUser.role === 'TEACHER' && course.teacherId !== currentUser.id) {
    throw new AppError(403, 'You may only manage tests for your assigned courses', 'FORBIDDEN');
  }
  if (!['TEACHER', 'STAFF', 'ADMIN'].includes(currentUser.role)) {
    throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
  }
  return course;
}

async function getManagerTest(id: string, req: AuthenticatedRequest) {
  const test = await prisma.test.findUnique({
    where: { id },
    include: { course: { select: { id: true, code: true, name: true, teacherId: true } } },
  });
  if (!test) throw new AppError(404, 'Test not found', 'NOT_FOUND');
  const currentUser = user(req);
  if (!isManager(currentUser.role) && (currentUser.role !== 'TEACHER' || test.course.teacherId !== currentUser.id)) {
    throw new AppError(403, 'Test access denied', 'FORBIDDEN');
  }
  return test;
}

function publicQuestion(question: { id: string; prompt: string; type: QuestionType; points: number; order: number; choices: Array<{ id: string; text: string; order: number }> }) {
  return {
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    points: question.points,
    order: question.order,
    choices: question.choices,
  };
}

async function studentTest(id: string, studentId: string) {
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, code: true, name: true, enrollments: { where: { studentId, status: 'APPROVED' }, select: { id: true } } } },
      questions: { orderBy: { order: 'asc' }, include: { choices: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } } } },
    },
  });
  if (!test || test.status !== TestStatus.PUBLISHED || !test.course.enrollments.length) {
    throw new AppError(404, 'Test not found', 'NOT_FOUND');
  }
  const now = new Date();
  if ((test.availableFrom && now < test.availableFrom) || (test.availableUntil && now > test.availableUntil)) {
    throw new AppError(409, 'This test is not currently available', 'TEST_UNAVAILABLE');
  }
  return test;
}

function sortIds(ids: string[]) {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

async function gradeAttempt(attemptId: string, submittedAt: Date, status: TestAttemptStatus) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: { test: { include: { questions: { include: { choices: true } } } }, answers: true },
  });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');
  let score = 0;
  let maxScore = 0;
  const updates: Prisma.PrismaPromise<unknown>[] = [];
  for (const question of attempt.test.questions) {
    maxScore += question.points;
    const answer = attempt.answers.find((item) => item.questionId === question.id);
    if (!answer) continue;
    const objective = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type);
    if (!objective) continue;
    const correct = sortIds(question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id));
    const selected = sortIds(answer.selectedChoiceIds);
    const isCorrect = correct.length === selected.length && correct.every((id, index) => id === selected[index]);
    const pointsAwarded = isCorrect ? question.points : 0;
    score += pointsAwarded;
    updates.push(prisma.testAnswer.update({ where: { id: answer.id }, data: { isCorrect, pointsAwarded, gradedAt: submittedAt } }));
  }
  await prisma.$transaction([
    ...updates,
    prisma.testAttempt.update({ where: { id: attempt.id }, data: { status, submittedAt, score, maxScore } }),
  ]);
  return { score, maxScore };
}

router.get('/eligible', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  if (currentUser.role !== 'STUDENT') throw new AppError(403, 'Student access required', 'FORBIDDEN');
  const now = new Date();
  const tests = await prisma.test.findMany({
    where: {
      status: TestStatus.PUBLISHED,
      course: { enrollments: { some: { studentId: currentUser.id, status: 'APPROVED' } } },
      OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
      AND: [{ OR: [{ availableUntil: null }, { availableUntil: { gte: now } }] }],
    },
    include: {
      course: { select: { id: true, code: true, name: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: currentUser.id }, select: { attemptNumber: true, status: true, score: true, maxScore: true, resultsReleasedAt: true } },
    },
    orderBy: [{ availableUntil: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ success: true, data: tests });
}));

router.get('/course/:courseId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  if (currentUser.role === 'STUDENT') {
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId: req.params.courseId, studentId: currentUser.id, status: 'APPROVED' },
      select: { id: true },
    });
    if (!enrollment) throw new AppError(403, 'An approved enrollment is required to view course tests', 'ENROLLMENT_REQUIRED');
    const now = new Date();
    const tests = await prisma.test.findMany({
      where: {
        courseId: req.params.courseId,
        status: TestStatus.PUBLISHED,
        OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
        AND: [{ OR: [{ availableUntil: null }, { availableUntil: { gte: now } }] }],
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: currentUser.id },
          select: { id: true, attemptNumber: true, status: true, score: true, maxScore: true, resultsReleasedAt: true },
        },
      },
      orderBy: [{ availableUntil: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: tests });
  }
  await assertCourseManager(req.params.courseId, req);
  const tests = await prisma.test.findMany({
    where: { courseId: req.params.courseId },
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: tests });
}));

router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = testSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const currentUser = user(req);
  const course = await assertCourseManager(parsed.data.courseId, req);
  const data = parsed.data;
  const test = await prisma.test.create({
    data: {
      courseId: course.id,
      createdById: currentUser.id,
      title: data.title,
      description: data.description,
      durationMinutes: data.durationMinutes,
      maxAttempts: data.maxAttempts,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      availableUntil: data.availableUntil ? new Date(data.availableUntil) : null,
      shuffleQuestions: data.shuffleQuestions,
      showResults: data.showResults,
      questions: {
        create: data.questions.map((question, index) => ({
          prompt: question.prompt,
          type: question.type,
          points: question.points,
          order: question.order ?? index,
          answerKey: question.answerKey,
          choices: { create: question.choices.map((choice, choiceIndex) => ({ text: choice.text, isCorrect: choice.isCorrect, order: choice.order ?? choiceIndex })) },
        })),
      },
    },
    include: { questions: { include: { choices: true }, orderBy: { order: 'asc' } } },
  });
  res.status(201).json({ success: true, data: test, message: 'Test draft created' });
}));

router.get('/:id/manage', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await getManagerTest(req.params.id, req);
  const test = await prisma.test.findUnique({
    where: { id: req.params.id },
    include: { course: { select: { id: true, code: true, name: true } }, questions: { include: { choices: true }, orderBy: { order: 'asc' } } },
  });
  res.json({ success: true, data: test });
}));

router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await getManagerTest(req.params.id, req);
  const parsed = testSchema.partial().omit({ courseId: true, questions: true }).safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const data = parsed.data;
  const test = await prisma.test.update({
    where: { id: req.params.id },
    data: {
      ...data,
      availableFrom: data.availableFrom === undefined ? undefined : data.availableFrom ? new Date(data.availableFrom) : null,
      availableUntil: data.availableUntil === undefined ? undefined : data.availableUntil ? new Date(data.availableUntil) : null,
    },
  });
  res.json({ success: true, data: test, message: 'Test updated' });
}));

router.post('/:id/publish', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await getManagerTest(req.params.id, req);
  const count = await prisma.question.count({ where: { testId: test.id } });
  if (!count) throw new AppError(409, 'Add at least one question before publishing', 'NO_QUESTIONS');
  const published = await prisma.$transaction(async (tx) => {
    const updated = await tx.test.update({ where: { id: test.id }, data: { status: TestStatus.PUBLISHED, publishedAt: test.publishedAt ?? new Date() } });
    if (test.status !== TestStatus.PUBLISHED) {
      const enrollments = await tx.enrollment.findMany({ where: { courseId: test.courseId, status: 'APPROVED' }, select: { studentId: true } });
      if (enrollments.length) {
        await tx.activity.createMany({
          data: enrollments.map((enrollment) => ({
            userId: enrollment.studentId,
            type: 'TEST_PUBLISHED',
            description: `New test published in ${test.course.code}: ${test.title}`,
            metadata: { testId: test.id, courseId: test.courseId, event: 'TestPublished' },
          })),
        });
      }
    }
    return updated;
  });
  res.json({ success: true, data: published, message: 'Test published' });
}));

router.post('/:id/archive', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await getManagerTest(req.params.id, req);
  const archived = await prisma.test.update({ where: { id: req.params.id }, data: { status: TestStatus.ARCHIVED } });
  res.json({ success: true, data: archived, message: 'Test archived' });
}));

router.post('/:id/questions', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await getManagerTest(req.params.id, req);
  if (test.status !== TestStatus.DRAFT) throw new AppError(409, 'Published tests cannot add questions', 'TEST_LOCKED');
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const question = await prisma.question.create({ data: { testId: test.id, ...parsed.data, choices: { create: parsed.data.choices.map((choice, index) => ({ ...choice, order: choice.order ?? index })) } }, include: { choices: true } });
  res.status(201).json({ success: true, data: question, message: 'Question added' });
}));

router.patch('/:testId/questions/:questionId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await getManagerTest(req.params.testId, req);
  if (test.status !== TestStatus.DRAFT) throw new AppError(409, 'Published tests cannot edit questions', 'TEST_LOCKED');
  const question = await prisma.question.findFirst({ where: { id: req.params.questionId, testId: test.id } });
  if (!question) throw new AppError(404, 'Question not found', 'NOT_FOUND');
  const parsed = questionUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const { choices, ...questionData } = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    if (choices) {
      await tx.choice.deleteMany({ where: { questionId: question.id } });
    }
    return tx.question.update({
      where: { id: question.id },
      data: { ...questionData, ...(choices ? { choices: { create: choices.map((choice, index) => ({ ...choice, order: choice.order ?? index })) } } : {}) },
      include: { choices: true },
    });
  });
  res.json({ success: true, data: updated, message: 'Question updated' });
}));

router.delete('/:testId/questions/:questionId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await getManagerTest(req.params.testId, req);
  if (test.status !== TestStatus.DRAFT) throw new AppError(409, 'Published tests cannot remove questions', 'TEST_LOCKED');
  await prisma.question.deleteMany({ where: { id: req.params.questionId, testId: test.id } });
  res.json({ success: true, message: 'Question removed' });
}));

router.get('/:id/attempts', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await getManagerTest(req.params.id, req);
  const attempts = await prisma.testAttempt.findMany({
    where: { testId: test.id },
    include: { student: { select: { id: true, firstName: true, lastName: true, email: true } }, answers: { include: { question: true } } },
    orderBy: { startedAt: 'desc' },
  });
  res.json({ success: true, data: attempts });
}));

router.post('/:id/release-results', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await getManagerTest(req.params.id, req);
  const result = await prisma.testAttempt.updateMany({ where: { testId: test.id, status: { in: [TestAttemptStatus.SUBMITTED, TestAttemptStatus.GRADED] } }, data: { resultsReleasedAt: new Date() } });
  res.json({ success: true, data: { released: result.count }, message: 'Results released to students' });
}));

const startTestHandler = async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  if (currentUser.role !== 'STUDENT') throw new AppError(403, 'Student access required', 'FORBIDDEN');
  const test = await studentTest(req.params.id, currentUser.id);
  const attempts = await prisma.testAttempt.findMany({ where: { testId: test.id, studentId: currentUser.id }, orderBy: { attemptNumber: 'desc' } });
  const active = attempts.find((attempt) => attempt.status === TestAttemptStatus.IN_PROGRESS && attempt.dueAt > new Date());
  if (active) {
    const detail = await prisma.testAttempt.findUnique({ where: { id: active.id }, include: { answers: true } });
    return res.json({ success: true, data: { attempt: detail, test: { ...test, questions: test.questions.map(publicQuestion) } } });
  }
  if (attempts.length >= test.maxAttempts) throw new AppError(409, 'You have used all attempts for this test', 'ATTEMPTS_EXHAUSTED');
  const startedAt = new Date();
  const durationEnd = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000);
  const dueAt = test.availableUntil && test.availableUntil < durationEnd ? test.availableUntil : durationEnd;
  const attempt = await prisma.testAttempt.create({
    data: { testId: test.id, studentId: currentUser.id, attemptNumber: attempts.length + 1, startedAt, dueAt, maxScore: test.questions.reduce((sum, question) => sum + question.points, 0) },
    include: { answers: true },
  });
  res.status(201).json({ success: true, data: { attempt, serverTime: new Date().toISOString(), test: { ...test, questions: test.questions.map(publicQuestion) } } });
};

router.get('/:id/start', asyncHandler(startTestHandler));
router.post('/:id/start', asyncHandler(startTestHandler));

router.put('/attempts/:attemptId/answers', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  if (currentUser.role !== 'STUDENT') throw new AppError(403, 'Student access required', 'FORBIDDEN');
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const attempt = await prisma.testAttempt.findUnique({ where: { id: req.params.attemptId }, include: { test: true } });
  if (!attempt || attempt.studentId !== currentUser.id) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');
  if (attempt.status !== TestAttemptStatus.IN_PROGRESS || attempt.dueAt <= new Date()) throw new AppError(409, 'This attempt is no longer accepting answers', 'ATTEMPT_CLOSED');
  const question = await prisma.question.findFirst({ where: { id: parsed.data.questionId, testId: attempt.testId }, include: { choices: { select: { id: true } } } });
  if (!question) throw new AppError(400, 'Question does not belong to this test', 'INVALID_QUESTION');
  const allowed = new Set(question.choices.map((choice) => choice.id));
  if (parsed.data.selectedChoiceIds.some((id) => !allowed.has(id))) throw new AppError(400, 'Invalid choice for question', 'INVALID_CHOICE');
  const answer = await prisma.testAnswer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: question.id } },
    update: { selectedChoiceIds: parsed.data.selectedChoiceIds, responseText: parsed.data.responseText },
    create: { attemptId: attempt.id, questionId: question.id, selectedChoiceIds: parsed.data.selectedChoiceIds, responseText: parsed.data.responseText },
  });
  res.json({ success: true, data: { answer, serverTime: new Date().toISOString(), dueAt: attempt.dueAt } });
}));

router.post('/attempts/:attemptId/submit', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  if (currentUser.role !== 'STUDENT') throw new AppError(403, 'Student access required', 'FORBIDDEN');
  const attempt = await prisma.testAttempt.findUnique({ where: { id: req.params.attemptId }, include: { test: true } });
  if (!attempt || attempt.studentId !== currentUser.id) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');
  if (attempt.status !== TestAttemptStatus.IN_PROGRESS) throw new AppError(409, 'Attempt already submitted', 'ATTEMPT_CLOSED');
  const answers = z.array(answerSchema).safeParse(req.body?.answers ?? []);
  if (!answers.success) throw answers.error;
  for (const answer of answers.data) {
    const question = await prisma.question.findFirst({ where: { id: answer.questionId, testId: attempt.testId }, include: { choices: { select: { id: true } } } });
    if (!question || answer.selectedChoiceIds.some((id) => !question.choices.some((choice) => choice.id === id))) throw new AppError(400, 'Invalid answer payload', 'INVALID_ANSWER');
    await prisma.testAnswer.upsert({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: question.id } }, update: { selectedChoiceIds: answer.selectedChoiceIds, responseText: answer.responseText }, create: { attemptId: attempt.id, questionId: question.id, selectedChoiceIds: answer.selectedChoiceIds, responseText: answer.responseText } });
  }
  const status = new Date() > attempt.dueAt ? TestAttemptStatus.EXPIRED : TestAttemptStatus.SUBMITTED;
  const graded = await gradeAttempt(attempt.id, new Date(), status);
  res.json({ success: true, data: { attemptId: attempt.id, ...graded, status }, message: status === TestAttemptStatus.EXPIRED ? 'Time expired; objective answers were graded' : 'Test submitted' });
}));

router.get('/attempts/:attemptId/results', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  const attempt = await prisma.testAttempt.findUnique({ where: { id: req.params.attemptId }, include: { test: { include: { course: { select: { teacherId: true } }, questions: { include: { choices: true }, orderBy: { order: 'asc' } } } }, answers: { include: { question: true } }, student: { select: { id: true, firstName: true, lastName: true, email: true } } } });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');
  const canManage = isManager(currentUser.role) || (currentUser.role === 'TEACHER' && attempt.test.course.teacherId === currentUser.id);
  if (!canManage && (currentUser.role !== 'STUDENT' || attempt.studentId !== currentUser.id)) throw new AppError(403, 'Attempt access denied', 'FORBIDDEN');
  if (!canManage && !attempt.resultsReleasedAt && !attempt.test.showResults) throw new AppError(409, 'Results have not been released yet', 'RESULTS_LOCKED');
  const response = canManage ? attempt : {
    ...attempt,
    test: {
      ...attempt.test,
      questions: attempt.test.questions.map((question) => ({
        ...question,
        choices: question.choices.map(({ isCorrect: _isCorrect, ...choice }) => choice),
      })),
    },
    answers: attempt.answers.map((answer) => ({
      ...answer,
      question: {
        id: answer.question.id,
        prompt: answer.question.prompt,
        type: answer.question.type,
        points: answer.question.points,
        order: answer.question.order,
      },
    })),
  };
  res.json({ success: true, data: response });
}));

router.put('/attempts/:attemptId/grade', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = user(req);
  if (!['TEACHER', 'STAFF', 'ADMIN'].includes(currentUser.role)) throw new AppError(403, 'Teacher, Staff, or Admin access required', 'FORBIDDEN');
  const parsed = manualGradeSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;
  const attempt = await prisma.testAttempt.findUnique({ where: { id: req.params.attemptId }, include: { test: { include: { course: { select: { teacherId: true } }, questions: true } } } });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');
  if (currentUser.role === 'TEACHER' && attempt.test.course.teacherId !== currentUser.id) throw new AppError(403, 'Test access denied', 'FORBIDDEN');
  if (attempt.status === TestAttemptStatus.IN_PROGRESS) throw new AppError(409, 'Submit the attempt before grading', 'ATTEMPT_IN_PROGRESS');
  const pointsByQuestion = new Map(attempt.test.questions.map((question) => [question.id, question.points]));
  await prisma.$transaction(parsed.data.answers.map((answer) => {
    const max = pointsByQuestion.get(answer.questionId);
    if (max === undefined) throw new AppError(400, 'Question does not belong to this test', 'INVALID_QUESTION');
    if (answer.pointsAwarded > max) throw new AppError(400, 'Points exceed question value', 'INVALID_POINTS');
    return prisma.testAnswer.update({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: answer.questionId } }, data: { pointsAwarded: answer.pointsAwarded, gradedAt: new Date() } });
  }));
  const updatedAnswers = await prisma.testAnswer.findMany({ where: { attemptId: attempt.id } });
  const score = updatedAnswers.reduce((sum, answer) => sum + (answer.pointsAwarded ?? 0), 0);
  const updated = await prisma.testAttempt.update({ where: { id: attempt.id }, data: { score, maxScore: attempt.test.questions.reduce((sum, question) => sum + question.points, 0), status: TestAttemptStatus.GRADED, gradedAt: new Date() } });
  res.json({ success: true, data: updated, message: 'Manual grades saved' });
}));

export { router as testRoutes };
