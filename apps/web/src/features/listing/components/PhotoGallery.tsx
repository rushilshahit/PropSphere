import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { PropertyImage } from '@propsphere/types';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
import { StreetViewPanel } from './StreetViewPanel';

function supabaseTransform(url: string, width: number): string {
  return url.replace('/object/public/', '/render/image/public/') + `?width=${width}&format=webp`;
}

interface PhotoGalleryProps {
  images: PropertyImage[];
  virtualTourUrl?: string;
  lat?: number | null;
  lng?: number | null;
}

export function PhotoGallery({ images, virtualTourUrl, lat, lng }: PhotoGalleryProps) {
  const [lightboxImages, setLightboxImages] = useState<PropertyImage[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('photos');
  const [mainLoaded, setMainLoaded] = useState(false);

  const regularImages = images.filter((i) => !i.is_floor_plan);
  const floorPlans = images.filter((i) => i.is_floor_plan);
  const hasVirtualTour = !!virtualTourUrl;
  const hasStreetView = lat != null && lng != null && !!GOOGLE_MAPS_API_KEY;

  const tabs = [
    { key: 'photos', label: `Photos (${regularImages.length})` },
    ...(floorPlans.length ? [{ key: 'floorplan', label: 'Floor Plan' }] : []),
    ...(hasVirtualTour ? [{ key: 'tour', label: '360° Tour' }] : []),
    ...(hasStreetView ? [{ key: 'streetview', label: 'Street View' }] : []),
  ];

  const showTabs = tabs.length > 1;

  function openLightbox(imgs: PropertyImage[], index: number) {
    setLightboxImages(imgs);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prev = useCallback(
    () => setLightboxIndex((i) => (i === 0 ? lightboxImages.length - 1 : i - 1)),
    [lightboxImages.length],
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === lightboxImages.length - 1 ? 0 : i + 1)),
    [lightboxImages.length],
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

  const mainImage = regularImages[0] ?? images[0];
  const thumbnails = regularImages.slice(1, 5);
  const remainingCount = Math.max(0, regularImages.length - 5);

  return (
    <>
      {/* Tab bar — only shown when multiple content types exist */}
      {showTabs && (
        <div className="flex gap-1 mb-3 border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Photos tab */}
      {activeTab === 'photos' && (
        <>
          {/* Desktop grid */}
          <div className="hidden lg:grid grid-cols-[65%_35%] gap-2 h-[480px] rounded-card overflow-hidden">
            <div
              className="relative cursor-pointer overflow-hidden"
              onClick={() => openLightbox(regularImages, 0)}
            >
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
              {regularImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(regularImages, 0);
                  }}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-neutral-900 text-xs font-medium px-3 py-1.5 rounded shadow hover:bg-white transition-colors"
                >
                  View all {regularImages.length} photos
                </button>
              )}
            </div>

            <div className="grid grid-rows-4 gap-2">
              {thumbnails.map((img, i) => {
                const isLast = i === thumbnails.length - 1;
                const showOverlay = isLast && remainingCount > 0;
                return (
                  <div
                    key={img.id}
                    className="relative cursor-pointer overflow-hidden"
                    onClick={() => openLightbox(regularImages, i + 1)}
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
                onClick={() => openLightbox(regularImages, 0)}
              />
            </div>
            {regularImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {regularImages.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`View photo ${i + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors ${i === 0 ? 'bg-neutral-900' : 'bg-neutral-300'}`}
                    onClick={() => openLightbox(regularImages, i)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Floor plan tab */}
      {activeTab === 'floorplan' && (
        <div className="space-y-4">
          {floorPlans.map((fp, i) => (
            <img
              key={fp.id}
              src={supabaseTransform(fp.cdn_url, 1200)}
              alt={fp.caption ?? `Floor plan ${i + 1}`}
              className="w-full rounded-[8px] cursor-zoom-in"
              onClick={() => openLightbox(floorPlans, i)}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Virtual tour tab */}
      {activeTab === 'tour' && (
        <div
          className="relative bg-neutral-900 rounded-[8px] overflow-hidden"
          style={{ paddingBottom: '56.25%', height: 0 }}
        >
          <iframe
            src={virtualTourUrl!}
            className="absolute inset-0 w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-fullscreen"
            allowFullScreen
            title="Virtual property tour"
          />
          <a
            href={virtualTourUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-[4px] flex items-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3" /> Open full screen
          </a>
        </div>
      )}

      {/* Street view tab */}
      {activeTab === 'streetview' && lat != null && lng != null && (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <StreetViewPanel lat={lat} lng={lng} />
        </APIProvider>
      )}

      {/* Lightbox */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={supabaseTransform(lightboxImages[lightboxIndex].cdn_url, 1200)}
              alt={lightboxImages[lightboxIndex].caption ?? `Photo ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain mx-auto block"
            />
          </div>

          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium select-none">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
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
