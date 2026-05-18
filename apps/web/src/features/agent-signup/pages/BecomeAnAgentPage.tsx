import { useState } from 'react';
import { AgentSignupStepper } from '../components/AgentSignupStepper';
import { Step1PersonalDetails } from '../components/Step1PersonalDetails';
import { Step2Agency } from '../components/Step2Agency';
import { Step3License } from '../components/Step3License';
import { Step4Review } from '../components/Step4Review';
import { AgentSignupSuccess } from '../components/AgentSignupSuccess';
import { useAgentSignup } from '../hooks/useAgentSignup';
import { WIZARD_DEFAULTS } from '../types';
import type { AgentWizardState } from '../types';

export default function BecomeAnAgentPage() {
  const [wizardState, setWizardState] = useState<AgentWizardState>(WIZARD_DEFAULTS);
  const { handleSubmit, isSubmitting, isSuccess, error } = useAgentSignup();

  function patch(updates: Partial<AgentWizardState>) {
    setWizardState((prev) => ({ ...prev, ...updates }));
  }

  function goBack() {
    setWizardState((prev) => ({ ...prev, step: (prev.step - 1) as AgentWizardState['step'] }));
  }

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <AgentSignupSuccess />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Become an Agent</h1>
        <p className="text-sm text-neutral-500 mt-1">
          List your properties and connect with buyers on PropSphere.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <AgentSignupStepper current={wizardState.step} />
      </div>

      <div className="bg-white border border-neutral-200 rounded-card shadow-card p-6">
        {wizardState.step === 1 && (
          <Step1PersonalDetails state={wizardState} onNext={patch} />
        )}
        {wizardState.step === 2 && (
          <Step2Agency state={wizardState} onNext={patch} onBack={goBack} />
        )}
        {wizardState.step === 3 && (
          <Step3License state={wizardState} onNext={patch} onBack={goBack} />
        )}
        {wizardState.step === 4 && (
          <Step4Review
            state={wizardState}
            onSubmit={() => { void handleSubmit(wizardState); }}
            onBack={goBack}
            isSubmitting={isSubmitting}
          />
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-btn px-3 py-2 mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
