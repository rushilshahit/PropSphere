import { useRef } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  useOwnerListingImages,
  useDeleteListingImage,
  useUploadListingImages,
} from '@/api/owner-listings';

interface Props {
  propertyId: string;
}

export function PropertyImageManager({ propertyId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: images = [], isLoading } = useOwnerListingImages(propertyId);
  const deleteImage = useDeleteListingImage(propertyId);
  const uploadImages = useUploadListingImages(propertyId);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    uploadImages.mutate(
      { files, startOrder: images.length },
      { onSettled: () => { if (fileInputRef.current) fileInputRef.current.value = ''; } },
    );
  }

  function handleDelete(imageId: string, storagePath: string) {
    deleteImage.mutate({ imageId, storagePath });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {isLoading ? 'Loading…' : `${images.length} photo${images.length !== 1 ? 's' : ''}`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploadImages.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          Upload photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {uploadImages.isError && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-btn">
          {(uploadImages.error as Error).message}
        </p>
      )}
      {deleteImage.isError && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-btn">
          {(deleteImage.error as Error).message}
        </p>
      )}

      {images.length === 0 && !isLoading ? (
        <div
          className="border-2 border-dashed border-neutral-200 rounded-btn py-10 text-center text-neutral-400 text-sm cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          Click to upload photos (JPG, PNG, WebP)
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="relative group rounded-btn overflow-hidden bg-neutral-100 aspect-[4/3]"
            >
              <img
                src={img.cdn_url}
                alt={`Property photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id, img.storage_path)}
                disabled={deleteImage.isPending}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                aria-label="Delete photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
