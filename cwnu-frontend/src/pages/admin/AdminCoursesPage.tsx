import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function AdminCoursesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updateError, setUpdateError] = useState('');
  useEffect(() => {
    if (searchParams.get('action') === 'create') setShowCreateModal(true);
  }, [searchParams]);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', page, search, departmentFilter],
    queryFn: () => api.getCourses({
      page,
      limit: 10,
      search: search || undefined,
      departmentId: departmentFilter !== 'All' ? departmentFilter : undefined,
      includeInactive: true,
    }),
    enabled: !!user,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
    enabled: !!user,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['course-teachers'],
    queryFn: () => api.getUsers({ role: 'teacher', limit: 100 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'staff'),
  });
  const { data: selectedCourseData, isLoading: isSelectedCourseLoading } = useQuery({
    queryKey: ['course', selectedCourse?.id],
    queryFn: () => api.getCourse(selectedCourse.id),
    enabled: !!selectedCourse?.id,
  });
  const { data: courseRequestsData } = useQuery({
    queryKey: ['course-requests'],
    queryFn: () => api.getCourseRequests(),
    enabled: !!user && (user.role === 'admin' || user.role === 'staff'),
  });
  const reviewRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' }) => api.reviewCourseRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-requests'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => api.createCourse(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setShowCreateModal(false); },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCourse(id, {
      ...data,
      teacherId: data.teacherId || null,
    }),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] });
      setFormMessage({ type: 'success', text: 'Course updated successfully.' });
      setSelectedCourse(null);
    },
    onError: (error: any) => {
      const message = !error.response
        ? 'Connection failed. Your changes were not saved. Please check your connection and try again.'
        : error.response?.data?.message || 'Course update failed. Your changes were not saved.';
      setUpdateError(message);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => api.deleteCourse(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setShowDeleteConfirm(false); setCourseToDelete(null); },
  });

  const courses = coursesData?.data?.data || [];
  const departments = departmentsData?.data || [];
  const teachers = teachersData?.data?.data || [];
  const courseRequests = courseRequestsData?.data || [];
  const totalPages = coursesData?.data?.meta?.totalPages || 1;
  const total = coursesData?.data?.meta?.total || 0;

  const handleDeleteClick = (id: string) => { setCourseToDelete(id); setShowDeleteConfirm(true); };
  const handleEditClick = (course: any) => { setFormMessage(null); setUpdateError(''); setSelectedCourse({ ...course }); };

  return (
    <div className="space-y-6 animate-fade-in">
      {formMessage && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${formMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'}`}>{formMessage.text}</div>}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-primary-950 p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-500/20" aria-hidden="true" />
        <div className="absolute -bottom-24 right-32 h-48 w-48 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Link
              to={user?.role === 'staff' ? '/dashboard/staff' : '/dashboard/admin'}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
              Back to dashboard
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Academic operations</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Course Management</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">
              Create, organize, and maintain the university course catalogue from one workspace.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {total} {total === 1 ? 'course' : 'courses'} in catalogue
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Live database records</span>
            </div>
          </div>
          {user?.role === 'admin' || user?.role === 'staff' ? (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full shrink-0 border border-white/15 bg-white text-gray-900 shadow-lg hover:bg-gray-100 sm:w-auto"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Add Course
            </Button>
          ) : null}
        </div>
      </section>

      <Card>
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-gray-800 dark:from-gray-950/60 dark:to-gray-900 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">Catalogue filters</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Find a course by name, code, or department.</p>
                </div>
                {search || departmentFilter !== 'All' ? (
                  <button type="button" onClick={() => { setSearch(''); setDepartmentFilter('All'); setPage(1); }} className="text-xs font-semibold text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300">
                    Clear filters
                  </button>
                ) : null}
              </div>
              <Input placeholder="Search by course name or code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path className="text-primary-500" stroke="currentColor" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>} />
            </div>
            <div className="w-full lg:w-64">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Department</label>
              <Select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }} options={['All', ...departments.map((d: any) => d.id)].map(r => ({ value: r, label: r === 'All' ? 'All departments' : departments.find((d: any) => d.id === r)?.name || r }))} className="w-full" />
            </div>
          </div>
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
                          {user?.role === 'admin' && <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(c.id)}>Delete</Button>}
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

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-gray-100 p-6 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Faculty assignment</p>
          <h2 className="mt-1 text-heading-lg font-semibold">Teacher course requests</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review requests submitted by teachers.</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {courseRequests.length ? courseRequests.map((request: any) => (
            <div key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{request.course?.name}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{request.course?.code} · Requested by {request.teacher?.firstName} {request.teacher?.lastName}</p>
                <Badge variant={request.status === 'ACCEPTED' ? 'success' : request.status === 'REJECTED' ? 'danger' : 'warning'} size="sm" className="mt-2">{request.status}</Badge>
              </div>
              {request.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => reviewRequestMutation.mutate({ id: request.id, status: 'ACCEPTED' })} isLoading={reviewRequestMutation.isPending}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => reviewRequestMutation.mutate({ id: request.id, status: 'REJECTED' })}>Reject</Button>
                </div>
              )}
            </div>
          )) : <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No teacher course requests yet.</p>}
        </div>
      </Card>

      <CourseFormModal course={selectedCourseData?.data || selectedCourse} isOpen={!!selectedCourse || showCreateModal} onClose={() => { setSelectedCourse(null); setShowCreateModal(false); setUpdateError(''); }} serverError={updateError} onSubmit={selectedCourse ? (data: any) => { setUpdateError(''); updateCourseMutation.mutate({ id: selectedCourse.id, data }); } : (data: any) => createCourseMutation.mutate(data)} isLoading={createCourseMutation.isPending || updateCourseMutation.isPending || isSelectedCourseLoading} departments={departments} teachers={teachers} />

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setCourseToDelete(null); }} onConfirm={() => courseToDelete && deleteCourseMutation.mutate(courseToDelete)} title="Delete Course" message="Are you sure you want to delete this course? This action cannot be undone." confirmText="Delete" variant="danger" isLoading={deleteCourseMutation.isPending} />
    </div>
  );
}

