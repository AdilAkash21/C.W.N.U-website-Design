import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';
import { formatDate, cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';

const getStatIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    book: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
    award: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    'calendar-check': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  };
  return icons[name] || icons.book;
};

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => api.getEnrollments({ studentId: user?.id }),
    enabled: !!user,
  });

  const { data: upcomingAssignments } = useQuery({
    queryKey: ['upcoming-assignments', user?.id],
    queryFn: () => api.getAssignments(),
    enabled: !!user,
  });

  const { data: recentGrades } = useQuery({
    queryKey: ['recent-grades', user?.id],
    queryFn: () => api.getEnrollments({ studentId: user?.id, status: 'completed' }),
    enabled: !!user,
  });
  const { data: attendance } = useQuery({
    queryKey: ['student-attendance', user?.id],
    queryFn: () => api.getStudentAttendance(),
    enabled: !!user,
  });

  const allEnrollments = enrollments?.data || [];
  const currentCourses = allEnrollments.filter((enrollment: any) => enrollment.status === 'APPROVED').slice(0, 4);
  const courseAssignmentsPath = currentCourses[0]?.courseId
    ? `/dashboard/assignments?courseId=${currentCourses[0].courseId}`
    : '/dashboard/assignments';
  const enrolledCourseIds = new Set(currentCourses.map((enrollment: any) => enrollment.courseId));
  const assignments = upcomingAssignments?.data
    ?.filter((assignment: any) => !assignment.courseId || enrolledCourseIds.has(assignment.courseId))
    .slice(0, 5) || [];
  const grades = recentGrades?.data?.filter((enrollment: any) => enrollment.gradePoints != null).slice(0, 4) || [];
  const averageGradePoints = grades.length
    ? grades.reduce((total: number, enrollment: any) => total + Number(enrollment.gradePoints), 0) / grades.length
    : null;
  const attendanceInvitations = attendance?.data?.invitations || [];
  const attendanceRecords = attendanceInvitations
    .map((invitation: any) => invitation.session?.records?.find((record: any) => record.enrollmentId === invitation.enrollmentId))
    .filter(Boolean);
  const presentAttendance = attendanceRecords.filter((record: any) => record.status === 'PRESENT' || record.status === 'LATE').length;
  const attendanceRate = attendanceRecords.length ? Math.round((presentAttendance / attendanceRecords.length) * 100) : null;
  const stats = [
    { label: 'Enrolled Courses', value: String(currentCourses.length), detail: currentCourses.length ? 'Approved enrollments' : 'No enrollments yet', icon: 'book', color: 'bg-blue-500' },
    { label: 'Upcoming Assignments', value: String(assignments.length), detail: assignments.length ? 'From your courses' : 'No assignments yet', icon: 'clipboard', color: 'bg-amber-500' },
    { label: 'Current GPA', value: averageGradePoints !== null ? averageGradePoints.toFixed(2) : '—', detail: grades.length ? 'Based on recorded grades' : 'No grades yet', icon: 'award', color: 'bg-emerald-500' },
    { label: 'Attendance Rate', value: attendanceRate !== null ? `${attendanceRate}%` : '—', detail: attendanceRecords.length ? `${attendanceRecords.length} recorded sessions` : 'No attendance records yet', icon: 'calendar-check', color: 'bg-violet-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" aria-hidden="true" />
        <div className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition-colors hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Student portal</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {user?.firstName}!</h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
              Stay on top of your learning journey and make today count.
            </p>
          </div>
          <Link to="/courses" className="shrink-0">
            <Button variant="secondary" className="border-0 bg-white text-primary-700 hover:bg-blue-50">
              Explore courses
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden p-5 hover:-translate-y-0.5 hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.detail}</p>
              </div>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-105', stat.color)}>
                {getStatIcon(stat.icon)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Semester Progress */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Academic overview</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Your course progress</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Approved courses start at 0% and update as academic activity is recorded.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36" aria-label="Course progress: 0 percent">
                <path className="text-gray-200 dark:text-gray-800" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831" />
                <path className="text-gray-300 dark:text-gray-700" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="0, 100" d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">0%</span>
            </div>
            <div className="hidden min-w-32 sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Starting point</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Progress updates after activity</p>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800" />
      </Card>

      {/* Current Courses & Upcoming Assignments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Courses */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Your learning</p>
              <h2 className="mt-1 text-heading-lg font-semibold">Current Courses</h2>
            </div>
            <Link to="/dashboard/courses" className="rounded-lg px-2 py-1 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-950/30">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentCourses.length > 0 ? (
              currentCourses.map((enrollment: any) => (
                <Link key={enrollment.id} to={`/dashboard/student/courses/${enrollment.courseId}`} className="group flex items-center gap-4 p-5 transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-950/20 sm:p-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600 shadow-sm transition-transform duration-200 group-hover:scale-105 dark:from-primary-900/40 dark:to-blue-900/30 dark:text-primary-300">
                    <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-gray-900 dark:text-white">{enrollment.course?.name || 'Course'}</h3>
                      <Badge variant="success" size="sm" dot>Active</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{enrollment.course?.code} {enrollment.course?.teacher ? `• ${enrollment.course.teacher.firstName} ${enrollment.course.teacher.lastName}` : ''}</p>
                    <p className="mt-2 text-xs font-medium text-gray-400">{enrollment.course?.schedule || 'Open course workspace for details'}</p>
                  </div>
                  <span className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-transform group-hover:translate-x-0.5 dark:text-primary-400 sm:flex">Open <span aria-hidden="true">→</span></span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <p className="text-gray-500 dark:text-gray-400">No courses enrolled yet</p>
                <Link to="/courses" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">Browse Courses</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Upcoming Assignments</h2>
            <Link to={courseAssignmentsPath} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {assignments.length > 0 ? (
              assignments.map((assignment: any) => (
                <div key={assignment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{assignment.course?.name} • Due {formatDate(assignment.dueAt)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info" size="sm">{assignment.type}</Badge>
                        <Badge variant="gray" size="sm">{assignment.maxPoints} pts</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Link to={`/dashboard/assignments/${assignment.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                <p className="text-gray-500 dark:text-gray-400">No upcoming assignments</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Grades & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent Grades</h2>
            <Link to="/dashboard/grades" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {grades.length > 0 ? (
              grades.map((enrollment: any) => (
                <div key={enrollment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{enrollment.course?.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course?.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{enrollment.grade || '—'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.gradePoints?.toFixed(2)} GPA pts</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <p className="text-gray-500 dark:text-gray-400">No grades yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Student portal</p>
              <h2 className="mt-1 text-heading-lg font-semibold">Quick Actions</h2>
            </div>
            <span className="text-xs text-gray-500">Choose an option</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link to="/dashboard/courses" className="group flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm dark:border-gray-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">My Courses</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Browse and manage your courses</p>
                </div>
            </Link>
            <Link to={courseAssignmentsPath} className="group flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm dark:border-gray-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">View Assignments</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open course work assignments</p>
                </div>
            </Link>
            <Link to="/dashboard/schedule" className="group flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm dark:border-gray-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">My Schedule</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View weekly class schedule</p>
                </div>
            </Link>
            <Link to="/dashboard/attendance" className="group flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm dark:border-gray-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Attendance</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check attendance records</p>
                </div>
            </Link>
            <Link to="/dashboard/grades" className="group flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm dark:border-gray-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
                  <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Grades</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Review course results</p>
                </div>
            </Link>
            <Link to="/profile" className="group flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm dark:border-gray-800 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Profile Settings</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your information</p>
                </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}