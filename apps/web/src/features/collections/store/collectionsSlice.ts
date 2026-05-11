import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface CollectionsState {
  savedPropertyIds: string[];
  comparePropertyIds: string[];
  isCompareDrawerOpen: boolean;
}

const initialState: CollectionsState = {
  savedPropertyIds: [],
  comparePropertyIds: [],
  isCompareDrawerOpen: false,
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    setSavedIds(state, action: PayloadAction<string[]>) {
      state.savedPropertyIds = action.payload;
    },
    addSavedId(state, action: PayloadAction<string>) {
      if (!state.savedPropertyIds.includes(action.payload)) {
        state.savedPropertyIds.push(action.payload);
      }
    },
    removeSavedId(state, action: PayloadAction<string>) {
      state.savedPropertyIds = state.savedPropertyIds.filter((id) => id !== action.payload);
    },
    addToCompare(state, action: PayloadAction<string>) {
      if (
        state.comparePropertyIds.length < 4 &&
        !state.comparePropertyIds.includes(action.payload)
      ) {
        state.comparePropertyIds.push(action.payload);
      }
    },
    removeFromCompare(state, action: PayloadAction<string>) {
      state.comparePropertyIds = state.comparePropertyIds.filter((id) => id !== action.payload);
      if (state.comparePropertyIds.length < 2) {
        state.isCompareDrawerOpen = false;
      }
    },
    toggleCompareDrawer(state) {
      state.isCompareDrawerOpen = !state.isCompareDrawerOpen;
    },
    clearCompare(state) {
      state.comparePropertyIds = [];
      state.isCompareDrawerOpen = false;
    },
  },
});

export const {
  setSavedIds,
  addSavedId,
  removeSavedId,
  addToCompare,
  removeFromCompare,
  toggleCompareDrawer,
  clearCompare,
} = collectionsSlice.actions;

const selectSavedIds = (state: RootState) => state.collections.savedPropertyIds;
const selectSavedSet = createSelector(selectSavedIds, (ids) => new Set(ids));

export const selectIsSaved = createSelector(
  [selectSavedSet, (_state: RootState, id: string) => id],
  (set, id) => set.has(id),
);

export const selectCompareIds = (state: RootState) => state.collections.comparePropertyIds;
export const selectIsCompareDrawerOpen = (state: RootState) =>
  state.collections.isCompareDrawerOpen;

export const collectionsReducer = collectionsSlice.reducer;
