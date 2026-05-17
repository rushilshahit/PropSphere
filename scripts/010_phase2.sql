-- ============================================================
-- 010_phase2.sql — Phase 2 schema additions
-- IMPORTANT: Run BLOCK 1 first and commit; then run BLOCK 2+.
-- Postgres requires enum values to be committed before use.
-- ============================================================

-- ============================================================
-- BLOCK 1 — Enum extension (run alone, commit before Block 2)
-- ============================================================
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'under_contract';


-- ============================================================
-- BLOCK 2 — New columns on properties
-- ============================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tour_url           TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bhk_config                 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS feature_order              SMALLINT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sold_price_is_confidential BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS under_contract_at          TIMESTAMPTZ;


-- ============================================================
-- BLOCK 3 — New columns on agents / agencies / profiles
-- ============================================================
ALTER TABLE agents   ADD COLUMN IF NOT EXISTS is_verified        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE agents   ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ;
ALTER TABLE agents   ADD COLUMN IF NOT EXISTS license_doc_url     TEXT;
ALTER TABLE agents   ADD COLUMN IF NOT EXISTS slug                TEXT;

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS slug                TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_agent_since TIMESTAMPTZ;


-- ============================================================
-- BLOCK 4 — New tables
-- ============================================================

-- Price history per property address
CREATE TABLE IF NOT EXISTS property_price_history (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID        NOT NULL,     -- properties.id
  address_key  TEXT        NOT NULL,     -- normalised: lower(suburb_state_streetno_streetname)
  sold_price   INT         NOT NULL,
  sold_date    DATE        NOT NULL,
  sale_method  sale_method,
  is_seed_data BOOLEAN     NOT NULL DEFAULT FALSE,
  source       TEXT        NOT NULL DEFAULT 'internal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buyer offers (simple: no counter-offer flow)
CREATE TABLE IF NOT EXISTS offers (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID        NOT NULL,   -- properties.id
  agent_id        UUID        NOT NULL,   -- agents.id
  sender_id       UUID,                   -- profiles.id (null if unauthenticated)
  sender_name     TEXT        NOT NULL,
  sender_email    TEXT        NOT NULL,
  sender_phone    TEXT,
  amount          INT         NOT NULL,
  message         TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  is_confidential BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recently viewed (authenticated users; localStorage for guests)
CREATE TABLE IF NOT EXISTS recently_viewed (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL,   -- profiles.id
  property_id UUID        NOT NULL,   -- properties.id
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

-- Agent license/certificate documents
CREATE TABLE IF NOT EXISTS agent_certifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID        NOT NULL,   -- agents.id
  doc_name    TEXT        NOT NULL,
  doc_url     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- BLOCK 5 — Indexes
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug   ON agents(slug)   WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_history_property ON property_price_history(property_id);
CREATE INDEX IF NOT EXISTS idx_price_history_address  ON property_price_history(address_key);
CREATE INDEX IF NOT EXISTS idx_price_history_date     ON property_price_history(sold_date DESC);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user   ON recently_viewed(user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_offers_agent    ON offers(agent_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_property ON offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_sender   ON offers(sender_id)  WHERE sender_id IS NOT NULL;


-- ============================================================
-- BLOCK 6 — RLS on new tables
-- ============================================================
ALTER TABLE offers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed        ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_certifications   ENABLE ROW LEVEL SECURITY;

-- offers: public insert (unauthenticated buyers can submit)
CREATE POLICY "public insert"    ON offers FOR INSERT WITH CHECK (true);
-- offers: sender reads own
CREATE POLICY "sender reads own" ON offers FOR SELECT USING (sender_id = auth.uid());
-- offers: agent reads their listings' offers
CREATE POLICY "agent reads own"  ON offers FOR SELECT
  USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));

-- recently_viewed: own rows only
CREATE POLICY "own" ON recently_viewed USING (user_id = auth.uid());

-- price_history: public read
CREATE POLICY "public read" ON property_price_history FOR SELECT USING (true);

-- agent_certifications: agent reads own
CREATE POLICY "agent own" ON agent_certifications
  USING (agent_id IN (SELECT id FROM agents WHERE profile_id = auth.uid()));


-- ============================================================
-- BLOCK 7 — Seed price history for existing seeded properties
-- ============================================================

-- Record 1: ~3 years ago at 85% of current price
INSERT INTO property_price_history (property_id, address_key, sold_price, sold_date, sale_method, is_seed_data)
SELECT
  id,
  lower(
    replace(suburb, ' ', '_') || '_' || state || '_' ||
    street_number || '_' || replace(street_name, ' ', '_')
  ),
  ROUND((COALESCE(price, 3000000) * 0.85)::numeric, -5)::INT,
  (NOW() - INTERVAL '3 years')::DATE,
  'private_treaty'::sale_method,
  true
FROM properties
WHERE is_seeded = true AND COALESCE(price, 0) > 0
ON CONFLICT DO NOTHING;

-- Record 2: ~5 years ago at 70% of current price
INSERT INTO property_price_history (property_id, address_key, sold_price, sold_date, sale_method, is_seed_data)
SELECT
  id,
  lower(
    replace(suburb, ' ', '_') || '_' || state || '_' ||
    street_number || '_' || replace(street_name, ' ', '_')
  ),
  ROUND((COALESCE(price, 3000000) * 0.70)::numeric, -5)::INT,
  (NOW() - INTERVAL '5 years')::DATE,
  'auction'::sale_method,
  true
FROM properties
WHERE is_seeded = true AND COALESCE(price, 0) > 0
ON CONFLICT DO NOTHING;
