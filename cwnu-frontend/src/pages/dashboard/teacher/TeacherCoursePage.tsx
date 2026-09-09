import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const getLocalDateTimeInputValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

export function TeacherCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-course', courseId],
    queryFn: () => api.getCourse(courseId as string),
    enabled: Boolean(courseId),
    refetchInterval: 5000,
  });
  const queryClient = useQueryClient();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('Course attendance');
  const [sessionDescription, setSessionDescription] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<'MANUAL' | 'AUTOMATIC' | 'CHECK_IN'>('MANUAL');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [sessionDate, setSessionDate] = useState(() => getLocalDateTimeInputValue());
  const [sessionError, setSessionError] = useState<string | null>(null);
  const setSessionDateToNow = () => setSessionDate(getLocalDateTimeInputValue());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!selectedEnrollmentId) return;
    document.getElementById('student-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedEnrollmentId]);
  const attendanceMutation = useMutation({
    mutationFn: (input: { enrollmentId: string; status: string }) => api.recordAttendance({
      enrollmentId: input.enrollmentId,
      status: input.status,
      date: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] }),
  });
  const gradeMutation = useMutation({
    mutationFn: (input: { submissionId: string; pointsEarned: number; feedback?: string }) => api.gradeSubmission(input.submissionId, { pointsEarned: input.pointsEarned, feedback: input.feedback }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] }),
  });
  const { data: sessions } = useQuery({
    queryKey: ['attendance-sessions', courseId],
    queryFn: () => api.getAttendanceSessions(courseId),
    enabled: Boolean(courseId),
    refetchInterval: 1000,
  });
  const createSessionMutation = useMutation({
    mutationFn: () => api.createAttendanceSession({
      courseId: courseId as string,
      title: sessionTitle,
      description: sessionDescription || undefined,
      date: new Date(sessionDate).toISOString(),
      attendanceMode,
      durationMinutes,
    }),
    onSuccess: () => {
      setSessionTitle('Course attendance');
      setSessionDescription('');
      setSessionDate(getLocalDateTimeInputValue());
      setSessionError(null);
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions', courseId] });
    },
    onError: (error: any) => {
      setSessionError(error?.response?.data?.message || error?.message || 'The attendance session could not be created.');
    },
  });
  const openSessionMutation = useMutation({
    mutationFn: (id: string) => api.openAttendanceSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-sessions', courseId] }),
  });
  const reopenSessionMutation = useMutation({
    mutationFn: (id: string) => api.reopenAttendanceSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-sessions', courseId] }),
  });
  const saveSessionMutation = useMutation({
    mutationFn: (input: { id: string; records: Array<{ enrollmentId: string; status: string }> }) => api.recordAttendanceSession(input.id, input.records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] });
    },
  });
  const closeSessionMutation = useMutation({
    mutationFn: (id: string) => api.closeAttendanceSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-sessions', courseId] }),
  });

  if (isLoading) return <div className="flex min-h-[320px] items-center justify-center text-gray-500">Loading course workspace...</div>;
  if (isError || !data?.data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Unable to load this course workspace.</div>;

  const course = data.data;
  const activeEnrollments = (course.enrollments || []).filter((enrollment: any) => enrollment.status === 'APPROVED');
  const pendingEnrollments = (course.enrollments || []).filter((enrollment: any) => enrollment.status === 'PENDING');
  const publishedAssignments = (course.assignments || []).filter((assignment: any) => assignment.isPublished);
  const selectedEnrollment = activeEnrollments.find((enrollment: any) => enrollment.id === selectedEnrollmentId);
  const selectedSubmissions = selectedEnrollment
    ? (course.assignments || []).flatMap((assignment: any) => (assignment.submissions || [])
      .filter((submission: any) => submission.enrollmentId === selectedEnrollment.id)
      .map((submission: any) => ({ ...submission, assignment })))
    : [];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <Link
          to="/dashboard/teacher"
          className="group inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-primary-300"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-primary-950/40 dark:group-hover:text-primary-300" aria-hidden="true">
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          <span>Teacher dashboard</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="hidden font-medium text-gray-500 sm:inline dark:text-gray-400">Course workspace</span>
        </Link>
        <span className="mr-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live sync
        </span>
      </div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-primary-800 text-white shadow-elevated">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-32 right-32 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative p-6 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200">Active course</span>
              <span className="truncate">{course.code}</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Live workspace
            </span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-200">{course.semester} {course.year}</p>
              <h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">{course.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Manage learners, attendance, assessments, and course delivery from one workspace.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to={`/dashboard/courses/${courseId}/tests`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-blue-50">
                  <span>Manage tests</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link to={`/dashboard/assignments?courseId=${courseId}`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
                  Assignments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Active roster', activeEnrollments.length, 'Approved enrollments'],
          ['Pending review', pendingEnrollments.length, 'Awaiting approval'],
          ['Published work', publishedAssignments.length, 'Student-visible assignments'],
        ].map(([label, value, detail]) => (
          <Card key={label as string} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
          </Card>
        ))}
      </div>
      <Card padding="none" className="overflow-hidden" id="attendance">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-950/20 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Course attendance</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Attendance sessions</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a session to notify every approved student, then record their status.</p>
          </div>
          <div className="w-full space-y-3 lg:w-auto lg:min-w-[540px]">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary-100 bg-primary-50/70 px-3 py-2 dark:border-primary-900/40 dark:bg-primary-950/20">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-300">Live local time</span>
            <time dateTime={currentTime.toISOString()} className="font-mono text-sm font-bold tabular-nums text-primary-900 dark:text-primary-100">
              {currentTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' })}
            </time>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="sr-only" htmlFor="session-title">Session title</label>
            <input id="session-title" value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} placeholder="Session title" className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800" aria-label="Session title" />
            <label className="sr-only" htmlFor="session-description">Session description</label>
            <input id="session-description" value={sessionDescription} onChange={(event) => setSessionDescription(event.target.value)} placeholder="Description (optional)" className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800" aria-label="Session description" />
            <div className="flex min-w-0 items-center gap-1 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <label className="sr-only" htmlFor="session-date">Session date and time</label>
            <input id="session-date" type="datetime-local" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-800" aria-label="Session date and time" />
            <button type="button" onClick={setSessionDateToNow} className="mr-1 shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-primary-700 transition hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/40" title="Set session date and time to the current live time">Now</button>
            </div>
            <select value={attendanceMode} onChange={(event) => setAttendanceMode(event.target.value as typeof attendanceMode)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-primary-500 dark:border-gray-700 dark:bg-gray-800" aria-label="Attendance mode">
              <option value="MANUAL">Manual session</option>
              <option value="AUTOMATIC">Automatic schedule</option>
              <option value="CHECK_IN">Student check-in</option>
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Duration
              <input type="number" min="1" max="720" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="w-14 bg-transparent text-sm font-semibold outline-none" aria-label="Duration in minutes" />
              min
            </label>
            <button type="button" disabled={!sessionTitle.trim() || createSessionMutation.isPending} onClick={() => createSessionMutation.mutate()} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
              {createSessionMutation.isPending ? 'Creating...' : 'Create session'}
            </button>
          </div>
          {sessionError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {sessionError}
            </p>
          )}
        </div>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          {(sessions?.data || []).length ? (sessions?.data || []).map((session: any) => {
            const isSelected = selectedSessionId === session.id;
            const recordsByEnrollment = new Map<string, any>((session.records || []).map((record: any) => [record.enrollmentId, record] as [string, any]));
            return (
              <div key={session.id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{session.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(session.date).toLocaleString()} · {session.invitations?.length || 0} invited</p>
                    {session.description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{session.description}</p>}
                    {['OPEN', 'ATTENDANCE_IN_PROGRESS', 'REOPENED'].includes(session.status) && (session.reopenExpiresAt || session.sessionEndAt || session.closesAt) && (
                      <p className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${session.status === 'REOPENED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                        {session.status === 'REOPENED' ? 'Reopened' : 'Time remaining'}: {formatCountdown(new Date(session.reopenExpiresAt || session.sessionEndAt || session.closesAt).getTime() - currentTime.getTime())}
                      </p>
                    )}
                    {session.status === 'CLOSED' && <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Attendance session ended</p>}
                  </div>
                  <div className="flex items-center gap-2">
                     <Badge variant={session.status === 'OPEN' || session.status === 'ATTENDANCE_IN_PROGRESS' ? 'success' : session.status === 'CLOSED' ? 'gray' : session.status === 'CANCELLED' ? 'danger' : 'warning'}>{session.status.replaceAll('_', ' ')}</Badge>
                    <button type="button" onClick={() => setSelectedSessionId(isSelected ? null : session.id)} className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300">
                      {isSelected ? 'Hide roster' : 'Open roster'}
                    </button>
                    {['SCHEDULED', 'REOPENED'].includes(session.status) && <button type="button" onClick={() => openSessionMutation.mutate(session.id)} className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300">Open</button>}
                    {!['CLOSED', 'CANCELLED'].includes(session.status) && <button type="button" onClick={() => closeSessionMutation.mutate(session.id)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Close</button>}
                    {session.status === 'CLOSED' && !session.reopenUsed && <button type="button" onClick={() => reopenSessionMutation.mutate(session.id)} className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300">Reopen for 1 minute</button>}
                    {session.status === 'CLOSED' && session.reopenUsed && <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">Permanently closed</span>}
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    {(session.invitations || []).map((invitation: any) => {
                      const record = recordsByEnrollment.get(invitation.enrollmentId);
                      return (
                        <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{invitation.enrollment?.student?.firstName} {invitation.enrollment?.student?.lastName}</p>
                            <p className="text-xs text-gray-500">{invitation.status === 'ACCEPTED' ? 'Accepted invitation' : 'Invitation pending'}</p>
                          </div>
                          <select defaultValue={record?.status || 'NOT_RECORDED'} aria-label={`Attendance for ${invitation.enrollment?.student?.firstName || 'student'}`} onChange={(event) => {
                            const next = (session.invitations || []).map((item: any) => {
                              const current = recordsByEnrollment.get(item.enrollmentId);
                              return { enrollmentId: item.enrollmentId, status: item.enrollmentId === invitation.enrollmentId ? event.target.value : current?.status || 'NOT_RECORDED' };
                            });
                            saveSessionMutation.mutate({ id: session.id, records: next });
                          }} disabled={saveSessionMutation.isPending || ['CLOSED', 'CANCELLED'].includes(session.status)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900">
                            <option value="NOT_RECORDED">Not recorded</option><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="ABSENT">Absent</option><option value="EXCUSED">Excused</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }) : <p className="py-3 text-sm text-gray-500 dark:text-gray-400">No attendance sessions yet.</p>}
        </div>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Enrollment source of truth</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Student list</h2>
          </div>
          <Badge variant="info">{activeEnrollments.length} active</Badge>
        </div>
        {activeEnrollments.length ? (
          <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
            {activeEnrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      {enrollment.student.firstName?.[0]}{enrollment.student.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">{enrollment.student.firstName} {enrollment.student.lastName}</p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">{enrollment.student.email}</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                  {(() => {
                    const sessionRecords = (sessions?.data || []).flatMap((session: any) =>
                      (session.records || [])
                        .filter((record: any) => record.enrollmentId === enrollment.id)
                        .map((record: any) => ({ ...record, sessionDate: session.date }))
                    );
                    const attendance = sessionRecords.length ? sessionRecords : (enrollment.attendances || []);
                    const presentCount = attendance.filter((item: any) => item.status === 'PRESENT' || item.status === 'LATE').length;
                    const studentSubmissions = (course.assignments || []).flatMap((assignment: any) =>
                      (assignment.submissions || []).filter((submission: any) => submission.enrollmentId === enrollment.id).map((submission: any) => ({ ...submission, assignment }))
                    );
                    const completedCount = studentSubmissions.filter((submission: any) => submission.status === 'GRADED').length;
                    const progress = publishedAssignments.length ? Math.round((completedCount / publishedAssignments.length) * 100) : 0;
                    const todayAttendance = attendance
                      .filter((item: any) => new Date(item.sessionDate || item.date).toDateString() === new Date().toDateString())
                      .sort((left: any, right: any) => new Date(right.sessionDate || right.date).getTime() - new Date(left.sessionDate || left.date).getTime())[0];
                    return (
                      <div className="mt-4 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Course progress</span><span className="font-bold text-gray-700 dark:text-gray-200">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} /></div>
                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/70"><p className="text-gray-500">Attendance</p><p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{presentCount}/{attendance.length || 0}</p></div>
                          <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/70"><p className="text-gray-500">Submitted</p><p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{studentSubmissions.length}</p></div>
                          <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/70"><p className="text-gray-500">Completed</p><p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{completedCount}</p></div>
                        </div>
                        <button type="button" onClick={() => setSelectedEnrollmentId(enrollment.id)} className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950/30">
                          Open student profile
                        </button>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                          Today&apos;s attendance
                          <select
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-normal text-gray-700 outline-none focus:border-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            value={todayAttendance?.status || ''}
                            onChange={(event) => attendanceMutation.mutate({ enrollmentId: enrollment.id, status: event.target.value })}
                            disabled={attendanceMutation.isPending}
                          >
                            <option value="">Not recorded</option><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="ABSENT">Absent</option><option value="EXCUSED">Excused</option>
                          </select>
                        </label>
                        {studentSubmissions.length > 0 && <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Assignment scores</p>
                          {studentSubmissions.map((submission: any) => (
                            <SubmissionGradeEditor
                              key={submission.id}
                              submission={submission}
                              onSave={(pointsEarned, feedback) => gradeMutation.mutate({ submissionId: submission.id, pointsEarned, feedback })}
                              isSaving={gradeMutation.isPending}
                            />
                          ))}
                        </div>}
                      </div>
                    );
                  })()}
              </div>
            ))}
          </div>
        ) : <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No approved students are currently enrolled.</p>}
      </Card>
      {selectedEnrollment && (
        <Card padding="none" className="overflow-hidden scroll-mt-6" id="student-profile">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-950/20 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Student profile</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{selectedEnrollment.student.firstName} {selectedEnrollment.student.lastName}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedEnrollment.student.email} · {selectedEnrollment.status}</p>
            </div>
            <button type="button" onClick={() => setSelectedEnrollmentId(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800">Close profile</button>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance history</p>
              <div className="mt-3 space-y-2">
                {(selectedEnrollment.attendances || []).length ? selectedEnrollment.attendances.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/70">
                    <span>{new Date(item.date).toLocaleDateString()}</span><Badge variant={item.status === 'PRESENT' ? 'success' : 'warning'}>{item.status}</Badge>
                  </div>
                )) : <p className="text-sm text-gray-500">No attendance recorded.</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Course grade</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input defaultValue={selectedEnrollment.grade || ''} placeholder="Letter grade" className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" onBlur={(event) => api.updateStudentGrade(selectedEnrollment.id, { grade: event.target.value }).then(() => queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] }))} />
                <input type="number" min="0" max="4" step="0.01" defaultValue={selectedEnrollment.gradePoints ?? ''} placeholder="Grade points" className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" onBlur={(event) => api.updateStudentGrade(selectedEnrollment.id, { gradePoints: Number(event.target.value) }).then(() => queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] }))} />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Assignment records</p>
              <div className="mt-3 space-y-2">
                {selectedSubmissions.length ? selectedSubmissions.map((submission: any) => (
                  <div key={submission.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{submission.assignment.title}</span><span className="text-xs text-gray-500">{submission.pointsEarned ?? 0}/{submission.assignment.maxPoints}</span></div>
                    <p className="mt-1 text-xs text-gray-500">{submission.status} · Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                    {submission.feedback && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">Feedback: {submission.feedback}</p>}
                  </div>
                )) : <p className="text-sm text-gray-500">No submissions yet.</p>}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function SubmissionGradeEditor({
  submission,
  onSave,
  isSaving,
}: {
  submission: any;
  onSave: (pointsEarned: number, feedback: string) => void;
  isSaving: boolean;
}) {
  const [points, setPoints] = useState(submission.pointsEarned?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [expanded, setExpanded] = useState(false);
  const hasContent = Boolean(submission.content || submission.attachments?.length);

  return (
    <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-gray-600 dark:text-gray-300">{submission.assignment.title}</span>
        <span className="text-[11px] text-gray-400">{submission.status}</span>
      </div>
      {hasContent && (
        <button type="button" className="mt-2 text-xs font-semibold text-primary-600 hover:underline" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Hide submission' : 'View submission'}
        </button>
      )}
      {expanded && (
        <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-800/70">
          {submission.content && <p className="whitespace-pre-wrap">{submission.content}</p>}
          {submission.attachments?.length ? <p className="mt-2 break-all text-gray-500">Attachments: {submission.attachments.join(', ')}</p> : null}
        </div>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-[6rem_1fr_auto]">
        <input type="number" min="0" max={submission.assignment.maxPoints} value={points} onChange={(event) => setPoints(event.target.value)} placeholder={`/${submission.assignment.maxPoints}`} aria-label={`Score for ${submission.assignment.title}`} className="rounded-md border border-gray-200 px-2 py-1 text-right text-xs dark:border-gray-700 dark:bg-gray-800" />
        <input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback (optional)" aria-label={`Feedback for ${submission.assignment.title}`} className="rounded-md border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800" />
        <Button size="sm" disabled={isSaving || points === ''} isLoading={isSaving} onClick={() => onSave(Number(points), feedback)}>Save</Button>
      </div>
    </div>
  );
}
