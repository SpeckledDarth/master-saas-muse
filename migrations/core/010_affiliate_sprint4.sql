-- Migration 010: Affiliate Enhancements Sprint 4
-- Features: Anti-Spam/Compliance (E16), Fraud Scoring (E17), Tax Compliance (E15),
--           Co-Branded Landing Pages (E13), Two-Tier Referrals (E14), API Access (E18),
--           In-Dashboard Messaging (E28), Surveys (E29), Testimonials (E30),
--           Badges (E31), Webhooks (E32)
-- Run this in Supabase SQL Editor before testing Sprint 4 features.

-- E16: Anti-Spam & Compliance Rules
ALTER TABLE affiliate_applications
  ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- E17: Automated Fraud Scoring
ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS fraud_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fraud_score_updated_at TIMESTAMPTZ;

-- E17: Fraud scoring settings
ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS fraud_auto_pause_threshold INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS fraud_scoring_enabled BOOLEAN DEFAULT false;

-- E14: Two-Tier Referrals
ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS recruited_by_affiliate_id UUID;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS two_tier_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS second_tier_commission_rate NUMERIC(5,2) DEFAULT 5.00;

-- E29: Survey settings
ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS survey_interval_days INTEGER DEFAULT 90;

-- E15: Tax Compliance
CREATE TABLE IF NOT EXISTS affiliate_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  tax_id_type TEXT NOT NULL DEFAULT 'ssn',
  tax_id_last4 TEXT,
  tax_id_encrypted TEXT,
  address_line1 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT NOT NULL DEFAULT 'US',
  form_type TEXT NOT NULL DEFAULT 'w9',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_tax_info_user ON affiliate_tax_info(affiliate_user_id);

-- E13: Co-Branded Landing Pages
CREATE TABLE IF NOT EXISTS affiliate_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,
  bio TEXT,
  photo_url TEXT,
  custom_cta TEXT,
  theme_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_landing_pages_slug ON affiliate_landing_pages(slug);

-- E14: Two-Tier Referral Commissions
CREATE TABLE IF NOT EXISTS affiliate_second_tier_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier1_affiliate_id UUID NOT NULL,
  tier2_affiliate_id UUID NOT NULL,
  original_commission_id UUID,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_second_tier_tier1 ON affiliate_second_tier_commissions(tier1_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_second_tier_tier2 ON affiliate_second_tier_commissions(tier2_affiliate_id);

-- E18: Affiliate API Access
CREATE TABLE IF NOT EXISTS affiliate_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_api_keys_user ON affiliate_api_keys(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_api_keys_hash ON affiliate_api_keys(api_key_hash);

-- E28: In-Dashboard Messaging
CREATE TABLE IF NOT EXISTS affiliate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'affiliate',
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_messages_affiliate ON affiliate_messages(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_messages_unread ON affiliate_messages(affiliate_user_id, is_read);

-- E29: Affiliate Satisfaction Surveys
CREATE TABLE IF NOT EXISTS affiliate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  can_use_as_testimonial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_surveys_affiliate ON affiliate_surveys(affiliate_user_id);

-- E30: Affiliate Testimonials
CREATE TABLE IF NOT EXISTS affiliate_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID,
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  earnings_display TEXT,
  tier_name TEXT,
  avatar_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E31: Verified Earnings Badges
CREATE TABLE IF NOT EXISTS affiliate_badge_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  threshold_cents INTEGER NOT NULL,
  badge_image_url TEXT,
  embed_html TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  threshold_cents INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_affiliate_badges_user ON affiliate_badges(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_badges_verification ON affiliate_badges(verification_code);

-- E31: Seed default badge tiers
INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
VALUES
  ('Verified Partner', 50000, 1),
  ('Top Partner', 250000, 2),
  ('Elite Partner', 1000000, 3)
ON CONFLICT DO NOTHING;

-- E32: Affiliate Webhook Notifications
CREATE TABLE IF NOT EXISTS affiliate_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['affiliate.commission', 'affiliate.payout'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_webhooks_user ON affiliate_webhooks(affiliate_user_id);

CREATE TABLE IF NOT EXISTS affiliate_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON affiliate_webhook_deliveries(webhook_id);
