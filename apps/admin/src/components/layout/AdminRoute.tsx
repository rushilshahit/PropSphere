import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import {
  selectAuthInitialized,
  selectIsAdmin,
  selectIsAuthenticated,
  selectSession,
  selectUser,
} from '@/features/auth/store/authSlice';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const PROFILE_LOAD_TIMEOUT_MS = 5000;

export function AdminRoute({ children }: { children: ReactNode }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const session = useAppSelector(selectSession);
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileTimedOut, setProfileTimedOut] = useState(false);

  // Inactivity logout
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, navigate]);

  // Escape hatch: if profile hasn't loaded after 5s, stop waiting
  useEffect(() => {
    if (!isAuthenticated || user) return;
    const t = setTimeout(() => setProfileTimedOut(true), PROFILE_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isAuthenticated, user]);

  // Reset timeout flag when user loads
  useEffect(() => {
    if (user) setProfileTimedOut(false);
  }, [user]);

  const profileLoading = initialized && isAuthenticated && !user && !profileTimedOut;

  if (!initialized || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
