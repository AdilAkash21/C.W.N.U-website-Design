import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout, AuthLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { CoursesPage } from './pages/public/CoursesPage';
import { CourseDetailsPage } from './pages/public/CourseDetailsPage';
import { BlogPage } from './pages/public/BlogPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { StudentDashboard } from './pages/dashboard/student/StudentDashboard';
import { StudentCoursesPage } from './pages/dashboard/student/StudentCoursesPage';
import { StudentCourseWorkspacePage } from './pages/dashboard/student/StudentCourseWorkspacePage';
import { StudentAttendancePage } from './pages/dashboard/student/StudentAttendancePage';
import { StudentSchedulePage } from './pages/dashboard/student/StudentSchedulePage';
import { StudentGradesPage } from './pages/dashboard/student/StudentGradesPage';
import { StudentNotificationsPage } from './pages/dashboard/student/StudentNotificationsPage';
import { TeacherDashboard } from './pages/dashboard/teacher/TeacherDashboard';
import { TeacherCoursePage } from './pages/dashboard/teacher/TeacherCoursePage';
import { TeacherAttendancePage } from './pages/dashboard/teacher/TeacherAttendancePage';
import { TeacherTestsPage } from './pages/dashboard/teacher/TeacherTestsPage';
import { StudentTestsPage } from './pages/dashboard/student/StudentTestsPage';
import { StudentTestTakingPage } from './pages/dashboard/student/StudentTestTakingPage';
import { StudentTestResultsPage } from './pages/dashboard/student/StudentTestResultsPage';
import { StaffDashboard } from './pages/dashboard/staff/StaffDashboard';
import { AdminDashboard } from './pages/dashboard/admin/AdminDashboard';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminNoticesPage } from './pages/admin/AdminNoticesPage';
import { AdminContactMessagesPage } from './pages/admin/AdminContactMessagesPage';
import { ContactMessagesPage } from './pages/ContactMessagesPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/ProtectedRoute';
import { TeachingPlansPage } from './pages/TeachingPlansPage';
import { AssignmentsPage } from './pages/dashboard/AssignmentsPage';
import './index.css';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminErrorIncidentsPage } from './pages/admin/AdminErrorIncidentsPage';

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
    <ErrorBoundary>
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<RoleDashboardRedirect />} />
              <Route element={<RoleRoute allowedRoles={['student']} />}>
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/courses" element={<StudentCoursesPage />} />
                <Route path="/dashboard/student/courses/:courseId" element={<StudentCourseWorkspacePage />} />
                <Route path="/dashboard/attendance" element={<StudentAttendancePage />} />
                <Route path="/dashboard/schedule" element={<StudentSchedulePage />} />
                <Route path="/dashboard/grades" element={<StudentGradesPage />} />
                <Route path="/dashboard/tests" element={<StudentTestsPage />} />
                <Route path="/dashboard/tests/:testId/take" element={<StudentTestTakingPage />} />
                <Route path="/dashboard/tests/results/:attemptId" element={<StudentTestResultsPage />} />
                <Route path="/dashboard/notifications" element={<StudentNotificationsPage />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['teacher']} />}>
                <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
                <Route path="/dashboard/courses/:courseId" element={<TeacherCoursePage />} />
                <Route path="/dashboard/courses/:courseId/tests" element={<TeacherTestsPage />} />
                <Route path="/dashboard/attendance" element={<TeacherAttendancePage />} />
                <Route path="/dashboard/notifications" element={<TeacherDashboard />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['staff']} />}>
                <Route path="/dashboard/staff" element={<StaffDashboard />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/dashboard/admin/courses" element={<AdminCoursesPage />} />
              </Route>
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<RoleRoute allowedRoles={['student', 'teacher', 'staff', 'admin']} />}>
                <Route path="/dashboard/assignments" element={<AssignmentsPage />} />
                <Route path="/dashboard/assignments/:assignmentId" element={<AssignmentsPage />} />
                <Route path="/dashboard/messages" element={<ContactMessagesPage />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['student', 'teacher', 'staff', 'admin']} />}>
                <Route path="/dashboard/teaching-plans" element={<TeachingPlansPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['admin', 'staff']} />}>
                <Route path="/admin/courses" element={<AdminCoursesPage />} />
                <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
                <Route path="/admin/notices" element={<AdminNoticesPage />} />
                <Route path="/admin/contact-messages" element={<AdminContactMessagesPage />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin/error-incidents" element={<AdminErrorIncidentsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </NotificationProvider>
    </ErrorBoundary>
  );
}

function RoleDashboardRedirect() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'teacher'
    ? '/dashboard/teacher'
    : user?.role === 'staff'
      ? '/dashboard/staff'
      : user?.role === 'admin'
        ? '/dashboard/admin'
        : '/dashboard/student';

  return <Navigate to={dashboardPath} replace />;
}

export default App;