-- =============================================
-- SUPABASE SCHEMA SYNC — SAFE VERSION
-- Run in Supabase SQL Editor
-- If any PART fails, run the remaining parts individually
-- =============================================

-- ==================== PART 1: New Tables ====================

CREATE TABLE IF NOT EXISTS affiliate_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  target_cents INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  referral_id UUID,
  commission_id UUID,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'approved', 'denied')),
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS affiliate_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  slug TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  label TEXT DEFAULT '',
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'promo')),
  target_dashboards TEXT[] DEFAULT ARRAY['all'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_spotlight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  month TEXT NOT NULL,
  affiliate_name TEXT NOT NULL,
  affiliate_avatar TEXT DEFAULT '',
  story TEXT DEFAULT '',
  stats_summary TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_asset_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  affiliate_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('download', 'copy', 'view', 'share')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  billing_alerts BOOLEAN NOT NULL DEFAULT true,
  security_alerts BOOLEAN NOT NULL DEFAULT true,
  product_updates BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  monthly_report BOOLEAN NOT NULL DEFAULT true,
  affiliate_updates BOOLEAN NOT NULL DEFAULT true,
  support_responses BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connected_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  account_name TEXT DEFAULT '',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE TABLE IF NOT EXISTS connected_platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  search_keywords TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotional_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE,
  campaign_type TEXT NOT NULL DEFAULT 'general' CHECK (campaign_type IN ('general', 'seasonal', 'feature_launch', 'flash_sale', 'holiday', 'contest')),
  content_suggestions JSONB DEFAULT '[]',
  linked_asset_ids UUID[] DEFAULT '{}',
  linked_contest_id UUID,
  is_published BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL,
  affiliate_id UUID NOT NULL,
  progress_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  summary TEXT DEFAULT '',
  key_metric TEXT DEFAULT '',
  key_metric_label TEXT DEFAULT '',
  customer_quote TEXT DEFAULT '',
  customer_name TEXT DEFAULT '',
  customer_role TEXT DEFAULT '',
  affiliate_user_id UUID,
  testimonial_id UUID,
  featured_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'pending_review', 'archived')),
  source TEXT DEFAULT 'admin' CHECK (source IN ('admin', 'affiliate', 'ai_draft')),
  org_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_link_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  landing_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag)
);

CREATE TABLE IF NOT EXISTS entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PART 2: Indexes ====================

CREATE INDEX IF NOT EXISTS idx_affiliate_goals_user ON affiliate_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_disputes_affiliate ON commission_disputes(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_disputes_status ON commission_disputes(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_slug ON affiliate_short_links(slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_affiliate ON affiliate_short_links(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_asset ON affiliate_asset_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_affiliate ON affiliate_asset_usage(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_created ON affiliate_asset_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_connected_platforms_user ON connected_platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_platform_metrics_user ON connected_platform_metrics(user_id, platform, date);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON knowledge_base_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON knowledge_base_articles(slug);
CREATE INDEX IF NOT EXISTS idx_promo_cal_dates ON promotional_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promo_cal_published ON promotional_calendar(is_published);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_affiliate ON challenge_progress(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_affiliate ON case_studies(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_presets_user ON affiliate_link_presets(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag);
CREATE INDEX IF NOT EXISTS idx_entity_notes_entity ON entity_notes(entity_type, entity_id);

-- Unique index (safe — IF NOT EXISTS)
DO $$ BEGIN
  CREATE UNIQUE INDEX idx_challenge_progress_unique ON challenge_progress(challenge_id, affiliate_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ==================== PART 3: ALTER existing tables (safe) ====================
-- These add columns to tables that should already exist from migrations 001-012.
-- Each is wrapped so if the table doesn't exist, it won't crash the whole script.

DO $$ BEGIN
  ALTER TABLE referral_clicks ADD COLUMN IF NOT EXISTS country TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE referral_clicks ADD COLUMN IF NOT EXISTS device_type TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE referral_clicks ADD COLUMN IF NOT EXISTS referral_link_user_id UUID;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS churn_reason TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_profiles ADD COLUMN IF NOT EXISTS quiz_results JSONB;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_link_presets ADD COLUMN IF NOT EXISTS utm_source TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_link_presets ADD COLUMN IF NOT EXISTS utm_medium TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_link_presets ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_link_presets ADD COLUMN IF NOT EXISTS utm_content TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_link_presets ADD COLUMN IF NOT EXISTS landing_page TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Indexes on altered columns (safe — only if table exists)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_referral_clicks_user ON referral_clicks(referral_link_user_id);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_referral_clicks_country ON referral_clicks(country);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_churned ON affiliate_referrals(churned_at);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ==================== PART 4: RLS Policies ====================

ALTER TABLE affiliate_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_spotlight ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_asset_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_link_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_notes ENABLE ROW LEVEL SECURITY;

-- User-level policies
DO $$ BEGIN CREATE POLICY "Users manage own goals" ON affiliate_goals FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own disputes" ON commission_disputes FOR ALL USING (affiliate_user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own short links" ON affiliate_short_links FOR ALL USING (affiliate_user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own asset usage" ON affiliate_asset_usage FOR ALL USING (affiliate_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own email prefs" ON email_preferences FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own connected platforms" ON connected_platforms FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own platform metrics" ON connected_platform_metrics FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users manage own link presets" ON affiliate_link_presets FOR ALL USING (affiliate_user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role policies (for API routes using service role key)
DO $$ BEGIN CREATE POLICY "Service role full access goals" ON affiliate_goals FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access disputes" ON commission_disputes FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access short links" ON affiliate_short_links FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access announcements" ON announcements FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access spotlight" ON affiliate_spotlight FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access asset usage" ON affiliate_asset_usage FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access email prefs" ON email_preferences FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access connected platforms" ON connected_platforms FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access platform metrics" ON connected_platform_metrics FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access link presets" ON affiliate_link_presets FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access user_tags" ON user_tags FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access entity_notes" ON entity_notes FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access referral_clicks" ON referral_clicks FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

-- ==================== VERIFICATION ====================
-- Run this after to confirm all tables exist:

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'affiliate_goals', 'commission_disputes', 'affiliate_short_links',
  'announcements', 'affiliate_spotlight', 'affiliate_asset_usage',
  'email_preferences', 'connected_platforms', 'connected_platform_metrics',
  'knowledge_base_articles', 'promotional_calendar',
  'challenge_progress', 'case_studies',
  'notifications', 'affiliate_link_presets',
  'user_tags', 'entity_notes'
)
ORDER BY table_name;
-- Expected: 17 rows
