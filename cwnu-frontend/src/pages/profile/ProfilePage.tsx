import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[a-z]/, 'Must contain at least one lowercase letter').regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    login: <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>,
    course_enroll: <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    assignment_submit: <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>,
    grade_received: <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    profile_update: <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    password_change: <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  };
  return icons[type] || icons.login;
};

const getActivityLabel = (type: string) => {
  const labels: Record<string, string> = {
    login: 'Sign In',
    course_enroll: 'Course Enrollment',
    course_drop: 'Course Drop',
    assignment_submit: 'Assignment Submitted',
    grade_received: 'Grade Received',
    attendance_recorded: 'Attendance Recorded',
    profile_update: 'Profile Updated',
    password_change: 'Password Changed',
    notice_view: 'Notice Viewed',
  };
  return labels[type] || type;
};

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    login: 'bg-blue-100 dark:bg-blue-900/30',
    course_enroll: 'bg-green-100 dark:bg-green-900/30',
    assignment_submit: 'bg-purple-100 dark:bg-purple-900/30',
    grade_received: 'bg-yellow-100 dark:bg-yellow-900/30',
    profile_update: 'bg-gray-100 dark:bg-gray-800',
    password_change: 'bg-red-100 dark:bg-red-900/30',
  };
  return colors[type] || 'bg-gray-100 dark:bg-gray-800';
};

void getActivityIcon;
void getActivityLabel;
void getActivityColor;

