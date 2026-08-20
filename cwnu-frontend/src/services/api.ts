import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { parseJwt, isTokenExpired } from '../utils/cn';
import type { ApiError, ApiResponse, AuthTokens, LoginCredentials, RegisterData, User, ProfileUpdateData, PasswordResetRequest, PasswordResetConfirm, ChangePasswordData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken && !isTokenExpired(accessToken)) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
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

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post<ApiResponse<AuthTokens>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      return accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !isTokenExpired(token);
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.client.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials);
    const { user, tokens } = response.data.data;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
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
    const refreshToken = localStorage.getItem('refreshToken');
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
    return this.client.get('/auth/me');
  }

  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<User>> {
    return this.client.patch('/auth/profile', data);
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.client.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getDashboardStats(role: User['role']): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/dashboard/stats/${role}`);
  }

  async getCourses(params?: { page?: number; limit?: number; search?: string; departmentId?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/courses', { params });
  }

  async getCourse(id: string): Promise<ApiResponse<any>> {
    return this.client.get(`/courses/${id}`);
  }

  async createCourse(data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.post('/courses', data);
  }

  async updateCourse(id: string, data: Partial<any>): Promise<ApiResponse<any>> {
    return this.client.patch(`/courses/${id}`, data);
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

  async getEnrollments(params?: { studentId?: string; courseId?: string; status?: string }): Promise<ApiResponse<any[]>> {
    return this.client.get('/enrollments', { params });
  }

  async getDepartments(): Promise<ApiResponse<any[]>> {
    return this.client.get('/departments');
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
    return this.client.get('/assignments', { params: { courseId } });
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

  async submitAssignment(assignmentId: string, data: { content?: string; attachments?: File[] }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    data.attachments?.forEach((file) => formData.append('attachments', file));
    return this.client.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async gradeSubmission(submissionId: string, data: { pointsEarned: number; feedback?: string }): Promise<ApiResponse<any>> {
    return this.client.post(`/submissions/${submissionId}/grade`, data);
  }

  async getAttendance(courseId: string, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any[]>> {
    return this.client.get(`/attendance/${courseId}`, { params });
  }

  async recordAttendance(data: { enrollmentId: string; date: string; status: string; notes?: string }): Promise<ApiResponse<any>> {
    return this.client.post('/attendance', data);
  }

  async bulkRecordAttendance(data: { courseId: string; date: string; records: Array<{ enrollmentId: string; status: string; notes?: string }> }): Promise<ApiResponse<any[]>> {
    return this.client.post('/attendance/bulk', data);
  }

  async getNotices(params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/notices', { params });
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
    return this.client.get(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.client.patch(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/users/${id}`);
  }

  async getActivityLogs(params?: { page?: number; limit?: number; userId?: string; type?: string }): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.client.get('/activity-logs', { params });
  }
}

export const api = new ApiService();