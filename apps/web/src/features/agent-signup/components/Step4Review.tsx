import { Button } from '@/components/ui';
import { UserCircle } from 'lucide-react';
import type { AgentWizardState } from '../types';

interface ReviewRowProps {
  label: string;
  value: string | undefined;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="flex justify-between py-2.5 border-b border-neutral-100 last:border-0 text-sm">
      <span className="text-neutral-500 font-medium">{label}</span>
      <span className="text-neutral-800 text-right max-w-[60%] truncate">{value ?? '—'}</span>
    </div>
  );
}

interface Step4Props {
  state: AgentWizardState;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step4Review({ state, onSubmit, onBack, isSubmitting }: Step4Props) {
  const agencyDisplay =
    state.agencyMode === 'join'
      ? state.existingAgencyName
      : `${state.newAgencyName ?? ''} (new agency)`;

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Please review your application before submitting. Our team will verify your details within 2 business days.
      </p>

      <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-btn">
        {state.headshotPreview ? (
          <img
            src={state.headshotPreview}
            alt="Headshot"
            className="w-14 h-14 rounded-full object-cover border border-neutral-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-neutral-400" />
          </div>
        )}
        <div>
          <p className="font-semibold text-neutral-900">{state.fullName}</p>
          <p className="text-sm text-neutral-500">{state.phone}</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-btn px-4">
        <ReviewRow label="Full name" value={state.fullName} />
        <ReviewRow label="Phone" value={state.phone} />
        <ReviewRow label="Agency" value={agencyDisplay} />
        <ReviewRow label="Licence number" value={state.licenseNo} />
        <ReviewRow
          label="Licence document"
          value={state.licenseDocFile ? state.licenseDocFile.name : 'Not provided'}
        />
        <ReviewRow label="Years of experience" value={String(state.yearsActive)} />
        <ReviewRow label="Bio" value={state.bio.length > 80 ? `${state.bio.slice(0, 80)}…` : state.bio} />
      </div>

      <p className="text-xs text-neutral-400">
        By submitting you agree to our Terms of Service and acknowledge that your licence details will be verified.
      </p>

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} loading={isSubmitting}>
          Submit Application
        </Button>
      </div>
    </div>
  );
}
