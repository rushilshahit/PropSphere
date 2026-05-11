import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { AlertFrequency } from '@propsphere/types';
import { selectSearchFilters } from '@/features/search/store/searchSlice';
import { useCreateSavedSearch } from '@/api/notifications';
import { Button } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREQ_OPTIONS: { value: AlertFrequency; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
];

export function SaveSearchModal({ isOpen, onClose }: SaveSearchModalProps) {
  const { toast } = useToast();
  const filters = useSelector(selectSearchFilters);
  const { mutateAsync: createSavedSearch, isPending } = useCreateSavedSearch();

  const defaultName = filters.query
    ? filters.query
    : filters.listingType === 'rent'
      ? 'Rental search'
      : 'Property search';

  const [name, setName] = useState(defaultName);
  const [freq, setFreq] = useState<AlertFrequency>('instant');

  if (!isOpen) return null;

  async function handleSave() {
    await createSavedSearch({ name: name.trim() || defaultName, filters, alertFreq: freq });
    toast('Search saved!', 'success');
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white rounded-card shadow-modal animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-brand-primary" />
            <h3 className="text-base font-semibold text-neutral-900">Save this search</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="search-name" className="block text-sm font-medium text-neutral-700 mb-1">
                Search name
              </label>
              <input
                id="search-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-btn focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Alert frequency</label>
              <div className="space-y-2">
                {FREQ_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-3 rounded-btn border cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="freq"
                      value={opt.value}
                      checked={freq === opt.value}
                      onChange={() => setFreq(opt.value)}
                      className="accent-brand-primary"
                    />
                    <span className="text-sm text-neutral-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button size="sm" className="flex-1" loading={isPending} onClick={handleSave}>
              Save search
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
