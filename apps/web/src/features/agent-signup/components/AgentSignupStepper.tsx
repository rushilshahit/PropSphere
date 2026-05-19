import { cn } from '@/lib/cn';

const STEPS = [
  { n: 1, label: 'Personal Details' },
  { n: 2, label: 'Agency' },
  { n: 3, label: 'Licence & Bio' },
  { n: 4, label: 'Review' },
];

interface AgentSignupStepperProps {
  current: 1 | 2 | 3 | 4;
}

export function AgentSignupStepper({ current }: AgentSignupStepperProps) {
  return (
    <nav aria-label="Signup progress" className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const done = current > step.n;
        const active = current === step.n;
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  done && 'bg-brand-primary text-white',
                  active && 'bg-brand-primary text-white ring-4 ring-brand-primary/20',
                  !done && !active && 'bg-neutral-200 text-neutral-500',
                )}
              >
                {done ? '✓' : step.n}
              </div>
              <span
                className={cn(
                  'text-[11px] mt-1 font-medium whitespace-nowrap',
                  active ? 'text-brand-primary' : 'text-neutral-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-12 sm:w-20 mb-4 mx-1 transition-colors',
                  done ? 'bg-brand-primary' : 'bg-neutral-200',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
