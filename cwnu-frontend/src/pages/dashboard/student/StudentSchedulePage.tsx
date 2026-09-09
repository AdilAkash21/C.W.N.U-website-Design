import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { uiUxSchedule, uiUxWeeks } from '../../../data/uiUxSchedule';

export function StudentSchedulePage() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useQuery({ queryKey: ['student-schedule-courses', user?.id], queryFn: () => api.getCourses({ limit: 100 }), enabled: Boolean(user) });
  const course = courses?.data?.data?.find((item: any) => item.name?.toLowerCase().includes('ui/ux')) || courses?.data?.data?.[0];
  const schedule = course?.schedules?.length ? course.schedules : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" />
        <Link to="/dashboard/student" className="relative mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white hover:underline">← Back to dashboard</Link>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Academic calendar</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Class schedule</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Your 24-week UI/UX Design learning path, organized into three practical sessions every week.</p></div>
          <div className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold">{uiUxSchedule.length} planned sessions</div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <ScheduleStat value="24" label="Weeks" />
        <ScheduleStat value="3 / week" label="Class rhythm" />
        <ScheduleStat value="Figma" label="Primary tool" />
      </div>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Weekly rhythm</p><h2 className="mt-1 text-xl font-bold">UI/UX Design</h2></div><Badge variant="success">Beginner → Intermediate</Badge></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{(schedule.length ? schedule : [{ dayOfWeek: 1, startTime: '18:00', endTime: '20:00' }, { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' }, { dayOfWeek: 5, startTime: '18:00', endTime: '20:00' }]).map((item: any, index: number) => <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40"><p className="font-semibold">{item.day || ['Monday', 'Wednesday', 'Friday'][index]}</p><p className="mt-1 text-sm text-gray-500">{item.startTime} – {item.endTime}</p><p className="mt-2 text-xs text-gray-500">Attendance required</p></div>)}</div>
      </Card>
      {isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" /> : !course ? <Card className="p-8 text-center text-gray-500">Enroll in UI/UX Design to view the detailed class schedule.</Card> : (
        <div className="space-y-4">{uiUxWeeks.map((week) => <Card key={week.weekNumber} className="overflow-hidden p-0"><div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-800/40 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Month {week.monthNumber} · Week {week.weekNumber}</p><h2 className="mt-1 text-lg font-bold">{week.theme}</h2></div><Badge variant="info">3 sessions</Badge></div><div className="grid gap-3 p-5 md:grid-cols-3">{week.sessions.map((session) => <div key={session.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{session.day}</p><span className="text-xs text-gray-500">{session.startTime}–{session.endTime}</span></div><h3 className="mt-3 font-semibold">{session.title}</h3><p className="mt-1 text-xs leading-5 text-gray-500">{session.objectives[0]} and build practical confidence in Figma.</p></div>)}</div><div className="border-t border-gray-100 px-5 py-4 text-sm dark:border-gray-800"><span className="font-semibold">Weekly deliverable:</span> <span className="text-gray-500">{week.assignment}</span></div></Card>)}</div>
      )}
    </div>
  );
}

function ScheduleStat({ value, label }: { value: string; label: string }) {
  return <Card className="p-4 sm:p-5"><p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p></Card>;
}
