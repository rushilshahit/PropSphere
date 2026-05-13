import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { Profile } from '@propsphere/types';
import { useAppDispatch } from '@/store/hooks';
import { setInitialized, setSession, setUser } from '@/features/auth/store/authSlice';
import { supabase } from '@/lib/supabase';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let initialized = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch(setSession(session));

      if (event === 'SIGNED_OUT') {
        dispatch(setUser(null));
        if (!initialized) {
          initialized = true;
          dispatch(setInitialized(true));
        }
        return;
      }

      // Only fetch profile on initial load — SIGNED_IN is handled by LoginPage
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user.id);
            dispatch(setUser(profile));
          } catch {
            dispatch(setUser(null));
          }
        } else {
          dispatch(setUser(null));
        }
        if (!initialized) {
          initialized = true;
          dispatch(setInitialized(true));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
