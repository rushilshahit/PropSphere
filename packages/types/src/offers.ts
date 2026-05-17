export const OfferStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

export interface Offer {
  id: string;
  property_id: string;
  agent_id: string;
  sender_id?: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  amount: number;
  message?: string;
  status: OfferStatus;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmitOfferInput {
  property_id: string;
  agent_id: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  amount: number;
  message?: string;
  is_confidential?: boolean;
}
