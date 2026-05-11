import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  light?: boolean;
}

export function SectionHeader({ title, subtitle, action, light = false }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        <h2 className={`text-2xl md:text-3xl font-bold ${light ? 'text-white' : 'text-neutral-900'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-base mt-1 ${light ? 'text-white/70' : 'text-neutral-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
