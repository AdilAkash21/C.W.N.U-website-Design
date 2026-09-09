import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { UserMenu } from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';

type Theme = 'light' | 'jade' | 'dark';

const themes: Theme[] = ['light', 'jade', 'dark'];

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    );
  }

  if (theme === 'jade') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5 7.5 4h9L21 9.5 12 20 3 9.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 9.5 9 .5 9-.5M7.5 4 12 10l4.5-6M12 10v10" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

const navigation = [
  { name: 'Home', href: '/', icon: 'home' },
  { name: 'About', href: '/about', icon: 'info' },
  { name: 'Courses', href: '/courses', icon: 'book' },
  { name: 'Blog', href: '/blog', icon: 'newspaper' },
  { name: 'Contact', href: '/contact', icon: 'mail' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || savedTheme === 'jade' ? savedTheme : 'light';
  });
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'jade', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const themeToggle = (
    <button
      type="button"
      onClick={() => setTheme(themes[(themes.indexOf(theme) + 1) % themes.length])}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <ThemeIcon theme={nextTheme} />
      <span className="capitalize">{nextTheme}</span>
    </button>
  );

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-card' : 'bg-transparent')}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="group flex items-center gap-2" aria-label="CWNU Home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                <path d="M5 13.18v4L12 21l7-3.82v-4" />
                <path d="M12 3v18" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">CWNU</span>
          </Link>

          <div className="hidden lg:flex lg:items-center lg:gap-6">
            {(isAuthenticated ? [...navigation, { name: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' }] : navigation).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-0.5',
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                  )
                }

              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {themeToggle}
            {isAuthenticated ? (
              <UserMenu
                user={{
                  name: `${user?.firstName} ${user?.lastName}`,
                  email: user?.email || '',
                  avatar: user?.avatar,
                  role: user?.role || 'student',
                }}
                onProfile={() => window.location.href = '/profile'}
                onSettings={() => window.location.href = '/profile?tab=settings'}
                onLogout={handleLogout}
              />
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div id="mobile-menu" className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
          <div className="container px-4 py-4 space-y-2">
            {(isAuthenticated ? [...navigation, { name: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' }] : navigation).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:translate-x-1',
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                  )
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              {themeToggle}
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="btn btn-secondary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  {hasRole('admin') && (
                    <Link to="/dashboard/admin" className="btn btn-outline w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="btn btn-ghost w-full text-left">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}