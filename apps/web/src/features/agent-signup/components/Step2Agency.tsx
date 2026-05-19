import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAgencySearch } from '@/api/agencies';
import type { AgentWizardState } from '../types';

const joinSchema = z.object({
  agencyQuery: z.string(),
});

const createSchema = z.object({
  newAgencyName: z.string().min(2, 'Agency name is required'),
  newAgencyAddress: z.string().min(5, 'Address is required'),
  newAgencyPhone: z.string().min(7, 'Phone is required'),
});

type JoinFields = z.infer<typeof joinSchema>;
type CreateFields = z.infer<typeof createSchema>;

interface Step2Props {
  state: AgentWizardState;
  onNext: (patch: Partial<AgentWizardState>) => void;
  onBack: () => void;
}

export function Step2Agency({ state, onNext, onBack }: Step2Props) {
  const [mode, setMode] = useState<'join' | 'create'>(state.agencyMode);
  const [query, setQuery] = useState(state.existingAgencyName ?? '');
  const [selectedAgency, setSelectedAgency] = useState<{ id: string; name: string } | null>(
    state.existingAgencyId ? { id: state.existingAgencyId, name: state.existingAgencyName ?? '' } : null,
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [joinError, setJoinError] = useState('');

  const { data: agencyResults } = useAgencySearch(query);

  const createForm = useForm<CreateFields>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      newAgencyName: state.newAgencyName ?? '',
      newAgencyAddress: state.newAgencyAddress ?? '',
      newAgencyPhone: state.newAgencyPhone ?? '',
    },
  });

  function handleSelectAgency(agency: { id: string; name: string }) {
    setSelectedAgency(agency);
    setQuery(agency.name);
    setDropdownOpen(false);
    setJoinError('');
  }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgency) {
      setJoinError('Please select an agency from the list');
      return;
    }
    onNext({
      agencyMode: 'join',
      existingAgencyId: selectedAgency.id,
      existingAgencyName: selectedAgency.name,
      step: 3,
    });
  }

  function handleCreateSubmit(data: CreateFields) {
    onNext({
      agencyMode: 'create',
      newAgencyName: data.newAgencyName,
      newAgencyAddress: data.newAgencyAddress,
      newAgencyPhone: data.newAgencyPhone,
      step: 3,
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Are you joining an existing agency or starting a new one?
      </p>

      <div className="flex gap-3">
        {(['join', 'create'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 py-3 px-4 rounded-btn border text-sm font-medium transition-colors',
              mode === m
                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                : 'border-neutral-300 text-neutral-600 hover:border-neutral-400',
            )}
          >
            {m === 'join' ? 'Join existing agency' : 'Create new agency'}
          </button>
        ))}
      </div>

      {mode === 'join' && (
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Search agency by name"
              placeholder="e.g. PropIndia Realty"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedAgency(null);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              error={joinError}
            />
            {dropdownOpen && agencyResults && agencyResults.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-btn shadow-card-hover max-h-56 overflow-y-auto">
                {agencyResults.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
                      onClick={() => handleSelectAgency(a)}
                    >
                      <span className="font-medium">{a.name}</span>
                      <span className="text-neutral-400 ml-2 text-xs">
                        {a.suburb}, {a.state}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedAgency && (
            <p className="text-sm text-green-700 bg-green-50 rounded-btn px-3 py-2">
              Selected: <strong>{selectedAgency.name}</strong>
            </p>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}

      {mode === 'create' && (
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <Input
            label="Agency name"
            placeholder="e.g. Skyline Properties"
            {...createForm.register('newAgencyName')}
            error={createForm.formState.errors.newAgencyName?.message}
          />
          <Input
            label="Office address"
            placeholder="e.g. 12 SG Highway, Ahmedabad 380054"
            {...createForm.register('newAgencyAddress')}
            error={createForm.formState.errors.newAgencyAddress?.message}
          />
          <Input
            label="Office phone"
            type="tel"
            placeholder="+91 79 1234 5678"
            {...createForm.register('newAgencyPhone')}
            error={createForm.formState.errors.newAgencyPhone?.message}
          />

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}
    </div>
  );
}
