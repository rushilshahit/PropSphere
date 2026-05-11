import { combineReducers } from '@reduxjs/toolkit';
import { searchReducer } from '@/features/search/store/searchSlice';
import { mapReducer } from '@/features/map/store/mapSlice';
import { authReducer } from '@/features/auth/store/authSlice';
import { collectionsReducer } from '@/features/collections/store/collectionsSlice';

export const rootReducer = combineReducers({
  search: searchReducer,
  map: mapReducer,
  auth: authReducer,
  collections: collectionsReducer,
});
