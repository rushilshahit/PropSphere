import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsSaved, addSavedId, removeSavedId } from '@/features/collections/store/collectionsSlice';
import { useUnsaveProperty } from '@/api/collections';
import { selectIsAuthenticated } from '@/features/auth/store/authSlice';

export function useSaveProperty(propertyId: string) {
  const dispatch = useAppDispatch();
  const isSaved = useAppSelector((state) => selectIsSaved(state, propertyId));
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const { mutate: unsave } = useUnsaveProperty();

  function toggle() {
    if (!isAuthenticated) {
      setSaveModalOpen(true);
      return;
    }
    if (isSaved) {
      dispatch(removeSavedId(propertyId));
      unsave(propertyId, {
        onError: () => dispatch(addSavedId(propertyId)),
      });
    } else {
      setSaveModalOpen(true);
    }
  }

  return { isSaved, toggle, saveModalOpen, closeSaveModal: () => setSaveModalOpen(false) };
}
