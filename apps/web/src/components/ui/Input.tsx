import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-neutral-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border rounded-btn px-3 py-2.5 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-neutral-300',
            props.disabled && 'opacity-50 bg-neutral-50 cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {helper && !error && <p className="text-xs text-neutral-500 mt-1">{helper}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
