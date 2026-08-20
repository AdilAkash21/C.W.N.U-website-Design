import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/FormControls';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      navigate(from, { replace: true });
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