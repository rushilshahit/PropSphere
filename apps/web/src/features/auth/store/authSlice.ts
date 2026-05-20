import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Session } from '@supabase/supabase-js';
import type { RootState } from '@/store';
import type { Profile, UserRole } from '@propsphere/types';

interface AuthState {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  needsRoleSelection: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  initialized: false,
  needsRoleSelection: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<Profile | null>) {
      state.user = action.payload;
    },
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
    setNeedsRoleSelection(state, action: PayloadAction<boolean>) {
      state.needsRoleSelection = action.payload;
    },
  },
});

export const { setUser, setSession, setLoading, setInitialized, setNeedsRoleSelection } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectSession = (state: RootState) => state.auth.session;
export const selectIsAuthenticated = (state: RootState) => state.auth.session !== null;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectUserRole = (state: RootState): UserRole | null =>
  state.auth.user?.role ?? null;
export const selectIsAgent = (state: RootState) => state.auth.user?.role === 'agent';
export const selectIsSeller = (state: RootState) => state.auth.user?.role === 'seller';
export const selectNeedsRoleSelection = (state: RootState) => state.auth.needsRoleSelection;

export const authReducer = authSlice.reducer;
