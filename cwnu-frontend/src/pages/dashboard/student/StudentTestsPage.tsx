import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export function StudentTestsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('courseId') || undefined;
  const { data, isLoading, isError } = useQuery({ queryKey: ['eligible-tests', courseId], queryFn: () => courseId ? api.getCourseTests(courseId) : api.getEligibleTests() });
  const tests = data?.data || [];
  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-academic-gold/15" /><div className="relative"><button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white hover:underline">← Back to previous page</button><p className="text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Assessment center</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tests and quizzes</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">{courseId ? 'Only published assessments for this approved course appear here.' : 'Only published assessments for your approved course enrollments appear here.'}</p></div></section>
      {isLoading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div> : isError ? <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20"><p className="font-semibold text-red-800 dark:text-red-300">Unable to load tests</p><p className="mt-1 text-sm text-red-700 dark:text-red-400">Please refresh the page and try again.</p></Card> : tests.length === 0 ? <Card className="p-8 text-center"><p className="font-semibold text-gray-900 dark:text-white">No eligible tests right now</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Published assessments for your approved courses will appear here.</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => {
            const attemptsUsed = test.attempts?.length || 0;
            const active = test.attempts?.find((attempt) => attempt.status === 'IN_PROGRESS');
            return <Card key={test.id} variant="hover" className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{test.course?.code}</p><h2 className="mt-1 text-xl font-bold">{test.title}</h2></div><Badge variant={active ? 'warning' : 'info'}>{active ? 'In progress' : 'Available'}</Badge></div>
              <p className="text-sm text-gray-500">{test.course?.name} · {test._count?.questions || 0} questions · {test.durationMinutes} minutes</p>
              <div className="flex items-center justify-between text-xs text-gray-500"><span>{attemptsUsed}/{test.maxAttempts} attempts used</span>{test.availableUntil && <span>Due {new Date(test.availableUntil).toLocaleString()}</span>}</div>
              {active ? <Link to={`/dashboard/tests/${test.id}/take`}><Button className="w-full">Continue test</Button></Link> : attemptsUsed < test.maxAttempts ? <Link to={`/dashboard/tests/${test.id}/take`}><Button className="w-full">Start test</Button></Link> : <Button disabled className="w-full">Attempts exhausted</Button>}
            </Card>;
          })}
        </div>
      )}
    </div>
  );
}
