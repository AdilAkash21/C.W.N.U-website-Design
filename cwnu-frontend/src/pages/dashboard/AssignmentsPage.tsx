import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const emptyForm = { courseId: '', title: '', description: '', type: 'HOMEWORK', maxPoints: 100, weight: 1, dueAt: '', allowLateSubmission: false };

export function AssignmentsPage() {
  const { user } = useAuth();
  const { assignmentId } = useParams<{ assignmentId?: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') || undefined;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['assignments', user?.id, courseId],
    queryFn: () => api.getAssignments(courseId),
    enabled: Boolean(user),
  });
  const { data: detail } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.getAssignment(assignmentId as string),
    enabled: Boolean(assignmentId),
  });
  const { data: teacherDashboard } = useQuery({
    queryKey: ['teacher-dashboard-assignments', user?.id],
    queryFn: () => api.getTeacherDashboard(),
    enabled: isTeacher,
  });
  const { data: course } = useQuery({
    queryKey: ['assignment-course', courseId],
    queryFn: () => api.getCourse(courseId as string),
    enabled: Boolean(courseId),
  });
  const { data: notifications } = useQuery({
    queryKey: ['assignment-notifications', user?.id],
    queryFn: () => api.getAssignmentNotifications(),
    enabled: Boolean(user),
  });
  const createMutation = useMutation({
    mutationFn: () => api.createAssignment({
      ...form,
      maxPoints: Number(form.maxPoints),
      weight: Number(form.weight),
      dueAt: new Date(form.dueAt).toISOString(),
    }),
    onSuccess: () => {
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
  const publishMutation = useMutation({
    mutationFn: (id: string) => api.publishAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });
  const submitMutation = useMutation({
    mutationFn: () => api.submitAssignment(assignmentId as string, { content }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
  const gradeMutation = useMutation({
    mutationFn: (input: { submissionId: string; pointsEarned: number; feedback?: string }) => api.gradeSubmission(input.submissionId, { pointsEarned: input.pointsEarned, feedback: input.feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  if (assignmentId) {
    const assignment = detail?.data;
    if (!assignment) return <Card className="p-8 text-center text-gray-500">Loading assignment...</Card>;
    const ownSubmission = assignment.submissions?.find((item: any) => item.studentId === user?.id);
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link to={courseId ? `/dashboard/assignments?courseId=${courseId}` : '/dashboard/assignments'} className="text-sm font-semibold text-primary-600 hover:underline">← All assignments</Link>
        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{assignment.course?.code}</p><h1 className="mt-1 text-2xl font-bold">{assignment.title}</h1></div>
            <Badge variant={assignment.isPublished ? 'success' : 'warning'}>{assignment.isPublished ? 'Published' : 'Draft'}</Badge>
          </div>
          <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{assignment.description}</p>
          <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800/60 sm:grid-cols-3">
            <Info label="Due" value={new Date(assignment.dueAt).toLocaleString()} />
            <Info label="Points" value={String(assignment.maxPoints)} />
            <Info label="Type" value={assignment.type} />
          </div>
          {user?.role === 'student' && assignment.isPublished && (
            <div className="space-y-3 border-t pt-4 dark:border-gray-800">
              <label className="block text-sm font-semibold">Your submission<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-900" placeholder="Write your response..." /></label>
              <Button disabled={!content.trim() || submitMutation.isPending} isLoading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>{ownSubmission ? 'Resubmit work' : 'Submit work'}</Button>
              {ownSubmission && <p className="text-sm text-gray-500">Last submitted {new Date(ownSubmission.submittedAt).toLocaleString()} · {ownSubmission.status}</p>}
            </div>
          )}
          {isTeacher && (
          <div className="border-t pt-4 dark:border-gray-800">
            <h2 className="font-bold">Submissions ({assignment.submissions?.length || 0})</h2>
            <div className="mt-3 space-y-3">
              {assignment.submissions?.length ? assignment.submissions.map((submission: any) => (
                <TeacherSubmissionRow key={submission.id} submission={submission} maxPoints={assignment.maxPoints} onSave={(pointsEarned, feedback) => gradeMutation.mutate({ submissionId: submission.id, pointsEarned, feedback })} isSaving={gradeMutation.isPending} />
              )) : <p className="text-sm text-gray-500">No students have submitted this assignment yet.</p>}
            </div>
          </div>
          )}
        </Card>
      </div>
    );
  }

  const assignments = data?.data || [];
  const courses = teacherDashboard?.data?.courses || [];
  const courseName = course?.data?.name || assignments[0]?.course?.name;
  const courseCode = course?.data?.code || assignments[0]?.course?.code;
  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" />
        <div className="relative">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors hover:text-white hover:underline"
          >
            ← Back to previous page
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">
            <span>Course work</span>
            {courseCode && <span className="rounded-full bg-white/10 px-2.5 py-1 tracking-normal text-blue-100">{courseCode}</span>}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Assignments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            {courseName ? `Stay on top of every deliverable for ${courseName}.` : 'Keep coursework organized from draft to final submission.'}
          </p>
          {isTeacher && (
            <Button
              className="mt-5 bg-white text-primary-700 hover:bg-primary-50"
              onClick={() => setShowForm((value) => !value)}
            >
              <span aria-hidden="true">{showForm ? '×' : '+'}</span>
              {showForm ? 'Close form' : 'Create assignment'}
            </Button>
          )}
        </div>
      </section>
      {!courseId && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm text-primary-800 dark:border-primary-900/50 dark:bg-primary-950/20 dark:text-primary-200">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold dark:bg-primary-900/50">i</span>
          <span>Assignments are private drafts until a teacher publishes them.</span>
        </div>
      )}
      {showForm && isTeacher && (
        <Card className="grid gap-3 p-5 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">Course<select value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-900"><option value="">Select your course</option>{courses.map((course: any) => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}</select></label>
          <label className="text-sm font-semibold">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-900" /></label>
          <label className="text-sm font-semibold">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-900"><option>HOMEWORK</option><option>QUIZ</option><option>PROJECT</option><option>MIDTERM</option><option>FINAL</option><option>PRESENTATION</option></select></label>
          <label className="text-sm font-semibold sm:col-span-2">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-900" /></label>
          <label className="text-sm font-semibold">Due date<input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-900" /></label>
          <label className="text-sm font-semibold">Max points<input type="number" value={form.maxPoints} onChange={(event) => setForm({ ...form, maxPoints: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-900" /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.allowLateSubmission} onChange={(event) => setForm({ ...form, allowLateSubmission: event.target.checked })} /> Allow late submissions</label>
          <Button disabled={!form.courseId || !form.title || form.description.length < 10 || !form.dueAt || createMutation.isPending} isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>Save draft</Button>
        </Card>
      )}
      {notifications?.data?.length ? <Card className="p-5"><h2 className="font-bold">Assignment notifications</h2><div className="mt-3 space-y-2">{notifications.data.slice(0, 5).map((item: any) => <p key={item.id} className="text-sm text-gray-600 dark:text-gray-300">{item.description}<span className="ml-2 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span></p>)}</div></Card> : null}
      {isLoading ? <Card className="p-8 text-center text-gray-500">Loading assignments...</Card> : isError ? <Card className="p-8 text-center text-red-600">Unable to load assignments.</Card> : assignments.length === 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="relative flex flex-col items-center px-6 py-16 text-center sm:px-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 via-academic-gold to-primary-600" />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600 ring-8 ring-primary-50/60 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-950/20" aria-hidden="true">
              <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7h8M8 11h5m-7 9h10a2 2 0 002-2V6.5A2.5 2.5 0 0015.5 4h-7A2.5 2.5 0 006 6.5V18a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="m9 16 1.5 1.5L14 14" /></svg>
            </div>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Course work hub</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Nothing assigned yet</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500">New assignments will appear here when your instructor publishes them. Check back soon or explore the course workspace.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {courseId && <Link to={`/dashboard/courses/${courseId}`}><Button variant="outline">Course workspace</Button></Link>}
              {isTeacher && <Button onClick={() => setShowForm(true)}>Create assignment</Button>}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((assignment: any) => <Card key={assignment.id} className="flex flex-col gap-3 p-5">
            <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{assignment.course?.code}</p><h2 className="mt-1 break-words text-lg font-bold">{assignment.title}</h2></div><Badge variant={assignment.isPublished ? 'success' : 'warning'}>{assignment.isPublished ? 'Published' : 'Draft'}</Badge></div>
            <p className="line-clamp-2 flex-1 text-sm text-gray-600 dark:text-gray-300">{assignment.description}</p>
            <p className="text-xs text-gray-500">Due {new Date(assignment.dueAt).toLocaleString()} · {assignment.maxPoints} points</p>
            <div className="flex flex-wrap gap-2"><Link to={`/dashboard/assignments/${assignment.id}`}><Button size="sm" variant="outline">Open</Button></Link>{isTeacher && !assignment.isPublished && <Button size="sm" onClick={() => publishMutation.mutate(assignment.id)} disabled={publishMutation.isPending}>Publish</Button>}{isTeacher && <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(assignment.id)}>Delete</Button>}</div>
          </Card>)}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function TeacherSubmissionRow({
  submission,
  maxPoints,
  onSave,
  isSaving,
}: {
  submission: any;
  maxPoints: number;
  onSave: (pointsEarned: number, feedback: string) => void;
  isSaving: boolean;
}) {
  const [points, setPoints] = useState(submission.pointsEarned?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  return (
    <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-semibold">{submission.student?.firstName} {submission.student?.lastName}</p><p className="text-xs text-gray-500">Submitted {new Date(submission.submittedAt).toLocaleString()} · {submission.status}</p></div>
        <span className="text-sm text-gray-500">{submission.pointsEarned ?? '—'}/{maxPoints}</span>
      </div>
      {submission.content && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/70">{submission.content}</p>}
      {submission.attachments?.length ? <p className="mt-2 break-all text-xs text-gray-500">Attachments: {submission.attachments.join(', ')}</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-[6rem_1fr_auto]">
        <input type="number" min="0" max={maxPoints} value={points} onChange={(event) => setPoints(event.target.value)} placeholder={`/${maxPoints}`} aria-label="Points earned" className="rounded-lg border p-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
        <input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback (optional)" aria-label="Submission feedback" className="rounded-lg border p-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
        <Button size="sm" disabled={isSaving || points === ''} isLoading={isSaving} onClick={() => onSave(Number(points), feedback)}>Save grade</Button>
      </div>
    </div>
  );
}
