import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { formatDate } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const noticeTypes = ['general', 'academic', 'event', 'urgent', 'maintenance'];
const roles = ['student', 'teacher', 'staff', 'admin'];

export function AdminNoticesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);

  const { data: noticesData, isLoading } = useQuery({
    queryKey: ['notices', page, search, typeFilter],
    queryFn: () => api.getNotices({ page, limit: 10, type: typeFilter !== 'All' ? typeFilter : undefined }),
    enabled: !!user,
  });

  const createNoticeMutation = useMutation({
    mutationFn: (data: any) => api.createNotice(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); setShowCreateModal(false); },
  });

  const updateNoticeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateNotice(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); setSelectedNotice(null); },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotice(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); setShowDeleteConfirm(false); setNoticeToDelete(null); },
  });

  const notices = noticesData?.data?.data || [];
  const totalPages = noticesData?.data?.meta?.totalPages || 1;
  const total = noticesData?.data?.meta?.total || 0;

  const handleDeleteClick = (id: string) => { setNoticeToDelete(id); setShowDeleteConfirm(true); };
  const handleEditClick = (notice: any) => { setSelectedNotice({ ...notice }); };

  const getTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
      general: 'gray', academic: 'info', event: 'primary', urgent: 'danger', maintenance: 'warning',
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-gray-900 dark:text-white">Notice Management</h1>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">Manage university announcements and notices</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Create Notice
        </Button>
      </div>

      <Card>
        <div className="border-b border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/30 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <Input placeholder="Search notices..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>} />
          </div>
          </div>
          <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} options={['All', ...noticeTypes].map(t => ({ value: t, label: t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1) }))} className="w-full md:w-48" />
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Notice</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Type</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Target Roles</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Published</th>
                    <th className="text-right p-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notices.map((n: any) => (
                    <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{n.content}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant={getTypeColor(n.type)} size="sm">{n.type}</Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {n.targetRoles.join(', ')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={n.isPublished ? 'success' : 'gray'} size="sm">{n.isPublished ? 'Published' : 'Draft'}</Badge>
                          {n.isPinned && <Badge variant="warning" size="sm">Pinned</Badge>}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(n.publishAt)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(n)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(n.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {notices.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">No notices found</td></tr>}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} notices</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <NoticeFormModal notice={selectedNotice} isOpen={!!selectedNotice || showCreateModal} onClose={() => { setSelectedNotice(null); setShowCreateModal(false); }} onSubmit={selectedNotice ? (data: any) => updateNoticeMutation.mutate({ id: selectedNotice.id, data }) : (data: any) => createNoticeMutation.mutate(data)} isLoading={createNoticeMutation.isPending || updateNoticeMutation.isPending} />

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setNoticeToDelete(null); }} onConfirm={() => noticeToDelete && deleteNoticeMutation.mutate(noticeToDelete)} title="Delete Notice" message="Are you sure you want to delete this notice? This action cannot be undone." confirmText="Delete" variant="danger" isLoading={deleteNoticeMutation.isPending} />
    </div>
  );
}

function NoticeFormModal({ notice, isOpen, onClose, onSubmit, isLoading }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: notice ? { title: notice.title, content: notice.content, type: notice.type, targetRoles: notice.targetRoles, publishAt: notice.publishAt ? notice.publishAt.split('T')[0] : '', expireAt: notice.expireAt ? notice.expireAt.split('T')[0] : '', isPinned: notice.isPinned, isPublished: notice.isPublished } : { title: '', content: '', type: 'general', targetRoles: ['student', 'teacher', 'staff', 'admin'], publishAt: new Date().toISOString().split('T')[0], expireAt: '', isPinned: false, isPublished: true },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={notice ? 'Edit Notice' : 'Create Notice'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input label="Title" error={errors.title?.message?.toString()} {...register('title', { required: true })} />
        <Textarea label="Content" rows={5} error={errors.content?.message?.toString()} {...register('content', { required: true })} />
        <div className="grid sm:grid-cols-2 gap-5">
          <Select label="Type" options={noticeTypes.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} {...register('type')} />
          <Input label="Publish Date" type="date" {...register('publishAt')} />
        </div>
        <Input label="Expire Date (Optional)" type="date" {...register('expireAt')} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">Target Roles</label>
          <div className="flex flex-wrap gap-3">
            {roles.map((role) => (
              <label key={role} className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" value={role} {...register('targetRoles')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{role}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isPinned" {...register('isPinned')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="isPinned" className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinned</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isPublished" {...register('isPublished')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{notice ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from 'react-hook-form';
import { Textarea } from '../../components/ui/Input';