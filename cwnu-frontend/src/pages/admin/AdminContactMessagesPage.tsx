import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { formatDateTime, formatRelativeTime, getInitials } from '../../utils/cn';

const statuses = ['NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'RESOLVED', 'CLOSED'];

const statusLabels: Record<string, string> = {
  NEW: 'New',
  READ: 'Read',
  IN_PROGRESS: 'In progress',
  REPLIED: 'Replied',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

function statusVariant(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' {
  if (status === 'NEW') return 'warning';
  if (status === 'REPLIED' || status === 'RESOLVED') return 'success';
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'CLOSED') return 'gray';
  return 'primary';
}

function SearchIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>;
}

function RefreshIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" /></svg>;
}

function ArrowLeftIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" /></svg>;
}

export function AdminContactMessagesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();
  const queryKey = ['contact-conversations', search, status];
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => api.getContactConversations({
      search: search || undefined,
      status: status || undefined,
    }),
    refetchInterval: 5000,
  });
  const replyMutation = useMutation({
    mutationFn: () => api.replyToContactMessage(selected?.id as string, replyText.trim()),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['contact-conversations'] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: (nextStatus: string) => api.updateContactStatus(selected?.id as string, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-conversations'] }),
  });

  const conversations = data?.data || [];
  const selected = conversations.find((item: any) => item.id === selectedId) || conversations[0];
  const metrics = useMemo(() => ({
    total: conversations.length,
    new: conversations.filter((item: any) => item.status === 'NEW').length,
    active: conversations.filter((item: any) => item.status === 'READ' || item.status === 'IN_PROGRESS').length,
    replied: conversations.filter((item: any) => item.status === 'REPLIED').length,
  }), [conversations]);
  const filtersActive = Boolean(search || status);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setSelectedId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-primary-950 p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-500/20" aria-hidden="true" />
        <div className="absolute -bottom-24 right-32 h-48 w-48 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Link to="/dashboard/admin" className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                <ArrowLeftIcon />
                Back to Admin Dashboard
              </Link>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-300">Admin support desk</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Contact messages</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">Review, respond to, and resolve user conversations from one organized workspace.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Inbox status</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white"><span className="h-2 w-2 rounded-full bg-emerald-400" />Live and syncing</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => refetch()} isLoading={isFetching && !isLoading} leftIcon={<RefreshIcon />}>Refresh inbox</Button>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Message summary">
        {[
          { label: 'Total conversations', value: metrics.total, tone: 'bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white' },
          { label: 'Needs first reply', value: metrics.new, tone: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300' },
          { label: 'In progress', value: metrics.active, tone: 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300' },
          { label: 'Replied', value: metrics.replied, tone: 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300' },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border border-gray-100 p-4 shadow-sm dark:border-gray-800 ${metric.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </section>

      <div className="grid min-h-[620px] gap-6 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.35fr)]">
        <Card padding="none" className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Inbox</h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{metrics.total} conversation{metrics.total === 1 ? '' : 's'}</p>
              </div>
              {filtersActive && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Clear filters</button>}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></span>
              <input aria-label="Search contact messages" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sender, email, or subject" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="message-status" className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
              <select id="message-status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                <option value="">All statuses</option>
                {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
              </select>
            </div>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {isLoading && <div className="space-y-3 p-5"><div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /><div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /><div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /></div>}
            {isError && <div className="p-6 text-center"><p className="text-sm font-semibold text-gray-900 dark:text-white">Unable to load the inbox</p><p className="mt-1 text-xs text-gray-500">Check the local backend and try again.</p><Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>Try again</Button></div>}
            {!isLoading && !isError && conversations.map((item: any) => (
              <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`group block w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${selected?.id === item.id ? 'border-l-4 border-primary-600 bg-primary-50/70 pl-3 dark:bg-primary-950/30' : 'border-l-4 border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{getInitials(item.name || 'User')}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><p className="truncate font-semibold text-gray-900 dark:text-white">{item.subject}</p><Badge size="sm" variant={statusVariant(item.status)} dot>{statusLabels[item.status] || item.status}</Badge></div>
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{item.name} · {item.email}</p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400"><span>{formatRelativeTime(item.createdAt)}</span><span>{item.messages?.length || 0} message{item.messages?.length === 1 ? '' : 's'}</span></div>
                  </div>
                </div>
              </button>
            ))}
            {!isLoading && !isError && !conversations.length && <div className="p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800"><SearchIcon /></div><p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{filtersActive ? 'No matching conversations' : 'Your inbox is clear'}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{filtersActive ? 'Try a different search or status.' : 'New contact messages will appear here.'}</p></div>}
          </div>
        </Card>

        <Card padding="none" className="flex min-h-0 flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{getInitials(selected.name || 'User')}</span>
                    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Conversation</p><h2 className="mt-1 truncate text-xl font-bold text-gray-900 dark:text-white">{selected.subject}</h2><p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{selected.name} · {selected.email}</p></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label htmlFor="conversation-status" className="sr-only">Conversation status</label>
                    <select id="conversation-status" value={selected.status} disabled={statusMutation.isPending} onChange={(event) => statusMutation.mutate(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800">{statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-800 sm:grid-cols-3">
                  <div><p className="text-gray-400">Received</p><p className="mt-1 font-medium text-gray-700 dark:text-gray-200">{formatDateTime(selected.createdAt)}</p></div>
                  <div><p className="text-gray-400">Messages</p><p className="mt-1 font-medium text-gray-700 dark:text-gray-200">{selected.messages?.length || 0}</p></div>
                  <div><p className="text-gray-400">Assigned admin</p><p className="mt-1 font-medium text-gray-700 dark:text-gray-200">{selected.assignedTo ? `${selected.assignedTo.firstName} ${selected.assignedTo.lastName}` : 'Unassigned'}</p></div>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50/60 p-5 dark:bg-gray-950/20 sm:p-6">
                {selected.messages?.map((message: any) => {
                  const isAdminMessage = Boolean(message.authorId);
                  return <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${isAdminMessage ? 'rounded-br-md bg-primary-600 text-white' : 'rounded-bl-md border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={`mt-2 text-[11px] ${isAdminMessage ? 'text-primary-100' : 'text-gray-400'}`}>{isAdminMessage ? 'Administrator · ' : `${selected.name} · `}{formatDateTime(message.createdAt)}</p></div></div>;
                })}
              </div>
              <div className="border-t border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <Textarea label="Reply to conversation" value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={3} placeholder="Write a clear response for the user..." />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-gray-400">Sending a reply changes the status to Replied.</p><Button type="button" onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || !selected?.id} isLoading={replyMutation.isPending}>Send response</Button></div>
              </div>
            </>
          ) : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-300"><SearchIcon /></div><h2 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">Select a conversation</h2><p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">Choose a message from the inbox to review its history, update its status, or send a response.</p></div>}
        </Card>
      </div>
    </div>
  );
}
