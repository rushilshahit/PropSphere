import { useState } from 'react';
import { mediaService } from '@/api/media';
import { useApplyAsAgent } from '@/api/agencies';
import type { AgentWizardState } from '../types';

export function useAgentSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyMutation = useApplyAsAgent();

  async function submit(state: AgentWizardState): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    let avatarUrl: string | undefined;
    if (state.headshotFile) {
      avatarUrl = await mediaService.upload(state.headshotFile, 'agent-avatars');
    }

    let licenseDocUrl: string | undefined;
    if (state.licenseDocFile) {
      licenseDocUrl = await mediaService.upload(state.licenseDocFile, 'agent-docs');
    }

    await applyMutation.mutateAsync({
      agencyMode: state.agencyMode,
      existingAgencyId: state.existingAgencyId,
      newAgency:
        state.agencyMode === 'create'
          ? {
              name: state.newAgencyName ?? '',
              address: state.newAgencyAddress ?? '',
              phone: state.newAgencyPhone ?? '',
            }
          : undefined,
      licenseNo: state.licenseNo,
      licenseDocUrl,
      bio: state.bio,
      yearsActive: state.yearsActive,
      avatarUrl,
    });

    setIsSuccess(true);
    setIsSubmitting(false);
  }

  async function handleSubmit(state: AgentWizardState): Promise<void> {
    try {
      await submit(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  }

  return { handleSubmit, isSubmitting, isSuccess, error };
}
