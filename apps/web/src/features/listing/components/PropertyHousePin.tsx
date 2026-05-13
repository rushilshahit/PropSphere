import { Marker } from 'react-map-gl';

interface PropertyHousePinProps {
  lat: number;
  lng: number;
}

const HOUSE_SVG = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 2L1 15V42H13V28H23V42H35V15L18 2Z" fill="#E5001A" stroke="white" stroke-width="2"/>
</svg>`;

export function PropertyHousePin({ lat, lng }: PropertyHousePinProps) {
  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div
        dangerouslySetInnerHTML={{ __html: HOUSE_SVG }}
        className="animate-pin-drop cursor-pointer"
      />
    </Marker>
  );
}
