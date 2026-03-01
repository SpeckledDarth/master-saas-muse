-- Migration 017: Contact Fields (Sprint 8A)
-- Creates multi-value contact tables and adds profile columns for CRM detail enrichment.
-- user_profiles already has 1-to-1 columns (phone, address_line1, etc.) from migration 011.
-- These new tables handle the 1-to-many pattern (multiple phones, emails, addresses per user).

-- Add new 1-to-1 profile columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;

-- Multi-value phone numbers
CREATE TABLE IF NOT EXISTS user_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Mobile',
  phone_number TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON user_phone_numbers(user_id);

-- Multi-value email addresses
CREATE TABLE IF NOT EXISTS user_email_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Personal',
  email TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_email_addresses_user_id ON user_email_addresses(user_id);

-- Multi-value addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  street TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'US',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- Social links
CREATE TABLE IF NOT EXISTS user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_social_links_user_id ON user_social_links(user_id);

-- Sprint 8B: Grandfathering Gaps
-- GAP-1/GAP-2: Add terms JSONB to contracts for machine-readable locked values
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS terms JSONB;

-- GAP-3/GAP-4: Add locked cookie duration and min payout to referral_links
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS locked_cookie_duration_days INTEGER;
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS locked_min_payout_cents INTEGER;

-- Sprint 9A: Discount code rename cooldown tracking
ALTER TABLE affiliate_discount_codes ADD COLUMN IF NOT EXISTS last_renamed_at TIMESTAMPTZ;

-- Sprint 9B: Broadcast category tagging
ALTER TABLE affiliate_broadcasts ADD COLUMN IF NOT EXISTS category TEXT;

-- Sprint 9B: Marketing asset file metadata
ALTER TABLE affiliate_assets ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE affiliate_assets ADD COLUMN IF NOT EXISTS file_type TEXT;
