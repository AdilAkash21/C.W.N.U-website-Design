import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { formatDate, cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export function AdminCoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', page, search, departmentFilter],
    queryFn: () => api.getCourses({
      page,
      limit: 10,
      search: search || undefined,
      departmentId: departmentFilter !== 'All' ? departmentFilter : undefined,
    }),
    enabled: !!user,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
    enabled: !!user,
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => api.createCourse(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setShowCreateModal(false); },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCourse(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setSelectedCourse(null); },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => api.deleteCourse(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setShowDeleteConfirm(false); setCourseToDelete(null); },
  });

  const courses = coursesData?.data?.data || [];
  const departments = departmentsData?.data || [];
  const totalPages = coursesData?.data?.meta?.totalPages || 1;
  const total = coursesData?.data?.meta?.total || 0;

  const handleDeleteClick = (id: string) => { setCourseToDelete(id); setShowDeleteConfirm(true); };
  const handleEditClick = (course: any) => { setSelectedCourse({ ...course }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-gray-900 dark:text-white">Course Management</h1>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">Manage university courses</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Course
        </Button>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>} />
          </div>
          <Select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }} options={['All', ...departments.map((d: any) => d.id)].map(r => ({ value: r, label: r === 'All' ? 'All Departments' : departments.find((d: any) => d.id === r)?.name || r }))} className="w-48" />
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Course</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Department</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Teacher</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Semester</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Enrollment</th>
                    <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-right p-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {courses.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{c.code} • {c.credits} credits</p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{c.department?.name}</td>
                      <td className="p-4 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">{c.teacher?.firstName} {c.teacher?.lastName}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{c.semester} {c.year}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{c.enrolledCount}/{c.maxStudents}</td>
                      <td className="p-4">
                        <Badge variant={c.isActive ? 'success' : 'gray'} size="sm">{c.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(c)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(c.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">No courses found</td></tr>}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} courses</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <CourseFormModal course={selectedCourse} isOpen={!!selectedCourse || showCreateModal} onClose={() => { setSelectedCourse(null); setShowCreateModal(false); }} onSubmit={selectedCourse ? (data) => updateCourseMutation.mutate({ id: selectedCourse.id, data }) : (data) => createCourseMutation.mutate(data)} isLoading={createCourseMutation.isPending || updateCourseMutation.isPending} departments={departments} />

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setCourseToDelete(null); }} onConfirm={() => courseToDelete && deleteCourseMutation.mutate(courseToDelete)} title="Delete Course" message="Are you sure you want to delete this course? This action cannot be undone." confirmText="Delete" variant="danger" isLoading={deleteCourseMutation.isPending} />
    </div>
  );
}

function CourseFormModal({ course, isOpen, onClose, onSubmit, isLoading, departments }: any) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: course ? {
      code: course.code, name: course.name, description: course.description || '',
      credits: course.credits, departmentId: course.departmentId, teacherId: course.teacherId,
      semester: course.semester, year: course.year, maxStudents: course.maxStudents,
      schedule: course.schedule, isActive: course.isActive,
    } : { code: '', name: '', description: '', credits: 3, departmentId: '', teacherId: '', semester: 'Fall', year: new Date().getFullYear(), maxStudents: 30, schedule: '', isActive: true },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={course ? 'Edit Course' : 'Create Course'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input label="Course Code" error={errors.code?.message} {...register('code', { required: true })} />
          <Input label="Course Name" error={errors.name?.message} {...register('name', { required: true })} />
        </div>
        <Textarea label="Description" rows={3} {...register('description')} />
        <div className="grid sm:grid-cols-3 gap-5">
          <Input label="Credits" type="number" {...register('credits', { valueAsNumber: true })} />
          <Select label="Department" options={departments.map((d: any) => ({ value: d.id, label: d.name }))} {...register('departmentId')} />
          <Input label="Max Students" type="number" {...register('maxStudents', { valueAsNumber: true })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <Input label="Semester" {...register('semester')} />
          <Input label="Year" type="number" {...register('year', { valueAsNumber: true })} />
          <Select label="Teacher" options={[{ value: '', label: 'Unassigned' }]} {...register('teacherId')} />
        </div>
        <Input label="Schedule (JSON)" placeholder='[{"dayOfWeek": 1, "startTime": "10:00", "endTime": "11:30", "room": "101", "building": "Tech"}]' {...register('schedule')} />
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{course ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from 'react-hook-form';
import { Textarea } from '../../components/ui/Input';