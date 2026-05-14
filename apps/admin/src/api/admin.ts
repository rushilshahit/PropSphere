import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/admin${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: res.statusText }))) as { message: string };
    throw new Error(err.message ?? res.statusText);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export interface DashboardStats {
  activeListings: number;
  newListingsToday: number;
  enquiriesThisWeek: number;
  newUsersToday: number;
  unreadEnquiries: number;
  featuredListings: number;
  listingsByStatus: { status: string; count: number }[];
  enquiriesLast30Days: { date: string; count: number }[];
  registrationsLast30Days: { date: string; count: number }[];
  topSuburbs: { suburb: string; count: number }[];
}

export const getDashboardStats = () =>
  request<DashboardStats>('GET', '/analytics/dashboard');

// ── Properties ────────────────────────────────────────────────────────────
export interface AdminProperty {
  id: string;
  headline: string | null;
  suburb: string;
  state: string;
  listing_type: string;
  property_type: string;
  status: string;
  sale_method: string | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  price_display: string | null;
  is_price_hidden: boolean;
  auction_at: string | null;
  description: string | null;
  unit_number: string | null;
  street_number: string | null;
  street_name: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  land_size_sqm: number | null;
  build_size_sqm: number | null;
  agent_id: string;
  agency_id: string;
  view_count: number;
  enquiry_count: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
}

