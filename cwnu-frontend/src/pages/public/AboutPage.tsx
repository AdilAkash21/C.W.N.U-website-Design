import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

export function AboutPage() {
  const stats = [
    { value: '1941', label: 'Founded' },
    { value: '15,000+', label: 'Students' },
    { value: '500+', label: 'Faculty' },
    { value: '50+', label: 'Programs' },
  ];

  const values = [
    {
      title: 'Academic Excellence',
      description: 'We maintain the highest standards of teaching and research, fostering intellectual growth and critical thinking.',
      icon: 'award',
    },
    {
      title: 'Innovation',
      description: 'We embrace new ideas and technologies to prepare students for the challenges of tomorrow.',
      icon: 'lightbulb',
    },
    {
      title: 'Global Citizenship',
      description: 'We cultivate a diverse, inclusive community that values cultural understanding and social responsibility.',
      icon: 'globe',
    },
    {
      title: 'Integrity',
      description: 'We uphold the highest ethical standards in all our academic and professional endeavors.',
      icon: 'shield-check',
    },
  ];

  const leadership = [
    { name: 'Dr. James Chen', role: 'President', bio: 'Visionary leader with 30+ years in higher education administration.' },
    { name: 'Prof. Maria Rodriguez', role: 'Vice President, Academic Affairs', bio: 'Renowned researcher in computational biology and education reform.' },
    { name: 'Dr. Robert Kim', role: 'Vice President, Student Affairs', bio: 'Champion of student success and campus life innovation.' },
    { name: 'Prof. Sarah Johnson', role: 'Vice President, Research', bio: 'Leading expert in sustainable energy and interdisciplinary research.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-academic-navy via-academic-navy-light to-academic-dark" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-display-xl font-bold text-white mb-4">About CWNU</h1>
          <p className="text-body-lg text-gray-300 max-w-2xl mx-auto">
            Empowering minds and shaping futures since 1941. Discover our journey, values, and commitment to excellence.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section bg-gray-50 dark:bg-gray-900" aria-labelledby="mission-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="mission-title" className="text-display-md font-bold mb-6">Our Mission & Vision</h2>
              <div className="space-y-4 text-body text-gray-600 dark:text-gray-400">
                <p>
                  China West Normal University (CWNU) is a prestigious educational institution committed to excellence in teaching and research.
                  Our mission is to empower students with the knowledge and skills needed to succeed in a rapidly changing world.
                </p>
                <p>
                  We offer a wide range of programs in various fields, including technology, business, arts, and sciences.
                  Our faculty members are experts in their respective fields, dedicated to providing a supportive and engaging learning environment.
                </p>
                <p>
                  At CWNU, we believe in fostering innovation, critical thinking, and lifelong learning. Our graduates go on to become leaders
                  in their industries, making meaningful contributions to society.
                </p>
              </div>
              <Link to="/courses">
                <Button className="mt-6">Explore Our Programs</Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"
                alt="CWNU Campus"
                className="w-full rounded-2xl shadow-elevated"
              />
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-elevated max-w-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">98%</p>
                    <p className="text-body-sm text-gray-500 dark:text-gray-400">Graduation Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-academic-navy text-white" aria-labelledby="stats-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-5xl font-bold text-primary-400 mb-2">{stat.value}</div>
                <div className="text-body text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section" aria-labelledby="values-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="values-title" className="section-title">Our Core Values</h2>
            <p className="section-subtitle">The principles that guide everything we do</p>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card variant="hover" key={value.title} className="text-center p-8">
                <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                  {getValueIcon(value.icon)}
                </div>
                <h3 className="text-heading-md font-semibold mb-2">{value.title}</h3>
                <p className="text-body text-gray-600 dark:text-gray-400">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section bg-gray-50 dark:bg-gray-900" aria-labelledby="leadership-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="leadership-title" className="section-title">University Leadership</h2>
            <p className="section-subtitle">Meet the team guiding our institution</p>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((leader) => (
              <Card variant="hover" key={leader.name} className="text-center p-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.908 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-heading-sm font-semibold">{leader.name}</h3>
                <p className="text-body-sm text-primary-600 dark:text-primary-400 mb-2">{leader.role}</p>
                <p className="text-body-sm text-gray-600 dark:text-gray-400">{leader.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="section" aria-labelledby="history-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="history-title" className="section-title">Our History</h2>
            <p className="section-subtitle">Key milestones in our journey</p>
          </header>

          <div className="max-w-3xl mx-auto">
            <Timeline />
          </div>
        </div>
      </section>
    </div>
  );
}

function Timeline() {
  const events = [
    { year: '1941', title: 'University Founded', description: 'China West Normal University established as a teacher training college.' },
    { year: '1960', title: 'Expanded Programs', description: 'Added liberal arts and sciences programs, becoming a comprehensive university.' },
    { year: '1985', title: 'Graduate School Established', description: 'Launched master\'s and doctoral programs across multiple disciplines.' },
    { year: '2000', title: 'Digital Transformation', description: 'Pioneered online learning and digital campus initiatives.' },
    { year: '2015', title: 'Global Partnerships', description: 'Established 100+ international partnerships for student exchange and research.' },
    { year: '2024', title: 'Innovation Hub Opened', description: 'State-of-the-art research and entrepreneurship center inaugurated.' },
  ];

  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
      <div className="space-y-8">
        {events.map((event, index) => (
          <div key={event.year} className="relative pl-16">
            <div className="absolute left-8 top-1 w-3 h-3 rounded-full bg-primary-600 border-4 border-white dark:border-gray-900 shadow-lg" aria-hidden="true" />
            <div className="absolute left-4 top-1 text-right w-12 text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">
              {event.year}
            </div>
            <Card className="p-6">
              <h3 className="text-heading-sm font-semibold mb-1">{event.title}</h3>
              <p className="text-body text-gray-600 dark:text-gray-400">{event.description}</p>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function getValueIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    award: (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    lightbulb: (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    globe: (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    'shield-check': (
      <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[name] || icons.award;
}