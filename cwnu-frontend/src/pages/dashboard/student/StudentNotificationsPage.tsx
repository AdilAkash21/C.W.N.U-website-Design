import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export function StudentNotificationsPage() {
  const { user } = useAuth();
  const { data: attendance } = useQuery({ queryKey: ['student-notification-attendance', user?.id], queryFn: () => api.getStudentAttendance(), enabled: Boolean(user) });
  const { data: assignments } = useQuery({ queryKey: ['student-notification-assignments', user?.id], queryFn: () => api.getAssignmentNotifications(), enabled: Boolean(user) });
  const items = [...(attendance?.data?.notifications || []).map((item: any) => ({ ...item, kind: 'Attendance' })), ...(assignments?.data || []).map((item: any) => ({ ...item, kind: 'Assignment' }))].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return <div className="space-y-6 animate-fade-in"><section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-[#122b54] to-[#1d477d] p-6 text-white shadow-elevated sm:p-8"><Link to="/dashboard/student" className="mb-5 inline-flex text-sm font-semibold text-blue-100 hover:text-white hover:underline">← Back to dashboard</Link><p className="text-xs font-semibold uppercase tracking-[0.2em] text-academic-gold">Student portal</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Notifications</h1><p className="mt-3 text-sm text-blue-100">Stay up to date with attendance, assignments, and course activity.</p></section><Card padding="none" className="overflow-hidden"><div className="border-b border-gray-100 p-5 dark:border-gray-800"><h2 className="text-xl font-bold">Recent activity</h2></div>{items.length ? <div className="divide-y divide-gray-100 dark:divide-gray-800">{items.map((item: any, index: number) => <div key={item.id || index} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-primary-600">{item.kind}</span><span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{item.description || item.title || 'New course activity'}</p></div>)}</div> : <div className="p-10 text-center text-gray-500">You are all caught up. No notifications yet.</div>}</Card></div>;
}
