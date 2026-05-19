import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Paperclip } from 'lucide-react';
import type { AgentWizardState } from '../types';

const schema = z.object({
  licenseNo: z.string().min(3, 'Licence number is required'),
  bio: z.string().min(30, 'Bio must be at least 30 characters').max(1000, 'Bio must be under 1000 characters'),
  yearsActive: z.number({ invalid_type_error: 'Enter years of experience' }).min(0).max(50),
});

type Fields = z.infer<typeof schema>;

interface Step3Props {
  state: AgentWizardState;
  onNext: (patch: Partial<AgentWizardState>) => void;
  onBack: () => void;
}

export function Step3License({ state, onNext, onBack }: Step3Props) {
  const docRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      licenseNo: state.licenseNo,
      bio: state.bio,
      yearsActive: state.yearsActive,
    },
  });

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onNext({ licenseDocFile: file });
  }

  function onSubmit(data: Fields) {
    onNext({ ...data, step: 4 });
  }

  const bioValue = watch('bio');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-neutral-500">
        Your licence details will be verified by our team before your profile goes live.
      </p>

      <Input
        label="Real estate licence number"
        placeholder="e.g. RERA-GJ-12345"
        {...register('licenseNo')}
        error={errors.licenseNo?.message}
      />

      <div>
        <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
          Licence document <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <button
          type="button"
          onClick={() => docRef.current?.click()}
          className="flex items-center gap-2 text-sm text-brand-primary font-medium hover:underline"
        >
          <Paperclip className="w-4 h-4" />
          {state.licenseDocFile ? state.licenseDocFile.name : 'Attach PDF or image'}
        </button>
        <input
          ref={docRef}
          type="file"
          accept=".pdf,image/jpeg,image/png"
          className="hidden"
          onChange={handleDocChange}
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
          Professional bio
        </label>
        <textarea
          className="w-full border border-neutral-300 rounded-btn px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          rows={4}
          placeholder="Tell buyers and sellers about your experience, specialisations, and approach…"
          {...register('bio')}
        />
        <div className="flex justify-between mt-1">
          {errors.bio ? (
            <p className="text-xs text-red-500">{errors.bio.message}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-neutral-400">{bioValue?.length ?? 0} / 1000</p>
        </div>
      </div>

      <Input
        label="Years of experience"
        type="number"
        min={0}
        max={50}
        {...register('yearsActive', { valueAsNumber: true })}
        error={errors.yearsActive?.message}
      />

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
