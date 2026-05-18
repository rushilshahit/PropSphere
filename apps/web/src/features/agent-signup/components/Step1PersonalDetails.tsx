import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { UserCircle } from 'lucide-react';
import type { AgentWizardState } from '../types';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
});

type Fields = z.infer<typeof schema>;

interface Step1Props {
  state: AgentWizardState;
  onNext: (patch: Partial<AgentWizardState>) => void;
}

export function Step1PersonalDetails({ state, onNext }: Step1Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: state.fullName, phone: state.phone },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onNext({ headshotFile: file, headshotPreview: preview });
  }

  function onSubmit(data: Fields) {
    onNext({ ...data, step: 2 });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-neutral-500">
        Tell us about yourself. This information will appear on your public agent profile.
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-neutral-300 hover:border-brand-primary flex items-center justify-center overflow-hidden transition-colors"
        >
          {state.headshotPreview ? (
            <img src={state.headshotPreview} alt="Headshot preview" className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-10 h-10 text-neutral-300" />
          )}
        </button>
        <div>
          <p className="text-sm font-medium text-neutral-700">Profile photo</p>
          <p className="text-xs text-neutral-400 mt-0.5">JPG or PNG, at least 200×200px</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-brand-primary font-medium mt-1 hover:underline"
          >
            {state.headshotPreview ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Input
        label="Full name"
        placeholder="e.g. Priya Mehta"
        {...register('fullName')}
        error={errors.fullName?.message}
      />

      <Input
        label="Mobile number"
        type="tel"
        placeholder="+91 98765 43210"
        {...register('phone')}
        error={errors.phone?.message}
      />

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
