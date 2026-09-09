import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function ContactMessagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['my-contact-conversations'], queryFn: () => api.getContactConversations(), refetchInterval: 10000 });
  const conversations = data?.data || [];
  return (
    <div className="space-y-6 animate-fade-in">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Support</p><h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">My conversations</h1><p className="mt-2 text-sm text-gray-500">View your contact messages and administrator responses.</p></div>
      {isLoading ? <Card><p className="text-sm text-gray-500">Loading conversations...</p></Card> : conversations.map((conversation: any) => (
        <Card key={conversation.id} padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 dark:border-gray-800"><div><h2 className="font-semibold text-gray-900 dark:text-white">{conversation.subject}</h2><p className="mt-1 text-xs text-gray-500">{new Date(conversation.createdAt).toLocaleString()}</p></div><Badge variant={conversation.status === 'REPLIED' ? 'success' : 'info'}>{conversation.status}</Badge></div>
          <div className="space-y-3 p-5">{conversation.messages.map((message: any) => <div key={message.id} className={`rounded-2xl p-4 ${message.authorId ? 'bg-primary-50 dark:bg-primary-950/30' : 'bg-gray-50 dark:bg-gray-800/70'}`}><p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{message.body}</p><p className="mt-2 text-xs text-gray-400">{new Date(message.createdAt).toLocaleString()}</p></div>)}</div>
        </Card>
      ))}
      {!isLoading && !conversations.length && <Card><p className="text-sm text-gray-500">You have no contact conversations yet.</p></Card>}
    </div>
  );
}
