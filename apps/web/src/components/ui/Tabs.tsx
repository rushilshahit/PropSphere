import { cn } from '@/lib/cn';

interface TabOption {
  label: string;
  value: string;
  activeClassName?: string;
}

interface TabsProps {
  tabs: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('bg-white rounded-full p-1 inline-flex shadow-sm', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all duration-150',
              isActive
                ? (tab.activeClassName ?? 'bg-brand-primary text-white')
                : 'text-neutral-600 hover:bg-neutral-100',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
