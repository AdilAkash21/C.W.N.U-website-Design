import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/FormControls';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'teacher', 'staff', 'admin'], { message: 'Choose how you want to sign in' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
const LAST_LOGIN_EMAIL_KEY = 'lastLoginEmail';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem(LAST_LOGIN_EMAIL_KEY) || '',
      role: 'student',
      rememberMe: false,
    },
  });
  const selectedRole = watch('role');

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await login({
        email: data.email,
        password: data.password,
        role: data.role,
        rememberMe: data.rememberMe,
      });
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, data.email);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              <path d="M5 13.18v4L12 21l7-3.82v-4" />
              <path d="M12 3v18" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl text-gray-900 dark:text-white">CWNU</span>
        </Link>
        <h1 className="text-display-md font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
        <p className="text-body text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
      </div>

      <Card className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" role="alert">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@cwnu.edu"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Continue as</legend>
            <input type="hidden" {...register('role')} />
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: 'student' as const,
                  label: 'Student',
                  description: 'Access your courses and progress',
                  icon: (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12v4.5c2.2 1.5 4.5 2.25 7 2.25s4.8-.75 7-2.25V12" />
                    </svg>
                  ),
                },
                {
                  value: 'teacher' as const,
                  label: 'Teacher',
                  description: 'Manage classes and students',
                  icon: (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  ),
                },
                {
                  value: 'staff' as const,
                  label: 'Staff',
                  description: 'Manage university operations',
                  icon: <span className="text-lg font-bold">S</span>,
                },
                {
                  value: 'admin' as const,
                  label: 'Admin',
                  description: 'Manage the entire platform',
                  icon: <span className="text-lg font-bold">A</span>,
                },
              ].map((option) => {
                const isSelected = selectedRole === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('role', option.value, { shouldValidate: true })}
                    aria-pressed={isSelected}
                    className={`group rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-500'
                    }`}
                  >
                    <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {option.icon}
                    </span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-4 text-gray-500 dark:text-gray-400">{option.description}</span>
                  </button>
                );
              })}
            </div>
            {errors.role?.message && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">{errors.role.message}</p>}
          </fieldset>

          <div className="relative">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Forgot password"
            >
              <Link to="/forgot-password" className="text-sm font-medium">Forgot password?</Link>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox {...register('rememberMe')} label="Remember me" />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}