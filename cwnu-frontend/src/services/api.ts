import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { isTokenExpired } from '../utils/cn';
import type { ApiError, ApiResponse, AuthTokens, LoginCredentials, RegisterData, User, ProfileUpdateData, PasswordResetRequest, PasswordResetConfirm, ChangePasswordData, PaginatedResponse, DashboardStats, AttendanceSession, CourseTest, TestAttempt, TestAnswer } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const API_ORIGIN = new URL(API_BASE_URL).origin;
const AUTH_KEYS = ['accessToken', 'refreshToken', 'user'] as const;

function emitNotification(type: 'success' | 'error', message: string): void {
  window.dispatchEvent(new CustomEvent('cwnu:notification', { detail: { type, message } }));
}

function getStoredAuthValue(key: (typeof AUTH_KEYS)[number]): string | null {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function storeAuthValue(key: (typeof AUTH_KEYS)[number], value: string, rememberMe: boolean): void {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;
  otherStorage.removeItem(key);
  targetStorage.setItem(key, value);
}

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = getStoredAuthValue('accessToken');
        if (accessToken && !isTokenExpired(accessToken)) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        const method = response.config.method?.toUpperCase();
        const message = response.data?.message || (
          method === 'POST' ? 'Request submitted successfully.' :
          method === 'DELETE' ? 'Deleted successfully.' :
          'Changes saved successfully.'
        );
        const url = response.config.url || '';
        if (message && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !url.includes('/auth/')) {
          emitNotification('success', message);
        }
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = (error.config || {}) as InternalAxiosRequestConfig & { _retry?: boolean };

        const requestUrl = originalRequest.url || '';
        const isAuthenticationRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh');

        if (error.response?.status === 401 && !isAuthenticationRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch {
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }

        const method = originalRequest.method?.toUpperCase();
        if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !isAuthenticationRequest) {
          const status = error.response?.status;
          const message = !error.response
            ? 'The server could not be reached. Check that the local backend is running and try again.'
            : status === 403
              ? 'You do not have permission to perform this action.'
              : status === 404
                ? 'The requested item could not be found.'
                : status === 409
                  ? 'This change conflicts with a newer update. Refresh and try again.'
                  : status === 429
                    ? 'Too many requests. Please wait a moment and try again.'
                    : error.response?.data?.message || 'The operation could not be completed. Please try again.';
          emitNotification('error', message);
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = getStoredAuthValue('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post<ApiResponse<AuthTokens>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      const rememberMe = Boolean(localStorage.getItem('refreshToken'));
      storeAuthValue('accessToken', accessToken, rememberMe);
      storeAuthValue('refreshToken', newRefreshToken, rememberMe);
      return accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private clearAuth(): void {
    AUTH_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  getAccessToken(): string | null {
    return getStoredAuthValue('accessToken');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !isTokenExpired(token);
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.client.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials);
    const { user, tokens } = response.data.data;
    const rememberMe = credentials.rememberMe === true;
    storeAuthValue('accessToken', tokens.accessToken, rememberMe);
    storeAuthValue('refreshToken', tokens.refreshToken, rememberMe);
    storeAuthValue('user', JSON.stringify(user), rememberMe);
    return response.data;
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.client.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/register', data);
    const { user, tokens } = response.data.data;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = getStoredAuthValue('refreshToken');
    try {
      await this.client.post('/auth/logout', { refreshToken });
    } finally {
      this.clearAuth();
    }
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<void>> {
    return this.client.post('/auth/password-reset/request', data);
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<ApiResponse<void>> {
    return this.client.post('/auth/password-reset/confirm', data);
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    return this.client.post('/auth/password/change', data);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.client.get<ApiResponse<User>>('/users/me');
    if (response.data.data.avatar?.startsWith('/')) {
      response.data.data.avatar = `${API_ORIGIN}${response.data.data.avatar}`;
    }
    return response.data;
  }

  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<User>> {
    const response = await this.client.patch<ApiResponse<User>>('/users/me', data);
    return response.data;
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.client.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.data.avatarUrl.startsWith('/')) {
      response.data.data.avatarUrl = `${API_ORIGIN}${response.data.data.avatarUrl}`;
    }
    response.data.data.avatarUrl = `${response.data.data.avatarUrl}${response.data.data.avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
    return response.data;
  }

  async getDashboardStats(role: User['role']): Promise<ApiResponse<DashboardStats>> {
    return this.client.get(`/dashboard/stats/${role}`);
  }

  async getAdminDashboard(): Promise<ApiResponse<{
    userStats: Array<{ role: string; _count: { id: number } }>;
    totalCourses: number;
    activeNotices: number;
    totalEnrollments: number;
    totalSubmissions: number;
    pendingEnrollments: number;
    pendingEnrollmentRecords: any[];
    pendingCourseRequests: any[];
    recentActivities: any[];
    recentAssignments: any[];
  }>> {
    const response = await this.client.get<ApiResponse<{
      userStats: Array<{ role: string; _count: { id: number } }>;
      totalCourses: number;
      activeNotices: number;
      totalEnrollments: number;
      totalSubmissions: number;
      pendingEnrollments: number;
      pendingEnrollmentRecords: any[];
      pendingCourseRequests: any[];
      recentActivities: any[];
      recentAssignments: any[];
    }>>('/dashboard/admin');
    return response.data;
  }

  async getTeacherDashboard(): Promise<ApiResponse<{
    courses: any[];
    pendingEnrollments: any[];
    recentGradedSubmissions: any[];
    courseRequests: any[];
    notifications: any[];
  }>> {
    const response = await this.client.get<ApiResponse<{
      courses: any[];
      pendingEnrollments: any[];
      recentGradedSubmissions: any[];
      courseRequests: any[];
      notifications: any[];
    }>>('/dashboard/teacher');
    return response.data;
  }

  async getStaffDashboard(): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>('/dashboard/staff');
    return response.data;
  }

  async getCourses(params?: { page?: number; limit?: number; search?: string; departmentId?: string; teacherId?: string; includeInactive?: boolean }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/courses', { params });
  }

  async getCourseRequests(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/course-requests');
    return response.data;
  }

  async submitCourseRequests(courseIds: string[]): Promise<ApiResponse<any[]>> {
    const response = await this.client.post<ApiResponse<any[]>>('/course-requests', { courseIds });
    return response.data;
  }

  async reviewCourseRequest(id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ApiResponse<any>> {
    const response = await this.client.put<ApiResponse<any>>(`/course-requests/${id}`, { status });
    return response.data;
  }

  async getCourse(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(`/courses/${id}`);
    return response.data;
  }

  async getCourseWorkspace(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(`/courses/${id}/workspace`);
    return response.data;
  }

  async getTeachingPlans(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/teaching-plans');
    return response.data;
  }

  async getTeachingPlan(courseId: string): Promise<ApiResponse<any | null>> {
    const response = await this.client.get<ApiResponse<any | null>>(`/teaching-plans/${courseId}`);
    return response.data;
  }

  async saveTeachingPlan(courseId: string, data: any): Promise<ApiResponse<any>> {
    const response = await this.client.put<ApiResponse<any>>(`/teaching-plans/${courseId}`, data);
    return response.data;
  }

  async createCourse(data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.post('/courses', data);
  }

  async updateCourse(id: string, data: Partial<any>): Promise<ApiResponse<any>> {
    const response = await this.client.put<ApiResponse<any>>(`/courses/${id}`, data);
    return response.data;
  }

  async updateEnrollment(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DROPPED' | 'COMPLETED'): Promise<ApiResponse<any>> {
    const response = await this.client.put<ApiResponse<any>>(`/enrollments/${id}`, { status });
    return response.data;
  }

  async updateStudentGrade(enrollmentId: string, data: { grade?: string; gradePoints?: number }): Promise<ApiResponse<any>> {
    const response = await this.client.put<ApiResponse<any>>(`/enrollments/${enrollmentId}`, data);
    return response.data;
  }

  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/courses/${id}`);
  }

  async enrollCourse(courseId: string): Promise<ApiResponse<any>> {
    return this.client.post('/enrollments', { courseId });
  }

  async dropCourse(enrollmentId: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/enrollments/${enrollmentId}`);
  }

  async getEnrollments(params?: { studentId?: string; courseId?: string; status?: string; limit?: number }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/enrollments', { params });
    return response.data;
  }

  async getDepartments(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any[]> & { meta?: PaginatedResponse<any>['meta'] }> {
    const response = await this.client.get<ApiResponse<any[]> & { meta?: PaginatedResponse<any>['meta'] }>('/departments', { params });
    return response.data;
  }

  async createDepartment(data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.post('/departments', data);
  }

  async updateDepartment(id: string, data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.patch(`/departments/${id}`, data);
  }

  async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/departments/${id}`);
  }

  async getAssignments(courseId?: string): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/assignments', { params: { courseId } });
    return response.data;
  }

  async createAssignment(data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.post('/assignments', data);
  }

  async updateAssignment(id: string, data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.patch(`/assignments/${id}`, data);
  }

  async deleteAssignment(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/assignments/${id}`);
  }

  async publishAssignment(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>(`/assignments/${id}/publish`);
    return response.data;
  }

  async getAssignment(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(`/assignments/${id}`);
    return response.data;
  }

  async getAssignmentNotifications(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/assignments/notifications');
    return response.data;
  }

  async submitAssignment(assignmentId: string, data: { content?: string; attachments?: string[] }): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>(`/assignments/${assignmentId}/submit`, {
      content: data.content,
      attachments: data.attachments,
    });
    return response.data;
  }

  async gradeSubmission(submissionId: string, data: { pointsEarned: number; feedback?: string; status?: string }): Promise<ApiResponse<any>> {
    const response = await this.client.put<ApiResponse<any>>(`/assignments/${submissionId}/grade`, data);
    return response.data;
  }

  async getEligibleTests(): Promise<ApiResponse<CourseTest[]>> {
    const response = await this.client.get<ApiResponse<CourseTest[]>>('/tests/eligible');
    return response.data;
  }

  async getCourseTests(courseId: string): Promise<ApiResponse<CourseTest[]>> {
    const response = await this.client.get<ApiResponse<CourseTest[]>>(`/tests/course/${courseId}`);
    return response.data;
  }

  async getManagedTest(testId: string): Promise<ApiResponse<CourseTest>> {
    const response = await this.client.get<ApiResponse<CourseTest>>(`/tests/${testId}/manage`);
    return response.data;
  }

  async createTest(data: {
    courseId: string;
    title: string;
    description?: string;
    durationMinutes: number;
    maxAttempts: number;
    availableFrom?: string | null;
    availableUntil?: string | null;
    showResults: boolean;
    questions: Array<{ prompt: string; type: string; points: number; choices: Array<{ text: string; isCorrect: boolean }> }>;
  }): Promise<ApiResponse<CourseTest>> {
    const response = await this.client.post<ApiResponse<CourseTest>>('/tests', data);
    return response.data;
  }

  async updateTest(testId: string, data: Partial<{
    title: string;
    description: string;
    durationMinutes: number;
    maxAttempts: number;
    availableFrom: string | null;
    availableUntil: string | null;
    showResults: boolean;
  }>): Promise<ApiResponse<CourseTest>> {
    const response = await this.client.patch<ApiResponse<CourseTest>>(`/tests/${testId}`, data);
    return response.data;
  }

  async publishTest(testId: string): Promise<ApiResponse<CourseTest>> {
    const response = await this.client.post<ApiResponse<CourseTest>>(`/tests/${testId}/publish`);
    return response.data;
  }

  async addTestQuestion(testId: string, data: { prompt: string; type: string; points: number; choices: Array<{ text: string; isCorrect: boolean }> }): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>(`/tests/${testId}/questions`, data);
    return response.data;
  }

  async startTest(testId: string): Promise<ApiResponse<{ attempt: TestAttempt; serverTime?: string; test: CourseTest }>> {
    const response = await this.client.post<ApiResponse<{ attempt: TestAttempt; serverTime?: string; test: CourseTest }>>(`/tests/${testId}/start`);
    return response.data;
  }

  async saveTestAnswer(attemptId: string, answer: TestAnswer): Promise<ApiResponse<{ answer: TestAnswer; serverTime: string; dueAt: string }>> {
    const response = await this.client.put<ApiResponse<{ answer: TestAnswer; serverTime: string; dueAt: string }>>(`/tests/attempts/${attemptId}/answers`, answer);
    return response.data;
  }

  async submitTest(attemptId: string, answers: TestAnswer[]): Promise<ApiResponse<{ attemptId: string; score: number; maxScore: number; status: string }>> {
    const response = await this.client.post<ApiResponse<{ attemptId: string; score: number; maxScore: number; status: string }>>(`/tests/attempts/${attemptId}/submit`, { answers });
    return response.data;
  }

  async getTestResults(attemptId: string): Promise<ApiResponse<TestAttempt & { test: CourseTest }>> {
    const response = await this.client.get<ApiResponse<TestAttempt & { test: CourseTest }>>(`/tests/attempts/${attemptId}/results`);
    return response.data;
  }

  async getTestAttempts(testId: string): Promise<ApiResponse<TestAttempt[]>> {
    const response = await this.client.get<ApiResponse<TestAttempt[]>>(`/tests/${testId}/attempts`);
    return response.data;
  }

  async releaseTestResults(testId: string): Promise<ApiResponse<{ released: number }>> {
    const response = await this.client.post<ApiResponse<{ released: number }>>(`/tests/${testId}/release-results`);
    return response.data;
  }

  async getAttendance(courseId: string, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>(`/attendance/${courseId}`, { params });
    return response.data;
  }

  async recordAttendance(data: { enrollmentId: string; date: string; status: string; notes?: string }): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>('/attendance', data);
    return response.data;
  }

  async bulkRecordAttendance(data: { courseId: string; date: string; records: Array<{ enrollmentId: string; status: string; notes?: string }> }): Promise<ApiResponse<any[]>> {
    return this.client.post('/attendance/bulk', data);
  }

  async createAttendanceSession(data: { courseId: string; title: string; description?: string; date: string; durationMinutes?: number; opensAt?: string; closesAt?: string; attendanceMode?: 'MANUAL' | 'AUTOMATIC' | 'CHECK_IN'; gracePeriodMinutes?: number; notes?: string }): Promise<ApiResponse<AttendanceSession>> {
    const response = await this.client.post<ApiResponse<AttendanceSession>>('/attendance/sessions', data);
    return response.data;
  }

  async getAttendanceSessions(courseId?: string): Promise<ApiResponse<AttendanceSession[]>> {
    const response = await this.client.get<ApiResponse<AttendanceSession[]>>('/attendance/sessions', { params: courseId ? { courseId } : undefined });
    return response.data;
  }

  async getAttendanceSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    const response = await this.client.get<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}`);
    return response.data;
  }

  async recordAttendanceSession(id: string, records: Array<{ enrollmentId: string; status: string; notes?: string }>): Promise<ApiResponse<any[]>> {
    const response = await this.client.put<ApiResponse<any[]>>(`/attendance/sessions/${id}/records`, { records });
    return response.data;
  }

  async closeAttendanceSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    const response = await this.client.post<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}/close`);
    return response.data;
  }

  async openAttendanceSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    const response = await this.client.post<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}/open`);
    return response.data;
  }

  async reopenAttendanceSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    const response = await this.client.post<ApiResponse<AttendanceSession>>(`/attendance/sessions/${id}/reopen`);
    return response.data;
  }

  async getStudentAttendance(courseId?: string): Promise<ApiResponse<{ invitations: any[]; notifications: any[] }>> {
    const response = await this.client.get<ApiResponse<{ invitations: any[]; notifications: any[] }>>('/attendance/student', {
      params: courseId ? { courseId } : undefined,
    });
    return response.data;
  }

  async acceptAttendanceInvitation(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>(`/attendance/invitations/${id}/accept`);
    return response.data;
  }

  async getNotices(params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/notices', { params });
  }

  async sendContactMessage(data: { name: string; email: string; subject: string; message: string }): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>('/contact', data);
    return response.data;
  }

  async getContactConversations(params?: { search?: string; status?: string }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/contact', { params });
    return response.data;
  }

  async replyToContactMessage(id: string, message: string): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>(`/contact/${id}/reply`, { message });
    return response.data;
  }

  async updateContactStatus(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>(`/contact/${id}/status`, { status });
    return response.data;
  }

  async createNotice(data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.post('/notices', data);
  }

  async updateNotice(id: string, data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.patch(`/notices/${id}`, data);
  }

  async deleteNotice(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/notices/${id}`);
  }

  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<ApiResponse<PaginatedResponse<User>>> {
    return this.client.get('/users', { params });
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  }

  async createUser(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.client.post('/users', data);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/users/${id}`);
  }

  async getActivityLogs(params?: { page?: number; limit?: number; userId?: string; type?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/activity-logs', { params });
  }

  async getErrorIncidents(params?: { page?: number; limit?: number; search?: string; status?: string; severity?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>('/admin/error-incidents', { params });
    return response.data;
  }

  async updateErrorIncident(id: string, data: { status: string; resolutionNotes?: string }): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/error-incidents/${id}`, data);
    return response.data;
  }
}

export const api = new ApiService();