import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ArrowLeft } from 'lucide-react';
import type { Profile } from '@propsphere/types';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { setSession, setUser } from '@/features/auth/store/authSlice';
import { useToast } from '@/components/providers/ToastProvider';
import { Input, Button } from '@/components/ui';
import { RegisterRoleSelector, type SelectableRole } from './RegisterRoleSelector';

interface AuthModalProps {
  mode: 'login' | 'register';
  isOpen: boolean;
  onClose: () => void;
}

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterDetailsForm = z.infer<typeof registerDetailsSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

const ROLE_REDIRECT: Record<SelectableRole, string> = {
  seller: '/post-property',
  agent: '/become-an-agent',
  buyer: '/',
};

export function AuthModal({ mode: initialMode, isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('buyer');
  const [apiError, setApiError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/';

  useEffect(() => {
    setMode(initialMode);
    setRegisterStep(1);
    setSelectedRole('buyer');
    setApiError(null);
    setForgotSent(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterDetailsForm>({ resolver: zodResolver(registerDetailsSchema) });
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setRegisterStep(1);
    setSelectedRole('buyer');
    setApiError(null);
    setForgotSent(false);
    loginForm.reset();
    registerForm.reset();
    forgotForm.reset();
  }

  async function handleLogin(values: LoginForm) {
    setApiError(null);
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoginLoading(false);
    if (error) { setApiError(error.message); return; }
    if (data.session) dispatch(setSession(data.session));
    onClose();
    navigate(returnTo);
  }

  async function handleRegister(values: RegisterDetailsForm) {
    setApiError(null);
    setRegisterLoading(true);
    const dbRole = selectedRole === 'agent' ? 'pending_agent' : selectedRole;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName, role: dbRole } },
    });
    if (error) { setRegisterLoading(false); setApiError(error.message); return; }

    if (data.session) {
      // Use the backend (service-role client) to create/update the profile so RLS
      // cannot silently block role assignment the way a client-side upsert would.
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ full_name: values.fullName, role: dbRole }),
      });
      // Fetch the post-PATCH profile so Redux has the correct role before we navigate.
      // onAuthStateChange may have already fetched the profile with the old/default role.
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle();
      dispatch(setSession(data.session));
      if (profile) dispatch(setUser(profile as Profile));
    }

    setRegisterLoading(false);
    toast('Welcome to PropSphere!', 'success');
    onClose();
    navigate(ROLE_REDIRECT[selectedRole]);
  }

  async function handleForgotPassword(values: ForgotForm) {
    setApiError(null);
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) { setApiError(error.message); return; }
    setForgotSent(true);
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white rounded-card shadow-modal animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">

          {/* ── Login ────────────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Welcome back</h2>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
                <div>
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot-password'); setApiError(null); setForgotSent(false); forgotForm.reset(); }}
                      className="text-xs text-brand-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                {apiError && <p className="text-sm text-red-500">{apiError}</p>}
                <Button type="submit" className="w-full" loading={loginLoading}>
                  Log in
                </Button>
              </form>
            </>
          )}

          {/* ── Forgot password ───────────────────────────────── */}
          {mode === 'forgot-password' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-neutral-400 hover:text-neutral-600"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-neutral-900">Reset password</h2>
              </div>

              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 mb-1">Check your email</p>
                  <p className="text-sm text-neutral-500 mb-6">
                    We sent a password reset link to your email. It may take a minute to arrive.
                  </p>
                  <Button className="w-full" onClick={() => switchMode('login')}>
                    Back to login
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-neutral-500 mb-5">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                  <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                    <Input
                      label="Email"
                      type="email"
                      autoComplete="email"
                      error={forgotForm.formState.errors.email?.message}
                      {...forgotForm.register('email')}
                    />
                    {apiError && <p className="text-sm text-red-500">{apiError}</p>}
                    <Button type="submit" className="w-full" loading={forgotLoading}>
                      Send reset link
                    </Button>
                  </form>
                </>
              )}
            </>
          )}

          {/* ── Register step 1: role picker ─────────────────── */}
          {mode === 'register' && registerStep === 1 && (
            <>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Create your account</h2>
              <p className="text-sm text-neutral-500 mb-6">I am a…</p>
              <RegisterRoleSelector value={selectedRole} onChange={setSelectedRole} />
              <Button
                className="w-full mt-6"
                onClick={() => { setApiError(null); setRegisterStep(2); }}
              >
                Continue
              </Button>
            </>
          )}

          {/* ── Register step 2: details ──────────────────────── */}
          {mode === 'register' && registerStep === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="text-neutral-400 hover:text-neutral-600"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-neutral-900">Your details</h2>
              </div>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <Input
                  label="Full name"
                  type="text"
                  autoComplete="name"
                  error={registerForm.formState.errors.fullName?.message}
                  {...registerForm.register('fullName')}
                />
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password')}
                />
                {apiError && <p className="text-sm text-red-500">{apiError}</p>}
                <Button type="submit" className="w-full" loading={registerLoading}>
                  Create account
                </Button>
              </form>
            </>
          )}

          {/* ── Toggle login/register (hidden on forgot-password) ── */}
          {mode !== 'forgot-password' && (
            <p className="text-sm text-neutral-500 text-center mt-5">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-brand-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-brand-primary font-medium hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          )}

        </div>
      </div>
    </div>,
    document.body,
  );
}
