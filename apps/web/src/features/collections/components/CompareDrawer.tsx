import { useQueries } from '@tanstack/react-query';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import type { PropertyDetail } from '@propsphere/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCompareIds,
  selectIsCompareDrawerOpen,
  removeFromCompare,
  toggleCompareDrawer,
  clearCompare,
} from '@/features/collections/store/collectionsSlice';
import { formatPrice } from '@propsphere/utils';

async function fetchProperty(id: string): Promise<PropertyDetail> {
  const res = await fetch(`/api/properties/${id}`);
  if (!res.ok) throw new Error('Failed to fetch property');
  const json = (await res.json()) as { data: PropertyDetail };
  return json.data;
}

function daysOnMarket(p: PropertyDetail): string {
  if (!p.published_at) return '—';
  const days = Math.floor(
    (Date.now() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  return `${days} day${days === 1 ? '' : 's'}`;
}

interface CompareRow {
  label: string;
  render: (p: PropertyDetail) => string;
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'Price', render: (p) => (p.price ? formatPrice(p.price) : p.price_display ?? '—') },
  { label: 'Bedrooms', render: (p) => (p.bedrooms != null ? String(p.bedrooms) : '—') },
  { label: 'Bathrooms', render: (p) => (p.bathrooms != null ? String(p.bathrooms) : '—') },
  { label: 'Car spaces', render: (p) => (p.car_spaces != null ? String(p.car_spaces) : '—') },
  { label: 'Land size', render: (p) => (p.land_size_sqm != null ? `${p.land_size_sqm} m²` : '—') },
  { label: 'Suburb', render: (p) => p.suburb },
  { label: 'Days on market', render: daysOnMarket },
];

export function CompareDrawer() {
  const dispatch = useAppDispatch();
  const compareIds = useAppSelector(selectCompareIds);
  const isOpen = useAppSelector(selectIsCompareDrawerOpen);

  const queries = useQueries({
    queries: compareIds.map((id) => ({
      queryKey: ['properties', id],
      queryFn: () => fetchProperty(id),
      staleTime: 60_000,
    })),
  });

  const properties = queries.map((q) => q.data ?? null);

  if (compareIds.length < 2) return null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => dispatch(toggleCompareDrawer())}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-btn shadow-card-hover hover:bg-brand-primary-dark transition-colors text-sm font-medium"
        >
          <ChevronUp className="w-4 h-4" />
          Compare ({compareIds.length})
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-modal"
          style={{ height: '60vh' }}
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-900 text-sm">
              Compare properties ({compareIds.length})
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch(clearCompare())}
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => dispatch(toggleCompareDrawer())}
                className="text-neutral-400 hover:text-neutral-600"
                aria-label="Minimise"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-auto h-[calc(60vh-53px)]">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="text-left px-6 py-3 text-neutral-500 font-medium w-32">Feature</th>
                  {properties.map((p, i) => (
                    <th key={compareIds[i]} className="px-4 py-3 text-left min-w-[180px]">
                      {p ? (
                        <div className="relative pr-4">
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCompare(compareIds[i]))}
                            className="absolute top-0 right-0 bg-neutral-100 rounded-full p-0.5 hover:bg-red-100 hover:text-red-500 transition-colors"
                            aria-label="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {p.images[0] && (
                            <img
                              src={p.images[0].cdn_url}
                              alt={p.headline ?? p.suburb}
                              className="w-full h-20 object-cover rounded-btn mb-2"
                            />
                          )}
                          <p className="text-xs font-medium text-neutral-800 leading-tight truncate">
                            {[
                              p.unit_number
                                ? `${p.unit_number}/${p.street_number}`
                                : p.street_number,
                              p.street_name,
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">{p.suburb}</p>
                        </div>
                      ) : (
                        <div className="h-28 bg-neutral-100 rounded-btn animate-pulse" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(({ label, render }) => (
                  <tr key={label} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-6 py-3 text-neutral-500 font-medium whitespace-nowrap">
                      {label}
                    </td>
                    {properties.map((p, i) => (
                      <td key={compareIds[i]} className="px-4 py-3 text-neutral-800">
                        {p ? render(p) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
