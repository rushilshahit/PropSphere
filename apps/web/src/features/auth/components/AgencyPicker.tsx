import { useState } from 'react';
import { Search, Building2, X } from 'lucide-react';
import { useAgencySearch, type AgencySummary } from '@/api/agencies';
import { useDebounce } from '@/hooks/useDebounce';

interface AgencyPickerProps {
  selected: AgencySummary | null;
  onSelect: (agency: AgencySummary) => void;
  onClear: () => void;
}

export function AgencyPicker({ selected, onSelect, onClear }: AgencyPickerProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: results = [], isFetching } = useAgencySearch(debouncedQuery);

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 border-2 border-brand-primary rounded-card bg-blue-50">
        {selected.logo_url ? (
          <img src={selected.logo_url} alt={selected.name} className="w-9 h-9 rounded-md object-contain flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-primary truncate">{selected.name}</p>
          <p className="text-xs text-neutral-500">{selected.suburb}, {selected.state}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
          aria-label="Change agency"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your agency…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-300 rounded-btn outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
      </div>

      {debouncedQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-card shadow-card-hover max-h-52 overflow-y-auto">
          {isFetching ? (
            <p className="text-sm text-neutral-400 px-4 py-3">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-neutral-400 px-4 py-3">No agencies found for &ldquo;{debouncedQuery}&rdquo;</p>
          ) : (
            results.map((agency) => (
              <button
                key={agency.id}
                type="button"
                onClick={() => { onSelect(agency); setQuery(''); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
              >
                {agency.logo_url ? (
                  <img src={agency.logo_url} alt={agency.name} className="w-8 h-8 rounded-md object-contain flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{agency.name}</p>
                  <p className="text-xs text-neutral-500">{agency.suburb}, {agency.state}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
