import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { CoursesPage } from './pages/public/CoursesPage';
import { BlogPage } from './pages/public/BlogPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { StudentDashboard } from './pages/dashboard/student/StudentDashboard';
import { TeacherDashboard } from './pages/dashboard/teacher/TeacherDashboard';
import { StaffDashboard } from './pages/dashboard/staff/StaffDashboard';
import { AdminDashboard } from './pages/dashboard/admin/AdminDashboard';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminNoticesPage } from './pages/admin/AdminNoticesPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute>}>
              <Route path="/dashboard" element={<Navigate to="/dashboard/student" replace />} />
              <Route element={<RoleRoute allowedRoles={['student']}>}>
                <Route path="/dashboard/student" element={<StudentDashboard />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['teacher']}>}>
                <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['staff']}>}>
                <Route path="/dashboard/staff" element={<StaffDashboard />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['admin']}>}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
              </Route>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute>}>
              <Route element={<RoleRoute allowedRoles={['admin']>}}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/courses" element={<AdminCoursesPage />} />
                <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
                <Route path="/admin/notices" element={<AdminNoticesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;