export function ProfilePage() {
  const { user, updateProfile, uploadAvatar, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { data: teacherDashboard } = useQuery({
    queryKey: ['teacher-profile-summary', user?.id],
    queryFn: () => api.getTeacherDashboard(),
    enabled: user?.role === 'teacher',
  });
  const teacherCourses = teacherDashboard?.data?.courses || [];
  const pendingEnrollments = teacherDashboard?.data?.pendingEnrollments || [];
  const recentGradedSubmissions = teacherDashboard?.data?.recentGradedSubmissions || [];
  const teacherStudents = teacherCourses.reduce((total, course) => total + (course.enrolledCount || 0), 0);
  const profileFields = [user?.firstName, user?.lastName, user?.email, user?.phone, user?.dateOfBirth, user?.address, user?.bio];
  const completion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      address: user?.address || '',
      bio: user?.bio || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
        address: user.address || '',
        bio: user.bio || '',
      });
    }
  }, [user, reset]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      await refreshUser();
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      alert('Password changed successfully!');
      resetPassword();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarPreview(url);
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const avatarSrc = avatarPreview || user?.avatar;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 p-6 text-white shadow-elevated sm:p-8">
        <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-2">
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-blue-100 transition-colors hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Account center</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your profile</h1>
          <p className="max-w-xl text-sm text-blue-100 sm:text-base">Keep your personal information, security, and account activity in one place.</p>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="overflow-hidden p-0" variant="elevated">
            <div className="h-24" />
            <div className="-mt-10 flex flex-col items-center px-6 pb-6 text-center sm:flex-row sm:items-end sm:text-left lg:flex-col lg:items-center lg:text-center">
              <div className="relative shrink-0">
                <Avatar src={avatarSrc} name={`${user?.firstName} ${user?.lastName}`} size="2xl" />
                <label className="absolute bottom-0 right-0 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="sr-only"
                  disabled={isUploadingAvatar}
                />
                  <div className={cn(
                  'w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center border-4 border-white dark:border-gray-900',
                  'hover:bg-primary-700 transition-colors cursor-pointer',
                  isUploadingAvatar && 'opacity-50 cursor-wait'
                )}>
                  {isUploadingAvatar ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  )}
                  </div>
                </label>
              </div>
              <div className="mt-3 min-w-0 sm:ml-4 sm:mt-0 lg:ml-0 lg:mt-3">
              <h2 className="text-heading-md font-semibold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
              </h2>
              <p className="mt-1 truncate text-body-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <Badge variant="info" className="mt-3 capitalize">{user?.role}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Profile completion</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add details to personalize your account</p>
              </div>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{completion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
            <div className="mt-5 space-y-1 border-t border-gray-100 pt-4 dark:border-gray-800">
              {user?.role === 'teacher' ? (
                <>
                  <StatRow label="Assigned Courses" value={teacherDashboard ? String(teacherCourses.length) : '—'} />
                  <StatRow label="Enrolled Students" value={teacherDashboard ? String(teacherStudents) : '—'} />
                  <StatRow label="Pending Requests" value={teacherDashboard ? String(pendingEnrollments.length) : '—'} />
                  <StatRow label="Recently Graded" value={teacherDashboard ? String(recentGradedSubmissions.length) : '—'} />
                </>
              ) : (
                <p className="py-2 text-sm text-gray-500 dark:text-gray-400">Learning statistics will appear here once real records are available.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card className="p-6 sm:p-8">
                <div className="mb-7 border-b border-gray-100 pb-5 dark:border-gray-800">
                  <h2 className="text-heading-lg font-semibold text-gray-900 dark:text-white">Personal information</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update the details connected to your {user?.role || 'user'} account.</p>
                </div>
                <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6" noValidate>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
                    <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
                  </div>
                  <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                  <Input label="Phone" type="tel" placeholder="+86 123 456 7890" error={errors.phone?.message} {...register('phone')} />
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
                    <Select
                      label="Role"
                      options={[
                        { value: 'student', label: 'Student' },
                        { value: 'teacher', label: 'Teacher' },
                        { value: 'staff', label: 'Staff' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      disabled
                      value={user?.role || ''}
                    />
                  </div>
                  <Input label="Address" placeholder="Street, City, Country" error={errors.address?.message} {...register('address')} />
                  <Textarea label="Bio" placeholder="Tell us about yourself..." rows={4} error={errors.bio?.message} {...register('bio')} />
                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
                  </div>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card className="p-6">
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6" noValidate>
                  <h3 className="text-heading-md font-semibold border-b border-gray-100 dark:border-gray-800 pb-4">Change Password</h3>
                  <Input
                    label="Current Password"
                    type="password"
                    error={passwordErrors.currentPassword?.message}
                    autoComplete="current-password"
                    {...registerPassword('currentPassword')}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
                      New Password
                    </label>
                    <Input
                      type="password"
                      error={passwordErrors.newPassword?.message}
                      autoComplete="new-password"
                      {...registerPassword('newPassword')}
                    />
                    <div className="mt-2 space-y-1">
                      <PasswordRequirement met={(watchPassword('newPassword') || '').length >= 8}>At least 8 characters</PasswordRequirement>
                      <PasswordRequirement met={/[A-Z]/.test(watchPassword('newPassword') || '')}>One uppercase letter</PasswordRequirement>
                      <PasswordRequirement met={/[a-z]/.test(watchPassword('newPassword') || '')}>One lowercase letter</PasswordRequirement>
                      <PasswordRequirement met={/[0-9]/.test(watchPassword('newPassword') || '')}>One number</PasswordRequirement>
                    </div>
                  </div>
                  <Input
                    label="Confirm New Password"
                    type="password"
                    error={passwordErrors.confirmPassword?.message}
                    autoComplete="new-password"
                    {...registerPassword('confirmPassword')}
                  />
                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="submit" variant="primary" isLoading={isSubmittingPassword}>Change Password</Button>
                  </div>
                </form>

                <div className="mt-8">
                  <h3 className="text-heading-md font-semibold border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">Danger Zone</h3>
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">Delete Account</p>
                      <p className="text-sm text-red-600 dark:text-red-500">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="danger">Delete Account</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="p-8 text-center">
                    <p className="font-medium text-gray-900 dark:text-white">No activity history available</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Account activity will appear here when activity tracking is connected.</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function PasswordRequirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <svg className={cn('w-4 h-4 flex-shrink-0', met ? 'text-green-500' : 'text-gray-300 dark:text-gray-600')} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        {met ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />}
      </svg>
      <span className={cn(met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')}>{children}</span>
    </div>
  );
}