function CourseFormModal({ course, isOpen, onClose, onSubmit, isLoading, departments, teachers, serverError }: any) {
  const form = useForm({
    defaultValues: {
      code: '', name: '', description: '', credits: 3, departmentId: '', teacherId: '', semester: 'Fall', year: new Date().getFullYear(), maxStudents: 30, schedule: '', isActive: false,
    },
  });
  const { register, handleSubmit, reset, formState: { errors } } = form;
  useEffect(() => {
    if (!course) {
      reset({ code: '', name: '', description: '', credits: 3, departmentId: '', teacherId: '', semester: 'Fall', year: new Date().getFullYear(), maxStudents: 30, schedule: '', isActive: false });
      return;
    }
    reset({
      code: course.code, name: course.name, description: course.description || '',
      credits: course.credits, departmentId: course.departmentId, teacherId: course.teacherId,
      semester: course.semester, year: course.year, maxStudents: course.maxStudents,
      schedule: course.schedules?.length ? JSON.stringify(course.schedules.map(({ id, courseId, ...schedule }: any) => schedule)) : '',
      isActive: course.isActive,
    });
  }, [course, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={course ? 'Edit Course' : 'Create Course'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input label="Course Code" error={errors.code?.message?.toString()} {...register('code', { required: 'Course code is required. Please enter a course code.' })} />
          <Input label="Course Name" error={errors.name?.message?.toString()} {...register('name', { required: 'Course name is required. Please enter a course name.' })} />
        </div>
        <Textarea label="Description" rows={3} {...register('description')} />
        <div className="grid sm:grid-cols-3 gap-5">
          <Input label="Credits" type="number" {...register('credits', { valueAsNumber: true, min: { value: 1, message: 'Credits must be at least 1.' } })} error={errors.credits?.message?.toString()} />
          <Select label="Department" options={departments.map((d: any) => ({ value: d.id, label: d.name }))} {...register('departmentId', { required: 'Department is required. Please select a department.' })} />
          <Input label="Max Students" type="number" {...register('maxStudents', { valueAsNumber: true, min: { value: 1, message: 'Maximum students must be at least 1.' } })} error={errors.maxStudents?.message?.toString()} />
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <Input label="Semester" {...register('semester', { required: 'Semester is required.' })} />
          <Input label="Year" type="number" {...register('year', { valueAsNumber: true, required: 'Year is required.' })} error={errors.year?.message?.toString()} />
          <Select label="Teacher" options={[
            { value: '', label: 'Unassigned' },
            ...teachers.map((teacher: any) => ({
              value: teacher.id,
              label: `${teacher.firstName} ${teacher.lastName}`,
            })),
          ]} {...register('teacherId')} />
        </div>
        <Input label="Schedule (JSON)" placeholder='[{"dayOfWeek": 1, "startTime": "10:00", "endTime": "11:30", "room": "101", "building": "Tech"}]' error={errors.schedule?.message?.toString()} {...register('schedule', { validate: (value) => { if (!value) return true; if (Array.isArray(value)) return true; try { const parsed = JSON.parse(value); return Array.isArray(parsed) || 'Schedule must be a JSON array.'; } catch { return 'Schedule must be valid JSON.'; } }, setValueAs: (value) => { if (!value) return undefined; try { return JSON.parse(value); } catch { return value; } } })} />
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>
        {serverError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" role="alert">{serverError}</p>}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{course ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

import { Textarea } from '../../components/ui/Input';