-- Phase 1.5: Launch Kit tables
-- Referral/share links, onboarding funnel tracking, email drip sequences

-- Share/referral links for each user
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_links_user ON referral_links(user_id);
CREATE INDEX idx_referral_links_code ON referral_links(ref_code);

-- Track individual referral click events
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_clicks_code ON referral_clicks(ref_code);

-- Onboarding funnel step tracking
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'viewed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_events_user ON onboarding_events(user_id);
CREATE INDEX idx_onboarding_events_step ON onboarding_events(step);

-- Email drip sequence tracking
CREATE TABLE IF NOT EXISTS email_drip_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL DEFAULT 'welcome',
  step INTEGER NOT NULL,
  email_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_email_drip_user ON email_drip_log(user_id, sequence_name);

-- Changelog entries
CREATE TABLE IF NOT EXISTS changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT,
  category TEXT DEFAULT 'improvement',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_changelog_published ON changelog_entries(published, published_at);

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drip_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_links_user ON referral_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY referral_clicks_insert ON referral_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY onboarding_events_user ON onboarding_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY email_drip_user ON email_drip_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY changelog_select_published ON changelog_entries
  FOR SELECT USING (published = true);
