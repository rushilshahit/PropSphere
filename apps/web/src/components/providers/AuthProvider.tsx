import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { Profile } from '@propsphere/types';
import { useAppDispatch } from '@/store/hooks';
import {
  setInitialized,
  setNeedsRoleSelection,
  setSession,
  setUser,
} from '@/features/auth/store/authSlice';
import { setSavedIds } from '@/features/collections/store/collectionsSlice';
import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

async function fetchSavedIds(token: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/collections/saved-ids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: string[] };
  return json.data ?? [];
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let initialized = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      dispatch(setSession(session));

      if (session?.user) {
        const [profile, savedIds] = await Promise.all([
          fetchProfile(session.user.id),
          fetchSavedIds(session.access_token).catch(() => [] as string[]),
        ]);
        dispatch(setUser(profile));
        dispatch(setSavedIds(savedIds));

        const oauthPending = sessionStorage.getItem('oauth_role_pending') === '1';
        const isNewProfile =
          profile !== null && Date.now() - new Date(profile.created_at).getTime() < 60_000;
        if (oauthPending && isNewProfile) {
          sessionStorage.removeItem('oauth_role_pending');
          dispatch(setNeedsRoleSelection(true));
        }
      } else {
        dispatch(setUser(null));
        dispatch(setSavedIds([]));
      }

      if (!initialized) {
        initialized = true;
        dispatch(setInitialized(true));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
