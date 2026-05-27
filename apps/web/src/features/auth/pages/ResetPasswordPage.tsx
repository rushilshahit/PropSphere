import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/providers/ToastProvider';
import { Input, Button } from '@/components/ui';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready');
    });

    // Supabase may have already processed the token before this component mounted
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const hash = new URLSearchParams(window.location.hash.replace('#', ''));
        const query = new URLSearchParams(window.location.search);
        if (hash.get('type') === 'recovery' || query.get('type') === 'recovery') {
          setStatus('ready');
        }
      }
    });

    // If no recovery event after 6 seconds, the link is invalid or expired
    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'invalid' : prev));
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(values: ResetForm) {
    setApiError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setIsSubmitting(false);
    if (error) { setApiError(error.message); return; }
    toast('Password updated successfully', 'success');
    navigate('/');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-neutral-900 mb-2">Link expired or invalid</h1>
          <p className="text-sm text-neutral-500 mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Button onClick={() => navigate('/')}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-card shadow-card p-8">
        <h1 className="text-xl font-bold text-neutral-900 mb-1">Set new password</h1>
        <p className="text-sm text-neutral-500 mb-6">Choose a new password for your account.</p>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
          {apiError && <p className="text-sm text-red-500">{apiError}</p>}
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
