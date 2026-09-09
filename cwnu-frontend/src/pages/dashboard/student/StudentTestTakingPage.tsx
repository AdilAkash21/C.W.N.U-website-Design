import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import type { TestAnswer } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export function StudentTestTakingPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({ queryKey: ['start-test', testId], queryFn: () => api.startTest(testId as string), enabled: Boolean(testId), retry: false });
  const attempt = data?.data?.attempt;
  const questions = data?.data?.test.questions || [];
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const saveMutation = useMutation({ mutationFn: (answer: TestAnswer) => api.saveTestAnswer(attempt?.id as string, answer) });
  const submitMutation = useMutation({
    mutationFn: () => api.submitTest(attempt?.id as string, answers),
    onSuccess: (result) => navigate(`/dashboard/tests/results/${result.data.attemptId}`),
  });

  useEffect(() => {
    if (!attempt) return;
    setAnswers(attempt.answers || []);
  }, [attempt]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = attempt ? Math.max(0, new Date(attempt.dueAt).getTime() - now) : 0;
  const formattedRemaining = useMemo(() => `${Math.floor(remaining / 60000).toString().padStart(2, '0')}:${Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0')}`, [remaining]);
  const setAnswer = (answer: TestAnswer) => {
    setAnswers((current) => [...current.filter((item) => item.questionId !== answer.questionId), answer]);
    if (attempt) saveMutation.mutate(answer);
  };
  const answerFor = (questionId: string) => answers.find((answer) => answer.questionId === questionId);

  useEffect(() => {
    if (attempt && remaining === 0 && submitMutation.isIdle) submitMutation.mutate();
  }, [attempt, remaining, submitMutation]);

  if (isLoading) return <div className="space-y-4 animate-pulse"><div className="h-40 rounded-3xl bg-gray-200 dark:bg-gray-800" /><div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800" /></div>;
  if (isError || !data?.data || !attempt) return <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20"><p className="font-semibold text-red-800 dark:text-red-300">This test cannot be started</p><p className="mt-1 text-sm text-red-700 dark:text-red-400">It may be unavailable or you may have used all attempts.</p><Link to="/dashboard/tests" className="mt-4 inline-flex text-sm font-semibold text-red-800 underline dark:text-red-300">← Back to tests</Link></Card>;
  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <div className="sticky top-3 z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-5 text-white shadow-elevated sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><Link to="/dashboard/tests" className="mb-4 inline-flex text-sm font-semibold text-blue-100 hover:text-white hover:underline">← All tests</Link><p className="text-xs uppercase tracking-[0.16em] text-academic-gold">{data.data.test.course?.code}</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">{data.data.test.title}</h1></div><div className={`shrink-0 rounded-xl px-3 py-2 text-lg font-bold ${remaining < 60000 ? 'bg-red-100 text-red-700' : 'bg-white/15 text-white'}`} aria-label="Time remaining">{formattedRemaining}</div></div></div>
      {questions.map((question, index) => {
        const answer = answerFor(question.id);
        const selected = new Set(answer?.selectedChoiceIds || []);
        return <Card key={question.id} className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-gray-900 dark:text-white">{index + 1}. {question.prompt}</h2><span className="shrink-0 rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">{question.points} pt</span></div>
          {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type) ? <div className="space-y-2">{question.choices.map((choice) => <label key={choice.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800"><input type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'} name={question.id} checked={selected.has(choice.id)} onChange={() => { const next = question.type === 'MULTIPLE_CHOICE' ? (selected.has(choice.id) ? [...selected].filter((id) => id !== choice.id) : [...selected, choice.id]) : [choice.id]; setAnswer({ questionId: question.id, selectedChoiceIds: next }); }} />{choice.text}</label>)}</div> : <textarea value={answer?.responseText || ''} onChange={(event) => setAnswer({ questionId: question.id, selectedChoiceIds: [], responseText: event.target.value })} rows={question.type === 'ESSAY' ? 7 : 3} placeholder="Type your answer..." className="w-full rounded-xl border p-3 dark:border-gray-700 dark:bg-gray-900" />}
        </Card>;
      })}
      <Button className="w-full" disabled={submitMutation.isPending} isLoading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>Submit test</Button>
    </div>
  );
}
