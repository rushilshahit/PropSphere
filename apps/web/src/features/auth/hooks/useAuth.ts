import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectAuthInitialized,
  selectAuthLoading,
  selectIsAgent,
  selectIsAuthenticated,
  selectSession,
  selectUser,
  setSession,
  setUser,
} from '@/features/auth/store/authSlice';
import { setSavedIds } from '@/features/collections/store/collectionsSlice';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const session = useAppSelector(selectSession);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAgent = useAppSelector(selectIsAgent);
  const loading = useAppSelector(selectAuthLoading);
  const initialized = useAppSelector(selectAuthInitialized);

  function signOut() {
    // Navigate home first so ProtectedRoute never sees isAuthenticated=false
    // on a guarded path and redirects with requireAuth:true (which opens the modal).
    navigate('/');
    dispatch(setSession(null));
    dispatch(setUser(null));
    dispatch(setSavedIds([]));
    queryClient.clear();
    // Fire-and-forget: scope:'local' clears localStorage without a network round-trip.
    void supabase.auth.signOut({ scope: 'local' });
  }

  return { user, session, isAuthenticated, isAgent, loading, initialized, signOut };
}
