import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const initialQuestion = { prompt: '', type: 'SINGLE_CHOICE', points: 1, choices: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] };

export function TeacherTestsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [question, setQuestion] = useState(initialQuestion);
  const { data: course } = useQuery({ queryKey: ['course', courseId], queryFn: () => api.getCourse(courseId as string), enabled: Boolean(courseId) });
  const { data, isLoading } = useQuery({ queryKey: ['course-tests', courseId], queryFn: () => api.getCourseTests(courseId as string), enabled: Boolean(courseId) });
  const createMutation = useMutation({
    mutationFn: () => api.createTest({
      courseId: courseId as string,
      title,
      description,
      durationMinutes,
      maxAttempts,
      showResults,
      questions: [{ ...question, choices: question.choices.filter((choice) => choice.text.trim()) }],
    }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setQuestion(initialQuestion);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['course-tests', courseId] });
    },
  });
  const publishMutation = useMutation({
    mutationFn: (testId: string) => api.publishTest(testId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-tests', courseId] }),
  });
  const releaseMutation = useMutation({ mutationFn: (testId: string) => api.releaseTestResults(testId) });

  const updateChoice = (index: number, value: string) => setQuestion((current) => ({ ...current, choices: current.choices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, text: value } : choice) }));
  const toggleChoice = (index: number) => setQuestion((current) => ({ ...current, choices: current.choices.map((choice, choiceIndex) => ({ ...choice, isCorrect: current.type === 'SINGLE_CHOICE' || current.type === 'TRUE_FALSE' ? choiceIndex === index : choiceIndex === index ? !choice.isCorrect : choice.isCorrect })) }));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" /><div className="relative"><Link to={`/dashboard/courses/${courseId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white hover:underline">← Course workspace</Link><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Assessment authoring</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{course?.data?.name || 'Course tests'}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Draft, publish, and release results for course-scoped tests.</p></div><Button onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close form' : 'Create test'}</Button></div></div></section>
      {showForm && (
        <Card className="grid gap-4 border-primary-200 bg-primary-50/30 p-6 sm:grid-cols-2 dark:border-primary-900/50 dark:bg-primary-950/10">
          <label className="text-sm font-semibold sm:col-span-2">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm font-semibold sm:col-span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm font-semibold">Minutes<input type="number" min={1} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm font-semibold">Attempts<input type="number" min={1} value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={showResults} onChange={(event) => setShowResults(event.target.checked)} /> Show results when submitted</label>
          <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2 dark:bg-gray-800/60">
            <p className="font-semibold">First question</p>
            <input value={question.prompt} onChange={(event) => setQuestion({ ...question, prompt: event.target.value })} placeholder="Question prompt" className="mt-2 w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <select value={question.type} onChange={(event) => setQuestion({ ...question, type: event.target.value })} className="rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900"><option value="SINGLE_CHOICE">Single choice</option><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True / false</option><option value="SHORT_ANSWER">Short answer</option><option value="ESSAY">Essay</option></select>
              <input type="number" min={1} value={question.points} onChange={(event) => setQuestion({ ...question, points: Number(event.target.value) })} className="rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" aria-label="Question points" />
            </div>
            {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type) && question.choices.map((choice, index) => <div key={index} className="mt-2 flex items-center gap-2"><input type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'} checked={choice.isCorrect} onChange={() => toggleChoice(index)} aria-label={`Correct option ${index + 1}`} /><input value={choice.text} onChange={(event) => updateChoice(index, event.target.value)} placeholder={`Option ${index + 1}`} className="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-900" /></div>)}
          </div>
          <Button disabled={!title.trim() || !question.prompt.trim() || createMutation.isPending} isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>Save draft</Button>
        </Card>
      )}
      {isLoading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.data || []).map((test) => <Card key={test.id} variant="hover" className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{test._count?.questions || 0} questions</p><h2 className="mt-1 text-xl font-bold">{test.title}</h2></div><Badge variant={test.status === 'PUBLISHED' ? 'success' : 'warning'}>{test.status}</Badge></div>
            <p className="text-sm text-gray-500">{test.durationMinutes} minutes · {test.maxAttempts} attempt{test.maxAttempts === 1 ? '' : 's'}</p>
            <div className="flex flex-wrap gap-2"><span className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700">Teacher managed</span>{test.status === 'DRAFT' && <Button size="sm" onClick={() => publishMutation.mutate(test.id)} disabled={publishMutation.isPending}>Publish</Button>}{test.status === 'PUBLISHED' && <Button size="sm" variant="secondary" onClick={() => releaseMutation.mutate(test.id)}>Release results</Button>}</div>
          </Card>)}
          {!data?.data?.length && <Card className="p-8 text-center text-gray-500 md:col-span-2">No tests yet. Create a draft to get started.</Card>}
        </div>
      )}
    </div>
  );
}
