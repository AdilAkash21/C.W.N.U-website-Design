import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const courses = [
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
    tags: ['HTML', 'CSS', 'JavaScript', 'React'],
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
    tags: ['Python', 'Algorithms', 'Complexity'],
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
    tags: ['Python', 'Pandas', 'Visualization', 'ML Basics'],
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
    tags: ['Scikit-learn', 'TensorFlow', 'Neural Networks'],
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
    tags: ['Typography', 'Color Theory', 'Layout', 'Figma'],
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
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [level, setLevel] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesDept = department === 'All' || course.department === department;
    const matchesLevel = level === 'All' || course.level === level;
    return matchesSearch && matchesDept && matchesLevel;
  });

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
      <section className="section bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departments.map((d) => ({ value: d, label: d }))}
                className="w-48"
              />
              <Select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                options={levels.map((l) => ({ value: l, label: l }))}
                className="w-48"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setView('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    view === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  aria-label="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
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
      </section>

      {/* Courses List */}
      <section className="section bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-lg font-semibold">All Courses ({filteredCourses.length})</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Showing {filteredCourses.length} of {courses.length} courses</span>
            </div>
          </div>

          {view === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
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

function CourseCard({ course }: { course: typeof courses[0] }) {
  const isFull = course.enrolled >= course.maxStudents;

  return (
    <Card variant="hover" className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <Badge variant="info">{course.level}</Badge>
        <span className="text-sm font-mono text-gray-500">{course.code}</span>
      </div>

      <h3 className="text-heading-md font-semibold mb-2">{course.name}</h3>
      <p className="text-body text-gray-600 dark:text-gray-400 mb-4 flex-1">{course.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{course.schedule}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{course.room}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{course.teacher}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {course.tags.map((tag) => (
          <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${(course.enrolled / course.maxStudents) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {course.enrolled}/{course.maxStudents}
          </span>
        </div>
        <Link to={`/courses/${course.id}`}>
          <Button variant={isFull ? 'secondary' : 'primary'} size="sm" disabled={isFull}>
            {isFull ? 'Waitlist' : 'Enroll'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function CourseListItem({ course }: { course: typeof courses[0] }) {
  const isFull = course.enrolled >= course.maxStudents;

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
          {course.tags.map((tag) => (
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
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {course.enrolled}/{course.maxStudents}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link to={`/courses/${course.id}`}>
          <Button variant={isFull ? 'secondary' : 'primary'} disabled={isFull}>
            {isFull ? 'Waitlist' : 'View Details'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}