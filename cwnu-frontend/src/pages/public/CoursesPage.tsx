import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const courses = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript. Build responsive websites from scratch.',
    credits: 3,
    department: 'Computer Science',
    teacher: 'Dr. Sarah Chen',
    semester: 'Fall',
    year: 2026,
    schedule: 'Mon/Wed 10:00-11:30',
    room: 'Tech Building 101',
    maxStudents: 30,
    enrolled: 24,
    level: 'Beginner',
    tags: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
  },
  {
    id: '2',
    code: 'CS201',
    name: 'Data Structures & Algorithms',
    description: 'Master essential data structures and algorithms for efficient problem solving.',
    credits: 4,
    department: 'Computer Science',
    teacher: 'Prof. Michael Roberts',
    semester: 'Fall',
    year: 2026,
    schedule: 'Tue/Thu 14:00-15:30',
    room: 'Tech Building 205',
    maxStudents: 25,
    enrolled: 22,
    level: 'Intermediate',
    tags: ['Algorithms', 'Complexity Analysis', 'Trees', 'Graphs'],
  },
  {
    id: '3',
    code: 'DS101',
    name: 'Introduction to Data Science',
    description: 'Explore data analysis, visualization, and machine learning fundamentals with Python.',
    credits: 3,
    department: 'Data Science',
    teacher: 'Dr. Emily Watson',
    semester: 'Fall',
    year: 2026,
    schedule: 'Mon/Wed 13:00-14:30',
    room: 'Science Hall 301',
    maxStudents: 30,
    enrolled: 28,
    level: 'Beginner',
    tags: ['Python', 'Pandas', 'Data Cleaning', 'Visualization'],
  },
  {
    id: '4',
    code: 'DS201',
    name: 'Machine Learning Fundamentals',
    description: 'Build and deploy machine learning models. Supervised and unsupervised learning techniques.',
    credits: 4,
    department: 'Data Science',
    teacher: 'Prof. David Park',
    semester: 'Spring',
    year: 2027,
    schedule: 'Tue/Thu 10:00-11:30',
    room: 'Science Hall 210',
    maxStudents: 20,
    enrolled: 15,
    level: 'Advanced',
    tags: ['Regression', 'Classification', 'Model Tuning', 'Clustering'],
  },
  {
    id: '5',
    code: 'GD101',
    name: 'Graphic Design Principles',
    description: 'Learn design theory, typography, color theory, and composition for visual communication.',
    credits: 3,
    department: 'Design',
    teacher: 'Prof. Lisa Anderson',
    semester: 'Fall',
    year: 2026,
    schedule: 'Mon/Wed 09:00-10:30',
    room: 'Arts Building 150',
    maxStudents: 25,
    enrolled: 20,
    level: 'Beginner',
    tags: ['Typography', 'Color Theory', 'Layout', 'Branding'],
  },
  {
    id: '6',
    code: 'GD201',
    name: 'UI/UX Design',
    description: 'User-centered design process, wireframing, prototyping, and usability testing.',
    credits: 3,
    department: 'Design',
    teacher: 'Dr. James Wilson',
    semester: 'Spring',
    year: 2027,
    schedule: 'Tue/Thu 13:00-14:30',
    room: 'Arts Building 200',
    maxStudents: 20,
    enrolled: 12,
    level: 'Intermediate',
    tags: ['Figma', 'Prototyping', 'User Research', 'Accessibility'],
  },
];

