export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  profile_id: string;
  agency_id: string;
  license_no: string | null;
  bio: string | null;
  years_active: number | null;
  created_at: string;
  // Joined from profiles
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string;
  // Joined from agencies
  agency: Agency | null;
}
