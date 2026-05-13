-- ============================================================
-- PropSphere Admin Panel — DB Migration
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ── 1. Add feature_order to properties ──────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS feature_order INT;

-- ── 2. Add is_suspended to profiles ─────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 3. Add is_active to agents ───────────────────────────────
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ── 4. Add sent_at to notifications ─────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

UPDATE notifications SET sent_at = created_at WHERE sent_at IS NULL;

-- ── 5. Add 'announcement' to notification_type enum ─────────
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'announcement';

-- ── 6. audit_logs table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID        NOT NULL,
  admin_email TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id
  ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "admin_only_audit"
  ON audit_logs
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- RPC Functions
-- ============================================================

-- ── 7. admin_listings_by_status ──────────────────────────────
CREATE OR REPLACE FUNCTION admin_listings_by_status()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT status::TEXT, COUNT(*) AS count
  FROM   properties
  GROUP  BY status
  ORDER  BY count DESC;
$$;

-- ── 8. admin_top_suburbs(limit_count) ────────────────────────
CREATE OR REPLACE FUNCTION admin_top_suburbs(limit_count INT DEFAULT 5)
RETURNS TABLE(suburb TEXT, state TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT suburb, state, COUNT(*) AS count
  FROM   properties
  WHERE  status = 'active'
  GROUP  BY suburb, state
  ORDER  BY count DESC
  LIMIT  limit_count;
$$;

-- ── 9. admin_enquiries_by_day(since) ─────────────────────────
CREATE OR REPLACE FUNCTION admin_enquiries_by_day(since TIMESTAMPTZ)
RETURNS TABLE(day DATE, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT created_at::DATE AS day, COUNT(*) AS count
  FROM   enquiries
  WHERE  created_at >= since
  GROUP  BY day
  ORDER  BY day ASC;
$$;

-- ── 10. admin_registrations_by_day(since) ────────────────────
CREATE OR REPLACE FUNCTION admin_registrations_by_day(since TIMESTAMPTZ)
RETURNS TABLE(day DATE, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT created_at::DATE AS day, COUNT(*) AS count
  FROM   profiles
  WHERE  created_at >= since
  GROUP  BY day
  ORDER  BY day ASC;
$$;

-- ── 11. admin_top_searched_suburbs(limit_count) ───────────────
-- Reads search_history.query JSONB, expects { "suburb": "..." }
CREATE OR REPLACE FUNCTION admin_top_searched_suburbs(limit_count INT DEFAULT 10)
RETURNS TABLE(suburb TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT query->>'suburb' AS suburb, COUNT(*) AS count
  FROM   search_history
  WHERE  query->>'suburb' IS NOT NULL
    AND  LENGTH(query->>'suburb') > 1
  GROUP  BY suburb
  ORDER  BY count DESC
  LIMIT  limit_count;
$$;

-- ── 12. admin_top_keywords(limit_count) ──────────────────────
-- Reads search_history.query JSONB, expects { "q": "..." }
CREATE OR REPLACE FUNCTION admin_top_keywords(limit_count INT DEFAULT 10)
RETURNS TABLE(keyword TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT query->>'q' AS keyword, COUNT(*) AS count
  FROM   search_history
  WHERE  query->>'q' IS NOT NULL
    AND  LENGTH(query->>'q') > 1
  GROUP  BY keyword
  ORDER  BY count DESC
  LIMIT  limit_count;
$$;

-- ── 13. refresh_suburb_stats(suburb_id) ─────────────────────
-- Recomputes median prices and avg days-on-market from live property data
CREATE OR REPLACE FUNCTION refresh_suburb_stats(suburb_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_name     TEXT;
  v_state    TEXT;
BEGIN
  SELECT name, state INTO v_name, v_state
  FROM   suburbs
  WHERE  id = suburb_id;

  UPDATE suburbs
  SET
    median_sale_price  = (
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::INT
      FROM   properties
      WHERE  suburb ILIKE v_name
        AND  state  ILIKE v_state
        AND  listing_type = 'buy'
        AND  status = 'sold'
        AND  price IS NOT NULL
    ),
    median_rent_price  = (
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::INT
      FROM   properties
      WHERE  suburb ILIKE v_name
        AND  state  ILIKE v_state
        AND  listing_type = 'rent'
        AND  status IN ('active', 'leased')
        AND  price IS NOT NULL
    ),
    days_on_market_avg = (
      SELECT ROUND(
        AVG(EXTRACT(EPOCH FROM (sold_at - published_at)) / 86400)::NUMERIC,
        1
      )
      FROM   properties
      WHERE  suburb ILIKE v_name
        AND  state  ILIKE v_state
        AND  status = 'sold'
        AND  sold_at      IS NOT NULL
        AND  published_at IS NOT NULL
    ),
    stats_updated_at = NOW()
  WHERE id = suburb_id;
END;
$$;
