import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { ListingType } from '@propsphere/types';
import { useSuburbAutocomplete } from '@/api/suburbs';
import { Tabs } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { selectSearchFilters, setListingType, setLocation } from '@/features/search/store/searchSlice';

const LISTING_TABS = [
  { label: 'Buy', value: 'buy', activeClassName: 'bg-brand-primary text-white' },
  { label: 'Rent', value: 'rent', activeClassName: 'bg-brand-secondary text-white' },
  { label: 'Sold', value: 'sold', activeClassName: 'bg-neutral-700 text-white' },
];

export function SearchWidget() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { listingType, query } = useSelector(selectSearchFilters);

  const [inputValue, setInputValue] = useState(query);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(inputValue, 300);
  const { data: suggestions = [] } = useSuburbAutocomplete(debouncedInput);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(name: string) {
    setInputValue(name);
    dispatch(setLocation(name));
    setShowDropdown(false);
    setActiveIndex(-1);
  }

  function handleSubmit() {
    dispatch(setLocation(inputValue));
    navigate(`/${listingType}?q=${encodeURIComponent(inputValue)}`);
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex].name);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="bg-white rounded-[16px] shadow-modal p-3 md:p-4">
      <div className="mb-3 flex justify-center">
        <Tabs
          tabs={LISTING_TABS}
          value={listingType}
          onChange={(v) => dispatch(setListingType(v as ListingType))}
        />
      </div>

      <div ref={containerRef} className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center bg-neutral-50 border border-neutral-200 rounded-lg focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all px-3 h-12">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search suburb, postcode..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowDropdown(true);
                setActiveIndex(-1);
              }}
              onFocus={() => inputValue.length >= 2 && setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 min-w-[120px] h-12 bg-brand-primary text-white font-medium text-sm rounded-lg hover:bg-brand-primary-dark transition-colors px-5"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-card shadow-modal border border-neutral-200 overflow-hidden">
            {suggestions.map((suburb, idx) => (
              <button
                key={suburb.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suburb.name);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${
                  idx === activeIndex ? 'bg-neutral-100' : ''
                }`}
              >
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-neutral-900">{suburb.name}</span>
                  <span className="text-xs text-neutral-500 ml-2">
                    {suburb.state} {suburb.postcode}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
