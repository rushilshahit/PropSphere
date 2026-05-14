import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { setSession } from '@/features/auth/store/authSlice';
import { useToast } from '@/components/providers/ToastProvider';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';

interface AuthModalProps {
  mode: 'login' | 'register';
  isOpen: boolean;
  onClose: () => void;
}

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['buyer', 'renter', 'seller', 'agent']),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

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
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState(initialMode);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMode(initialMode);
    setApiError(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' },
  });

  async function handleLogin(values: LoginForm) {
    setApiError(null);
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoginLoading(false);
    if (error) {
      setApiError(error.message);
      return;
    }
    if (data.session) {
      dispatch(setSession(data.session));
    }
    onClose();
    navigate('/');
  }

  async function handleRegister(values: RegisterForm) {
    setApiError(null);
    setRegisterLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName, role: values.role } },
    });
    setRegisterLoading(false);
    if (error) {
      setApiError(error.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: values.email,
        full_name: values.fullName,
        role: values.role,
      });
    }
    toast('Welcome to PropSphere!', 'success');
    if (data.session) {
      dispatch(setSession(data.session));
    }
    onClose();
    navigate('/');
  }

  async function handleGoogleOAuth() {
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
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleOAuth}
            className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-btn py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Login form */}
          {mode === 'login' && (
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
              <Button
                type="submit"
                className="w-full"
                loading={loginLoading}
              >
                Log in
              </Button>
            </form>
          )}

          {/* Register form */}
          {mode === 'register' && (
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
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                  I am a
                </label>
                <select
                  className="w-full border border-neutral-300 rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white"
                  {...registerForm.register('role')}
                >
                  <option value="buyer">Buyer</option>
                  <option value="renter">Renter</option>
                  <option value="seller">Seller</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              {apiError && <p className="text-sm text-red-500">{apiError}</p>}
              <Button
                type="submit"
                className="w-full"
                loading={registerLoading}
              >
                Sign up
              </Button>
            </form>
          )}

          {/* Toggle */}
          <p className="text-sm text-neutral-500 text-center mt-5">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setApiError(null); }}
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
                  onClick={() => { setMode('login'); setApiError(null); }}
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
