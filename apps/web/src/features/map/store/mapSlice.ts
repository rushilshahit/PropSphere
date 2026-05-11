import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_VIEWPORT } from '@/lib/mapbox';
import type { RootState } from '@/store';

interface MapState {
  viewport: { longitude: number; latitude: number; zoom: number };
  activePropertyId: string | null;
  showSchoolsLayer: boolean;
  isDrawMode: boolean;
  drawnBounds: [number, number][] | null;
  searchBbox: { swLat: number; swLng: number; neLat: number; neLng: number } | null;
}

const initialState: MapState = {
  viewport: DEFAULT_VIEWPORT,
  activePropertyId: null,
  showSchoolsLayer: false,
  isDrawMode: false,
  drawnBounds: null,
  searchBbox: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setViewport(state, action: PayloadAction<MapState['viewport']>) {
      state.viewport = action.payload;
    },
    setActiveProperty(state, action: PayloadAction<string>) {
      state.activePropertyId = action.payload;
    },
    clearActiveProperty(state) {
      state.activePropertyId = null;
    },
    toggleSchoolsLayer(state) {
      state.showSchoolsLayer = !state.showSchoolsLayer;
    },
    setDrawMode(state, action: PayloadAction<boolean>) {
      state.isDrawMode = action.payload;
    },
    setDrawnBounds(state, action: PayloadAction<[number, number][] | null>) {
      state.drawnBounds = action.payload;
    },
    setSearchBbox(
      state,
      action: PayloadAction<MapState['searchBbox']>,
    ) {
      state.searchBbox = action.payload;
    },
  },
});

export const {
  setViewport,
  setActiveProperty,
  clearActiveProperty,
  toggleSchoolsLayer,
  setDrawMode,
  setDrawnBounds,
  setSearchBbox,
} = mapSlice.actions;

export const mapReducer = mapSlice.reducer;

export const selectViewport = (state: RootState) => state.map.viewport;
export const selectActivePropertyId = (state: RootState) => state.map.activePropertyId;
export const selectShowSchoolsLayer = (state: RootState) => state.map.showSchoolsLayer;
export const selectIsDrawMode = (state: RootState) => state.map.isDrawMode;
export const selectDrawnBounds = (state: RootState) => state.map.drawnBounds;
export const selectSearchBbox = (state: RootState) => state.map.searchBbox;
