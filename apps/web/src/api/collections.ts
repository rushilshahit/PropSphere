import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Collection, CollectionWithProperties } from '@propsphere/types';
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

async function fetchCollections(): Promise<Collection[]> {
  const res = await authFetch('/api/collections');
  if (!res.ok) throw new Error('Failed to fetch collections');
  const json = (await res.json()) as { data: Collection[] };
  return json.data;
}

async function fetchCollectionProperties(collectionId: string): Promise<CollectionWithProperties> {
  const res = await authFetch(`/api/collections/${collectionId}/properties`);
  if (!res.ok) throw new Error('Failed to fetch collection properties');
  const json = (await res.json()) as { data: CollectionWithProperties };
  return json.data;
}

export function useCollections(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useCollectionProperties(collectionId: string | null) {
  return useQuery({
    queryKey: ['collections', collectionId, 'properties'],
    queryFn: () => fetchCollectionProperties(collectionId!),
    enabled: !!collectionId,
    staleTime: 30_000,
  });
}

export function useSaveProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, propertyId, notes }: { collectionId: string; propertyId: string; notes?: string }) => {
      const res = await authFetch(`/api/collections/${collectionId}/properties`, {
        method: 'POST',
        body: JSON.stringify({ propertyId, notes }),
      });
      if (!res.ok) throw new Error('Failed to save property');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUnsaveProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) =>
      authFetch(`/api/collections/properties/${propertyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await authFetch('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create collection');
      const json = (await res.json()) as { data: Collection };
      return json.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) =>
      authFetch(`/api/collections/${collectionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, propertyId }: { collectionId: string; propertyId: string }) =>
      authFetch(`/api/collections/${collectionId}/properties/${propertyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
