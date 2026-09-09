import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const statuses = ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'REOPENED', 'IGNORED'];

export function AdminErrorIncidentsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-error-incidents', search, status],
    queryFn: () => api.getErrorIncidents({ search: search || undefined, status: status || undefined }),
  });
  const update = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) => api.updateErrorIncident(id, { status: nextStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-error-incidents'] }),
  });
  const incidents = data?.data?.data || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-primary-600" to="/dashboard/admin">← Back to Admin Dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">System error monitoring</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Review grouped failures and track recovery without exposing technical details to users.</p>
        </div>
        <button type="button" onClick={() => refetch()} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold dark:border-gray-700 dark:text-white">Refresh</button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Search message, code, or reference" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {isLoading && <p className="text-gray-600 dark:text-gray-300">Loading incidents...</p>}
      {isError && <div className="rounded-lg bg-red-50 p-4 text-red-700">Unable to load incidents. <button className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {incidents.map((incident: any) => (
              <article className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between" key={incident.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">{incident.severity}</span>
                    <span className="text-xs font-mono text-gray-500">{incident.referenceId}</span>
                  </div>
                  <h2 className="mt-2 font-semibold text-gray-900 dark:text-white">{incident.message}</h2>
                  <p className="mt-1 text-sm text-gray-500">{incident.code || 'INTERNAL_ERROR'} · {incident.method} {incident.route} · {incident.occurrenceCount} occurrence(s)</p>
                </div>
                <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" value={incident.status} onChange={(event) => update.mutate({ id: incident.id, nextStatus: event.target.value })}>
                  {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </article>
            ))}
            {!incidents.length && <p className="p-8 text-center text-gray-500">No incidents match these filters.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
