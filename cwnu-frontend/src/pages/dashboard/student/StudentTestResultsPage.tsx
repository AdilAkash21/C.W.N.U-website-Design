import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function StudentTestResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, isError } = useQuery({ queryKey: ['test-results', attemptId], queryFn: () => api.getTestResults(attemptId as string), enabled: Boolean(attemptId), retry: false });
  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4 animate-pulse"><div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800" /><div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800" /></div>;
  if (isError || !data?.data) return <Card className="mx-auto max-w-3xl border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20"><p className="font-semibold text-red-800 dark:text-red-300">Results are not available yet</p><Link to="/dashboard/tests" className="mt-4 inline-flex text-sm font-semibold text-red-800 underline dark:text-red-300">← Back to tests</Link></Card>;
  const result = data.data;
  const percentage = result.maxScore ? Math.round(((result.score || 0) / result.maxScore) * 100) : 0;
  return <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
    <Link to="/dashboard/tests" className="inline-flex text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">← All tests</Link>
    <Card variant="elevated" className="relative overflow-hidden space-y-4 p-6 text-center sm:p-8"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-2xl font-bold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">{percentage}%</div><Badge variant={result.status === 'GRADED' ? 'success' : 'info'}>{result.status}</Badge><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{result.test?.title}</h1><p className="text-4xl font-bold text-primary-700 dark:text-primary-300">{result.score ?? 0} / {result.maxScore ?? 0}</p><p className="text-sm text-gray-500 dark:text-gray-400">Attempt {result.attemptNumber}</p>{!result.resultsReleasedAt && <p className="text-sm text-gray-500 dark:text-gray-400">Your teacher has not released detailed results yet.</p>}</Card>
    {result.resultsReleasedAt && result.answers?.length ? <Card className="space-y-3 p-6"><h2 className="font-bold text-gray-900 dark:text-white">Answer review</h2>{result.answers.map((answer, index) => <div key={answer.id || answer.questionId} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40"><p className="font-semibold text-gray-900 dark:text-white">{index + 1}. {answer.question?.prompt || 'Question'}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{answer.isCorrect === true ? 'Correct' : answer.isCorrect === false ? 'Incorrect' : 'Pending manual grading'} · {answer.pointsAwarded ?? 0} points</p></div>)}</Card> : null}
  </div>;
}
