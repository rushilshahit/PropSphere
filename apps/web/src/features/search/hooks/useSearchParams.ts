import { useEffect, useRef } from 'react';
import { useSearchParams as useRouterSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { SearchFilters } from '@propsphere/types';
import { selectSearchFilters, setFilters } from '../store/searchSlice';
import { useDebounce } from '@/hooks/useDebounce';

function filtersToParams(filters: SearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.query) p.set('q', filters.query);
  if (filters.priceMin !== undefined) p.set('pmin', String(filters.priceMin));
  if (filters.priceMax !== undefined) p.set('pmax', String(filters.priceMax));
  if (filters.bedrooms !== undefined) p.set('beds', String(filters.bedrooms));
  if (filters.bathrooms !== undefined) p.set('baths', String(filters.bathrooms));
  if (filters.carSpaces !== undefined) p.set('cars', String(filters.carSpaces));
  if (filters.propertyTypes.length) p.set('pt', filters.propertyTypes.join(','));
  if (filters.features.length) p.set('ft', filters.features.join(','));
  if (filters.sortBy !== 'newest') p.set('sort', filters.sortBy);
  if (filters.page > 1) p.set('p', String(filters.page));
  return p;
}

function paramsToFilters(params: URLSearchParams): Partial<SearchFilters> {
  const out: Partial<SearchFilters> = {};
  const q = params.get('q');
  if (q) out.query = q;
  const pmin = params.get('pmin');
  if (pmin) out.priceMin = Number(pmin);
  const pmax = params.get('pmax');
  if (pmax) out.priceMax = Number(pmax);
  const beds = params.get('beds');
  if (beds) out.bedrooms = Number(beds);
  const baths = params.get('baths');
  if (baths) out.bathrooms = Number(baths);
  const cars = params.get('cars');
  if (cars) out.carSpaces = Number(cars);
  const pt = params.get('pt');
  if (pt) out.propertyTypes = pt.split(',') as SearchFilters['propertyTypes'];
  const ft = params.get('ft');
  if (ft) out.features = ft.split(',');
  const sort = params.get('sort') as SearchFilters['sortBy'] | null;
  if (sort) out.sortBy = sort;
  const p = params.get('p');
  if (p) out.page = Number(p);
  return out;
}

export function useSearchParamsSync() {
  const dispatch = useDispatch();
  const filters = useSelector(selectSearchFilters);
  const [searchParams, setSearchParams] = useRouterSearchParams();
  const isInitialized = useRef(false);
  const debouncedFilters = useDebounce(filters, 200);

  // On mount: hydrate Redux from URL
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const partial = paramsToFilters(searchParams);
      if (Object.keys(partial).length > 0) {
        dispatch(setFilters(partial));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When filters change: sync to URL (debounced)
  useEffect(() => {
    if (!isInitialized.current) return;
    setSearchParams(filtersToParams(debouncedFilters), { replace: true });
  }, [debouncedFilters]); // eslint-disable-line react-hooks/exhaustive-deps
}
