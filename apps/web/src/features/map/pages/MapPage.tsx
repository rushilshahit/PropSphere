import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Locate, Map as MapIcon, PenLine } from 'lucide-react';
import { usePropertySearch } from '@/api/properties';
import { selectSearchFilters } from '@/features/search/store/searchSlice';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import {
  clearActiveProperty,
  selectActivePropertyId,
  selectDrawnBounds,
  selectIsDrawMode,
  setActiveProperty,
  setDrawMode,
  setSearchBbox,
} from '../store/mapSlice';
import { MapView } from '../components/MapView';

export default function MapPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const filters = useSelector(selectSearchFilters);
  const activePropertyId = useSelector(selectActivePropertyId);
  const isDrawMode = useSelector(selectIsDrawMode);
  const drawnBounds = useSelector(selectDrawnBounds);

  const { data } = usePropertySearch(filters);
  const properties = data?.pages.flatMap((p) => p.items) ?? [];

  const handleCurrentLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      // MapView holds the actual MapRef; we fly via a custom event
      const event = new CustomEvent('map:flyto', {
        detail: { longitude: coords.longitude, latitude: coords.latitude, zoom: 14 },
      });
      window.dispatchEvent(event);
    });
  }, []);

  const handleSearchThisArea = useCallback(() => {
    if (!drawnBounds) return;
    const lngs = drawnBounds.map(([lng]) => lng);
    const lats = drawnBounds.map(([, lat]) => lat);
    dispatch(
      setSearchBbox({
        swLat: Math.min(...lats),
        swLng: Math.min(...lngs),
        neLat: Math.max(...lats),
        neLng: Math.max(...lngs),
      }),
    );
    navigate('/buy');
  }, [drawnBounds, dispatch, navigate]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left panel — hidden on mobile */}
      <aside className="hidden md:flex flex-col w-80 shrink-0 border-r border-neutral-200 overflow-y-auto">
        <div className="p-3 border-b border-neutral-100">
          <p className="text-sm font-medium text-neutral-700">
            {properties.length} properties
          </p>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {properties.map((property) => (
            <div
              key={property.id}
              onMouseEnter={() => dispatch(setActiveProperty(property.id))}
              onMouseLeave={() => dispatch(clearActiveProperty())}
              className={`rounded-card transition-shadow ${
                property.id === activePropertyId ? 'ring-2 ring-brand-primary' : ''
              }`}
            >
              <PropertyCard property={property} compact />
            </div>
          ))}
        </div>
      </aside>

      {/* Map panel */}
      <div className="relative flex-1">
        <MapView />

        {/* Draw area button */}
        <button
          type="button"
          onClick={() => dispatch(setDrawMode(true))}
          className={`
            absolute top-3 right-3 z-10
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            border shadow-md transition-colors
            ${isDrawMode
              ? 'bg-brand-primary text-white border-brand-primary'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }
          `}
        >
          <PenLine className="w-4 h-4" />
          Draw area
        </button>

        {/* Current location button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="absolute bottom-8 right-4 z-10 bg-white border border-neutral-200 rounded-full p-2.5 shadow-md hover:bg-neutral-50 transition-colors"
          aria-label="Current location"
        >
          <Locate className="w-4 h-4 text-neutral-700" />
        </button>

        {/* "Search this area" banner after draw */}
        {drawnBounds && !isDrawMode && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={handleSearchThisArea}
              className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
            >
              Search this area
            </button>
          </div>
        )}

        {/* Mobile "List" button */}
        <button
          type="button"
          onClick={() => navigate('/buy')}
          className="md:hidden absolute top-3 left-3 z-10 flex items-center gap-2 bg-white border border-neutral-200 px-3 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-neutral-50"
        >
          <MapIcon className="w-4 h-4" />
          List
        </button>
      </div>
    </div>
  );
}
