import { useState } from 'react';
import { Plus, Share2, BookmarkX, PenLine } from 'lucide-react';
import { useCollections, useCollectionProperties, useCreateCollection, useRemoveFromCollection, useDeleteCollection, useUpdateCollectionNote } from '@/api/collections';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCompare, removeFromCompare, selectCompareIds } from '@/features/collections/store/collectionsSlice';
import { PropertyCard } from '@/features/search/components/PropertyCard';
import { useToast } from '@/components/providers/ToastProvider';
import { Button, Spinner } from '@/components/ui';

export default function CollectionsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const compareIds = useAppSelector(selectCompareIds);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');

  const { data: collections = [], isLoading: loadingCollections } = useCollections();
  const { mutate: createCollection } = useCreateCollection();
  const { mutate: deleteCollection } = useDeleteCollection();
  const { mutate: removeFromCollection } = useRemoveFromCollection();
  const { mutate: updateNote, isPending: savingNote } = useUpdateCollectionNote();

  const resolvedCollectionId =
    activeCollectionId ??
    collections.find((c) => c.is_default)?.id ??
    collections[0]?.id ??
    null;

  const { data: activeCollection, isLoading: loadingProperties } =
    useCollectionProperties(resolvedCollectionId);

  function handleCreateCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name, {
      onSuccess: () => {
        setNewCollectionName('');
        setShowNewInput(false);
      },
    });
  }

  function handleShare() {
    if (!activeCollection?.share_token) return;
    const url = `${window.location.origin}/collections/shared/${activeCollection.share_token}`;
    void navigator.clipboard.writeText(url);
    toast('Share link copied!', 'success');
  }

  function handleSaveNote(propertyId: string) {
    if (!resolvedCollectionId) return;
    updateNote(
      { collectionId: resolvedCollectionId, propertyId, notes: noteValue },
      {
        onSuccess: () => {
          setEditingId(null);
          toast('Note saved', 'success');
        },
      },
    );
  }

  function handleRemoveProperty(propertyId: string) {
    if (!resolvedCollectionId) return;
    removeFromCollection(
      { collectionId: resolvedCollectionId, propertyId },
      { onSuccess: () => toast('Removed from collection', 'info') },
    );
  }

  const properties = activeCollection?.properties ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">My Collections</h2>

        {loadingCollections ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <ul className="space-y-1">
            {collections.map((col) => (
              <li key={col.id}>
                <button
                  type="button"
                  onClick={() => setActiveCollectionId(col.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-btn text-sm transition-colors ${
                    resolvedCollectionId === col.id
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span className="truncate">{col.name}</span>
                  <span className="ml-2 text-xs text-neutral-400 flex-shrink-0">
                    {col.is_default ? 'Default' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* New collection */}
        {showNewInput ? (
          <div className="mt-3">
            <input
              autoFocus
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCollection();
                if (e.key === 'Escape') setShowNewInput(false);
              }}
              placeholder="Collection name"
              className="w-full border border-neutral-300 rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleCreateCollection}
                className="text-xs text-brand-primary font-medium hover:underline"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewInput(false)}
                className="text-xs text-neutral-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewInput(true)}
            className="mt-3 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            New collection
          </button>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0">
        {resolvedCollectionId && activeCollection && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{activeCollection.name}</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeCollection.share_token && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-primary border border-neutral-200 px-3 py-1.5 rounded-btn transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
              {!activeCollection.is_default && (
                <button
                  type="button"
                  onClick={() =>
                    deleteCollection(resolvedCollectionId, {
                      onSuccess: () => setActiveCollectionId(null),
                    })
                  }
                  className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {loadingProperties ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookmarkX className="w-12 h-12 text-neutral-300 mb-4" />
            <p className="text-neutral-500 text-sm">
              No saved properties yet.
              <br />
              Start browsing and save homes you love.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(properties as Array<typeof properties[0] & { notes?: string | null }>).map((property) => {
              const isCompared = compareIds.includes(property.id);
              const isEditingNote = editingId === property.id;
              return (
                <div key={property.id} className="relative">
                  <PropertyCard property={property} />
                  {/* Compare checkbox overlay */}
                  <label className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium cursor-pointer shadow-sm">
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => {
                        if (isCompared) {
                          dispatch(removeFromCompare(property.id));
                        } else {
                          dispatch(addToCompare(property.id));
                        }
                      }}
                      className="accent-brand-primary"
                    />
                    Compare
                  </label>
                  {/* Remove button overlay */}
                  <button
                    type="button"
                    onClick={() => handleRemoveProperty(property.id)}
                    className="absolute top-3 right-10 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="Remove from collection"
                  >
                    <BookmarkX className="w-4 h-4" />
                  </button>

                  {/* Inline note editor */}
                  <div className="mt-2 px-1">
                    {isEditingNote ? (
                      <div>
                        <textarea
                          className="w-full text-sm border border-neutral-300 rounded-btn p-2 resize-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none"
                          maxLength={500}
                          rows={3}
                          value={noteValue}
                          onChange={(e) => setNoteValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-neutral-400">{noteValue.length}/500</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              loading={savingNote}
                              onClick={() => handleSaveNote(property.id)}
                            >
                              Save note
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(property.id);
                          setNoteValue(property.notes ?? '');
                        }}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <PenLine className="w-3 h-3" />
                        {property.notes ? 'Edit note' : 'Add note'}
                      </button>
                    )}
                    {property.notes && !isEditingNote && (
                      <p className="text-xs text-neutral-500 italic mt-1 line-clamp-2">
                        {property.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
