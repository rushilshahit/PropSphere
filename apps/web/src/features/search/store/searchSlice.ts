import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ListingType, PropertyType, SearchFilters } from '@propsphere/types';
import type { RootState } from '@/store';

const defaultFilters: SearchFilters = {
  listingType: 'buy',
  query: '',
  propertyTypes: [],
  features: [],
  sortBy: 'newest',
  page: 1,
};

interface SearchState {
  filters: SearchFilters;
}

const initialState: SearchState = {
  filters: defaultFilters,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<SearchFilters>>) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    resetFilters(state) {
      state.filters = defaultFilters;
    },
    setListingType(state, action: PayloadAction<ListingType>) {
      state.filters.listingType = action.payload;
      state.filters.page = 1;
    },
    setLocation(state, action: PayloadAction<string>) {
      state.filters.query = action.payload;
      state.filters.page = 1;
    },
    setLocationCoords(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.filters.locationLat = action.payload.lat;
      state.filters.locationLng = action.payload.lng;
    },
    setPriceRange(state, action: PayloadAction<{ priceMin?: number; priceMax?: number }>) {
      state.filters.priceMin = action.payload.priceMin;
      state.filters.priceMax = action.payload.priceMax;
      state.filters.page = 1;
    },
    setBedrooms(state, action: PayloadAction<number | undefined>) {
      state.filters.bedrooms = action.payload;
      state.filters.page = 1;
    },
    setSortBy(state, action: PayloadAction<SearchFilters['sortBy']>) {
      state.filters.sortBy = action.payload;
      state.filters.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    setPropertyTypes(state, action: PayloadAction<PropertyType[]>) {
      state.filters.propertyTypes = action.payload;
      state.filters.page = 1;
    },
    setFeatures(state, action: PayloadAction<string[]>) {
      state.filters.features = action.payload;
      state.filters.page = 1;
    },
  },
});

export const {
  setFilters,
  resetFilters,
  setListingType,
  setLocation,
  setLocationCoords,
  setPriceRange,
  setBedrooms,
  setSortBy,
  setPage,
  setPropertyTypes,
  setFeatures,
} = searchSlice.actions;

export const searchReducer = searchSlice.reducer;

// Selectors
export const selectSearchFilters = (state: RootState) => state.search.filters;
export const selectListingType = (state: RootState) => state.search.filters.listingType;

export const selectActiveFilterCount = (state: RootState): number => {
  const f = state.search.filters;
  let count = 0;
  if (f.priceMin !== undefined) count++;
  if (f.priceMax !== undefined) count++;
  if (f.bedrooms !== undefined) count++;
  if (f.bathrooms !== undefined) count++;
  if (f.carSpaces !== undefined) count++;
  if (f.propertyTypes.length > 0) count++;
  if (f.features.length > 0) count++;
  return count;
};
