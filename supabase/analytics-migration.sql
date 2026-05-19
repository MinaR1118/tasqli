-- Run this in the Supabase SQL editor after the initial schema.sql
--
-- Email notifications on proposal acceptance
-- ─────────────────────────────────────────
-- The app sends a notification email to the VA whenever a client accepts a proposal.
-- Emails are sent server-side via SMTP (nodemailer) through /api/proposals/notify.
-- To enable notifications:
--   1. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in your env vars.
--      Supabase provides free SMTP — go to project Settings → SMTP for credentials.
--   2. Set INTERNAL_API_SECRET to a random secret (openssl rand -hex 32).
--      This protects the /api/proposals/notify endpoint from public access.
-- If SMTP vars are not set, acceptances still work — emails are silently skipped.

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS public_id text UNIQUE DEFAULT substr(md5(random()::text), 1, 10);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_by_name text;

CREATE TABLE IF NOT EXISTS proposal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  time_spent_seconds integer,
  ip_hash text,
  user_agent text
);

ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_views: anon insert"
  ON proposal_views FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "proposal_views: va select"
  ON proposal_views FOR SELECT
  TO authenticated
  USING (
    proposal_id IN (
      SELECT id FROM proposals WHERE va_id = auth.uid()
    )
  );
