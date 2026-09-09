import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { API_ORIGIN, api } from '../../services/api';
import { formatDate } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const roles = ['student', 'teacher', 'staff', 'admin'];

export function AdminUsersPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(() => {
    const role = searchParams.get('role');
    return role && roles.includes(role) ? role : 'All';
  });
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () => api.getUsers({
      page,
      limit: 10,
      search: search || undefined,
      role: roleFilter !== 'All' ? roleFilter : undefined,
    }),
    enabled: !!user,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'], refetchType: 'active' }),
      ]);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Unable to update this user.');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    },
  });

  const users = usersData?.data?.data || [];
  const totalPages = usersData?.data?.meta?.totalPages || 1;
  const total = usersData?.data?.meta?.total || 0;

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleEditClick = async (user: any) => {
    try {
      const response = await api.getUser(user.id);
      setSelectedUser(response.data);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Unable to load this user.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-primary-50/70 p-5 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/30 sm:p-6">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary-500/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/dashboard/admin"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
              Admin workspace
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">User Management</h1>
            <p className="mt-1.5 max-w-xl text-sm text-gray-600 dark:text-gray-400">Manage accounts, roles, and access across the university.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="w-full shrink-0 shadow-md sm:w-auto">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add User
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 via-white to-white p-5 dark:border-gray-800 dark:from-gray-950/60 dark:via-gray-900 dark:to-gray-900 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Directory controls</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Browse university accounts</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Search by name or email, then narrow the directory by role.</p>
            </div>
            {(search || roleFilter !== 'All') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setRoleFilter('All'); setPage(1); }}
                className="text-left text-xs font-semibold text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300 lg:text-right"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <label htmlFor="user-directory-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Search directory</label>
              <Input
                id="user-directory-search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>}
              />
            </div>
            <div>
              <label htmlFor="user-directory-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account role</label>
              <Select
                id="user-directory-role"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                options={['All', ...roles].map(r => ({ value: r, label: r === 'All' ? 'All roles' : `${r.charAt(0).toUpperCase()}${r.slice(1)}s` }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">User</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Role</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Status</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Last Login</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                    <th className="text-right p-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                            {u.avatar ? <img src={`${API_ORIGIN}${u.avatar}`} alt="" className="h-full w-full rounded-full object-cover" /> : `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant="info" size="sm">{u.role}</Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <Badge variant={u.isActive ? 'success' : 'gray'} size="sm">
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(u)}>
                            Edit
                          </Button>
                          {u.id !== user?.id && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(u.id)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} users
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <UserFormModal
        user={selectedUser}
        isOpen={!!selectedUser || showCreateModal}
        onClose={() => { setSelectedUser(null); setShowCreateModal(false); }}
        onSubmit={selectedUser ? (data: any) => updateUserMutation.mutate({ id: selectedUser.id, data }) : (data: any) => createUserMutation.mutate(data)}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
        onConfirm={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
}

function UserFormModal({ user, isOpen, onClose, onSubmit, isLoading }: any) {
  const { register, handleSubmit, formState: { errors, dirtyFields }, reset } = useForm({
    defaultValues: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
      address: user.address || '',
      bio: user.bio || '',
      password: '',
    } : {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      isActive: true,
      phone: '',
      dateOfBirth: '',
      address: '',
      bio: '',
    },
  });

  useEffect(() => {
    reset(user ? {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'STAFF',
      isActive: user.isActive ?? true,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
      address: user.address || '',
      bio: user.bio || '',
      password: '',
    } : {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      isActive: true,
      phone: '',
      dateOfBirth: '',
      address: '',
      bio: '',
    });
  }, [user, isOpen, reset]);

  const onFormSubmit = (data: any) => {
    if (!user && data.password !== data.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (user) {
      const changedData = Object.keys(dirtyFields).reduce((changes, field) => {
        changes[field] = data[field];
        return changes;
      }, {} as Record<string, unknown>);

      if (dirtyFields.isActive) {
        changedData.isActive = data.isActive === true || data.isActive === 'true';
      }
      if (dirtyFields.password && !data.password) {
        delete changedData.password;
      }
      if (Object.keys(changedData).length === 0) {
        onClose();
        return;
      }
      onSubmit(changedData);
    } else {
      onSubmit({ ...data, isActive: data.isActive === true || data.isActive === 'true', password: data.password || undefined });
    }
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Create User'} size="lg">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input label="First Name" error={errors.firstName?.message?.toString()} {...register('firstName', { required: true })} />
            <Input label="Last Name" error={errors.lastName?.message?.toString()} {...register('lastName', { required: true })} />
        </div>
        <Input label="Email" type="email" error={errors.email?.message?.toString()} {...register('email', { required: true })} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Phone" type="tel" placeholder="+86 123 456 7890" {...register('phone')} />
          <Input label="Date of Birth" type="date" {...register('dateOfBirth')} />
        </div>
        <Input label="Address" {...register('address')} />
        <Input label="Bio" {...register('bio')} />
        {!user && (
          <div className="grid sm:grid-cols-2 gap-5">
            <Input label="Password" type="password" error={errors.password?.message?.toString()} {...register('password', { required: true, minLength: 8 })} />
            <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message?.toString()} {...register('confirmPassword', { required: true })} />
          </div>
        )}
        {user && <Input label="New Password (optional)" type="password" placeholder="Leave blank to keep current password" {...register('password', { minLength: 8 })} />}
        <div className="grid sm:grid-cols-2 gap-5">
          <Select label="Role" error={errors.role?.message?.toString()} options={roles.filter((role) => user || role !== 'student').map(r => ({ value: r.toUpperCase(), label: r.charAt(0).toUpperCase() + r.slice(1) }))} {...register('role')} />
          <Select label="Status" options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} {...register('isActive')} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{user ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from 'react-hook-form';