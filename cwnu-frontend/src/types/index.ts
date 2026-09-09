export type UserRole = 'student' | 'teacher' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
  avatar?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  departmentId: string;
  department?: Department;
  teacherId?: string;
  teacher?: User;
  semester: string;
  year: number;
  schedule?: CourseSchedule[];
  maxStudents: number;
  enrolledCount: number;
  prerequisites?: string[];
  syllabus?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingPlanEntry {
  id?: string;
  month: number;
  week: number;
  topic: string;
  lesson?: string | null;
  activity?: string | null;
  assignment?: string | null;
  project?: string | null;
  assessment?: string | null;
  milestone?: string | null;
  resource?: string | null;
  completionDate?: string | null;
}

export interface TeachingPlan {
  id?: string;
  courseId: string;
  course?: Course;
  objectives: string[];
  outcomes: string[];
  resources: string[];
  startDate?: string | null;
  endDate?: string | null;
  completionDate?: string | null;
  entries: TeachingPlanEntry[];
}

export interface CourseSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  headId?: string;
  head?: User;
  facultyId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  student?: User;
  courseId: string;
  course?: Course;
  status: 'pending' | 'approved' | 'rejected' | 'dropped' | 'completed';
  grade?: string;
  gradePoints?: number;
  enrolledAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recordedBy?: string;
  recordedAt: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  title: string;
  date: string;
  opensAt?: string | null;
  closesAt?: string | null;
  description?: string | null;
  sessionStartAt?: string | null;
  sessionEndAt?: string | null;
  durationMinutes: number;
  attendanceMode: 'MANUAL' | 'AUTOMATIC' | 'CHECK_IN';
  gracePeriodMinutes: number;
  status: 'SCHEDULED' | 'OPEN' | 'ATTENDANCE_IN_PROGRESS' | 'SAVED' | 'CLOSED' | 'CANCELLED' | 'REOPENED';
  reopenedAt?: string | null;
  reopenExpiresAt?: string | null;
  reopenUsed?: boolean;
  notes?: string | null;
  course?: Course;
  invitations?: AttendanceInvitation[];
  records?: AttendanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceInvitation {
  id: string;
  sessionId: string;
  enrollmentId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  invitedAt: string;
  respondedAt?: string | null;
  session?: AttendanceSession;
  enrollment?: Enrollment;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  enrollmentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string | null;
  recordedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  course?: Course;
  title: string;
  description: string;
  type: 'homework' | 'quiz' | 'midterm' | 'final' | 'project' | 'presentation';
  maxPoints: number;
  weight: number;
  assignedAt: string;
  dueAt: string;
  allowLateSubmission: boolean;
  latePenalty?: number;
  attachments?: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignment?: Assignment;
  studentId: string;
  student?: User;
  content?: string;
  attachments?: string[];
  submittedAt: string;
  gradedAt?: string;
  pointsEarned?: number;
  feedback?: string;
  gradedBy?: string;
  status: 'submitted' | 'late' | 'graded' | 'returned';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'event' | 'urgent' | 'maintenance';
  targetRoles: UserRole[];
  authorId: string;
  author?: User;
  publishAt: string;
  expireAt?: string;
  isPinned: boolean;
  isPublished: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'course_enroll' | 'course_drop' | 'assignment_submit' | 'grade_received' | 'attendance_recorded' | 'profile_update' | 'password_change' | 'notice_view';
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalCourses?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalStaff?: number;
  pendingApprovals?: number;
  upcomingAssignments?: number;
  recentGrades?: Array<{
    courseName: string;
    grade: string;
    points: number;
  }>;
  attendanceRate?: number;
  gpa?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, string[]>;
  referenceId?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  roles?: UserRole[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

export interface TestChoice {
  id: string;
  text: string;
  order: number;
  isCorrect?: boolean;
}

export interface TestQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  points: number;
  order: number;
  choices: TestChoice[];
}

export interface CourseTest {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  status: TestStatus;
  durationMinutes: number;
  maxAttempts: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
  shuffleQuestions: boolean;
  showResults: boolean;
  course?: Pick<Course, 'id' | 'code' | 'name'>;
  questions?: TestQuestion[];
  _count?: { questions: number; attempts: number };
  attempts?: Array<{ attemptNumber: number; status: string; score?: number | null; maxScore?: number | null; resultsReleasedAt?: string | null }>;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';
  startedAt: string;
  dueAt: string;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
  resultsReleasedAt?: string | null;
  answers?: TestAnswer[];
}

export interface TestAnswer {
  id?: string;
  questionId: string;
  selectedChoiceIds: string[];
  responseText?: string | null;
  pointsAwarded?: number | null;
  isCorrect?: boolean | null;
  question?: { prompt: string };
}