import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

export function HomePage() {
  const courses = [
    {
      title: 'Web Development',
      description: 'Learn how to build websites from scratch using HTML, CSS, and JavaScript. Master modern frameworks like React, Vue, and Next.js.',
      icon: 'code',
    },
    {
      title: 'Data Science',
      description: 'Explore the world of data analysis and machine learning with Python. Work with real datasets and build predictive models.',
      icon: 'chart-bar',
    },
    {
      title: 'Graphic Design',
      description: 'Unleash your creativity with our graphic design course using Adobe tools. Learn UI/UX design, branding, and visual communication.',
      icon: 'palette',
    },
  ];

  const facilities = [
    {
      title: 'World Class Library',
      description: 'A vast collection of books, journals, and digital resources for all students\' academic needs.',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
    },
    {
      title: 'Tasty and Healthy Meals',
      description: 'A variety of nutritious meals to keep our students energized throughout the day.',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
    },
    {
      title: 'Sports Club',
      description: 'A spacious and modern basketball court, gym, and sports facilities for students to enjoy.',
      image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop',
    },
  ];

  const testimonials = [
    {
      name: 'Adil Akash',
      role: 'Web Development Student',
      content: 'The courses offered at CWNU are top-notch! I\'ve learned so much and feel ready to start my career.',
      rating: 4,
      avatar: null,
    },
    {
      name: 'Sakil Ahmed',
      role: 'Data Science Graduate',
      content: 'The faculty is incredibly supportive and the campus is beautiful. I couldn\'t ask for a better university experience.',
      rating: 4.5,
      avatar: null,
    },
    {
      name: 'Priya Sharma',
      role: 'Graphic Design Student',
      content: 'The hands-on projects and industry connections helped me build an impressive portfolio before graduation.',
      rating: 5,
      avatar: null,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-academic-navy via-academic-navy-light to-academic-dark" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 text-primary-400 text-sm font-medium mb-6 animate-slide-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              Fall 2026 Admissions Open
            </div>

            <h1 className="text-display-xl font-bold text-white mb-6 animate-slide-up animate-delay-100">
              Welcome to <span className="text-primary-400">CWNU</span>
            </h1>
            <p className="text-body-lg text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up animate-delay-200">
              China West Normal University — Empowering minds, shaping futures. A premier institution for academic excellence, innovation, and global citizenship.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-300">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Apply Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  Explore Programs
                </Button>
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 animate-slide-up animate-delay-400">
              <StatItem value="15,000+" label="Students" />
              <StatItem value="500+" label="Faculty" />
              <StatItem value="50+" label="Programs" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Courses Section */}
      <section className="section bg-gray-50 dark:bg-gray-900" aria-labelledby="courses-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="courses-title" className="section-title">Our Academic Programs</h2>
            <p className="section-subtitle">Discover world-class programs designed to prepare you for the future</p>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <Card variant="hover" key={course.title} className="group">
                <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {getCourseIcon(course.icon)}
                </div>
                <h3 className="text-heading-md font-semibold mb-2">{course.title}</h3>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
                <Link to="/courses" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/courses">
              <Button variant="secondary" size="lg">View All Programs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="section" aria-labelledby="facilities-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="facilities-title" className="section-title">Campus Facilities</h2>
            <p className="section-subtitle">State-of-the-art facilities to enhance your learning experience</p>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {facilities.map((facility, index) => (
              <Card variant="hover" key={facility.title} className="overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={facility.image}
                    alt={facility.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-heading-md font-semibold mb-2">{facility.title}</h3>
                  <p className="text-body text-gray-600 dark:text-gray-400">{facility.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section bg-gray-50 dark:bg-gray-900" aria-labelledby="testimonials-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="testimonials-title" className="section-title">What Our Students Say</h2>
            <p className="section-subtitle">Real stories from our community</p>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card variant="hover" key={testimonial.name}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.floor(testimonial.rating)
                          ? 'text-yellow-400 fill-current'
                          : i < testimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-body-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section relative overflow-hidden" aria-labelledby="cta-title">
        <div className="absolute inset-0 bg-gradient-to-r from-academic-navy via-academic-navy-light to-academic-dark" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80')] bg-cover bg-center opacity-10" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-title" className="text-display-lg font-bold text-white mb-4">Ready to Join Us?</h2>
          <p className="text-body-lg text-gray-300 mb-8 max-w-2xl mx-auto">Take the first step towards your future and become part of the CWNU community today.</p>
          <Link to="/contact">
            <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-bold text-white mb-1">{value}</div>
      <div className="text-body text-gray-300">{label}</div>
    </div>
  );
}

function getCourseIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    code: (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    'chart-bar': (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    palette: (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17a.002.002 0 01-.002-.002z" />
      </svg>
    ),
  };
  return icons[name] || icons.code;
}