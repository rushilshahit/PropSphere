import { useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface StreetViewPanelProps {
  lat: number;
  lng: number;
}

export function StreetViewPanel({ lat, lng }: StreetViewPanelProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const streetViewLib = useMapsLibrary('streetView');

  useEffect(() => {
    if (!streetViewLib || !divRef.current) return;

    new streetViewLib.StreetViewPanorama(divRef.current, {
      position: { lat, lng },
      addressControl: false,
      showRoadLabels: false,
      zoomControl: true,
      fullscreenControl: true,
      motionTracking: false,
      motionTrackingControl: false,
    });
  }, [streetViewLib, lat, lng]);

  return (
    <div
      ref={divRef}
      className="h-[400px] rounded-card overflow-hidden border border-neutral-200"
    />
  );
}
