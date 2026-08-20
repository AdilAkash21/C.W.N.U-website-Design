import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Dropdown, UserMenu } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

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
  const location = useLocation();
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-card' : 'bg-transparent')}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 lg:h-20">
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

          <div className="hidden lg:flex lg:items-center lg:gap-6">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
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
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
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
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="btn btn-secondary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  {hasRole('admin') && (
                    <Link to="/admin" className="btn btn-outline w-full" onClick={() => setIsMobileMenuOpen(false)}>
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