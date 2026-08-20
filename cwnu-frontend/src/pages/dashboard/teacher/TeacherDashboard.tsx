import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';
import { formatDate, cn } from '../../../utils/cn';
import { useAuth } from '../../../context/AuthContext';

export function TeacherDashboard() {
  const { user } = useAuth();

  const { data: courses } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: () => api.getCourses({ teacherId: user?.id }),
    enabled: !!user,
  });

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', user?.id],
    queryFn: () => api.getAssignments(),
    enabled: !!user,
  });

  const myCourses = courses?.data?.data || [];
  const myAssignments = assignments?.data?.filter((a: any) => a.course?.teacherId === user?.id).slice(0, 5) || [];

  const stats = [
    { label: 'Active Courses', value: myCourses.length, icon: 'book', color: 'bg-blue-500' },
    { label: 'Total Students', value: myCourses.reduce((sum: number, c: any) => sum + (c.enrolledCount || 0), 0), icon: 'users', color: 'bg-green-500' },
    { label: 'Pending Grading', value: myAssignments.filter((a: any) => a.submissions?.some((s: any) => s.status === 'submitted')).length, icon: 'clipboard', color: 'bg-yellow-500' },
    { label: 'This Week\'s Classes', value: '12', icon: 'calendar', color: 'bg-purple-500' },
  ];

  const getStatIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      book: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
      users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
      clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
      calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    };
    return icons[name] || icons.book;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-gray-900 dark:text-white">
            Welcome, Professor {user?.lastName}!
          </h1>
          <p className="text-body text-gray-600 dark:text-gray-400 mt-1">
            Manage your courses, assignments, and students.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/courses/new">
            <Button variant="primary">Create Course</Button>
          </Link>
        </div>
      </div>

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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">My Courses</h2>
            <Link to="/dashboard/courses" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {myCourses.length > 0 ? (
              myCourses.map((course: any) => (
                <Link key={course.id} to={`/dashboard/courses/${course.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} • {course.semester} {course.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="info" size="sm">{course.enrolledCount}/{course.maxStudents}</Badge>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No courses assigned</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-heading-lg font-semibold">Recent Assignments</h2>
            <Link to="/dashboard/assignments" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {myAssignments.length > 0 ? (
              myAssignments.map((assignment: any) => (
                <div key={assignment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{assignment.course?.name} • Due {formatDate(assignment.dueAt)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info" size="sm">{assignment.type}</Badge>
                        <Badge variant="gray" size="sm">{assignment.maxPoints} pts</Badge>
                      </div>
                    </div>
                    <Link to={`/dashboard/assignments/${assignment.id}/grade`}>
                      <Button variant="ghost" size="sm">Grade</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No assignments created</p>
                <Link to="/dashboard/assignments/new" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">Create Assignment</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Link to="/dashboard/attendance" className="block">
          <Card variant="hover" className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Take Attendance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mark attendance for today's classes</p>
          </Card>
        </Link>
        <Link to="/dashboard/grades" className="block">
          <Card variant="hover" className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Grade Submissions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and grade student work</p>
          </Card>
        </Link>
        <Link to="/dashboard/schedule" className="block">
          <Card variant="hover" className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your teaching schedule</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}