import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationInput = { type: NotificationType; message: string; duration?: number };

type Notification = NotificationInput & { id: number; duration: number };
type NotificationContextValue = { notify: (input: NotificationInput) => void };

const NotificationContext = createContext<NotificationContextValue | null>(null);
let nextId = 1;

function NotificationToast({ item, onRemove }: { item: Notification; onRemove: (id: number) => void }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fadeDelay = Math.max(0, item.duration - 300);
    const fadeTimer = window.setTimeout(() => setIsLeaving(true), fadeDelay);
    const removeTimer = window.setTimeout(() => onRemove(item.id), item.duration);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [item.duration, item.id, onRemove]);

  return (
    <div
      role={item.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto w-full rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isLeaving ? 'translate-y-1 opacity-0' : 'animate-fade-in opacity-100'
      } ${
        item.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-200' :
        item.type === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/90 dark:text-red-200' :
        item.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/90 dark:text-amber-200' :
        'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/90 dark:text-blue-200'
      }`}
    >
      <span className="mr-1 font-bold">{item.type === 'success' ? 'Success' : item.type === 'error' ? 'Error' : item.type === 'warning' ? 'Warning' : 'Info'} —</span>
      {item.message}
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((input: NotificationInput) => {
    const duration = input.duration ?? (
      input.type === 'success' || input.type === 'info' ? 5000 :
      input.type === 'error' ? 10000 : 7000
    );
    setNotifications((current) => {
      if (current.some((item) => item.type === input.type && item.message === input.message)) return current;
      return [...current, { ...input, id: nextId++, duration }];
    });
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => notify((event as CustomEvent<NotificationInput>).detail);
    window.addEventListener('cwnu:notification', handleNotification);
    return () => window.removeEventListener('cwnu:notification', handleNotification);
  }, [notify]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:max-w-md" aria-live="polite">
        {notifications.map((item) => <NotificationToast key={item.id} item={item} onRemove={removeNotification} />)}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}
