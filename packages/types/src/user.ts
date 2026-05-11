export const UserRole = {
  BUYER: 'buyer',
  RENTER: 'renter',
  SELLER: 'seller',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
