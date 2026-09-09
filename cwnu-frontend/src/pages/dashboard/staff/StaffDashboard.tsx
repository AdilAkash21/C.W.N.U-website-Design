import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';
import { formatDate, cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';
import { EnrollmentRequestsPanel } from '../../../components/dashboard/EnrollmentRequestsPanel';
import { TeacherCourseRequestsPanel } from '../../../components/dashboard/TeacherCourseRequestsPanel';

export function StaffDashboard() {
  const { user } = useAuth();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers({ limit: 10 }),
    enabled: !!user,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
    enabled: !!user,
  });

  const { data: notices } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.getNotices({ limit: 5 }),
    enabled: !!user,
  });
  const { data: staffDashboard } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: () => api.getStaffDashboard(),
    enabled: !!user,
  });

  const noticeList = notices?.data?.data || [];
  const userList = users?.data?.data || [];
  const recentEnrollments = staffDashboard?.data?.recentEnrollments || [];
  const recentAssignments = staffDashboard?.data?.recentAssignments || [];
  const pendingEnrollmentRecords = staffDashboard?.data?.pendingEnrollmentRecords || [];
  const pendingCourseRequests = staffDashboard?.data?.pendingCourseRequests || [];

  const stats = [
    { label: 'Student & teacher records', value: users?.data?.meta?.total || 0, icon: 'users', color: 'bg-blue-500' },
    { label: 'Departments', value: departments?.data?.length || 0, icon: 'building', color: 'bg-green-500' },
    { label: 'Published notices', value: noticeList.filter((n: any) => n.isPublished).length, icon: 'megaphone', color: 'bg-yellow-500' },
    { label: 'Pending enrollments', value: staffDashboard?.data?.pendingApprovals ?? '—', icon: 'clock', color: 'bg-purple-500' },
  ];

  const getStatIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
      building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
      megaphone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
      clock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    };
    return icons[name] || icons.users;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-academic-gold/15" aria-hidden="true" />
        <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Link
              to="/"
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </Link>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Operations workspace</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Admissions & Operations</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">
              Coordinate admissions, records, notices, and day-to-day university operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/courses">
              <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Manage courses</Button>
            </Link>
            <Link to="/dashboard/teaching-plans">
              <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Teaching plans</Button>
            </Link>
            <Link to="/profile">
              <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">View profile</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="h-full min-h-[136px] p-5">
            <div className="flex h-full items-center justify-between gap-3">
              <div>
                <p className="text-body-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                {getStatIcon(stat.icon)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <EnrollmentRequestsPanel requests={pendingEnrollmentRecords} queryKey="staff-dashboard" />
        <TeacherCourseRequestsPanel requests={pendingCourseRequests} queryKey="staff-dashboard" />
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Notices & announcements</h2>
            <Link to="/admin/notices" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">Manage notices</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {noticeList.length > 0 ? (
              noticeList.map((notice: any) => (
                <div key={notice.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{notice.title}</h3>
                        <Badge variant={notice.isPublished ? 'success' : 'warning'} size="sm">
                          {notice.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{notice.type} • {formatDate(notice.publishAt)}</p>
                    </div>
                    <Link to={`/admin/notices/${notice.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No notices yet</p>
                <Link to="/admin/notices/new" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">Create Notice</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent records</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">View only</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {userList.length > 0 ? (
              userList.slice(0, 5).map((u: any) => (
                <div key={u.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                      {u.firstName?.[0]}{u.lastName?.[0]}
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
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Database activity</p>
            <h2 className="mt-1 text-heading-lg font-semibold">Enrollment and assignment updates</h2>
          </div>
          <Badge variant="info" size="sm">{recentEnrollments.length + recentAssignments.length} recent</Badge>
        </div>
        <div className="grid gap-3 p-6 md:grid-cols-2">
          {recentEnrollments.slice(0, 4).map((enrollment: any) => (
            <div key={enrollment.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{enrollment.student?.firstName} {enrollment.student?.lastName} · {enrollment.course?.name}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enrollment {enrollment.status} · {formatDate(enrollment.updatedAt)}</p>
            </div>
          ))}
          {recentAssignments.slice(0, 4).map((course: any) => (
            <div key={`staff-assignment-${course.id}`} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{course.name} assigned to {course.teacher?.firstName} {course.teacher?.lastName}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">By {course.assignedBy?.firstName} {course.assignedBy?.lastName} · {formatDate(course.assignedAt)}</p>
            </div>
          ))}
          {!recentEnrollments.length && !recentAssignments.length && <p className="text-sm text-gray-500 dark:text-gray-400">No recent enrollment or assignment activity.</p>}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-full">
          <Card variant="hover" className="group h-full p-5 text-left sm:p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
              <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Admissions</h3>
            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">Application workflow coming soon</p>
          </Card>
        </div>
        <Link to="/admin/departments/new" className="block h-full">
          <Card variant="hover" className="group h-full p-5 text-left sm:p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Add Department</h3>
            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">Create new department</p>
          </Card>
        </Link>
        <Link to="/admin/notices/new" className="block h-full">
          <Card variant="hover" className="group h-full p-5 text-left sm:p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/30">
              <svg className="w-7 h-7 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Post Notice</h3>
            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">Publish announcement</p>
          </Card>
        </Link>
        <Link to="/admin/courses" className="block h-full">
          <Card variant="hover" className="group h-full p-5 text-left sm:p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
              <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Manage Courses</h3>
            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">Oversee all courses</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}