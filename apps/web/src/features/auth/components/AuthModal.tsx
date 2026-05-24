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
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
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

type LoginForm = z.infer<typeof loginSchema>;
type RegisterDetailsForm = z.infer<typeof registerDetailsSchema>;

const ROLE_REDIRECT: Record<SelectableRole, string> = {
  seller: '/post-property',
  agent: '/become-an-agent',
  buyer: '/',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.448 14.013 17.64 11.79 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal({ mode: initialMode, isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [mode, setMode] = useState(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('buyer');
  const [apiError, setApiError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/';

  useEffect(() => {
    setMode(initialMode);
    setRegisterStep(1);
    setSelectedRole('buyer');
    setApiError(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterDetailsForm>({ resolver: zodResolver(registerDetailsSchema) });

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setRegisterStep(1);
    setSelectedRole('buyer');
    setApiError(null);
    loginForm.reset();
    registerForm.reset();
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

  async function handleGoogleOAuth() {
    if (mode === 'register') {
      sessionStorage.setItem('oauth_role_pending', '1');
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
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
              <button
                type="button"
                onClick={handleGoogleOAuth}
                className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-btn py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors mb-4"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400">or</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />
                {apiError && <p className="text-sm text-red-500">{apiError}</p>}
                <Button type="submit" className="w-full" loading={loginLoading}>
                  Log in
                </Button>
              </form>
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
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400">or</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <button
                type="button"
                onClick={handleGoogleOAuth}
                className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-btn py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <GoogleIcon />
                Sign up with Google
              </button>
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

          {/* ── Toggle login/register ─────────────────────────── */}
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

        </div>
      </div>
    </div>,
    document.body,
  );
}
