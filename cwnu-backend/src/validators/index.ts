import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    role: z.literal('STUDENT'),
    phone: z.string().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    dateOfBirth: z.preprocess(
      (value) => value === '' ? undefined : value,
      z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date').optional()
    ),
    address: z.string().optional(),
    bio: z.string().max(500).optional(),
  }),
});

export const createCourseSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(20).toUpperCase(),
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    credits: z.number().int().min(1).max(6).default(3),
    departmentId: z.string().cuid(),
    teacherId: z.string().cuid().optional(),
    semester: z.string().min(1).max(20),
    year: z.number().int().min(2020).max(2030),
    maxStudents: z.number().int().min(1).max(200).default(30),
    schedule: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      room: z.string().max(50),
      building: z.string().max(100),
    })).optional(),
    prerequisites: z.array(z.string()).optional(),
    syllabus: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCourseSchema = createCourseSchema.shape.body.partial().extend({
  teacherId: z.string().cuid().nullable().optional(),
});

export const createCourseRequestSchema = z.object({
  body: z.object({
    courseIds: z.array(z.string().cuid()).min(1).max(20),
  }),
});

export const updateCourseRequestSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(10).toUpperCase(),
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    headId: z.string().cuid().optional(),
    facultyId: z.string().optional(),
  }),
});

export const updateDepartmentSchema = createDepartmentSchema.shape.body.partial();

export const createAssignmentSchema = z.object({
  body: z.object({
    courseId: z.string().cuid(),
    title: z.string().min(3).max(100),
    description: z.string().min(10),
    type: z.enum(['HOMEWORK', 'QUIZ', 'MIDTERM', 'FINAL', 'PROJECT', 'PRESENTATION']).default('HOMEWORK'),
    maxPoints: z.number().int().min(1).max(1000).default(100),
    weight: z.number().min(0.1).max(10).default(1.0),
    dueAt: z.string().datetime(),
    allowLateSubmission: z.boolean().default(false),
    latePenalty: z.number().min(0).max(100).optional(),
    attachments: z.array(z.string().url()).optional(),
  }),
});

export const updateAssignmentSchema = createAssignmentSchema.shape.body.partial();

export const createNoticeSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(10),
    type: z.enum(['GENERAL', 'ACADEMIC', 'EVENT', 'URGENT', 'MAINTENANCE']).default('GENERAL'),
    targetRoles: z.array(z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN'])).default(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN']),
    publishAt: z.string().datetime().optional(),
    expireAt: z.string().datetime().optional(),
    isPinned: z.boolean().default(false),
    isPublished: z.boolean().default(true),
    attachments: z.array(z.string().url()).optional(),
  }),
});

export const updateNoticeSchema = createNoticeSchema.shape.body.partial();

export const createEnrollmentSchema = z.object({
  body: z.object({
    courseId: z.string().cuid(),
    studentId: z.string().cuid().optional(),
  }),
});

export const updateEnrollmentSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DROPPED', 'COMPLETED']).optional(),
    grade: z.string().optional(),
    gradePoints: z.number().min(0).max(4).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const recordAttendanceSchema = z.object({
  body: z.object({
    enrollmentId: z.string().cuid(),
    date: z.string().datetime(),
    durationMinutes: z.number().int().min(1).max(720).optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'NOT_RECORDED']),
    notes: z.string().optional(),
  }),
});

export const bulkAttendanceSchema = z.object({
  body: z.object({
    courseId: z.string().cuid(),
    date: z.string().datetime(),
    records: z.array(z.object({
      enrollmentId: z.string().cuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'NOT_RECORDED']),
      notes: z.string().optional(),
    })).min(1),
  }),
});

export const createAttendanceSessionSchema = z.object({
  body: z.object({
    courseId: z.string().cuid(),
    title: z.string().min(2).max(120),
    description: z.string().max(1000).optional(),
    date: z.string().datetime(),
    durationMinutes: z.number().int().min(1).max(720).optional(),
    opensAt: z.string().datetime().optional(),
    closesAt: z.string().datetime().optional(),
    attendanceMode: z.enum(['MANUAL', 'AUTOMATIC', 'CHECK_IN']).optional(),
    gracePeriodMinutes: z.number().int().min(0).max(120).optional(),
    notes: z.string().max(1000).optional(),
  }).refine((value) => !value.opensAt || !value.closesAt || new Date(value.opensAt) < new Date(value.closesAt), {
    message: 'Session opening time must be before closing time',
    path: ['closesAt'],
  }),
});

export const attendanceSessionRecordsSchema = z.object({
  body: z.object({
    records: z.array(z.object({
      enrollmentId: z.string().cuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'NOT_RECORDED']),
      notes: z.string().max(1000).optional(),
    })).min(1),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const attendanceSessionIdSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const submitAssignmentSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    attachments: z.array(z.string().url()).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const gradeSubmissionSchema = z.object({
  body: z.object({
    pointsEarned: z.number().int().min(0).max(1000),
    feedback: z.string().optional(),
    status: z.enum(['SUBMITTED', 'LATE', 'GRADED', 'RETURNED']).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
  }),
});