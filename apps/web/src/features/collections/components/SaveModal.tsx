import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Folder } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addSavedId } from '@/features/collections/store/collectionsSlice';
import { selectIsAuthenticated } from '@/features/auth/store/authSlice';
import { useCollections, useSaveProperty, useCreateCollection } from '@/api/collections';
import { Button } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface SaveModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SaveModal({ propertyId, isOpen, onClose }: SaveModalProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: collections = [], isLoading } = useCollections({ enabled: isAuthenticated });
  const { mutateAsync: saveProperty, isPending: isSaving } = useSaveProperty();
  const { mutateAsync: createCollection, isPending: isCreating } = useCreateCollection();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  if (!isOpen) return null;

  const defaultCollection = collections.find((c) => c.is_default) ?? collections[0] ?? null;
  const activeCollectionId = selectedCollectionId ?? defaultCollection?.id ?? null;

  async function handleSave() {
    let collectionId = activeCollectionId;

    if (showNewInput && newCollectionName.trim()) {
      const newCollection = await createCollection(newCollectionName.trim());
      collectionId = newCollection.id;
    }

    if (!collectionId) return;

    await saveProperty({ collectionId, propertyId });
    dispatch(addSavedId(propertyId));
    toast('Property saved!', 'success');
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
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Save to collection</h3>

          {isLoading ? (
            <div className="text-sm text-neutral-500 py-4 text-center">Loading collections…</div>
          ) : (
            <div className="space-y-2 mb-4">
              {collections.map((collection) => (
                <label
                  key={collection.id}
                  className="flex items-center gap-3 p-3 rounded-btn border cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="collection"
                    value={collection.id}
                    checked={activeCollectionId === collection.id && !showNewInput}
                    onChange={() => {
                      setSelectedCollectionId(collection.id);
                      setShowNewInput(false);
                    }}
                    className="accent-brand-primary"
                  />
                  <Folder className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-700">{collection.name}</span>
                  {collection.is_default && (
                    <span className="ml-auto text-xs text-neutral-400">Default</span>
                  )}
                </label>
              ))}

              {showNewInput ? (
                <div className="flex items-center gap-2 p-3 rounded-btn border border-brand-primary bg-brand-primary/5">
                  <Plus className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    className="flex-1 text-sm bg-transparent focus:outline-none text-neutral-800 placeholder-neutral-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowNewInput(true); setSelectedCollectionId(null); }}
                  className="flex items-center gap-2 w-full p-3 text-sm text-brand-primary hover:bg-neutral-50 rounded-btn transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create new collection
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              loading={isSaving || isCreating}
              disabled={!activeCollectionId && !newCollectionName.trim()}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
