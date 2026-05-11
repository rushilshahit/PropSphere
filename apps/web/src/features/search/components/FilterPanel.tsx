import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { PropertyType } from '@propsphere/types';
import { formatPrice } from '@propsphere/utils';
import { Button, RangeSlider } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  resetFilters,
  selectActiveFilterCount,
  selectSearchFilters,
  setBedrooms,
  setFeatures,
  setFilters,
  setPriceRange,
  setPropertyTypes,
} from '../store/searchSlice';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'unit', label: 'Unit' },
  { value: 'land', label: 'Land' },
  { value: 'rural', label: 'Rural' },
];

const SEGMENT_OPTS = ['Any', '1', '2', '3', '4', '5+'];
const FEATURES = ['pool', 'gym', 'garden', 'balcony', 'parking', 'pet-friendly', 'furnished', 'lift'];

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
        const num = opt === 'Any' ? undefined : opt === '5+' ? 5 : Number(opt);
        const isActive = opt === 'Any' ? value === undefined : value === num;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(isActive ? undefined : num)}
            className={cn(
              'px-3 py-1.5 rounded-btn text-sm font-medium border transition-all',
              isActive
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-brand-primary',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface FilterPanelProps {
  onClose?: () => void;
}

export function FilterPanel({ onClose }: FilterPanelProps) {
  const dispatch = useDispatch();
  const filters = useSelector(selectSearchFilters);
  const activeCount = useSelector(selectActiveFilterCount);

  const priceMin = filters.priceMin ?? 0;
  const priceMax = filters.priceMax ?? 10_000_000;

  function togglePropertyType(type: PropertyType) {
    const next = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((t) => t !== type)
      : [...filters.propertyTypes, type];
    dispatch(setPropertyTypes(next));
  }

  function toggleFeature(feat: string) {
    const next = filters.features.includes(feat)
      ? filters.features.filter((f) => f !== feat)
      : [...filters.features, feat];
    dispatch(setFeatures(next));
  }

  return (
    <div className="w-full">
      <Section title="Price Range">
        <RangeSlider
          min={0}
          max={10_000_000}
          step={100_000}
          value={[priceMin, priceMax]}
          onChange={([lo, hi]) => dispatch(setPriceRange({ priceMin: lo, priceMax: hi }))}
          formatLabel={formatPrice}
          className="mb-3"
        />
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ''}
            onChange={(e) =>
              dispatch(setFilters({ priceMin: e.target.value ? Number(e.target.value) : undefined }))
            }
            className="w-1/2 border border-neutral-300 rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ''}
            onChange={(e) =>
              dispatch(setFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined }))
            }
            className="w-1/2 border border-neutral-300 rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-brand-primary',
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
          onChange={(v) => dispatch(setBedrooms(v))}
        />
      </Section>

      <Section title="Bathrooms">
        <Segment
          options={['Any', '1', '2', '3+']}
          value={filters.bathrooms}
          onChange={(v) => dispatch(setFilters({ bathrooms: v }))}
        />
      </Section>

      <Section title="Car Spaces">
        <Segment
          options={['Any', '1', '2', '3+']}
          value={filters.carSpaces}
          onChange={(v) => dispatch(setFilters({ carSpaces: v }))}
        />
      </Section>

      <Section title="Features">
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((feat) => (
            <button
              key={feat}
              type="button"
              onClick={() => toggleFeature(feat)}
              className={cn(
                'px-3 py-1 rounded-badge text-xs font-medium border capitalize transition-all',
                filters.features.includes(feat)
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-brand-primary',
              )}
            >
              {feat}
            </button>
          ))}
        </div>
      </Section>

      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch(resetFilters())}
          className="flex-1"
        >
          Reset {activeCount > 0 && `(${activeCount})`}
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
