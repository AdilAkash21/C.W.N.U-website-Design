import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.getDashboardStats('admin'),
    enabled: !!user,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers({ limit: 5 }),
    enabled: !!user,
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.getCourses({ limit: 5 }),
    enabled: !!user,
  });

  const statCards = [
    { label: 'Total Students', value: stats?.data?.totalStudents || '2,847', change: '+12%', icon: 'graduation', color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats?.data?.totalTeachers || '156', change: '+3%', icon: 'chalkboard', color: 'bg-green-500' },
    { label: 'Total Staff', value: stats?.data?.totalStaff || '89', change: '+1%', icon: 'briefcase', color: 'bg-purple-500' },
    { label: 'Active Courses', value: courses?.data?.data?.length || '42', change: '+5%', icon: 'book', color: 'bg-orange-500' },
  ];

  const getStatIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      graduation: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>,
      chalkboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
      briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
      book: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    };
    return icons[name] || icons.book;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">
            System overview and administrative controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change} vs last month</p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                {getStatIcon(stat.icon)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">System Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="User Registrations" value="23" subtitle="This week" icon="user-plus" color="blue" />
              <MetricCard label="Course Enrollments" value="156" subtitle="This week" icon="book-plus" color="green" />
              <MetricCard label="Assignments Submitted" value="89" subtitle="Today" icon="upload" color="purple" />
              <MetricCard label="Support Tickets" value="7" subtitle="Open" icon="ticket" color="orange" />
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Link to="/admin/users/new"><Button variant="outline">Add User</Button></Link>
                <Link to="/admin/courses/new"><Button variant="outline">Create Course</Button></Link>
                <Link to="/admin/departments/new"><Button variant="outline">Add Department</Button></Link>
                <Link to="/admin/notices/new"><Button variant="outline">Post Notice</Button></Link>
                <Link to="/admin/reports"><Button variant="outline">Generate Report</Button></Link>
                <Link to="/admin/settings"><Button variant="outline">Settings</Button></Link>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent Activity</h2>
            <Link to="/admin/activity" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { action: 'New user registered', user: 'John Smith', time: '2 min ago', type: 'user' },
              { action: 'Course created', user: 'CS301 - Advanced Algorithms', time: '15 min ago', type: 'course' },
              { action: 'Grade submitted', user: 'Prof. Wilson → Jane Doe', time: '1 hour ago', type: 'grade' },
              { action: 'Notice published', user: 'Fall 2026 Registration Open', time: '3 hours ago', type: 'notice' },
              { action: 'Department updated', user: 'Computer Science', time: '5 hours ago', type: 'department' },
            ].map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.user} • {activity.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent Users</h2>
            <Link to="/admin/users" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {users?.data?.data?.map((u: any) => (
              <div key={u.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">{u.role}</Badge>
                  <Badge variant={u.isActive ? 'success' : 'gray'} size="sm">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent Courses</h2>
            <Link to="/admin/courses" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {courses?.data?.data?.map((c: any) => (
              <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <h3 className="font-medium text-gray-900 dark:text-white">{c.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.code} • {c.department?.name} • {c.enrolledCount}/{c.maxStudents}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtitle, icon, color }: { label: string; value: string | number; subtitle: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  const icons: Record<string, React.ReactNode> = {
    'user-plus': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>,
    'book-plus': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    upload: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>,
    ticket: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
          {icons[icon]}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}