const departments = ['All', 'Computer Science', 'Data Science', 'Design'];
const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export function CoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [level, setLevel] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState('');
  const { data: courseData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['public-courses'],
    queryFn: () => api.getCourses({ limit: 100 }),
  });
  const { data: enrollmentData } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: () => api.getEnrollments({ studentId: user?.id }),
    enabled: user?.role === 'student',
  });
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.enrollCourse(courseId),
    onSuccess: () => {
      setMessage('Enrollment request sent to Staff and Admin for review.');
      queryClient.invalidateQueries({ queryKey: ['my-enrollments', user?.id] });
    },
    onError: () => setMessage('Unable to submit enrollment request. Please try again.'),
  });
  const databaseCourses = courseData?.data?.data || [];
  const enrollmentByCourse = new Map((enrollmentData?.data || []).map((enrollment: any) => [enrollment.courseId, enrollment]));
  const displayCourses = databaseCourses.map((course: any) => {
    const catalogueCourse = courses.find((item) => item.code === course.code);
    return {
      ...catalogueCourse,
      ...course,
      department: course.department?.name || catalogueCourse?.department || 'Department not assigned',
      teacher: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Teacher not assigned',
      enrolled: course.enrolledCount || 0,
      schedule: catalogueCourse?.schedule || 'Schedule not assigned',
      room: catalogueCourse?.room || 'Room not assigned',
      level: catalogueCourse?.level || 'Not specified',
      tags: catalogueCourse?.tags || [],
    };
  });

  const filteredCourses = displayCourses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesDept = department === 'All' || course.department === department;
    const matchesLevel = level === 'All' || course.level === level;
    return matchesSearch && matchesDept && matchesLevel;
  });
  const hasActiveFilters = search.trim() !== '' || department !== 'All' || level !== 'All';

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-academic-navy via-academic-navy-light to-academic-dark" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-display-xl font-bold text-white mb-4">Our Courses</h1>
          <p className="text-body-lg text-gray-300 max-w-2xl mx-auto">
            Explore our comprehensive curriculum designed to prepare you for success in today's digital world.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-gray-100 bg-white py-8 dark:border-gray-800 dark:bg-gray-900 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {message && <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{message}</p>}
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Course catalogue</p>
              <h2 className="mt-1 text-heading-md font-semibold text-gray-900 dark:text-white">Find the right course for you</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{isCoursesLoading ? 'Loading courses...' : `${filteredCourses.length} of ${displayCourses.length} courses`}</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-soft dark:border-gray-700 dark:bg-gray-950/60 sm:p-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_10rem_auto] lg:items-end">
              <div className="col-span-2 min-w-0 lg:col-span-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Search</label>
                <Input
                  placeholder="Search by course name or keyword"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Department</label>
                <Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={departments.map((d) => ({ value: d, label: d }))}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Level</label>
                <Select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  options={levels.map((l) => ({ value: l, label: l }))}
                />
              </div>
              <div className="col-span-2 flex items-end justify-between gap-3 lg:col-span-1 lg:justify-end">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setDepartment('All');
                      setLevel('All');
                    }}
                    className="whitespace-nowrap pb-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Clear filters
                  </button>
                )}
                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    view === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  aria-label="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    view === 'list' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  aria-label="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses List */}
      <section className="section bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-lg font-semibold">All Courses ({filteredCourses.length})</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Showing {filteredCourses.length} of {displayCourses.length} courses</span>
            </div>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} enrollment={enrollmentByCourse.get(course.id)} canEnroll={user?.role === 'student'} onEnroll={() => enrollMutation.mutate(course.id)} isSubmitting={enrollMutation.isPending && enrollMutation.variables === course.id} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <CourseListItem key={course.id} course={course} />
              ))}
            </div>
          )}

          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-heading-md font-semibold mb-2">No courses found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CourseCard({ course, enrollment, canEnroll, onEnroll, isSubmitting }: { course: any; enrollment?: any; canEnroll: boolean; onEnroll: () => void; isSubmitting: boolean }) {
  const isFull = course.enrolled >= course.maxStudents;

  return (
    <Card variant="hover" className="group relative flex h-full min-h-[390px] flex-col overflow-hidden border-gray-200/80 p-0 dark:border-gray-800">
      <div className="h-1.5 bg-gradient-to-r from-primary-600 via-primary-500 to-academic-navy" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <Badge variant="info">{course.level}</Badge>
        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">{course.code}</span>
      </div>

      <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{course.name}</h3>
      <p className="mb-5 min-h-[3.25rem] flex-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{course.description}</p>

      <div className="mb-1 space-y-2.5 rounded-xl bg-gray-50/80 p-3.5 dark:bg-gray-950/60">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-gray-900 dark:text-primary-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg></span><span className="truncate">{course.schedule}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-gray-900 dark:text-primary-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg></span><span className="truncate">{course.room}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-gray-900 dark:text-primary-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg></span><span className="truncate">{course.teacher}</span>
        </div>
      </div>
      </div>

      <div className="border-t border-gray-100 p-5 dark:border-gray-800 sm:p-6">
      <div className="mb-4 flex min-h-7 flex-wrap gap-2">
        {course.tags.map((tag: string) => (
          <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="flex-1" to={`/courses/${course.id}`}><Button className="w-full" variant="outline" size="sm">View Details</Button></Link>
          {canEnroll && (enrollment ? <Badge variant={enrollment.status === 'APPROVED' ? 'success' : enrollment.status === 'REJECTED' ? 'danger' : 'warning'}>{enrollment.status}</Badge> : <Button className="flex-1" variant={isFull ? 'secondary' : 'primary'} size="sm" disabled={isFull || isSubmitting} isLoading={isSubmitting} onClick={onEnroll}>{isFull ? 'Full' : 'Enroll'}</Button>)}
        </div>
      </div>
    </Card>
  );
}

function CourseListItem({ course }: { course: any }) {
  return (
    <Card className="p-4 flex flex-col md:flex-row items-start md:items-center gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="info">{course.level}</Badge>
          <span className="text-sm font-mono text-gray-500">{course.code}</span>
          <h3 className="text-heading-md font-semibold">{course.name}</h3>
        </div>
        <p className="text-body text-gray-600 dark:text-gray-400 mb-3">{course.description}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {course.tags.map((tag: string) => (
            <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
            </svg>
            {course.schedule}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {course.room}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {course.teacher}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link to={`/courses/${course.id}`}>
          <Button variant="outline">View Details</Button>
        </Link>
      </div>
    </Card>
  );
}