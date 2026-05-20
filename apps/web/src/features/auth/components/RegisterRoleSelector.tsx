import { Home, Building2, Briefcase } from 'lucide-react';

export type SelectableRole = 'buyer' | 'seller' | 'agent';

interface RegisterRoleSelectorProps {
  value: SelectableRole;
  onChange: (role: SelectableRole) => void;
}

const ROLES: { value: SelectableRole; label: string; description: string; Icon: typeof Home }[] = [
  {
    value: 'buyer',
    label: 'Buyer / Renter',
    description: 'Looking to buy or rent a property',
    Icon: Home,
  },
  {
    value: 'seller',
    label: 'Seller / Owner',
    description: 'Want to list or sell your property',
    Icon: Building2,
  },
  {
    value: 'agent',
    label: 'Agent / Professional',
    description: 'Licensed real estate agent',
    Icon: Briefcase,
  },
];

export function RegisterRoleSelector({ value, onChange }: RegisterRoleSelectorProps) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Select your role">
      {ROLES.map(({ value: roleValue, label, description, Icon }) => {
        const selected = value === roleValue;
        return (
          <button
            key={roleValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(roleValue)}
            className={`w-full flex items-center gap-4 p-4 rounded-card border-2 text-left transition-colors ${
              selected
                ? 'border-brand-primary bg-blue-50'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div
              className={`flex-shrink-0 p-2 rounded-lg ${
                selected ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${selected ? 'text-brand-primary' : 'text-neutral-900'}`}>
                {label}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
