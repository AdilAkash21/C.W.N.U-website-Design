import { cn } from '../utils/cn';
import { getInitials } from '../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

export function Avatar({ className, src, alt, name, size = 'md', shape = 'circle', status, statusPosition = 'bottom-right', ...props }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const statusPositionClasses = {
    'bottom-right': 'bottom-0 right-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-left': 'top-0 left-0',
  };

  const initials = name ? getInitials(name) : '?';
  const bgColorClass = name
    ? `bg-[hsl(${name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360},70%,50%)]`
    : 'bg-gray-400';

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn(sizes[size], shapeClasses, 'object-cover')}
        />
      ) : (
        <div
          className={cn(
            sizes[size],
            shapeClasses,
            'flex items-center justify-center font-medium text-white select-none',
            bgColorClass
          )}
          aria-label={name ? `${name}'s avatar` : 'User avatar'}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute border-2 border-white dark:border-gray-900 rounded-full',
            statusSizes[size],
            statusColors[status],
            statusPositionClasses[statusPosition]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ avatars, max = 5, size = 'md', className, ...props }: {
  avatars: Array<AvatarProps & { id: string }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleAvatars.map((avatar) => (
        <Avatar key={avatar.id} {...avatar} size={size} className="ring-2 ring-white dark:ring-gray-900" />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center font-medium text-gray-600 dark:text-gray-400 border-2 border-white dark:border-gray-900',
            size === 'xs' && 'w-6 h-6 text-xs',
            size === 'sm' && 'w-8 h-8 text-sm',
            size === 'md' && 'w-10 h-10 text-base',
            size === 'lg' && 'w-12 h-12 text-lg',
            size === 'xl' && 'w-16 h-16 text-xl',
            size === '2xl' && 'w-24 h-24 text-2xl',
            'rounded-full bg-gray-100 dark:bg-gray-800'
          )}
          aria-label={`${remainingCount} more people`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}