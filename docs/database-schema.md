# Database Schema
## PropSphere — PostgreSQL via Supabase
### Rules: 3NF, no FK constraints, no generated columns, minimal columns

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- geo radius queries (map view)
```

---

## Enums

```sql
CREATE TYPE user_role         AS ENUM ('buyer','renter','seller','agent','admin');
CREATE TYPE listing_type      AS ENUM ('buy','rent','sold');
CREATE TYPE property_type     AS ENUM ('house','apartment','townhouse','unit','land','rural');
CREATE TYPE sale_method       AS ENUM ('private_treaty','auction','tender');
CREATE TYPE listing_status    AS ENUM ('draft','active','under_offer','sold','leased','withdrawn');
CREATE TYPE inspection_type   AS ENUM ('open_home','private');
CREATE TYPE enquiry_status    AS ENUM ('new','read','replied','archived');
CREATE TYPE alert_freq        AS ENUM ('instant','daily','weekly');
CREATE TYPE school_type       AS ENUM ('primary','secondary','combined');
CREATE TYPE school_sector     AS ENUM ('government','catholic','independent');
CREATE TYPE notification_type AS ENUM (
  'new_listing','price_drop','inspection_reminder',
  'enquiry_received','enquiry_replied'
);
```

---

## Shared Trigger Functions

```sql
-- Reused on all tables that have updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Tables

### `profiles`
One row per registered user. `id` matches `auth.users.id`.

