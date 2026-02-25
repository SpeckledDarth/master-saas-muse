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

CREATE INDEX IF NOT EXISTS idx_affiliate_goals_user ON affiliate_goals(user_id);

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

CREATE INDEX IF NOT EXISTS idx_commission_disputes_affiliate ON commission_disputes(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_disputes_status ON commission_disputes(status);

CREATE TABLE IF NOT EXISTS affiliate_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  slug TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  label TEXT DEFAULT '',
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_slug ON affiliate_short_links(slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_affiliate ON affiliate_short_links(affiliate_user_id);

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
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL DEFAULT 'copy' CHECK (action IN ('copy', 'download', 'view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_asset_usage_asset ON affiliate_asset_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_asset_usage_affiliate ON affiliate_asset_usage(affiliate_user_id);

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

ALTER TABLE affiliate_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_asset_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON affiliate_goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own disputes" ON commission_disputes FOR ALL USING (affiliate_user_id = auth.uid());
CREATE POLICY "Users manage own short links" ON affiliate_short_links FOR ALL USING (affiliate_user_id = auth.uid());
CREATE POLICY "Users manage own asset usage" ON affiliate_asset_usage FOR ALL USING (affiliate_user_id = auth.uid());
CREATE POLICY "Users manage own email prefs" ON email_preferences FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access goals" ON affiliate_goals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access disputes" ON commission_disputes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access short links" ON affiliate_short_links FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access announcements" ON announcements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access spotlight" ON affiliate_spotlight FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access asset usage" ON affiliate_asset_usage FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access email prefs" ON email_preferences FOR ALL USING (auth.role() = 'service_role');

-- Connected Analytics tables
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

CREATE INDEX IF NOT EXISTS idx_connected_platforms_user ON connected_platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_platform_metrics_user ON connected_platform_metrics(user_id, platform, date);

ALTER TABLE connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connected platforms" ON connected_platforms FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own platform metrics" ON connected_platform_metrics FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access connected platforms" ON connected_platforms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access platform metrics" ON connected_platform_metrics FOR ALL USING (auth.role() = 'service_role');
