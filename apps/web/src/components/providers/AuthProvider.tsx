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

// All API calls use the Vite proxy (/api → localhost:3001) to avoid CORS issues
// with direct cross-origin requests and to use the service-role key on the backend.

async function fetchProfile(token: string): Promise<Profile | null> {
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Profile | null };
  return json.data;
}

async function fetchSavedIds(token: string): Promise<string[]> {
  const res = await fetch('/api/collections/saved-ids', {
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

      try {
        if (session?.user) {
          const [profile, savedIds] = await Promise.all([
            fetchProfile(session.access_token).catch(() => null),
            fetchSavedIds(session.access_token).catch(() => [] as string[]),
          ]);

          // No profile row yet — auto-create it from the JWT user_metadata.
          // This covers users who registered before the backend upsert included email.
          let resolvedProfile = profile;
          if (!resolvedProfile) {
            const meta = session.user.user_metadata as { full_name?: string; role?: string };
            // Only roles accepted by updateProfileSchema — agent/admin are set by backend only.
            const settableRoles = ['buyer', 'seller', 'pending_agent'];
            const role = settableRoles.includes(meta.role ?? '') ? (meta.role as string) : 'buyer';
            await fetch('/api/users/me', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                // Omit full_name entirely when null — Zod rejects null for z.string()
                ...(meta.full_name ? { full_name: meta.full_name } : {}),
                role,
              }),
            }).catch(() => null);
            resolvedProfile = await fetchProfile(session.access_token).catch(() => null);
          }

          dispatch(setUser(resolvedProfile));
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
      } finally {
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
