import { useCallback, useEffect, useRef } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { useDispatch, useSelector } from 'react-redux';
import MaplibreDraw from 'maplibre-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-draw/dist/maplibre-gl-draw.css';
import { DEFAULT_VIEWPORT, MAP_STYLE_STREETS } from '@/lib/map';
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
  const drawRef = useRef<MaplibreDraw | null>(null);

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

  const handleMapLoad = useCallback(() => {
    syncBbox();
  }, [syncBbox]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { longitude, latitude, zoom } = (e as CustomEvent<{ longitude: number; latitude: number; zoom: number }>).detail;
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom });
    };
    window.addEventListener('map:flyto', handler);
    return () => window.removeEventListener('map:flyto', handler);
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (isDrawMode) {
      drawRef.current = new MaplibreDraw({
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
        initialViewState={DEFAULT_VIEWPORT}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE_STREETS}
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
