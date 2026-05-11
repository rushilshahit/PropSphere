import { useCallback, useEffect, useRef } from 'react';
import Map, { type MapRef } from 'react-map-gl';
import { useDispatch, useSelector } from 'react-redux';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { DEFAULT_VIEWPORT, MAP_STYLE, MAPBOX_TOKEN } from '@/lib/mapbox';
import { useMapProperties, useProperty } from '@/api/properties';
import {
  clearActiveProperty,
  selectActivePropertyId,
  selectIsDrawMode,
  selectSearchBbox,
  setActiveProperty,
  setDrawMode,
  setDrawnBounds,
  setSearchBbox,
  setViewport,
} from '../store/mapSlice';
import { PropertyMarker } from './PropertyMarker';
import { PropertyPopup } from './PropertyPopup';
import { SchoolsLayer } from './SchoolsLayer';
import { LayerToggles } from './LayerToggles';

export function MapView() {
  const dispatch = useDispatch();
  const activePropertyId = useSelector(selectActivePropertyId);
  const isDrawMode = useSelector(selectIsDrawMode);
  const searchBbox = useSelector(selectSearchBbox);

  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const { data: pins = [] } = useMapProperties(searchBbox);
  const { data: activeProperty } = useProperty(activePropertyId ?? '', !!activePropertyId);

  const syncBbox = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    dispatch(
      setSearchBbox({
        swLat: bounds.getSouth(),
        swLng: bounds.getWest(),
        neLat: bounds.getNorth(),
        neLng: bounds.getEast(),
      }),
    );
  }, [dispatch]);

  const handleMoveEnd = useCallback(() => {
    syncBbox();
  }, [syncBbox]);

  // Initialise bbox once the map loads
  const handleMapLoad = useCallback(() => {
    syncBbox();
  }, [syncBbox]);

  // Listen for fly-to requests from MapPage (current location button)
  useEffect(() => {
    const handler = (e: Event) => {
      const { longitude, latitude, zoom } = (e as CustomEvent<{ longitude: number; latitude: number; zoom: number }>).detail;
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom });
    };
    window.addEventListener('map:flyto', handler);
    return () => window.removeEventListener('map:flyto', handler);
  }, []);

  // Manage draw control lifecycle
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (isDrawMode) {
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      map.addControl(drawRef.current);

      const handleCreate = (e: { features: GeoJSON.Feature<GeoJSON.Polygon>[] }) => {
        const feature = e.features[0];
        if (feature) {
          const coords = feature.geometry.coordinates[0] as [number, number][];
          dispatch(setDrawnBounds(coords));
          dispatch(setDrawMode(false));
        }
      };

      map.on('draw.create', handleCreate as (ev: unknown) => void);

      return () => {
        map.off('draw.create', handleCreate as (ev: unknown) => void);
        if (drawRef.current) {
          map.removeControl(drawRef.current);
          drawRef.current = null;
        }
      };
    }
  }, [isDrawMode, dispatch]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={DEFAULT_VIEWPORT}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        onMove={(e) =>
          dispatch(
            setViewport({
              longitude: e.viewState.longitude,
              latitude: e.viewState.latitude,
              zoom: e.viewState.zoom,
            }),
          )
        }
        onMoveEnd={handleMoveEnd}
        onLoad={handleMapLoad}
        onClick={() => dispatch(clearActiveProperty())}
      >
        {pins.map((pin) => (
          <PropertyMarker
            key={pin.id}
            property={pin}
            isActive={pin.id === activePropertyId}
            onClick={() => dispatch(setActiveProperty(pin.id))}
          />
        ))}

        {activeProperty && (
          <PropertyPopup
            property={activeProperty}
            onClose={() => dispatch(clearActiveProperty())}
          />
        )}

        <SchoolsLayer />
      </Map>

      <LayerToggles />
    </div>
  );
}
