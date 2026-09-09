import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { api } from '../../../services/api';

export function StudentCourseWorkspacePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const workspace = useQuery({
    queryKey: ['student-course-workspace', courseId],
    queryFn: () => api.getCourseWorkspace(courseId as string),
    enabled: Boolean(courseId),
    retry: false,
  });
  const tests = useQuery({
    queryKey: ['student-course-tests', courseId],
    queryFn: () => api.getCourseTests(courseId as string),
    enabled: Boolean(courseId),
    retry: false,
  });
  const attendance = useQuery({
    queryKey: ['student-course-attendance', courseId],
    queryFn: () => api.getAttendance(courseId as string),
    enabled: Boolean(courseId),
    retry: false,
  });

  if (workspace.isLoading) return <Card className="p-8 text-center text-gray-500">Loading course workspace...</Card>;
  if (workspace.isError || !workspace.data?.data) {
    return <Card className="p-8 text-center text-red-600">This workspace is only available for approved course enrollments.</Card>;
  }

  const course = workspace.data.data;
  const assignments = course.assignments || [];
  const courseTests = tests.data?.data || [];
  const records = Array.isArray(attendance.data?.data) ? attendance.data.data : [];
  const planEntries = course.teachingPlan?.entries || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[32px] border-academic-gold/10" />
        <div className="pointer-events-none absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-blue-300/10" />
        <div className="relative">
          <Link to="/dashboard/student" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors hover:text-white hover:underline">
            <span aria-hidden="true">←</span> Back to dashboard
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-100">{course.code}</span>
                <span className="text-xs font-medium text-blue-200">{course.semester} {course.year}</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{course.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">{course.description || 'Your approved course workspace.'}</p>
              <p className="mt-4 text-sm text-blue-200">Instructor: <span className="font-semibold text-white">{course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Not assigned'}</span></p>
            </div>
            <Badge
              variant="success"
              dot
              className="border border-emerald-200/70 bg-emerald-50/95 px-3 py-1.5 font-semibold text-emerald-700 shadow-sm shadow-emerald-950/10 dark:border-emerald-400/20 dark:bg-emerald-950/45 dark:text-emerald-200"
            >
              Enrollment active
            </Badge>
          </div>
          <nav className="mt-8 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap" aria-label="Course workspace navigation">
            <WorkspaceLink to={`/dashboard/assignments?courseId=${course.id}`}>Assignments</WorkspaceLink>
            <WorkspaceLink to={`/dashboard/tests?courseId=${course.id}`}>Tests</WorkspaceLink>
            <WorkspaceLink to={`/dashboard/attendance?courseId=${course.id}`}>Attendance</WorkspaceLink>
          </nav>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Assignments" value={String(assignments.length)} detail={assignments.length ? 'Available to review' : 'No published work'} />
        <MetricCard label="Assessments" value={String(courseTests.length)} detail={courseTests.length ? 'Tests available' : 'No tests published'} />
        <MetricCard label="Attendance" value={String(records.length)} detail={records.length ? 'Recorded sessions' : 'No records yet'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <SectionHeading eyebrow="Course work" title="Assignments" link={`/dashboard/assignments?courseId=${course.id}`} />
          <div className="mt-5 space-y-3">
            {assignments.length ? assignments.map((assignment: any) => {
              const submission = assignment.submissions?.[0];
              return <div key={assignment.id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-gray-900 dark:text-white">{assignment.title}</p><p className="mt-1 text-xs text-gray-500">Due {new Date(assignment.dueAt).toLocaleString()} · {assignment.maxPoints} points</p></div><div className="flex items-center gap-2"><Badge variant={submission?.status === 'GRADED' ? 'success' : submission ? 'info' : 'warning'}>{submission?.status || 'Not submitted'}</Badge><Link to={`/dashboard/assignments/${assignment.id}`}><Button size="sm" variant="outline">Open</Button></Link></div></div>;
            }) : <EmptyState text="No published assignments yet." />}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeading eyebrow="Assessment center" title="Tests" link={`/dashboard/tests?courseId=${course.id}`} />
          <div className="mt-5 space-y-3">
            {courseTests.length ? courseTests.map((test: any) => <div key={test.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800"><p className="font-semibold">{test.title}</p><p className="mt-1 text-xs text-gray-500">{test._count?.questions || 0} questions · {test.durationMinutes} minutes</p><Link to={`/dashboard/tests/${test.id}/take`} className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline">Open test <span aria-hidden="true">→</span></Link></div>) : <EmptyState text={tests.isLoading ? 'Loading tests...' : 'No published tests yet.'} />}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          <SectionHeading eyebrow="Attendance" title="Your course record" link={`/dashboard/attendance?courseId=${course.id}`} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{records.length ? records.slice(0, 6).map((record: any) => <div key={record.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm dark:border-gray-800"><div><p className="font-semibold">{new Date(record.date).toLocaleDateString()}</p><p className="mt-1 text-xs text-gray-500">{record.notes || 'Course attendance record'}</p></div><Badge variant={record.status === 'PRESENT' || record.status === 'LATE' ? 'success' : 'warning'}>{record.status}</Badge></div>) : <div className="sm:col-span-2"><EmptyState text={attendance.isLoading ? 'Loading attendance...' : 'No attendance recorded yet.'} /></div>}</div>
        </Card>
        <Card className="relative overflow-hidden p-5 sm:p-6 lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-50 dark:bg-primary-950/30" />
          <div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Teaching programme</p><h2 className="mt-2 text-xl font-bold">Course plan</h2><p className="mt-3 text-sm leading-6 text-gray-500">{course.teachingPlan?.objectives?.[0] || 'Your teacher has not published a course objective yet.'}</p><div className="mt-5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60"><p className="text-2xl font-bold text-gray-900 dark:text-white">{planEntries.length}</p><p className="text-xs text-gray-500">scheduled teaching weeks</p></div><Link to="/dashboard/teaching-plans" className="mt-5 inline-flex text-sm font-semibold text-primary-600 hover:underline">Open teaching plan <span aria-hidden="true">→</span></Link></div>
        </Card>
      </div>
    </div>
  );
}

function WorkspaceLink({ to, children }: { to: string; children: string }) {
  return <Link to={to} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/20 sm:px-4 sm:text-sm">{children}</Link>;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></Card>;
}

function SectionHeading({ eyebrow, title, link }: { eyebrow: string; title: string; link: string }) {
  return <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">{eyebrow}</p><h2 className="mt-1 text-xl font-bold">{title}</h2></div><Link to={link} className="shrink-0 text-sm font-semibold text-primary-600 hover:underline">View all <span aria-hidden="true">→</span></Link></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700">{text}</div>;
}
