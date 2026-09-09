import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { courses } from './CoursesPage';
import { api } from '../../services/api';

export function CourseDetailsPage() {
  const { courseId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.getCourse(courseId as string),
    enabled: Boolean(courseId),
  });
  const databaseCourse = data?.data;
  const catalogueCourse = courses.find((item) => item.code === databaseCourse?.code);
  const course = databaseCourse
    ? {
        ...catalogueCourse,
        ...databaseCourse,
        department: databaseCourse.department?.name || 'Department not assigned',
        teacher: databaseCourse.teacher ? `${databaseCourse.teacher.firstName} ${databaseCourse.teacher.lastName}` : 'Teacher not assigned',
        enrolled: databaseCourse.enrolledCount || 0,
        level: catalogueCourse?.level || 'Not specified',
        schedule: catalogueCourse?.schedule || 'Schedule not assigned',
        room: catalogueCourse?.room || 'Room not assigned',
        tags: catalogueCourse?.tags || [],
      }
    : null;

  if (isLoading) {
    return <div className="container py-24 text-center text-gray-500">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-display-md font-bold text-gray-900 dark:text-white">Course not found</h1>
        <Link to="/courses" className="mt-6 inline-block"><Button>Back to courses</Button></Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="relative isolate overflow-hidden bg-academic-navy px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />
        <div className="container relative">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/courses"
              className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm font-semibold text-blue-100 shadow-lg shadow-blue-950/10 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1d3a]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base transition group-hover:-translate-x-0.5" aria-hidden="true">←</span>
              <span>Course catalogue</span>
            </Link>
            <span className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
              Course profile
            </span>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info">{course.level}</Badge>
                <span className="rounded-full border border-blue-200/20 bg-blue-950/40 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-blue-100">
                  {course.code}
                </span>
              </div>
              <h1 className="mt-5 text-display-md font-bold leading-tight tracking-tight sm:text-display-lg">{course.name}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">{course.description}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-blue-950/20 backdrop-blur-md">
              <div className="grid grid-cols-3 divide-x divide-white/10">
              <CourseStat label="Credits" value={`${course.credits}`} />
              <CourseStat label="Places" value={`${course.maxStudents}`} />
              <CourseStat label="Term" value={`${course.semester || 'TBA'} ${course.year || ''}`.trim()} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-400/10 px-3 py-2 text-xs">
                <span className="font-medium text-blue-100">Enrollment status</span>
                <span className="font-bold text-emerald-300">
                  {course.enrolled < course.maxStudents ? 'Open' : 'Full'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container grid gap-6 py-10 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Course plan</p>
              <h2 className="mt-1 text-heading-lg font-semibold">About this course</h2>
            </div>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">6 months</span>
          </div>
          <p className="mt-4 leading-7 text-gray-600 dark:text-gray-300">{course.description}</p>
          {databaseCourse?.teachingPlan?.objectives?.length ? (
            <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 dark:border-primary-900/50 dark:bg-primary-950/20">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Students will be able to</h3>
              <ul className="mt-3 space-y-2">
                {databaseCourse.teachingPlan.objectives.map((objective: string) => (
                  <li key={objective} className="flex gap-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                    <span className="mt-1 text-primary-600 dark:text-primary-400" aria-hidden="true">✓</span>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <h3 className="mt-8 text-heading-md font-semibold">What you will learn</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {course.tags.map((tag: string) => <li key={tag} className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">✓ {tag}</li>)}
          </ul>
          {databaseCourse?.teachingPlan?.entries?.length ? (
            <div className="mt-8">
              <h3 className="text-heading-md font-semibold">Six-month curriculum</h3>
              <div className="mt-4 space-y-3">
                {Array.from(new Set<number>(databaseCourse.teachingPlan.entries.map((entry: any) => Number(entry.month)))).map((month) => {
                  const monthEntries = databaseCourse.teachingPlan.entries.filter((entry: any) => entry.month === month);
                  const practicalEntry = monthEntries.find((entry: any) => entry.activity && !entry.activity.toLowerCase().includes('monthly review')) || monthEntries[0];
                  const assignmentEntry = monthEntries.find((entry: any) => entry.assignment && !entry.assignment.toLowerCase().includes('weekly class exercise')) || monthEntries[monthEntries.length - 1];
                  const assessmentEntry = monthEntries[monthEntries.length - 1];
                  return (
                    <details key={month} className="group rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/50" open={month === 1}>
                      <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:hidden dark:text-white">
                        <span className="text-primary-600 dark:text-primary-400">Month {month}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                        {monthEntries[0]?.topic}
                        <span className="float-right text-gray-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
                      </summary>
                      <div className="mt-3 space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <PlanSection label="Practical work" value={practicalEntry?.activity || 'Guided practical exercises and workshop activities.'} />
                          <PlanSection label="Assignment" value={assignmentEntry?.assignment || 'Complete the assigned monthly practical task.'} />
                          <PlanSection label="Assessment" value={assessmentEntry?.assessment || 'Monthly progress assessment.'} />
                        </div>
                        {monthEntries.map((entry: any) => (
                          <div key={entry.id}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Week {entry.week} · {entry.topic}</p>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{entry.lesson || entry.activity}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="text-heading-lg font-semibold">Course information</h2>
          <div className="mt-5 space-y-4">
            <Detail label="Department" value={course.department} />
            <Detail label="Instructor" value={course.teacher} />
            <Detail label="Credits" value={`${course.credits} credits`} />
            <Detail label="Term" value={`${course.semester || 'Term not assigned'} ${course.year || ''}`.trim()} />
            <Detail label="Schedule" value={course.schedule} />
            <Detail label="Location" value={course.room} />
            <Detail label="Availability" value={`${course.enrolled} of ${course.maxStudents} places filled`} />
          </div>
          <Link to="/courses" className="mt-7 block"><Button className="w-full">Back to course catalogue</Button></Link>
        </Card>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 dark:border-gray-800"><span className="text-sm text-gray-500 dark:text-gray-400">{label}</span><span className="text-right text-sm font-semibold text-gray-900 dark:text-white">{value}</span></div>;
}

function CourseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function PlanSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">{label}</p>
      <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{value}</p>
    </div>
  );
}
