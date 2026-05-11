import { useDispatch, useSelector } from 'react-redux';
import { Dropdown } from '@/components/ui';
import { selectSearchFilters, setSortBy } from '../store/searchSlice';

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Price (low to high)', value: 'price_asc' },
  { label: 'Price (high to low)', value: 'price_desc' },
] as const;

interface SortControlsProps {
  total: number;
}

export function SortControls({ total }: SortControlsProps) {
  const dispatch = useDispatch();
  const { sortBy } = useSelector(selectSearchFilters);

  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-neutral-500">
        <span className="font-semibold text-neutral-900">{total.toLocaleString()}</span>{' '}
        {total === 1 ? 'property' : 'properties'} found
      </p>
      <Dropdown
        options={[...SORT_OPTIONS]}
        value={sortBy}
        onChange={(v) => dispatch(setSortBy(v as typeof sortBy))}
        className="w-48"
      />
    </div>
  );
}
