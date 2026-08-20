import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';
import { formatDate, getInitials, cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';

const stats = [
  { label: 'Enrolled Courses', value: '5', icon: 'book', color: 'bg-blue-500' },
  { label: 'Upcoming Assignments', value: '3', icon: 'clipboard', color: 'bg-yellow-500' },
  { label: 'Current GPA', value: '3.72', icon: 'award', color: 'bg-green-500' },
  { label: 'Attendance Rate', value: '94%', icon: 'calendar-check', color: 'bg-purple-500' },
];

const getStatIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    book: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
    award: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    'calendar-check': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  };
  return icons[name] || icons.book;
};

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => api.getEnrollments({ studentId: user?.id, status: 'approved' }),
    enabled: !!user,
  });

  const { data: upcomingAssignments } = useQuery({
    queryKey: ['upcoming-assignments', user?.id],
    queryFn: () => api.getAssignments(),
    enabled: !!user,
  });

  const { data: recentGrades } = useQuery({
    queryKey: ['recent-grades', user?.id],
    queryFn: () => api.getEnrollments({ studentId: user?.id, status: 'completed' }),
    enabled: !!user,
  });

  const currentCourses = enrollments?.data?.slice(0, 4) || [];
  const assignments = upcomingAssignments?.data?.slice(0, 5) || [];
  const grades = recentGrades?.data?.slice(0, 4) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your courses today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/courses">
            <Button variant="primary">View All Courses</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                {getStatIcon(stat.icon)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Current Courses & Upcoming Assignments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Courses */}
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Current Courses</h2>
            <Link to="/dashboard/courses" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentCourses.length > 0 ? (
              currentCourses.map((enrollment: any) => (
                <Link key={enrollment.id} to={`/dashboard/courses/${enrollment.courseId}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{enrollment.course?.name || 'Course'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course?.code} • {enrollment.course?.teacher?.firstName} {enrollment.course?.teacher?.lastName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success" size="sm">Active</Badge>
                      <span className="text-xs text-gray-400">{enrollment.course?.schedule}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <p className="text-gray-500 dark:text-gray-400">No courses enrolled yet</p>
                <Link to="/courses" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">Browse Courses</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Upcoming Assignments</h2>
            <Link to="/dashboard/assignments" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {assignments.length > 0 ? (
              assignments.map((assignment: any) => (
                <div key={assignment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{assignment.course?.name} • Due {formatDate(assignment.dueAt)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info" size="sm">{assignment.type}</Badge>
                        <Badge variant="gray" size="sm">{assignment.maxPoints} pts</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Link to={`/dashboard/assignments/${assignment.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                <p className="text-gray-500 dark:text-gray-400">No upcoming assignments</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Grades & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent Grades</h2>
            <Link to="/dashboard/grades" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {grades.length > 0 ? (
              grades.map((enrollment: any) => (
                <div key={enrollment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{enrollment.course?.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course?.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{enrollment.grade || '—'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.gradePoints?.toFixed(2)} GPA pts</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <p className="text-gray-500 dark:text-gray-400">No grades yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-heading-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <Link to="/courses" className="block">
              <Button variant="secondary" className="w-full justify-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Browse Courses</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Find and enroll in new courses</p>
                </div>
              </Button>
            </Link>
            <Link to="/dashboard/assignments" className="block">
              <Button variant="secondary" className="w-full justify-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">View Assignments</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check upcoming deadlines</p>
                </div>
              </Button>
            </Link>
            <Link to="/dashboard/schedule" className="block">
              <Button variant="secondary" className="w-full justify-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">My Schedule</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View weekly class schedule</p>
                </div>
              </Button>
            </Link>
            <Link to="/dashboard/attendance" className="block">
              <Button variant="secondary" className="w-full justify-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Attendance</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check attendance records</p>
                </div>
              </Button>
            </Link>
            <Link to="/profile" className="block">
              <Button variant="secondary" className="w-full justify-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Profile Settings</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your information</p>
                </div>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}