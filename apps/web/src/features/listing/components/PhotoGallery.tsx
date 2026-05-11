import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PropertyImage } from '@propsphere/types';

function supabaseTransform(url: string, width: number): string {
  return url.replace('/object/public/', '/render/image/public/') + `?width=${width}&format=webp`;
}

interface PhotoGalleryProps {
  images: PropertyImage[];
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mainLoaded, setMainLoaded] = useState(false);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prev = useCallback(
    () => setLightboxIndex((i) => (i === 0 ? images.length - 1 : i - 1)),
    [images.length],
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === images.length - 1 ? 0 : i + 1)),
    [images.length],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, prev, next, closeLightbox]);

  if (!images.length) return null;

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);
  const remainingCount = Math.max(0, images.length - 5);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-[65%_35%] gap-2 h-[480px] rounded-card overflow-hidden">
        {/* Main image */}
        <div className="relative cursor-pointer overflow-hidden" onClick={() => openLightbox(0)}>
          {!mainLoaded && (
            <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
          )}
          <img
            src={supabaseTransform(mainImage.cdn_url, 1200)}
            alt={mainImage.caption ?? 'Property photo'}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
            loading="eager"
            fetchPriority="high"
            onLoad={() => setMainLoaded(true)}
          />
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-neutral-900 text-xs font-medium px-3 py-1.5 rounded shadow hover:bg-white transition-colors"
            >
              View all {images.length} photos
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="grid grid-rows-4 gap-2">
          {thumbnails.map((img, i) => {
            const isLast = i === thumbnails.length - 1;
            const showOverlay = isLast && remainingCount > 0;
            return (
              <div
                key={img.id}
                className="relative cursor-pointer overflow-hidden"
                onClick={() => openLightbox(i + 1)}
              >
                <img
                  src={supabaseTransform(img.cdn_url, 400)}
                  alt={img.caption ?? `Photo ${i + 2}`}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
                {showOverlay && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-semibold text-xl">+{remainingCount} more</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="relative aspect-[4/3] overflow-hidden rounded-card">
          <img
            src={supabaseTransform(mainImage.cdn_url, 1200)}
            alt={mainImage.caption ?? 'Property photo'}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            onClick={() => openLightbox(0)}
          />
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {images.slice(0, 8).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View photo ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === 0 ? 'bg-neutral-900' : 'bg-neutral-300'}`}
                onClick={() => openLightbox(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Image container — stop propagation so click on image doesn't close */}
          <div
            className="relative max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={supabaseTransform(images[lightboxIndex].cdn_url, 1200)}
              alt={images[lightboxIndex].caption ?? `Photo ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain mx-auto block"
            />
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium select-none">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
