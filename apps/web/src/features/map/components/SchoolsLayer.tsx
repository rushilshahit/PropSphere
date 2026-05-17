import { Marker } from 'react-map-gl/maplibre';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { selectShowSchoolsLayer, selectViewport } from '../store/mapSlice';

interface School {
  id: string;
  name: string;
  type: string;
  sector: string;
  lat: number;
  lng: number;
}

async function fetchNearbySchools(lat: number, lng: number, radius: number): Promise<School[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
  });
  const res = await fetch(`/api/schools/nearby?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch schools');
  const json = await res.json() as { data: School[] };
  return json.data;
}

export function SchoolsLayer() {
  const showSchools = useSelector(selectShowSchoolsLayer);
  const viewport = useSelector(selectViewport);

  const { data: schools = [] } = useQuery({
    queryKey: ['schools', 'nearby', viewport.latitude, viewport.longitude],
    queryFn: () => fetchNearbySchools(viewport.latitude, viewport.longitude, 5),
    enabled: showSchools,
    staleTime: 60_000,
  });

  if (!showSchools) return null;

  return (
    <>
      {schools.map((school) => (
        <Marker key={school.id} latitude={school.lat} longitude={school.lng}>
          <div className="group relative">
            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm cursor-pointer" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-white text-xs text-neutral-800 px-2 py-1 rounded shadow-md whitespace-nowrap">
                {school.name}
              </div>
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
}