export interface AdminPropertyListResponse {
  items: AdminProperty[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PropertyListParams {
  page?: number;
  listingType?: string;
  status?: string;
  suburb?: string;
  agentId?: string;
  isFeatured?: boolean;
}

export const getProperty = (id: string) =>
  request<AdminProperty>('GET', `/properties/${id}`);

export const listProperties = (params: PropertyListParams = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return request<AdminPropertyListResponse>('GET', `/properties${qs ? `?${qs}` : ''}`);
};

export const createProperty = (data: Record<string, unknown>) =>
  request<{ id: string }>('POST', '/properties', data);

export const updateProperty = (id: string, data: Record<string, unknown>) =>
  request<{ success: boolean }>('PATCH', `/properties/${id}`, data);

export const deleteProperty = (id: string) =>
  request<{ success: boolean }>('DELETE', `/properties/${id}`);

export const bulkUpdateProperties = (ids: string[], patch: Record<string, unknown>) =>
  request<{ success: boolean }>('PATCH', '/properties/bulk', { ids, ...patch });

// ── Agencies ─────────────────────────────────────────────────────────────
export interface AdminAgency {
  id: string;
  name: string;
  slug: string;
  suburb: string;
  state: string;
  postcode: string | null;
  website: string | null;
  phone: string | null;
  logo_url: string | null;
  agent_count: number;
  listing_count: number;
}

export const getAgency = (id: string) =>
  request<AdminAgency>('GET', `/agencies/${id}`);

export const listAgencies = (page = 1) =>
  request<{ items: AdminAgency[]; total: number; page: number; totalPages: number }>(
    'GET', `/agencies?page=${page}`
  );

export const createAgency = (data: Record<string, unknown>) =>
  request<{ id: string }>('POST', '/agencies', data);

export const updateAgency = (id: string, data: Record<string, unknown>) =>
  request<{ success: boolean }>('PATCH', `/agencies/${id}`, data);

export const deleteAgency = (id: string) =>
  request<{ success: boolean }>('DELETE', `/agencies/${id}`);

// ── Agents ────────────────────────────────────────────────────────────────
export interface AdminAgent {
  id: string;
  profile_id: string;
  full_name: string | null;
  email: string;
  agency_id: string;
  agency_name: string;
  license_no: string | null;
  bio: string | null;
  years_active: number | null;
  active_listings: number;
  is_active: boolean;
}

export const getAgent = (id: string) =>
  request<AdminAgent>('GET', `/agents/${id}`);

export const listAgents = (page = 1) =>
  request<{ items: AdminAgent[]; total: number; page: number; totalPages: number }>(
    'GET', `/agents?page=${page}`
  );

export const createAgent = (data: Record<string, unknown>) =>
  request<{ id: string }>('POST', '/agents', data);

export const updateAgent = (id: string, data: Record<string, unknown>) =>
  request<{ success: boolean }>('PATCH', `/agents/${id}`, data);

export const deactivateAgent = (id: string) =>
  request<{ success: boolean }>('PATCH', `/agents/${id}`, { is_active: false });

// ── Users ─────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  created_at: string;
  is_suspended: boolean;
  collections_count: number;
  saved_searches_count: number;
  enquiries_count: number;
}

export const getUser = (id: string) =>
  request<AdminUser>('GET', `/users/${id}`);

export const listUsers = (params: { page?: number; role?: string; search?: string } = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return request<{ items: AdminUser[]; total: number; page: number; totalPages: number }>(
    'GET', `/users${qs ? `?${qs}` : ''}`
  );
};

export const updateUser = (id: string, data: { role?: string; is_suspended?: boolean }) =>
  request<{ success: boolean }>('PATCH', `/users/${id}`, data);

// ── Suburbs ───────────────────────────────────────────────────────────────
export interface AdminSuburb {
  id: string;
  name: string;
  state: string;
  postcode: string;
  median_sale_price: number | null;
  median_rent_price: number | null;
  days_on_market_avg: number | null;
  stats_updated_at: string | null;
}

export const listSuburbs = (page = 1) =>
  request<{ items: AdminSuburb[]; total: number; page: number; totalPages: number }>(
    'GET', `/suburbs?page=${page}`
  );

export const updateSuburb = (id: string, data: Record<string, unknown>) =>
  request<{ success: boolean }>('PATCH', `/suburbs/${id}`, data);

export const createSuburb = (data: Record<string, unknown>) =>
  request<{ id: string }>('POST', '/suburbs', data);

export const refreshSuburbStats = (id: string) =>
  request<{ success: boolean }>('POST', `/suburbs/${id}/refresh`);

// ── Schools ───────────────────────────────────────────────────────────────
export interface AdminSchool {
  id: string;
  name: string;
  type: string;
  sector: string;
  suburb: string;
  state: string;
  postcode: string;
  rating: number | null;
  lat: number | null;
  lng: number | null;
}

export const listSchools = (page = 1) =>
  request<{ items: AdminSchool[]; total: number; page: number; totalPages: number }>(
    'GET', `/schools?page=${page}`
  );

export const createSchool = (data: Record<string, unknown>) =>
  request<{ id: string }>('POST', '/schools', data);

export const updateSchool = (id: string, data: Record<string, unknown>) =>
  request<{ success: boolean }>('PATCH', `/schools/${id}`, data);

export const deleteSchool = (id: string) =>
  request<{ success: boolean }>('DELETE', `/schools/${id}`);

export const importSchoolsCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return supabase.auth.getSession().then(({ data }) => {
    const token = data.session?.access_token;
    return fetch(`${API_BASE}/admin/schools/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((r) => r.json());
  });
};

// ── Enquiries ─────────────────────────────────────────────────────────────
export interface AdminEnquiry {
  id: string;
  sender_name: string;
  sender_email: string;
  property_id: string;
  property_address: string;
  agent_name: string | null;
  status: string;
  created_at: string;
  message: string;
}

export const listEnquiries = (params: { page?: number; status?: string; agentId?: string } = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return request<{ items: AdminEnquiry[]; total: number; page: number; totalPages: number }>(
    'GET', `/enquiries${qs ? `?${qs}` : ''}`
  );
};

export const updateEnquiryStatus = (id: string, status: string) =>
  request<{ success: boolean }>('PATCH', `/enquiries/${id}/status`, { status });

// ── Notifications ─────────────────────────────────────────────────────────
export interface AdminNotification {
  id: string;
  user_id: string;
  user_email: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  sent_at: string;
}

export const listNotifications = (params: { page?: number; type?: string } = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return request<{ items: AdminNotification[]; total: number; page: number; totalPages: number }>(
    'GET', `/notifications${qs ? `?${qs}` : ''}`
  );
};

export const broadcastNotification = (data: { title: string; body: string }) =>
  request<{ success: boolean }>('POST', '/notifications/broadcast', data);

// ── Media ─────────────────────────────────────────────────────────────────
export interface MediaSummary {
  totalFiles: number;
  totalSizeBytes: number;
  orphanedCount: number;
}

export interface MediaFile {
  id: string;
  property_id: string | null;
  property_address: string | null;
  cdn_url: string;
  storage_path: string;
  is_orphaned: boolean;
  created_at: string;
}

export const getMediaSummary = () => request<MediaSummary>('GET', '/media/summary');
export const listMediaFiles = (page = 1) =>
  request<{ items: MediaFile[]; total: number; page: number; totalPages: number }>(
    'GET', `/media?page=${page}`
  );
export const deleteOrphanedMedia = () =>
  request<{ deleted: number }>('DELETE', '/media/orphaned');

// ── Featured ──────────────────────────────────────────────────────────────
export const listFeatured = () =>
  request<{ items: AdminProperty[] }>('GET', '/featured');

export const toggleFeatured = (id: string, isFeatured: boolean) =>
  request<{ success: boolean }>('PATCH', `/properties/${id}`, { is_featured: isFeatured });

export const reorderFeatured = (orderedIds: string[]) =>
  request<{ success: boolean }>('POST', '/featured/reorder', { ids: orderedIds });

// ── Export helpers ────────────────────────────────────────────────────────
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; totalPages: number }>,
): Promise<T[]> {
  const first = await fetchPage(1);
  if (first.totalPages <= 1) return first.items;
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => fetchPage(i + 2)),
  );
  return [first.items, ...rest.map((r) => r.items)].flat();
}

export const exportAllProperties = (params: Omit<PropertyListParams, 'page'> = {}) =>
  fetchAllPages((page) => listProperties({ ...params, page }));

export const exportAllAgencies = () =>
  fetchAllPages((page) => listAgencies(page));

export const exportAllAgents = () =>
  fetchAllPages((page) => listAgents(page));

export const exportAllUsers = (params: { role?: string; search?: string } = {}) =>
  fetchAllPages((page) => listUsers({ ...params, page }));

export const exportAllSuburbs = () =>
  fetchAllPages((page) => listSuburbs(page));

export const exportAllSchools = () =>
  fetchAllPages((page) => listSchools(page));

export const exportAllEnquiries = (params: { status?: string } = {}) =>
  fetchAllPages((page) => listEnquiries({ ...params, page }));

// ── Analytics ─────────────────────────────────────────────────────────────
export interface ListingAnalytics {
  mostViewed: { id: string; headline: string; view_count: number }[];
  highestEnquiryRate: { id: string; headline: string; enquiry_count: number }[];
  avgDaysToSold: number;
}

export interface UserAnalytics {
  dau: number;
  wau: number;
  mau: number;
}

export interface SearchAnalytics {
  topSuburbs: { suburb: string; count: number }[];
  topKeywords: { query: string; count: number }[];
}

export const getListingAnalytics = () =>
  request<ListingAnalytics>('GET', '/analytics/listings');

export const getUserAnalytics = () =>
  request<UserAnalytics>('GET', '/analytics/users');

export const getSearchAnalytics = () =>
  request<SearchAnalytics>('GET', '/analytics/search');
