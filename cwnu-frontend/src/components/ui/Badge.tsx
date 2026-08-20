import { cn } from '../utils/cn';
import type { UserRole } from '../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({ className, variant = 'primary', size = 'md', dot, children, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', variants[variant].replace('bg-', 'bg-').replace('text-', 'bg-'))} />}
      {children}
    </span>
  );
}

export function RoleBadge({ role, size = 'md' }: { role: UserRole; size?: 'sm' | 'md' | 'lg' }) {
  const variants: Record<UserRole, BadgeProps['variant']> = {
    student: 'info',
    teacher: 'success',
    staff: 'primary',
    admin: 'danger',
  };

  const labels: Record<UserRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    staff: 'Staff',
    admin: 'Admin',
  };

  return <Badge variant={variants[role]} size={size}>{labels[role]}</Badge>;
}

export function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' | 'lg' }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    active: 'success',
    inactive: 'gray',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    dropped: 'gray',
    completed: 'info',
    present: 'success',
    absent: 'danger',
    late: 'warning',
    excused: 'info',
    submitted: 'info',
    graded: 'success',
    returned: 'primary',
    published: 'success',
    draft: 'gray',
    archived: 'gray',
  };

  return (
    <Badge variant={variantMap[status] || 'gray'} size={size} className="capitalize">
      {status}
    </Badge>
  );
}