import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Accepted',
  REJECTED: 'Rejected',
  DROPPED: 'Quit',
  COMPLETED: 'Completed',
};

export function StudentCoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'plan' | 'enroll' | 'details' | null>(null);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['student-course-options'],
    queryFn: () => api.getCourses({ limit: 100 }),
  });
  const { data: enrollments } = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: () => api.getEnrollments({ studentId: user?.id, limit: 100 }),
    enabled: !!user,
  });
  const enrollmentByCourse = new Map<string, any>();
  for (const item of enrollments?.data || []) {
    if (!enrollmentByCourse.has(item.courseId)) enrollmentByCourse.set(item.courseId, item);
  }
  const selectedCourse = (courses?.data?.data || []).find((course: any) => course.id === selectedCourseId);
  const selectedEnrollment = selectedCourseId ? enrollmentByCourse.get(selectedCourseId) : undefined;
  const { data: selectedPlan, isLoading: planLoading, isError: planError } = useQuery({
    queryKey: ['student-course-plan', selectedCourseId],
    queryFn: () => api.getTeachingPlan(selectedCourseId as string),
    enabled: panel === 'details' && !!selectedCourseId && selectedEnrollment?.status === 'APPROVED',
  });
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.enrollCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', user?.id] });
      setPanel(null);
    },
  });

  const selectAction = (courseId: string, action: 'plan' | 'enroll' | 'details') => {
    setSelectedCourseId(courseId);
    setPanel(action);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link to="/dashboard/student" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white hover:underline">← Back to dashboard</Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Academic catalogue</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Courses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Review course plans, request enrollment, and view approved teaching programmes.</p>
          </div>
          <div className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-sm">{courses?.data?.data?.length || 0} courses</div>
        </div>
      </section>

      {panel && selectedCourse && (
        <Card className="border-primary-200 bg-primary-50/50 p-5 dark:border-primary-900/50 dark:bg-primary-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">{panel === 'plan' ? 'Course plan' : panel === 'enroll' ? 'Enrollment request' : 'Six-month teaching programme'}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{selectedCourse.name}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedCourse.code}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPanel(null)}>Close</Button>
          </div>
          {panel === 'plan' && <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Info label="Credits" value={`${selectedCourse.credits} credits`} /><Info label="Term" value={`${selectedCourse.semester || 'Term'} ${selectedCourse.year || ''}`} /><Info label="Teacher" value={selectedCourse.teacher ? `${selectedCourse.teacher.firstName} ${selectedCourse.teacher.lastName}` : 'Teacher not assigned'} /></div>}
          {panel === 'enroll' && (
            <div className="mt-4 rounded-xl bg-white p-4 dark:bg-gray-900">
              <p className="text-sm text-gray-600 dark:text-gray-300">Submit an enrollment request for <strong>{selectedCourse.code} — {selectedCourse.name}</strong>. Staff or Admin will review it.</p>
              <Button className="mt-4" disabled={selectedEnrollment?.status === 'APPROVED' || selectedEnrollment?.status === 'PENDING' || enrollMutation.isPending} isLoading={enrollMutation.isPending} onClick={() => enrollMutation.mutate(selectedCourse.id)}>Submit enrollment request</Button>
              {enrollMutation.isError && <p className="mt-2 text-sm text-red-600">This course already has an enrollment request or could not be submitted.</p>}
            </div>
          )}
          {panel === 'details' && (
            <div className="mt-4">
              {selectedEnrollment?.status !== 'APPROVED' ? <p className="text-sm text-amber-700 dark:text-amber-300">The teaching programme is available after Staff or Admin accepts your enrollment.</p> : planLoading ? <p className="text-sm text-gray-500">Loading teaching programme...</p> : planError ? <p className="text-sm text-red-600">Unable to load this course programme.</p> : <TeachingPlan plan={selectedPlan?.data} />}
            </div>
          )}
        </Card>
      )}

      {coursesLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(courses?.data?.data || []).map((course: any) => {
            const enrollment = enrollmentByCourse.get(course.id);
            const accepted = enrollment?.status === 'APPROVED';
            const canApplyAgain = !enrollment || enrollment.status === 'REJECTED' || enrollment.status === 'DROPPED' || enrollment.status === 'COMPLETED';
            return (
              <Card key={course.id} variant="hover" className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3"><Badge variant="info">{course.code}</Badge><Badge variant={accepted ? 'success' : enrollment?.status === 'PENDING' ? 'warning' : enrollment?.status === 'REJECTED' ? 'danger' : 'gray'}>{enrollment ? statusLabel[enrollment.status] : 'Not Enrolled'}</Badge></div>
                <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{course.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{course.description}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 border-y border-gray-100 py-3 text-center text-xs dark:border-gray-800"><Info label="Credits" value={String(course.credits)} /><Info label="Term" value={course.semester || '—'} /><Info label="Teacher" value={course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Unassigned'} /></div>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><Button size="sm" variant="outline" onClick={() => selectAction(course.id, 'plan')}>Plan</Button><Button size="sm" disabled={!canApplyAgain} onClick={() => selectAction(course.id, 'enroll')}>{accepted ? 'Enrolled' : enrollment?.status === 'PENDING' ? 'Pending' : enrollment?.status === 'REJECTED' ? 'Apply Again' : enrollment?.status === 'DROPPED' || enrollment?.status === 'COMPLETED' ? 'Enroll Again' : 'Enroll'}</Button><Button size="sm" variant="ghost" onClick={() => selectAction(course.id, 'details')}>Details</Button>{accepted ? <Link to={`/dashboard/student/courses/${course.id}`} className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700">Workspace</Link> : <span />}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p><p className="mt-1 truncate font-semibold text-gray-900 dark:text-white">{value}</p></div>;
}

function TeachingPlan({ plan }: { plan: any }) {
  if (!plan) return <p className="text-sm text-gray-500">No teaching programme has been published yet.</p>;
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Info label="Objectives" value={`${plan.objectives?.length || 0} recorded`} /><Info label="Weeks" value={`${plan.entries?.length || 0} scheduled`} /><Info label="Completion" value={plan.completionDate ? new Date(plan.completionDate).toLocaleDateString() : 'Not set'} /></div><div className="grid gap-3 sm:grid-cols-2">{(plan.entries || []).map((entry: any) => <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Month {entry.month} · Week {entry.week}</p><p className="mt-1 font-semibold text-gray-900 dark:text-white">{entry.topic}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{entry.lesson || entry.activity || 'Scheduled class session'}</p></div>)}</div></div>;
}
