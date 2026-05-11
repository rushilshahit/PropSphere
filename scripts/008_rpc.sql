-- RPC: search_schools_radius
-- Returns schools within radius_km of the given lat/lng using PostGIS geography distance.
CREATE OR REPLACE FUNCTION search_schools_radius(
  lat       float,
  lng       float,
  radius_km float
)
RETURNS TABLE(
  id     UUID,
  name   TEXT,
  type   school_type,
  sector school_sector,
  lat    NUMERIC,
  lng    NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT id, name, type, sector, lat, lng
  FROM   schools
  WHERE  ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
           radius_km * 1000
         )
  LIMIT  20;
$$;
