-- Phase 3.6 Sprint 2: Affiliate Tools & Analytics
-- Columns: landing_page on referral_clicks, source_tag on referral_clicks + affiliate_referrals
-- Settings: leaderboard_enabled, leaderboard_privacy_mode on affiliate_program_settings

-- Deep Link tracking
ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- Referral Sub-Tracking (Source Tags)
ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS source_tag TEXT;

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS source_tag TEXT;

CREATE INDEX IF NOT EXISTS idx_referral_clicks_source_tag ON referral_clicks(source_tag);

-- Leaderboard settings on program settings
DO $$ BEGIN
  ALTER TABLE affiliate_program_settings
    ADD COLUMN IF NOT EXISTS leaderboard_enabled BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_program_settings
    ADD COLUMN IF NOT EXISTS leaderboard_privacy_mode TEXT NOT NULL DEFAULT 'initials';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
