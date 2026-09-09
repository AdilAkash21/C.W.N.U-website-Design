import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[a-z]/, 'Must contain at least one lowercase letter').regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { confirmPasswordReset } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setErrorMessage('Invalid or missing reset token');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage(null);
    try {
      await confirmPasswordReset({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-heading-lg font-bold text-gray-900 dark:text-white mb-3">Invalid Reset Link</h1>
        <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
          This password reset link is invalid or has expired. Please request a new password reset.
        </p>
        <Link to="/forgot-password">
          <Button variant="primary">Request New Link</Button>
        </Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-heading-lg font-bold text-gray-900 dark:text-white mb-3">Password Reset Successful</h1>
        <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
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
        <h1 className="text-display-md font-bold text-gray-900 dark:text-white mb-2">Reset your password</h1>
        <p className="text-body text-gray-600 dark:text-gray-400">Enter your new password below</p>
      </div>

      <Card className="p-6 sm:p-8">
        {status === 'error' && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" role="alert">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
              New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />
            <div className="mt-2 space-y-1">
              <PasswordRequirement met={password.length >= 8}>At least 8 characters</PasswordRequirement>
              <PasswordRequirement met={/[A-Z]/.test(password)}>One uppercase letter</PasswordRequirement>
              <PasswordRequirement met={/[a-z]/.test(password)}>One lowercase letter</PasswordRequirement>
              <PasswordRequirement met={/[0-9]/.test(password)}>One number</PasswordRequirement>
            </div>
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full" isLoading={status === 'submitting'}>
            Reset Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body text-gray-600 dark:text-gray-400">
            <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

function PasswordRequirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <svg
        className={met ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        {met ? (
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        )}
      </svg>
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>{children}</span>
    </div>
  );
}