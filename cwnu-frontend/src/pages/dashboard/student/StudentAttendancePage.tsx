import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export function StudentAttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') || undefined;
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-attendance', user?.id, courseId],
    queryFn: () => api.getStudentAttendance(courseId),
    enabled: Boolean(user),
    refetchInterval: 1000,
  });
  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.acceptAttendanceInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student-attendance', user?.id] }),
  });

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-52 rounded-3xl bg-gray-200 dark:bg-gray-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}
      </div>
      <div className="h-72 rounded-2xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
  if (isError || !data?.data) return (
    <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
      <p className="font-semibold text-red-800 dark:text-red-300">Unable to load attendance</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400">Please refresh the page and try again.</p>
    </Card>
  );

  const invitations = data.data.invitations || [];
  const notifications = data.data.notifications || [];
  const pendingCount = invitations.filter((invitation: any) => invitation.status === 'PENDING').length;
  const acceptedCount = invitations.filter((invitation: any) => invitation.status === 'ACCEPTED').length;
  const records = invitations.map((invitation: any) => invitation.session?.records?.find((record: any) => record.enrollmentId === invitation.enrollmentId)).filter(Boolean);
  const presentCount = records.filter((record: any) => record.status === 'PRESENT').length;
  const lateCount = records.filter((record: any) => record.status === 'LATE').length;
  const attendanceRate = records.length ? Math.round(((presentCount + lateCount) / records.length) * 100) : 0;
  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors hover:text-white hover:underline">
              <span aria-hidden="true">←</span> Back to previous page
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Student portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Course attendance</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              {courseId ? 'Review attendance activity for this approved course.' : 'Keep track of invitations, attendance marks, and course participation in one place.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-sm lg:self-end">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            {invitations.length} session{invitations.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceStat label="Pending response" value={pendingCount} tone="amber" />
        <AttendanceStat label="Upcoming / accepted" value={acceptedCount} tone="blue" />
        <AttendanceStat label="Present recorded" value={presentCount} tone="green" />
        <AttendanceStat label="Attendance rate" value={`${attendanceRate}%`} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Your courses</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Attendance sessions</h2>
            </div>
            {pendingCount > 0 && <Badge variant="warning">{pendingCount} action{pendingCount === 1 ? '' : 's'} needed</Badge>}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {invitations.length ? invitations.map((invitation: any) => {
              const record = invitation.session?.records?.find((item: any) => item.enrollmentId === invitation.enrollmentId);
              return (
                <div key={invitation.id} className="p-5 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">{invitation.session?.course?.code}</p>
                      <p className="mt-1 break-words font-semibold text-gray-900 dark:text-white">{invitation.session?.title}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{invitation.session?.course?.name} · {new Date(invitation.session?.date).toLocaleString()}</p>
                      <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                        {invitation.session?.status?.replaceAll('_', ' ') || 'Scheduled'}
                        {invitation.session?.closesAt ? ` · Ends ${new Date(invitation.session.closesAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                      </p>
                      {['OPEN', 'ATTENDANCE_IN_PROGRESS', 'REOPENED'].includes(invitation.session?.status) && (invitation.session?.reopenExpiresAt || invitation.session?.sessionEndAt || invitation.session?.closesAt) && (
                        <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {invitation.session?.status === 'REOPENED' ? 'Reopened — Time remaining' : 'Time remaining'}: {formatCountdown(new Date(invitation.session?.reopenExpiresAt || invitation.session?.sessionEndAt || invitation.session?.closesAt).getTime() - currentTime.getTime())}
                        </p>
                      )}
                      {invitation.session?.status === 'CLOSED' && <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Attendance session ended</p>}
                    </div>
                    <Badge variant={record?.status === 'PRESENT' ? 'success' : invitation.status === 'ACCEPTED' ? 'info' : 'warning'}>{record?.status || invitation.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {record ? `Recorded ${new Date(record.recordedAt).toLocaleString()}` : invitation.status === 'PENDING' ? 'Your response is required' : 'No attendance mark has been recorded yet'}
                    </p>
                    {invitation.status === 'PENDING' && (
                      <Button size="sm" isLoading={acceptMutation.isPending} disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate(invitation.id)}>Accept invitation</Button>
                    )}
                  </div>
                </div>
              );
            }) : <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No attendance sessions have been shared with your approved courses.</p>}
          </div>
        </Card>

        <Card padding="none" className="h-fit overflow-hidden">
          <div className="border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">Notifications</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Attendance activity</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" aria-hidden="true">!</span>
            </div>
          </div>
          <div className="space-y-3 p-5 sm:p-6">
            {notifications.length ? notifications.map((notification: any) => (
              <div key={notification.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{notification.description}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
            )) : <p className="text-sm text-gray-500 dark:text-gray-400">No attendance notifications yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function AttendanceStat({ label, value, tone }: { label: string; value: number | string; tone: 'amber' | 'blue' | 'green' | 'purple' }) {
  const styles = {
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    purple: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
  };
  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${styles[tone]}`}>{value}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{value === 0 ? 'All clear' : 'Review your activity'}</p>
      </div>
    </Card>
  );
}
