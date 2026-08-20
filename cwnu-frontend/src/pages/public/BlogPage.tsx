import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const blogPosts = [
  {
    id: '1',
    title: 'Certificate in Full Stack Web Development',
    excerpt: 'This immersive and project-driven program is designed to take you from a beginner to a job-ready full-stack developer.',
    content: `
      <h3>Program Overview</h3>
      <p>This comprehensive certificate equips you with the technical prowess to handle both client-side (front-end) and server-side (back-end) development. You will learn to create responsive user interfaces, architect robust server logic, manage databases, and deploy fully functional web applications.</p>
      
      <h3>Detailed Course Curriculum</h3>
      <p>The program is divided into five core modules, each building upon the last to form a complete skill set.</p>
      
      <h3>Foundations of Front-End Development</h3>
      <p>Objective: Learn to structure and style static web pages with interactive elements.</p>
      <ul>
        <li><strong>HTML5:</strong> Semantic HTML, forms, tables, accessibility best practices, and SEO fundamentals.</li>
        <li><strong>CSS3:</strong> Box model, flexbox, CSS grid, responsive design (media queries), transitions, animations, and custom properties (CSS variables).</li>
        <li><strong>JavaScript Fundamentals:</strong> Variables, data types, functions, loops, control flow, and DOM manipulation.</li>
        <li><strong>Tools & Environment Setup:</strong> Code editors (VS Code), browser developer tools, and Git for version control.</li>
      </ul>
      
      <h3>Advanced Front-End Development</h3>
      <p>Objective: Build complex, performant, and maintainable user interfaces.</p>
      <ul>
        <li><strong>React.js:</strong> Components, hooks, state management, context API, and performance optimization.</li>
        <li><strong>TypeScript:</strong> Static typing, interfaces, generics, and advanced type patterns.</li>
        <li><strong>State Management:</strong> Redux Toolkit, React Query, and modern data fetching patterns.</li>
        <li><strong>Testing:</strong> Unit testing with Vitest, integration testing with React Testing Library.</li>
      </ul>
    `,
    category: 'Web Development',
    author: 'Dr. Sarah Chen',
    authorRole: 'Professor, Computer Science',
    date: 'Jun 29, 2026',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    featured: true,
  },
  {
    id: '2',
    title: 'The Future of AI in Education',
    excerpt: 'How artificial intelligence is transforming the way we teach and learn at universities worldwide.',
    content: '<p>Content for AI in education article...</p>',
    category: 'Technology',
    author: 'Prof. Michael Roberts',
    authorRole: 'Dean, School of Engineering',
    date: 'Jun 15, 2026',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    featured: false,
  },
  {
    id: '3',
    title: 'Building a Data Science Portfolio That Gets You Hired',
    excerpt: 'Essential projects and skills to showcase in your data science portfolio to stand out to employers.',
    content: '<p>Content for data science portfolio article...</p>',
    category: 'Data Science',
    author: 'Dr. Emily Watson',
    authorRole: 'Associate Professor, Data Science',
    date: 'Jun 10, 2026',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    featured: false,
  },
  {
    id: '4',
    title: 'Design Systems: Creating Consistent User Experiences',
    excerpt: 'Learn how to build and maintain design systems that scale across products and teams.',
    content: '<p>Content for design systems article...</p>',
    category: 'Design',
    author: 'Prof. Lisa Anderson',
    authorRole: 'Head of Design Department',
    date: 'Jun 5, 2026',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    featured: false,
  },
  {
    id: '5',
    title: 'Cybersecurity Fundamentals for Every Developer',
    excerpt: 'Essential security practices every developer should know to protect applications and data.',
    content: '<p>Content for cybersecurity article...</p>',
    category: 'Security',
    author: 'Dr. James Wilson',
    authorRole: 'Cybersecurity Researcher',
    date: 'May 28, 2026',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    featured: false,
  },
  {
    id: '6',
    title: 'The Rise of Low-Code Development Platforms',
    excerpt: 'Exploring how low-code tools are democratizing software development and changing the industry.',
    content: '<p>Content for low-code article...</p>',
    category: 'Technology',
    author: 'Prof. David Park',
    authorRole: 'Visiting Faculty, Computer Science',
    date: 'May 20, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    featured: false,
  },
];

const categories = [
  { name: 'Web Development', count: 29 },
  { name: 'Data Science', count: 31 },
  { name: 'Design', count: 25 },
  { name: 'Technology', count: 35 },
  { name: 'Security', count: 32 },
  { name: 'Machine Learning', count: 37 },
  { name: 'Career', count: 41 },
  { name: 'Research', count: 22 },
];

export function BlogPage() {
  const featuredPost = blogPosts.find(p => p.featured);
  const regularPosts = blogPosts.filter(p => !p.featured);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-academic-navy via-academic-navy-light to-academic-dark" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 text-primary-400 text-sm font-medium mb-6">
            CWNU Blog
          </span>
          <h1 className="text-display-xl font-bold text-white mb-4">Insights & Resources</h1>
          <p className="text-body-lg text-gray-300 max-w-2xl mx-auto">
            Explore articles on web development, data science, design, technology, and more from our faculty and students.
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="section bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Featured Post */}
              {featuredPost && (
                <article className="relative">
                  <Card variant="hover" className="overflow-hidden">
                    <div className="relative h-64">
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="danger">Featured</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {featuredPost.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {featuredPost.readTime}
                        </span>
                        <Badge variant="info">{featuredPost.category}</Badge>
                      </div>
                      <h2 className="text-display-sm font-bold mb-3">{featuredPost.title}</h2>
                      <p className="text-body text-gray-600 dark:text-gray-400 mb-4">{featuredPost.excerpt}</p>
                      <Link to={`/blog/${featuredPost.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all">
                        Read more
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </Card>
                </article>
              )}

              {/* Regular Posts */}
              <div className="grid md:grid-cols-2 gap-6">
                {regularPosts.map((post) => (
                  <article key={post.id}>
                    <Card variant="hover" className="overflow-hidden h-full flex flex-col">
                      <div className="relative h-48">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="info">{post.category}</Badge>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {post.readTime}
                          </span>
                        </div>
                        <h3 className="text-heading-md font-semibold mb-2 flex-1">{post.title}</h3>
                        <p className="text-body text-gray-600 dark:text-gray-400 mb-4 flex-1">{post.excerpt}</p>
                        <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all">
                          Read more
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </Card>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2">
                <button className="btn btn-secondary btn-sm" disabled>Previous</button>
                <button className="btn btn-primary btn-sm">1</button>
                <button className="btn btn-secondary btn-sm">2</button>
                <button className="btn btn-secondary btn-sm">3</button>
                <span className="px-3 text-gray-400">...</span>
                <button className="btn btn-secondary btn-sm">10</button>
                <button className="btn btn-secondary btn-sm">Next</button>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-24">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-heading-md font-semibold">Categories</h3>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800" role="list">
                  {categories.map((cat) => (
                    <li key={cat.name}>
                      <Link to={`/blog?category=${cat.name.toLowerCase()}`} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{cat.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="mt-6 sticky top-24" style={{ top: 'calc(24rem + 1.5rem)' }}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-heading-md font-semibold">Newsletter</h3>
                </div>
                <div className="p-6">
                  <p className="text-body text-gray-600 dark:text-gray-400 mb-4">
                    Stay updated with our latest articles, research, and campus news.
                  </p>
                  <form className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      label="Email"
                    />
                    <Button className="w-full">Subscribe</Button>
                  </form>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}