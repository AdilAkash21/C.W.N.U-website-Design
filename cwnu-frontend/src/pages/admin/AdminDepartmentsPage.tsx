import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { formatDate, cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export function AdminDepartmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  const { data: deptsData, isLoading } = useQuery({
    queryKey: ['departments', page, search],
    queryFn: () => api.getDepartments({ page, limit: 10, search: search || undefined }),
    enabled: !!user,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers({ role: 'teacher', limit: 100 }),
    enabled: !!user,
  });

  const createDeptMutation = useMutation({
    mutationFn: (data: any) => api.createDepartment(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setShowCreateModal(false); },
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateDepartment(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setSelectedDept(null); },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setShowDeleteConfirm(false); setDeptToDelete(null); },
  });

  const departments = deptsData?.data || [];
  const teachers = usersData?.data?.data || [];
  const totalPages = deptsData?.meta?.totalPages || 1;
  const total = deptsData?.meta?.total || 0;

  const handleDeleteClick = (id: string) => { setDeptToDelete(id); setShowDeleteConfirm(true); };
  const handleEditClick = (dept: any) => { setSelectedDept({ ...dept }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-gray-900 dark:text-white">Department Management</h1>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">Manage academic departments</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Department
        </Button>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <Input placeholder="Search departments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>} className="max-w-md" />
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Department</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Head</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Faculty</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-right p-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {departments.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{d.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{d.code}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{d.head?.firstName} {d.head?.lastName} || '—'}</td>
                      <td className="p-4 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">{d.faculty?.name || '—'}</td>
                      <td className="p-4">
                        <Badge variant={d.isActive ? 'success' : 'gray'} size="sm">{d.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(d)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(d.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">No departments found</td></tr>}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} departments</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <DepartmentFormModal dept={selectedDept} isOpen={!!selectedDept || showCreateModal} onClose={() => { setSelectedDept(null); setShowCreateModal(false); }} onSubmit={selectedDept ? (data) => updateDeptMutation.mutate({ id: selectedDept.id, data }) : (data) => createDeptMutation.mutate(data)} isLoading={createDeptMutation.isPending || updateDeptMutation.isPending} teachers={teachers} />

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeptToDelete(null); }} onConfirm={() => deptToDelete && deleteDeptMutation.mutate(deptToDelete)} title="Delete Department" message="Are you sure you want to delete this department? This action cannot be undone." confirmText="Delete" variant="danger" isLoading={deleteDeptMutation.isPending} />
    </div>
  );
}

function DepartmentFormModal({ dept, isOpen, onClose, onSubmit, isLoading, teachers }: any) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: dept ? { code: dept.code, name: dept.name, description: dept.description || '', headId: dept.headId, facultyId: dept.facultyId, isActive: dept.isActive } : { code: '', name: '', description: '', headId: '', facultyId: '', isActive: true },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dept ? 'Edit Department' : 'Create Department'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input label="Department Code" error={errors.code?.message} {...register('code', { required: true })} />
          <Input label="Department Name" error={errors.name?.message} {...register('name', { required: true })} />
        </div>
        <Textarea label="Description" rows={3} {...register('description')} />
        <div className="grid sm:grid-cols-2 gap-5">
          <Select label="Department Head" options={[{ value: '', label: 'None' }, ...teachers.map((t: any) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))]} {...register('headId')} />
          <Input label="Faculty" {...register('facultyId')} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{dept ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from 'react-hook-form';
import { Textarea } from '../../components/ui/Input';