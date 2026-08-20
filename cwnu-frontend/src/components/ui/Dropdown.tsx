import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)} onKeyDown={handleKeyDown}>
        {trigger}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className={cn(
              'absolute z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-elevated border border-gray-100 dark:bg-gray-800 dark:border-gray-700',
              'animate-scale-in',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="menu"
            tabIndex={-1}
          >
            <ul className="py-1" role="listbox">
              {items.map((item, index) => (
                item.divider ? (
                  <li key={`divider-${index}`} className="h-px bg-gray-100 dark:bg-gray-700 my-1" role="separator" />
                ) : (
                  <li
                    key={index}
                    role="option"
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700',
                      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                      item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                    )}
                    tabIndex={-1}
                    aria-disabled={item.disabled}
                  >
                    {item.icon && <span className="flex-shrink-0 h-4 w-4">{item.icon}</span>}
                    <span>{item.label}</span>
                  </li>
                )
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function UserMenu({ user, onProfile, onSettings, onLogout }: UserMenuProps) {
  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <span className="hidden sm:block font-medium text-gray-700 dark:text-gray-300">
            {user.name}
          </span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      }
      items={[
        { label: 'Profile', icon: <UserIcon />, onClick: onProfile },
        { label: 'Settings', icon: <SettingsIcon />, onClick: onSettings },
        { divider: true },
        { label: 'Logout', icon: <LogoutIcon />, onClick: onLogout, danger: true },
      ]}
      align="right"
    />
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}