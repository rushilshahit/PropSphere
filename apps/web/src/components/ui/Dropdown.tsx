import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown({ options, value, onChange, placeholder, className, ...props }: DropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none w-full border border-neutral-300 rounded-btn px-3 py-2.5 pr-8 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
          'bg-white cursor-pointer',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
