export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

export const MAP_STYLE_STREETS =
  `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;

export const MAP_STYLE_SATELLITE =
  `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;

// Ahmedabad centre
export const DEFAULT_VIEWPORT = {
  longitude: 72.5714,
  latitude: 23.0225,
  zoom: 11,
};
