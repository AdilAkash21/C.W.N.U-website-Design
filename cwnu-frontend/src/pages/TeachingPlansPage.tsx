import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyPlan = (courseId: string) => ({ courseId, objectives: [], outcomes: [], resources: [], startDate: '', endDate: '', completionDate: '', entries: [] });

export function TeachingPlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const readOnly = user?.role === 'student';
  const { data, isLoading } = useQuery({ queryKey: ['teaching-plans'], queryFn: () => api.getTeachingPlans(), enabled: !!user });
  const plans = data?.data || [];
  const [selectedId, setSelectedId] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState('');
  const selected = plans.find((item: any) => item.courseId === selectedId);

  useEffect(() => {
    if (!selectedId && plans[0]) setSelectedId(plans[0].courseId);
  }, [plans, selectedId]);
  useEffect(() => {
    if (selectedId) api.getTeachingPlan(selectedId).then((response) => setPlan(response.data || emptyPlan(selectedId))).catch(() => setError('Unable to load this plan.'));
  }, [selectedId]);

  const save = useMutation({
    mutationFn: () => api.saveTeachingPlan(selectedId, { ...plan, startDate: plan.startDate || null, endDate: plan.endDate || null, completionDate: plan.completionDate || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teaching-plans'] }); setError(''); },
    onError: () => setError('Could not save the teaching plan. Check that each entry has a topic and valid month/week.'),
  });
  const updateList = (field: string, value: string) => setPlan((current: any) => ({ ...current, [field]: value.split('\n').map((item) => item.trim()).filter(Boolean) }));

  return <div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-academic-navy to-primary-800 p-6 text-white sm:p-8">
      <button
        type="button"
        onClick={() => navigate(user?.role === 'admin' ? '/dashboard/admin' : user?.role === 'staff' ? '/dashboard/staff' : user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Curriculum workspace</p>
      <h1 className="mt-2 text-3xl font-bold">Six-month teaching plans</h1>
      <p className="mt-2 text-sm text-blue-100">Objectives, outcomes, weekly lessons, projects, assessments, milestones, resources, and completion dates in one source of truth.</p>
    </section>
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card padding="none" className="h-fit overflow-hidden">
        <div className="border-b border-gray-100 p-4 dark:border-gray-800"><h2 className="font-semibold">Courses</h2></div>
        {isLoading ? <p className="p-4 text-sm text-gray-500">Loading...</p> : plans.length ? plans.map((item: any) => <button key={item.courseId} onClick={() => setSelectedId(item.courseId)} className={`block w-full border-b border-gray-100 p-4 text-left dark:border-gray-800 ${item.courseId === selectedId ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}><p className="font-medium">{item.course?.name}</p><p className="text-xs text-gray-500">{item.course?.code}</p></button>) : <p className="p-4 text-sm text-gray-500">No plans available yet.</p>}
        {selected && <div className="p-4"><Badge variant="info">{readOnly ? 'View only' : 'Editable'}</Badge></div>}
      </Card>
      {plan ? <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800"><div><h2 className="text-xl font-semibold">{selected?.course?.name || 'Teaching plan'}</h2><p className="text-sm text-gray-500">Six months · up to 30 weekly entries</p></div>{!readOnly && <Button onClick={() => save.mutate()} isLoading={save.isPending}>Save plan</Button>}</div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-3">{[['startDate','Start date'],['endDate','End date'],['completionDate','Completion date']].map(([key,label]) => <label key={key} className="text-sm font-medium">{label}<input type="date" value={plan[key] ? String(plan[key]).slice(0,10) : ''} disabled={readOnly} onChange={(event) => setPlan({...plan, [key]: event.target.value ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString() : null})} className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-900" /></label>)}</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{[['objectives','Objectives'],['outcomes','Learning outcomes'],['resources','Resources']].map(([key,label]) => <label key={key} className="text-sm font-medium">{label}<textarea rows={5} disabled={readOnly} value={(plan[key] || []).join('\n')} onChange={(event) => updateList(key, event.target.value)} placeholder="One item per line" className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-900" /></label>)}</div>
        <label className="mt-5 block text-sm font-medium">Monthly / weekly topics, lessons, activities, assignments, projects, assessments, milestones, resources<textarea rows={14} disabled={readOnly} value={JSON.stringify(plan.entries || [], null, 2)} onChange={(event) => { try { setPlan({...plan, entries: JSON.parse(event.target.value)}); setError(''); } catch { setError('Entries must be valid JSON.'); } }} className="mt-1 w-full rounded-lg border border-gray-300 p-3 font-mono text-xs dark:bg-gray-900" /></label>
      </Card> : <Card><p className="text-gray-500">Select a course with a plan to view it.</p></Card>}
    </div>
  </div>;
}