```sql
CREATE TABLE profiles (
  id          UUID      PRIMARY KEY,
  email       TEXT      NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'buyer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `agencies`

```sql
CREATE TABLE agencies (
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
```

---

### `agents`
`profile_id` and `agency_id` reference other tables by value — no FK constraint.

```sql
CREATE TABLE agents (
  id           UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID     NOT NULL UNIQUE,  -- profiles.id
  agency_id    UUID     NOT NULL,         -- agencies.id
  license_no   TEXT,
  bio          TEXT,
  years_active SMALLINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_profile_id ON agents(profile_id);
CREATE INDEX idx_agents_agency_id  ON agents(agency_id);
```

---

### `suburbs`
Geographic and statistical reference data. Stats refreshed nightly.

```sql
CREATE TABLE suburbs (
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

CREATE INDEX idx_suburbs_postcode ON suburbs(postcode);
```

---

### `properties`
Core listing entity. Address fields stored directly to avoid joins on every query.
`suburb_id` is a soft reference to `suburbs` — no FK constraint.

```sql
CREATE TABLE properties (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      UUID           NOT NULL,  -- agents.id
  agency_id     UUID           NOT NULL,  -- agencies.id
  suburb_id     UUID,                     -- suburbs.id (soft ref for stats join)

  listing_type  listing_type   NOT NULL DEFAULT 'buy',
  property_type property_type  NOT NULL,
  status        listing_status NOT NULL DEFAULT 'draft',
  sale_method   sale_method,

  -- address (denormalised — suburb/state/postcode stored directly)
  unit_number   TEXT,
  street_number TEXT          NOT NULL,
  street_name   TEXT          NOT NULL,
  suburb        TEXT          NOT NULL,
  state         TEXT          NOT NULL,
  postcode      TEXT          NOT NULL,
  lat           NUMERIC(9,6),
  lng           NUMERIC(9,6),
  location      GEOGRAPHY(POINT),  -- PostGIS for ST_DWithin radius queries

  -- specs
  bedrooms      SMALLINT,
  bathrooms     SMALLINT,
  car_spaces    SMALLINT,
  land_size_sqm NUMERIC(10,2),
  build_size_sqm NUMERIC(10,2),

  -- pricing
  price         INT,
  price_min     INT,
  price_max     INT,
  price_display TEXT,    -- "Contact agent" | "₹1.2Cr–₹1.5Cr"
  is_price_hidden BOOLEAN NOT NULL DEFAULT FALSE,

  -- content
  headline      TEXT,
  description   TEXT,
  features      JSONB NOT NULL DEFAULT '{}',
  -- { indoor: string[], outdoor: string[], climate: string[] }

  -- dates
  available_from DATE,
  auction_at    TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  sold_at       TIMESTAMPTZ,
  sold_price    INT,

  -- meta
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  view_count    INT     NOT NULL DEFAULT 0,
  enquiry_count INT     NOT NULL DEFAULT 0,

  -- full-text search (updated by trigger on insert/update)
  search_vector TSVECTOR,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Single-column indexes
CREATE INDEX idx_properties_agent_id     ON properties(agent_id);
CREATE INDEX idx_properties_suburb_id    ON properties(suburb_id);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_status       ON properties(status);
CREATE INDEX idx_properties_price        ON properties(price);
CREATE INDEX idx_properties_bedrooms     ON properties(bedrooms);
CREATE INDEX idx_properties_location     ON properties USING GIST(location);
CREATE INDEX idx_properties_fts          ON properties USING GIN(search_vector);

-- Compound: most common active listing query
CREATE INDEX idx_properties_active_search
  ON properties(listing_type, price, bedrooms)
  WHERE status = 'active';

-- FTS trigger
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

CREATE TRIGGER trg_properties_fts
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### `property_images`

```sql
CREATE TABLE property_images (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID    NOT NULL,  -- properties.id
  storage_path  TEXT    NOT NULL,
  cdn_url       TEXT    NOT NULL,
  caption       TEXT,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_floor_plan BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_images_property_id
  ON property_images(property_id, sort_order);
```

---

### `inspections`

```sql
CREATE TABLE inspections (
  id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID            NOT NULL,  -- properties.id
  type        inspection_type NOT NULL DEFAULT 'open_home',
  starts_at   TIMESTAMPTZ     NOT NULL,
  ends_at     TIMESTAMPTZ     NOT NULL,
  cancelled   BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspections_property_id ON inspections(property_id);
CREATE INDEX idx_inspections_upcoming
  ON inspections(starts_at)
  WHERE cancelled = FALSE;
```

---

### `enquiries`

```sql
CREATE TABLE enquiries (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID           NOT NULL,  -- properties.id
  agent_id      UUID           NOT NULL,  -- agents.id
  sender_id     UUID,                     -- profiles.id (null = unauthenticated)
  sender_name   TEXT           NOT NULL,
  sender_email  TEXT           NOT NULL,
  sender_phone  TEXT,
  message       TEXT           NOT NULL,
  status        enquiry_status NOT NULL DEFAULT 'new',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enquiries_agent_id    ON enquiries(agent_id, created_at DESC);
CREATE INDEX idx_enquiries_property_id ON enquiries(property_id);

CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### `saved_searches`

```sql
CREATE TABLE saved_searches (
  id              UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID       NOT NULL,  -- profiles.id
  name            TEXT       NOT NULL,
  filters         JSONB      NOT NULL,  -- serialised SearchFilters object
  alert_enabled   BOOLEAN    NOT NULL DEFAULT TRUE,
  alert_freq      alert_freq NOT NULL DEFAULT 'instant',
  last_alerted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
```

---

### `collections`

```sql
CREATE TABLE collections (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL,  -- profiles.id
  name        TEXT    NOT NULL DEFAULT 'Saved',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT    UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON collections(user_id);
```

---

### `collection_properties`

```sql
CREATE TABLE collection_properties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL,  -- collections.id
  property_id   UUID NOT NULL,  -- properties.id
  notes         TEXT CHECK (char_length(notes) <= 500),
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, property_id)
);

CREATE INDEX idx_col_props_collection_id ON collection_properties(collection_id);
```

---

### `price_alerts`

```sql
CREATE TABLE price_alerts (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID    NOT NULL,  -- profiles.id
  property_id   UUID    NOT NULL,  -- properties.id
  price_at_save INT     NOT NULL,
  triggered     BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);
```

---

### `schools`

```sql
CREATE TABLE schools (
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

CREATE INDEX idx_schools_location ON schools USING GIST(location);
```

---

### `notifications`

```sql
CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID              NOT NULL,  -- profiles.id
  type       notification_type NOT NULL,
  title      TEXT              NOT NULL,
  body       TEXT,
  data       JSONB             NOT NULL DEFAULT '{}',
  read       BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE read = FALSE;
```

---

### `search_history`
App limits to 20 rows per user on insert.

```sql
CREATE TABLE search_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,  -- profiles.id
  query      JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_history_user
  ON search_history(user_id, created_at DESC);
```

---

## RLS Policies

```sql
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties         ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "own profile" ON profiles USING (id = auth.uid());

-- properties: public read active, agent manages own
CREATE POLICY "public read active" ON properties
  FOR SELECT USING (status = 'active');
CREATE POLICY "agent manages own" ON properties
  USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));

-- enquiries
CREATE POLICY "agent reads own" ON enquiries
  FOR SELECT USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));
CREATE POLICY "sender reads own" ON enquiries
  FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY "sender inserts" ON enquiries
  FOR INSERT WITH CHECK (true);  -- allow unauthenticated

-- simple owner policies
CREATE POLICY "own" ON collections        USING (user_id = auth.uid());
CREATE POLICY "own" ON saved_searches     USING (user_id = auth.uid());
CREATE POLICY "own" ON price_alerts       USING (user_id = auth.uid());
CREATE POLICY "own" ON search_history     USING (user_id = auth.uid());
CREATE POLICY "own" ON notifications      USING (user_id = auth.uid());
CREATE POLICY "owner via collection" ON collection_properties
  USING (collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid()));
```

---

## Search Query Examples

```sql
-- Text + filter search
SELECT id, headline, suburb, state, price, bedrooms, bathrooms, cdn_url
FROM   properties
WHERE  status = 'active'
  AND  listing_type = 'buy'
  AND  search_vector @@ plainto_tsquery('english', 'Navrangpura 2BHK')
  AND  price BETWEEN 2000000 AND 8000000
  AND  bedrooms >= 2
ORDER  BY ts_rank(search_vector, plainto_tsquery('english', 'Navrangpura 2BHK')) DESC;

-- Radius search
SELECT id, headline, suburb, lat, lng
FROM   properties
WHERE  status = 'active'
  AND  ST_DWithin(
         location,
         ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326)::geography,
         5000
       );
```

---

## Seed Summary
10 properties across Ahmedabad suburbs: Navrangpura, Satellite, Bopal, Vastrapur,
Prahlad Nagar, SG Highway, Thaltej, Gota, Chandkheda, Maninagar.
1 agency · 2 agents · 10 suburb rows · 3 schools per suburb.
