import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { ListingType } from '@propsphere/types';
import { Tabs } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import {
  selectSearchFilters,
  setListingType,
  setLocation,
  setLocationCoords,
} from '../store/searchSlice';
import {
  useMapboxAutocomplete,
  type GeocodingFeature,
} from '../hooks/useMapboxAutocomplete';

const LISTING_TABS = [
  { label: 'Buy', value: 'buy', activeClassName: 'bg-brand-primary text-white' },
  { label: 'Rent', value: 'rent', activeClassName: 'bg-brand-secondary text-white' },
  { label: 'Sold', value: 'sold', activeClassName: 'bg-neutral-700 text-white' },
];

export function SearchBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { listingType, query } = useSelector(selectSearchFilters);

  const [inputValue, setInputValue] = useState(query);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(inputValue, 300);
  const { data: suggestions = [] } = useMapboxAutocomplete(debouncedInput);

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

  function handleSelect(feature: GeocodingFeature) {
    const name = feature.place_name.split(',')[0];
    setInputValue(name);
    dispatch(setLocation(name));
    dispatch(setLocationCoords({ lat: feature.center[1], lng: feature.center[0] }));
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
        handleSelect(suggestions[activeIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-3">
        <Tabs
          tabs={LISTING_TABS}
          value={listingType}
          onChange={(v) => dispatch(setListingType(v as ListingType))}
        />
      </div>

      <div ref={containerRef} className="relative">
        <div className="flex h-14 bg-white rounded-card shadow-card overflow-hidden border border-neutral-200 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
          <div className="flex items-center pl-4 text-neutral-400">
            <MapPin className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search suburb, postcode or area"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
              setActiveIndex(-1);
            }}
            onFocus={() => inputValue.length >= 2 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 text-base bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 bg-brand-primary text-white font-medium text-sm hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-card shadow-modal border border-neutral-200 overflow-hidden">
            {suggestions.map((feature, idx) => {
              const [primary, ...rest] = feature.place_name.split(',');
              return (
                <button
                  key={feature.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(feature);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${
                    idx === activeIndex ? 'bg-neutral-100' : ''
                  }`}
                >
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-neutral-900">{primary}</span>
                    {rest.length > 0 && (
                      <span className="text-xs text-neutral-500 ml-1">
                        {rest.join(',')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
