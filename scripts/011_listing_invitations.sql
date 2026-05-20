-- listing_invitations: owner → agent invitation to take over a listing
CREATE TABLE IF NOT EXISTS listing_invitations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid        NOT NULL,
  owner_id   uuid        NOT NULL,
  agent_id   uuid        NOT NULL,
  token      uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  message    text,
  status     text        NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- status values: pending | accepted | declined | cancelled | expired

CREATE INDEX IF NOT EXISTS idx_listing_invitations_property
  ON listing_invitations (property_id, status);

CREATE INDEX IF NOT EXISTS idx_listing_invitations_token
  ON listing_invitations (token);

ALTER TABLE listing_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can read and manage their own invitations
CREATE POLICY "Owners can manage own invitations"
  ON listing_invitations
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Public token-based read (accept/decline flow)
CREATE POLICY "Public token read"
  ON listing_invitations
  FOR SELECT
  USING (true);
