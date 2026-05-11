import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotification, SavedSearch, AlertFrequency } from '@propsphere/types';
import type { SearchFilters } from '@propsphere/types';
import { supabase } from '@/lib/supabase';

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

// ---- Saved Searches ----

async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const res = await authFetch('/api/saved-searches');
  if (!res.ok) throw new Error('Failed to fetch saved searches');
  const json = (await res.json()) as { data: SavedSearch[] };
  return json.data;
}

export function useSavedSearches() {
  return useQuery({
    queryKey: ['saved-searches'],
    queryFn: fetchSavedSearches,
    staleTime: 30_000,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, filters, alertFreq }: { name: string; filters: SearchFilters; alertFreq: AlertFrequency }) =>
      authFetch('/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify({ name, filters, alertFreq }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      alertEnabled,
      alertFreq,
    }: {
      id: string;
      alertEnabled?: boolean;
      alertFreq?: AlertFrequency;
    }) =>
      authFetch(`/api/saved-searches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ alertEnabled, alertFreq }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/saved-searches/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

// ---- Notifications ----

async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await authFetch('/api/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const json = (await res.json()) as { data: AppNotification[] };
  return json.data;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      authFetch('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
