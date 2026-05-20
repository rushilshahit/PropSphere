import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';

const BUCKET = 'property-media';

interface PropertyImage {
  id: string;
  storage_path: string;
  cdn_url: string;
  sort_order: number;
  is_floor_plan: boolean;
}

interface Props {
  propertyId: string | undefined;
}

export function PropertyImageUploader({ propertyId }: Props) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!propertyId) return;
    supabase
      .from('property_images')
      .select('id, storage_path, cdn_url, sort_order, is_floor_plan')
      .eq('property_id', propertyId)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setImages((data as PropertyImage[]) ?? []);
      });
  }, [propertyId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !propertyId) return;
    setUploading(true);
    setError(null);

    try {
      let nextOrder = images.length;
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

        const { data: row, error: insertErr } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            storage_path: path,
            cdn_url: publicUrl,
            sort_order: nextOrder,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        setImages((prev) => [...prev, row as PropertyImage]);
        nextOrder += 1;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (image: PropertyImage) => {
    const { error: storageErr } = await supabase.storage.from(BUCKET).remove([image.storage_path]);
    if (storageErr) { setError(storageErr.message); return; }
    await supabase.from('property_images').delete().eq('id', image.id);
    setImages((prev) => prev.filter((img) => img.id !== image.id));
  };

  const handleToggleFloorPlan = async (image: PropertyImage) => {
    const newValue = !image.is_floor_plan;
    const { error: updateErr } = await supabase
      .from('property_images')
      .update({ is_floor_plan: newValue })
      .eq('id', image.id);
    if (updateErr) { setError(updateErr.message); return; }
    setImages((prev) =>
      prev.map((img) => (img.id === image.id ? { ...img, is_floor_plan: newValue } : img)),
    );
  };

  if (!propertyId) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>Create the listing first (step 9), then return to this tab to upload images.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { void handleFiles(e.target.files); }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-btn">{error}</p>
      )}

      {images.length === 0 ? (
        <div
          className="border-2 border-dashed border-neutral-200 rounded-btn py-12 text-center text-neutral-400 text-sm cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          Click to upload images (JPG, PNG, WebP)
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="relative group rounded-btn overflow-hidden bg-neutral-100 aspect-[4/3]"
            >
              <img
                src={img.cdn_url}
                alt={`Property image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Top-left badge: Hero or Floor Plan */}
              {img.is_floor_plan ? (
                <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                  Floor Plan
                </span>
              ) : idx === 0 ? (
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  Hero
                </span>
              ) : null}
              {/* Hover controls */}
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => { void handleToggleFloorPlan(img); }}
                  className={`flex-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                    img.is_floor_plan
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white/90 text-neutral-800 hover:bg-white'
                  }`}
                  title={img.is_floor_plan ? 'Remove floor plan flag' : 'Mark as floor plan'}
                >
                  {img.is_floor_plan ? '✓ Floor Plan' : 'Floor Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => { void handleDelete(img); }}
                  className="bg-red-600 text-white rounded px-2 py-1 text-xs hover:bg-red-700 transition-colors"
                  aria-label="Delete image"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
