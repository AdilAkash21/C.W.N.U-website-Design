import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { API_ORIGIN, api } from '../../../services/api';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';
import { EnrollmentRequestsPanel } from '../../../components/dashboard/EnrollmentRequestsPanel';
import { TeacherCourseRequestsPanel } from '../../../components/dashboard/TeacherCourseRequestsPanel';

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: isDashboardLoading, isError: isDashboardError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.getAdminDashboard(),
    enabled: !!user,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers({ limit: 5 }),
    enabled: !!user,
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.getCourses({ limit: 5 }),
    enabled: !!user,
  });

  const dashboardData = dashboard?.data;
  const recentActivities = dashboardData?.recentActivities || [];
  const recentAssignments = dashboardData?.recentAssignments || [];
  const pendingEnrollmentRecords = dashboardData?.pendingEnrollmentRecords || [];
  const pendingCourseRequests = dashboardData?.pendingCourseRequests || [];
  const countByRole = (role: string) => dashboardData?.userStats.find((stat) => stat.role === role)?._count.id || 0;
  const statCards = [
    { label: 'Total Students', value: countByRole('STUDENT'), icon: 'graduation', color: 'bg-blue-500', href: '/admin/users?role=student' },
    { label: 'Total Teachers', value: countByRole('TEACHER'), icon: 'chalkboard', color: 'bg-green-500', href: '/admin/users?role=teacher' },
    { label: 'Total Staff', value: countByRole('STAFF'), icon: 'briefcase', color: 'bg-purple-500', href: '/admin/users?role=staff' },
    { label: 'Active Courses', value: dashboardData?.totalCourses || 0, icon: 'book', color: 'bg-orange-500', href: '/dashboard/admin/courses' },
  ];

  const getStatIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      graduation: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>,
      chalkboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
      briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
      book: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    };
    return icons[name] || icons.book;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 animate-fade-in sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-academic-gold/15" aria-hidden="true" />
        <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Platform control center</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">
              Manage users, academic operations, and platform data from one secure workspace.
            </p>
          </div>
          <Link to="/profile">
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">View profile</Button>
          </Link>
          <Link to="/dashboard/teaching-plans">
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Teaching plans</Button>
          </Link>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">Live metrics</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">University snapshot</h2>
        </div>
        <span className="hidden items-center gap-2 text-xs text-gray-500 dark:text-gray-400 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Synced with database
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.href} className="group/stat rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
            <Card className="relative h-full overflow-hidden p-5 transition-all duration-300 group-hover/stat:-translate-y-1 group-hover/stat:shadow-card-hover group-active/stat:translate-y-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{isDashboardLoading ? '—' : stat.value}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">View current records</p>
                </div>
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover/stat:scale-110', stat.color)}>
                  {getStatIcon(stat.icon)}
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 transition-opacity group-hover/stat:opacity-100 dark:text-primary-400">
                Open details
                <span aria-hidden="true">-&gt;</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      {isDashboardError ? (
        <Card className="p-6 text-red-700 dark:text-red-300">Unable to load current Admin dashboard data.</Card>
      ) : (
      <div className="grid grid-cols-1 gap-6">
        <EnrollmentRequestsPanel requests={pendingEnrollmentRecords} queryKey="admin-dashboard" />
        <TeacherCourseRequestsPanel requests={pendingCourseRequests} queryKey="admin-dashboard" />
        <Card className="p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-heading-lg font-semibold">Latest staff activity</h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Synced from database</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recentActivities.slice(0, 6).map((activity: any) => (
              <div key={activity.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.user?.firstName} {activity.user?.lastName} · {new Date(activity.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {recentAssignments.slice(0, 4).map((course: any) => (
              <div key={`assignment-${course.id}`} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{course.name} assigned to {course.teacher?.firstName} {course.teacher?.lastName}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">By {course.assignedBy?.firstName} {course.assignedBy?.lastName} · {course.assignedAt ? new Date(course.assignedAt).toLocaleString() : ''}</p>
              </div>
            ))}
            {!recentActivities.length && !recentAssignments.length && <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity.</p>}
          </div>
        </Card>
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-2 border-b border-gray-100 bg-gradient-to-br from-primary-50 via-white to-white p-6 dark:border-gray-800 dark:from-primary-950/40 dark:via-gray-900 dark:to-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">Live database snapshot</p>
              <h2 className="mt-1 text-heading-lg font-semibold text-gray-900 dark:text-white">System Overview</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Current data
            </span>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Course Enrollments" value={dashboardData?.totalEnrollments || 0} subtitle="All recorded" icon="book-plus" color="green" />
              <MetricCard label="Assignments Submitted" value={dashboardData?.totalSubmissions || 0} subtitle="All recorded" icon="upload" color="purple" />
              <MetricCard label="Published Notices" value={dashboardData?.activeNotices || 0} subtitle="Currently published" icon="ticket" color="orange" />
              <MetricCard label="Administrators" value={countByRole('ADMIN')} subtitle="Current database total" icon="user-plus" color="blue" />
            </div>
            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-primary-50/40 p-5 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/20">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Admin shortcuts</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Jump directly to a supported management workflow.</p>
                </div>
                <span className="hidden rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 sm:inline-flex dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300">6 available</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'Add User', detail: 'Create accounts and roles', href: '/admin/users', icon: 'user' },
                  { label: 'Create Course', detail: 'Add a course to the catalogue', href: '/admin/courses?action=create', icon: 'book' },
                  { label: 'Add Department', detail: 'Manage academic departments', href: '/admin/departments', icon: 'building' },
                  { label: 'Post Notice', detail: 'Publish a university notice', href: '/admin/notices', icon: 'notice' },
                  { label: 'Contact Messages', detail: 'Review submitted messages', href: '/admin/contact-messages', icon: 'mail' },
                  { label: 'System Errors', detail: 'Review reported incidents', href: '/admin/error-incidents', icon: 'report' },
                ].map((action, index) => (
                  <Link key={action.label} to={action.href} className="group/action">
                    <Button
                      variant="ghost"
                      leftIcon={<span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', index === 0 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300')}><ActionIcon name={action.icon} /></span>}
                      className={cn(
                        'h-full min-h-[72px] w-full justify-start rounded-2xl border border-gray-200 bg-white px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/60 hover:shadow-md dark:border-gray-700 dark:bg-gray-900/70 dark:hover:border-primary-800 dark:hover:bg-primary-950/30',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{action.label}</span>
                        <span className="mt-0.5 block truncate text-xs font-normal text-gray-500 dark:text-gray-400">{action.detail}</span>
                      </span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>

      </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Directory</p>
              <h2 className="mt-1 text-heading-lg font-semibold">Recent Users</h2>
            </div>
            <Link to="/admin/users" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {users?.data?.data?.length ? users.data.data.map((u: any) => (
              <div key={u.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                    {u.avatar ? <img src={`${API_ORIGIN}${u.avatar}`} alt="" className="h-full w-full rounded-full object-cover" /> : `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">{u.role}</Badge>
                  <Badge variant={u.isActive ? 'success' : 'gray'} size="sm">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            )) : <EmptyState message="No users have been recorded yet." />}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm dark:bg-primary-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM4 16.5A2.5 2.5 0 016.5 14H20M12 7v4m-2-2h4" /></svg>
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Academics</p>
                  <h2 className="mt-1 text-heading-lg font-semibold">Recent Courses</h2>
                </div>
              </div>
            </div>
            <Link to="/admin/courses" className="shrink-0 rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 dark:border-primary-800 dark:bg-gray-900 dark:text-primary-300 dark:hover:bg-primary-950/40">View all</Link>
          </div>
          <div className="space-y-3 bg-gray-50/70 p-4 dark:bg-gray-950/20 sm:p-5">
            {courses?.data?.data?.length ? courses.data.data.map((c: any) => (
              <Link key={c.id} to="/admin/courses" className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11zM4 16.5A2.5 2.5 0 016.5 14H20" /></svg>
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                    <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{c.code} <span className="mx-1 text-gray-300 dark:text-gray-600">•</span> {c.department?.name || 'Department not assigned'}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right"><p className="text-sm font-bold text-gray-900 dark:text-white">{c.enrolledCount ?? 0}<span className="font-medium text-gray-400">/{c.maxStudents}</span></p><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">enrolled</p></div>
                  <Badge variant={c.isActive ? 'success' : 'gray'} size="sm">{c.isActive ? 'Active' : 'Inactive'}</Badge>
                  <svg className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-500 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" /></svg>
                </div>
              </Link>
            )) : <EmptyState message="No courses have been created yet." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{message}</div>;
}

function ActionIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    user: <><path d="M15 19a4 4 0 00-8 0" /><circle cx="11" cy="8" r="3" /><path d="M19 8v6m3-3h-6" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5v-11z" /><path d="M4 16.5A2.5 2.5 0 016.5 14H20M12 7v4m-2-2h4" /></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M9 21v-4h6v4M8 8h1m3 0h1m3 0h1m-8 4h1m3 0h1m3 0h1" /></>,
    notice: <><path d="M4 12h2l9-5v10l-9-5H4v4m11-2a3 3 0 000-4" /></>,
    report: <><path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14M8 17v-4m4 4V8m4 9v-7" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6v.1h-2.6V20a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H6v-2.6h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.6V5h2.6v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.6 1h.1v2.6H21a1.7 1.7 0 00-1.6 1z" /></>,
  };

  return <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function MetricCard({ label, value, subtitle, icon, color }: { label: string; value: string | number; subtitle: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  const icons: Record<string, React.ReactNode> = {
    'user-plus': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>,
    'book-plus': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    upload: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>,
    ticket: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  };

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-primary-900">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
          {icons[icon]}
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
    </div>
  );
}