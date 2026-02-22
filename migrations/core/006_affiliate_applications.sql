-- Open Affiliate Program: Applications table + affiliate-only user support
-- Allows non-users to apply as affiliates with admin approval workflow

CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  website_url TEXT,
  promotion_method TEXT NOT NULL DEFAULT 'other',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_applications_email ON affiliate_applications(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);

-- Network integration settings for external affiliate platforms
CREATE TABLE IF NOT EXISTS affiliate_network_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name TEXT NOT NULL,
  network_slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  tracking_id TEXT,
  postback_url TEXT,
  api_key TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add affiliate role tracking to referral_links
ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS affiliate_role TEXT NOT NULL DEFAULT 'user';

-- Seed default network integrations
INSERT INTO affiliate_network_settings (network_name, network_slug, is_active)
VALUES
  ('ShareASale', 'shareasale', false),
  ('Impact', 'impact', false),
  ('PartnerStack', 'partnerstack', false)
ON CONFLICT (network_slug) DO NOTHING;
