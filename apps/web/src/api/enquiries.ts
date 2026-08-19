import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateEnquiryInput } from '@propsphere/types';
import { supabase } from '@/lib/supabase';

async function createEnquiry(data: CreateEnquiryInput): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Failed to send enquiry');
  }
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-enquiries'] });
    },
  });
}
