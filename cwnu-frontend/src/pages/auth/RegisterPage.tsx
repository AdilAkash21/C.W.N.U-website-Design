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

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[a-z]/, 'Must contain at least one lowercase letter').regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'teacher', 'staff'], { required_error: 'Please select a role' }),
  phone: z.string().optional(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const roles: Array<{ value: RegisterFormData['role']; label: string; description: string }> = [
  { value: 'student', label: 'Student', description: 'Enroll in courses, view grades, submit assignments' },
];

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const selectedRole = watch('role');
  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
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
        <h1 className="text-display-md font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
        <p className="text-body text-gray-600 dark:text-gray-400">Join CWNU and start your academic journey</p>
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
          <div className="grid sm:grid-cols-2 gap-5">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.firstName?.message}
              autoComplete="given-name"
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              autoComplete="family-name"
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@cwnu.edu"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <Input
            label="Phone (Optional)"
            type="tel"
            placeholder="+86 123 456 7890"
            error={errors.phone?.message}
            autoComplete="tel"
            {...register('phone')}
          />

          <fieldset>
            <legend className="text-sm font-semibold text-gray-900 dark:text-white">Account type</legend>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Public registration is currently available for students.</p>
            <input type="hidden" value="student" {...register('role')} />
            <div className="mt-3">
              {roles.map((role) => {
                const isSelected = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setValue('role', role.value, { shouldValidate: true })}
                    aria-pressed={isSelected}
                    className={`relative min-h-[148px] rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-500/10 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-500'
                    }`}
                  >
                    <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {role.value === 'student' && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12v4.5c2.2 1.5 4.5 2.25 7 2.25s4.8-.75 7-2.25V12" />
                        </svg>
                      )}
                      {role.value === 'teacher' && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                        </svg>
                      )}
                      {role.value === 'staff' && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                      )}
                    </span>
                    <span className="block text-sm font-semibold">{role.label}</span>
                    <span className="mt-1 block text-xs leading-4 text-gray-500 dark:text-gray-400">{role.description}</span>
                    <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
              Password
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
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          <Checkbox
            {...register('terms')}
            label="I agree to the Terms of Service and Privacy Policy"
            error={errors.terms?.message}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Sign in
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
        className={cn('w-4 h-4 flex-shrink-0', met ? 'text-green-500' : 'text-gray-300 dark:text-gray-600')}
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
      <span className={cn(met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')}>{children}</span>
    </div>
  );
}

import { cn } from '../../utils/cn';