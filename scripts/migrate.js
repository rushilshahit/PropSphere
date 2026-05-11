// Run: node scripts/migrate.js
const { Client } = require('pg');

const DATABASE_URL =
  'postgresql://postgres.lfvgrqrdwrnfxhuchwat:Superbase@8889@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const SQL = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('buyer','renter','seller','agent','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('buy','rent','sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('house','apartment','townhouse','unit','land','rural');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE sale_method AS ENUM ('private_treaty','auction','tender');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('draft','active','under_offer','sold','leased','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE inspection_type AS ENUM ('open_home','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE enquiry_status AS ENUM ('new','read','replied','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE alert_freq AS ENUM ('instant','daily','weekly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE school_type AS ENUM ('primary','secondary','combined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE school_sector AS ENUM ('government','catholic','independent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_listing','price_drop','inspection_reminder',
    'enquiry_received','enquiry_replied'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  role        user_role   NOT NULL DEFAULT 'buyer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agencies
CREATE TABLE IF NOT EXISTS agencies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  website    TEXT,
  phone      TEXT,
  address    TEXT,
  suburb     TEXT,
  state      TEXT,
  postcode   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agents
CREATE TABLE IF NOT EXISTS agents (
  id           UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID     NOT NULL UNIQUE,
  agency_id    UUID     NOT NULL,
  license_no   TEXT,
  bio          TEXT,
  years_active SMALLINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_profile_id ON agents(profile_id);
CREATE INDEX IF NOT EXISTS idx_agents_agency_id  ON agents(agency_id);

-- suburbs
CREATE TABLE IF NOT EXISTS suburbs (
  id                 UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               TEXT    NOT NULL,
  slug               TEXT    NOT NULL,
  postcode           TEXT    NOT NULL,
  state              TEXT    NOT NULL,
  lat                NUMERIC(9,6),
  lng                NUMERIC(9,6),
  median_sale_price  INT,
  median_rent_price  INT,
  days_on_market_avg NUMERIC(4,1),
  stats_updated_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, state)
);
CREATE INDEX IF NOT EXISTS idx_suburbs_postcode ON suburbs(postcode);

-- properties
CREATE TABLE IF NOT EXISTS properties (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id       UUID           NOT NULL,
  agency_id      UUID           NOT NULL,
  suburb_id      UUID,
  listing_type   listing_type   NOT NULL DEFAULT 'buy',
  property_type  property_type  NOT NULL,
  status         listing_status NOT NULL DEFAULT 'draft',
  sale_method    sale_method,
  unit_number    TEXT,
  street_number  TEXT           NOT NULL,
  street_name    TEXT           NOT NULL,
  suburb         TEXT           NOT NULL,
  state          TEXT           NOT NULL,
  postcode       TEXT           NOT NULL,
  lat            NUMERIC(9,6),
  lng            NUMERIC(9,6),
  location       GEOGRAPHY(POINT),
  bedrooms       SMALLINT,
  bathrooms      SMALLINT,
  car_spaces     SMALLINT,
  land_size_sqm  NUMERIC(10,2),
  build_size_sqm NUMERIC(10,2),
  price          INT,
  price_min      INT,
  price_max      INT,
  price_display  TEXT,
  is_price_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  headline       TEXT,
  description    TEXT,
  features       JSONB NOT NULL DEFAULT '{}',
  available_from DATE,
  auction_at     TIMESTAMPTZ,
  published_at   TIMESTAMPTZ,
  sold_at        TIMESTAMPTZ,
  sold_price     INT,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  view_count     INT     NOT NULL DEFAULT 0,
  enquiry_count  INT     NOT NULL DEFAULT 0,
  search_vector  TSVECTOR,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id     ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_suburb_id    ON properties(suburb_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status       ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price        ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms     ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_location     ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_properties_fts          ON properties USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_active_search
  ON properties(listing_type, price, bedrooms)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.suburb, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.postcode, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.headline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.street_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_fts ON properties;
CREATE TRIGGER trg_properties_fts
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- property_images
CREATE TABLE IF NOT EXISTS property_images (
  id            UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID     NOT NULL,
  storage_path  TEXT     NOT NULL,
  cdn_url       TEXT     NOT NULL,
  caption       TEXT,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_floor_plan BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id
  ON property_images(property_id, sort_order);

-- inspections
CREATE TABLE IF NOT EXISTS inspections (
  id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID            NOT NULL,
  type        inspection_type NOT NULL DEFAULT 'open_home',
  starts_at   TIMESTAMPTZ     NOT NULL,
  ends_at     TIMESTAMPTZ     NOT NULL,
  cancelled   BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_upcoming
  ON inspections(starts_at)
  WHERE cancelled = FALSE;

-- enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID           NOT NULL,
  agent_id      UUID           NOT NULL,
  sender_id     UUID,
  sender_name   TEXT           NOT NULL,
  sender_email  TEXT           NOT NULL,
  sender_phone  TEXT,
  message       TEXT           NOT NULL,
  status        enquiry_status NOT NULL DEFAULT 'new',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_agent_id    ON enquiries(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_property_id ON enquiries(property_id);

DROP TRIGGER IF EXISTS trg_enquiries_updated_at ON enquiries;
CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- saved_searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id              UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID       NOT NULL,
  name            TEXT       NOT NULL,
  filters         JSONB      NOT NULL,
  alert_enabled   BOOLEAN    NOT NULL DEFAULT TRUE,
  alert_freq      alert_freq NOT NULL DEFAULT 'instant',
  last_alerted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

-- collections
CREATE TABLE IF NOT EXISTS collections (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL,
  name        TEXT    NOT NULL DEFAULT 'Saved',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT    UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- collection_properties
CREATE TABLE IF NOT EXISTS collection_properties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL,
  property_id   UUID NOT NULL,
  notes         TEXT CHECK (char_length(notes) <= 500),
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_col_props_collection_id ON collection_properties(collection_id);

-- price_alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID    NOT NULL,
  property_id   UUID    NOT NULL,
  price_at_save INT     NOT NULL,
  triggered     BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

-- schools
CREATE TABLE IF NOT EXISTS schools (
  id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT          NOT NULL,
  type       school_type,
  sector     school_sector,
  suburb     TEXT,
  state      TEXT,
  postcode   TEXT,
  lat        NUMERIC(9,6),
  lng        NUMERIC(9,6),
  location   GEOGRAPHY(POINT),
  acara_id   TEXT          UNIQUE,
  rating     SMALLINT      CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schools_location ON schools USING GIST(location);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID              NOT NULL,
  type       notification_type NOT NULL,
  title      TEXT              NOT NULL,
  body       TEXT,
  data       JSONB             NOT NULL DEFAULT '{}',
  read       BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE read = FALSE;

-- search_history
CREATE TABLE IF NOT EXISTS search_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  query      JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user
  ON search_history(user_id, created_at DESC);

-- RLS
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties            ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own profile" ON profiles USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "public read active" ON properties FOR SELECT USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "agent manages own" ON properties
    USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "agent reads own" ON enquiries
    FOR SELECT USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "sender reads own" ON enquiries FOR SELECT USING (sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "sender inserts" ON enquiries FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "own" ON collections USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own" ON saved_searches USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own" ON price_alerts USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own" ON search_history USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "own" ON notifications USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "owner via collection" ON collection_properties
    USING (collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RPC: search_schools_radius
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

-- RPC: increment_view_count
CREATE OR REPLACE FUNCTION increment_view_count(prop_id UUID)
RETURNS void LANGUAGE SQL AS $$
  UPDATE properties SET view_count = view_count + 1 WHERE id = prop_id;
$$;
`;

async function migrate() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database.');
  try {
    await client.query(SQL);
    console.log('Migration complete — all tables, indexes, triggers, RLS policies, and RPCs created.');
  } finally {
    await client.end();
  }
}

migrate().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
