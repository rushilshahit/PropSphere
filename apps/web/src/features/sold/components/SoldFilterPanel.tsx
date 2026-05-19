import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { PropertyType } from '@propsphere/types';
import { formatPrice } from '@propsphere/utils';
import { Button, RangeSlider } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { SoldFiltersState } from '../types';
import { SALE_METHOD_OPTIONS, SOLD_AFTER_PRESETS } from '../types';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'unit', label: 'Unit' },
  { value: 'land', label: 'Land' },
  { value: 'rural', label: 'Rural' },
];

const SEGMENT_OPTS = ['Any', '1', '2', '3', '4', '5+'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-neutral-200 pb-4 mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-neutral-900 mb-3"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function Segment({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => {
        const num = opt === 'Any' ? undefined : opt.endsWith('+') ? Number(opt.slice(0, -1)) : Number(opt);
        const isActive = opt === 'Any' ? value === undefined : value === num;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(isActive ? undefined : num)}
            className={cn(
              'px-3 py-1.5 rounded-btn text-sm font-medium border transition-all',
              isActive
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-red-600',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface SoldFilterPanelProps {
  filters: SoldFiltersState;
  onChange: (patch: Partial<SoldFiltersState>) => void;
  onReset: () => void;
  onClose?: () => void;
}

function isoDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function SoldFilterPanel({ filters, onChange, onReset, onClose }: SoldFilterPanelProps) {
  const priceMin = filters.priceMin ?? 0;
  const priceMax = filters.priceMax ?? 10_000_000;

  function togglePropertyType(type: string) {
    const next = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((t) => t !== type)
      : [...filters.propertyTypes, type];
    onChange({ propertyTypes: next });
  }

  function toggleSaleMethod(value: string) {
    onChange({ saleMethod: filters.saleMethod === value ? undefined : value });
  }

  function handleSoldAfterPreset(months: number) {
    const iso = isoDateMonthsAgo(months);
    onChange({ soldAfter: filters.soldAfter === iso ? undefined : iso });
  }

  return (
    <div className="w-full">
      <Section title="Date Sold">
        <div className="flex flex-wrap gap-2">
          {SOLD_AFTER_PRESETS.map(({ label, months }) => {
            const iso = isoDateMonthsAgo(months);
            const isActive = filters.soldAfter === iso;
            return (
              <button
                key={months}
                type="button"
                onClick={() => handleSoldAfterPreset(months)}
                className={cn(
                  'px-3 py-1.5 rounded-btn text-sm font-medium border transition-all',
                  isActive
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-red-600',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Sale Method">
        <div className="flex flex-wrap gap-2">
          {SALE_METHOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleSaleMethod(value)}
              className={cn(
                'px-3 py-1.5 rounded-btn text-sm font-medium border transition-all',
                filters.saleMethod === value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-red-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Price Range">
        <RangeSlider
          min={0}
          max={10_000_000}
          step={100_000}
          value={[priceMin, priceMax]}
          onChange={([lo, hi]) => onChange({ priceMin: lo, priceMax: hi })}
          formatLabel={formatPrice}
          className="mb-3"
        />
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ''}
            onChange={(e) => onChange({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
            className="w-1/2 border border-neutral-300 rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ''}
            onChange={(e) => onChange({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
            className="w-1/2 border border-neutral-300 rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
        </div>
      </Section>

      <Section title="Property Type">
        <div className="grid grid-cols-3 gap-2">
          {PROPERTY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => togglePropertyType(value)}
              className={cn(
                'px-2 py-1.5 rounded-btn text-xs font-medium border transition-all text-center',
                filters.propertyTypes.includes(value)
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-red-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Bedrooms">
        <Segment
          options={SEGMENT_OPTS}
          value={filters.bedrooms}
          onChange={(v) => onChange({ bedrooms: v })}
        />
      </Section>

      <Section title="Bathrooms">
        <Segment
          options={['Any', '1', '2', '3+']}
          value={filters.bathrooms}
          onChange={(v) => onChange({ bathrooms: v })}
        />
      </Section>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onReset} className="flex-1">
          Reset
        </Button>
        {onClose && (
          <Button size="sm" onClick={onClose} className="flex-1">
            Show results
          </Button>
        )}
      </div>
    </div>
  );
}
