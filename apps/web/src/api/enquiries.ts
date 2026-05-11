import { useMutation } from '@tanstack/react-query';
import type { CreateEnquiryInput } from '@propsphere/types';

async function createEnquiry(data: CreateEnquiryInput): Promise<void> {
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Failed to send enquiry');
  }
}

export function useCreateEnquiry() {
  return useMutation({ mutationFn: createEnquiry });
}
