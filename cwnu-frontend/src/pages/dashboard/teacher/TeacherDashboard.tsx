import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';

export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    queryFn: () => api.getTeacherDashboard(),
    enabled: !!user,
    refetchInterval: 5000,
  });
  const { data: availableCourses } = useQuery({
    queryKey: ['teacher-course-options'],
    queryFn: () => api.getCourses({ limit: 100 }),
    enabled: !!user,
  });
  const submitRequestsMutation = useMutation({
    mutationFn: (courseIds: string[]) => api.submitCourseRequests(courseIds),
    onSuccess: () => {
      setSelectedCourseIds([]);
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });

  const myCourses = dashboard?.data?.courses || [];
  const pendingEnrollments = dashboard?.data?.pendingEnrollments || [];
  const recentGradedSubmissions = dashboard?.data?.recentGradedSubmissions || [];
  const courseRequests = dashboard?.data?.courseRequests || [];
  const notifications = dashboard?.data?.notifications || [];
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const courseOptions = availableCourses?.data?.data || [];

  const stats = [
    { label: 'Active Courses', value: myCourses.length, icon: 'book', color: 'bg-blue-500' },
    { label: 'Total Students', value: myCourses.reduce((sum: number, c: any) => sum + (c.enrollments?.length ?? c.enrolledCount ?? 0), 0), icon: 'users', color: 'bg-green-500' },
    { label: 'Pending Requests', value: pendingEnrollments.length, icon: 'clipboard', color: 'bg-yellow-500' },
    { label: 'Recently Graded', value: recentGradedSubmissions.length, icon: 'award', color: 'bg-purple-500' },
  ];

  const getStatIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      book: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
      users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
      clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
      calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    };

    if (isLoading) {
      return <div className="flex min-h-[320px] items-center justify-center text-gray-500 dark:text-gray-400">Loading your teaching dashboard...</div>;
    }

    if (isError) {
      return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">Unable to load your teaching dashboard. Please try again.</div>;
    }
    return icons[name] || icons.book;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" aria-hidden="true" />
        <div className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative right-auto top-auto mb-5 inline-flex self-start items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100 shadow-sm backdrop-blur-sm sm:absolute sm:right-8 sm:top-8 sm:mb-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-academic-gold/50" />
            <span className="relative h-2 w-2 rounded-full bg-academic-gold" />
          </span>
          Teacher workspace
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Teacher portal</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, Professor {user?.lastName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">Keep your classes moving forward, review student activity, and stay connected with your learners.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link to="/dashboard/teaching-plans"><Button variant="secondary" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto">Teaching plans</Button></Link>
            <Link to="/profile"><Button variant="secondary" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto">View profile</Button></Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110', stat.color)}>
                {getStatIcon(stat.icon)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:flex-nowrap sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Your teaching</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">My courses</h2>
            </div>
            <Link to="/dashboard/teacher" className="rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 dark:border-primary-800 dark:bg-gray-900 dark:text-primary-300 dark:hover:bg-primary-950/40">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {myCourses.length > 0 ? (
              myCourses.map((course: any) => (
                <Link key={course.id} to={`/dashboard/courses/${course.id}`} className="group flex min-w-0 flex-col gap-4 p-5 transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-blue-100 shadow-sm transition-transform duration-200 group-hover:scale-105 dark:from-primary-900/40 dark:to-blue-900/30">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-gray-900 dark:text-white">{course.name}</h3><Badge variant="success" size="sm" dot>Active</Badge></div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{course.code} <span className="mx-1 text-gray-300 dark:text-gray-600">•</span> {course.semester} {course.year}</p>
                      <p className="mt-2 text-xs font-medium text-gray-400">Course workspace · {course.enrollments?.length ?? course.enrolledCount ?? 0}/{course.maxStudents} active students</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
                    <span className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-transform group-hover:translate-x-0.5 dark:text-primary-400 sm:flex">Open <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-white">No courses assigned yet</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Approved teaching assignments will appear here.</p>
              </div>
            )}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Teaching opportunities</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Request courses to teach</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select courses for Staff or Admin review.</p>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {courseOptions.map((course: any) => {
              const request = courseRequests.find((item: any) => item.courseId === course.id);
              const disabled = request?.status === 'ACCEPTED' || course.teacherId;
              return (
                <label key={course.id} className={cn('rounded-2xl border p-4 transition-colors', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20')}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" disabled={disabled} checked={selectedCourseIds.includes(course.id)} onChange={(event) => setSelectedCourseIds((current) => event.target.checked ? [...current, course.id] : current.filter((id) => id !== course.id))} className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{course.name}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{course.code} · {course.semester} {course.year}</p>
                      {request && <Badge variant={request.status === 'ACCEPTED' ? 'success' : request.status === 'REJECTED' ? 'danger' : 'warning'} size="sm" className="mt-2">{request.status}</Badge>}
                      {!request && course.teacherId && <Badge variant="gray" size="sm" className="mt-2">Assigned</Badge>}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end border-t border-gray-100 p-5 dark:border-gray-800 sm:p-6">
            <Button className="w-full sm:w-auto" disabled={!selectedCourseIds.length || submitRequestsMutation.isPending} isLoading={submitRequestsMutation.isPending} onClick={() => submitRequestsMutation.mutate(selectedCourseIds)}>Submit course requests</Button>
          </div>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Student progress</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Recently graded</h2>
          </div>
          <Link to="/dashboard/assignments" className="rounded-lg px-3 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30">Assignments</Link>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          {recentGradedSubmissions.length > 0 ? recentGradedSubmissions.map((submission: any) => (
            <div key={submission.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
              <h3 className="font-medium text-gray-900 dark:text-white">{submission.student?.firstName} {submission.student?.lastName}</h3>
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{submission.assignment?.title} · {submission.assignment?.course?.name}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="success" size="sm">Graded</Badge>
                <Badge variant="gray" size="sm">{submission.pointsEarned ?? '—'} points</Badge>
              </div>
            </div>
          )) : (
            <p className="p-3 text-sm text-gray-500 dark:text-gray-400">No graded submissions yet.</p>
          )}
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">Needs attention</p>
            <h2 className="mt-1 text-heading-lg font-semibold">Enrollment requests</h2>
          </div>
          <Badge variant={pendingEnrollments.length ? 'warning' : 'success'}>{pendingEnrollments.length}</Badge>
        </div>
        {pendingEnrollments.length ? (
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {pendingEnrollments.slice(0, 4).map((enrollment: any) => (
              <div key={enrollment.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/60 dark:border-gray-800 dark:hover:border-amber-900 dark:hover:bg-amber-950/20">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{enrollment.student?.firstName} {enrollment.student?.lastName}</p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">{enrollment.student?.email}</p>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="font-medium text-gray-900 dark:text-white">You are all caught up</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No pending enrollment requests.</p>
          </div>
        )}
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Notifications</p>
            <h2 className="mt-1 text-heading-lg font-semibold">Course activity</h2>
          </div>
          <Badge variant={notifications.length ? 'info' : 'gray'}>{notifications.length}</Badge>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.length ? notifications.slice(0, 5).map((notification: any) => (
            <div key={notification.id} className="p-4 sm:px-6">
              <p className="font-medium text-gray-900 dark:text-white">{notification.description}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
          )) : <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No new course activity.</p>}
        </div>
      </Card>

      <div className="grid items-stretch gap-6 lg:grid-cols-4">
        <Link to={myCourses[0]?.id ? `/dashboard/attendance?courseId=${myCourses[0].id}` : '/dashboard/courses'} className="flex h-full">
          <Card variant="hover" className="flex h-full w-full flex-col justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Take Attendance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mark attendance for today's classes</p>
          </Card>
        </Link>
        <Link to="/dashboard/grades" className="flex h-full">
          <Card variant="hover" className="flex h-full w-full flex-col justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Grade Submissions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and grade student work</p>
          </Card>
        </Link>
        <Link to="/dashboard/schedule" className="flex h-full">
          <Card variant="hover" className="flex h-full w-full flex-col justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your teaching schedule</p>
          </Card>
        </Link>
        <Link to="/profile" className="flex h-full">
          <Card variant="hover" className="flex h-full w-full flex-col justify-center p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
              <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19a6 6 0 00-6-6H7a6 6 0 00-6 6m7-10a4 4 0 100-8 4 4 0 000 8zm8 10v-1a4 4 0 00-4-4h-1m5-5a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">My Profile</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your teacher details and account security</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}