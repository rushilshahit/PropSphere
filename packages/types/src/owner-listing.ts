export const ListingSource = {
  AGENT: 'agent',
  OWNER: 'owner',
} as const;
export type ListingSource = (typeof ListingSource)[keyof typeof ListingSource];

export const InvitationStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export interface ListingInvitation {
  id: string;
  property_id: string;
  owner_id: string;
  agent_id: string | null;
  token: string;
  status: InvitationStatus;
  invited_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
}
