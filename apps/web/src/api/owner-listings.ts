import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { store } from '@/store';
import { supabase } from '@/lib/supabase';

export interface OwnerListing {
  id: string;
  status: string;
  headline: string | null;
  suburb: string;
  state: string;
  postcode: string;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  price: number | null;
  price_display: string | null;
  listing_type: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  published_at: string | null;
  created_at: string;
  view_count: number;
  enquiry_count: number;
}

export interface OwnerListingStats {
  view_count: number;
  enquiry_count: number;
  days_listed: number;
}

export interface OwnerListingEnquiry {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

export interface ListingInvitation {
  id: string;
  property_id: string;
  agent_id: string;
  agent_name: string | null;
  agent_email: string;
  agent_agency: string | null;
  message: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface InvitationPreview {
  id: string;
  message: string | null;
  status: string;
  expires_at: string;
  property: {
    id: string;
    headline: string | null;
    address: string;
    suburb: string;
    state: string;
    listing_type: string;
  };
  owner_name: string | null;
}

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const session = store.getState().auth.session;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

export interface OwnerDashboardStats {
  activeListings: number;
  enquiriesToday: number;
  totalViews: number;
}

export function useOwnerDashboardStats() {
  return useQuery({
    queryKey: ['owner-listings', 'dashboard-stats'],
    queryFn: async (): Promise<OwnerDashboardStats> => {
      const res = await authFetch('/api/owner-listings/me/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = (await res.json()) as { data: OwnerDashboardStats };
      return json.data;
    },
    staleTime: 60_000,
  });
}

export function useMyOwnerListings() {
  return useQuery({
    queryKey: ['owner-listings', 'me'],
    queryFn: async () => {
      const res = await authFetch('/api/owner-listings/me');
      if (!res.ok) throw new Error('Failed to fetch listings');
      const json = (await res.json()) as { data: OwnerListing[] };
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useOwnerListingStats(id: string) {
  return useQuery({
    queryKey: ['owner-listings', id, 'stats'],
    queryFn: async () => {
      const res = await authFetch(`/api/owner-listings/${id}/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = (await res.json()) as { data: OwnerListingStats };
      return json.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useOwnerListingEnquiries(id: string) {
  return useQuery({
    queryKey: ['owner-listings', id, 'enquiries'],
    queryFn: async () => {
      const res = await authFetch(`/api/owner-listings/${id}/enquiries`);
      if (!res.ok) throw new Error('Failed to fetch enquiries');
      const json = (await res.json()) as { data: OwnerListingEnquiry[] };
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useUpdateOwnerListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await authFetch(`/api/owner-listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
  });
}

export function useDeleteOwnerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/owner-listings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete listing');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
  });
}

export interface CreateOwnerListingInput {
  property_type: string;
  listing_type: string;
  sale_method?: string;
  unit_number?: string;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  car_spaces?: number;
  land_size_sqm?: number;
  build_size_sqm?: number;
  price?: number;
  price_min?: number;
  price_max?: number;
  price_display?: string;
  is_price_hidden?: boolean;
  headline: string;
  description: string;
  features?: string[];
  auction_at?: string;
}

export function useCreateOwnerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateOwnerListingInput) => {
      const res = await authFetch('/api/owner-listings', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const json = (await res.json()) as { message?: string | string[] };
        const msg = Array.isArray(json.message) ? json.message[0] : (json.message ?? 'Failed to create listing');
        throw new Error(msg);
      }
      const json = (await res.json()) as { data: { id: string } };
      return json.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { propertyId: string; agentId: string; message?: string }) => {
      const res = await authFetch('/api/listing-invitations', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to send invitation');
      const json = (await res.json()) as { data: { id: string } };
      return json.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listing-invitations'] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/listing-invitations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel invitation');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listing-invitations'] });
    },
  });
}

export function usePendingInvitation(propertyId: string) {
  return useQuery({
    queryKey: ['listing-invitations', 'property', propertyId],
    queryFn: async () => {
      const res = await authFetch(`/api/listing-invitations/property/${propertyId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch invitation');
      const json = (await res.json()) as { data: ListingInvitation | null };
      return json.data;
    },
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: ['listing-invitations', 'preview', token],
    queryFn: async () => {
      const res = await fetch(`/api/listing-invitations/preview/${token}`);
      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message ?? 'Invalid invitation');
      }
      const json = (await res.json()) as { data: InvitationPreview };
      return json.data;
    },
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/listing-invitations/${token}/accept`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to accept invitation');
    },
  });
}

export function useDeclineInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/listing-invitations/${token}/decline`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to decline invitation');
    },
  });
}

const PROPERTY_MEDIA_BUCKET = 'property-media';

export async function uploadListingImages(propertyId: string, files: File[]): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(PROPERTY_MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadErr) throw new Error(uploadErr.message);

    const { data: { publicUrl } } = supabase.storage.from(PROPERTY_MEDIA_BUCKET).getPublicUrl(path);

    const { error: insertErr } = await supabase.from('property_images').insert({
      property_id: propertyId,
      storage_path: path,
      cdn_url: publicUrl,
      sort_order: i,
    });
    if (insertErr) throw new Error(insertErr.message);
  }
}

export interface InspectionSlot {
  type: 'open_home' | 'private';
  starts_at: string;
  ends_at: string;
}

export function useCreateInspections() {
  return useMutation({
    mutationFn: async ({ propertyId, slots }: { propertyId: string; slots: InspectionSlot[] }) => {
      const session = store.getState().auth.session;
      const res = await fetch(`/api/owner-listings/${propertyId}/inspections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) throw new Error('Failed to save inspection times');
    },
  });
}
