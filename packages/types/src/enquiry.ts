export const EnquiryStatus = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
  ARCHIVED: 'archived',
} as const;
export type EnquiryStatus = (typeof EnquiryStatus)[keyof typeof EnquiryStatus];

export interface Enquiry {
  id: string;
  property_id: string;
  agent_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateEnquiryInput {
  property_id: string;
  agent_id: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  message: string;
}
