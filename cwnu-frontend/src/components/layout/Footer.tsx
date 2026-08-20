import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const footerLinks = {
  university: [
    { name: 'About Us', href: '/about' },
    { name: 'Courses', href: '/courses' },
    { name: 'Faculty', href: '/faculty' },
    { name: 'Research', href: '/research' },
    { name: 'Admissions', href: '/admissions' },
  ],
  resources: [
    { name: 'Library', href: '/library' },
    { name: 'Student Portal', href: '/portal' },
    { name: 'Career Services', href: '/career' },
    { name: 'Alumni Network', href: '/alumni' },
    { name: 'Blog', href: '/blog' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Accessibility', href: '/accessibility' },
  ],
};

const socialLinks = [
  { name: 'Facebook', href: '#', icon: 'facebook' },
  { name: 'Twitter', href: '#', icon: 'twitter' },
  { name: 'Instagram', href: '#', icon: 'instagram' },
  { name: 'LinkedIn', href: '#', icon: 'linkedin' },
  { name: 'YouTube', href: '#', icon: 'youtube' },
];

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2" aria-label="CWNU Home">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                  <path d="M5 13.18v4L12 21l7-3.82v-4" />
                  <path d="M12 3v18" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl text-gray-900 dark:text-white">CWNU</span>
            </Link>
            <p className="mt-4 text-body text-gray-600 dark:text-gray-400 max-w-xs">
              China West Normal University - Empowering minds, shaping futures. A premier institution for academic excellence and innovation.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all duration-200"
                  aria-label={social.name}
                >
                  {getSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="University links">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">University</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.university.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-body-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-body-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-body-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-body-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} China West Normal University. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-body-sm text-gray-500 dark:text-gray-400">
              <span>Made with care for education</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function getSocialIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-1.689-.072-4.947-.072zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.354 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.947-.072 4.354-.2 6.78-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-1.689-.072-4.947-.072z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    youtube: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  };
  return icons[name] || icons.facebook;
}