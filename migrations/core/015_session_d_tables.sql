-- Migration 015: Session D tables — Resource Center, Knowledge Base, Promotional Calendar
-- Run on both Replit Postgres and Supabase

-- Asset usage tracking (downloads, copies, views)
CREATE TABLE IF NOT EXISTS affiliate_asset_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  affiliate_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('download', 'copy', 'view', 'share')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_usage_asset ON affiliate_asset_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_affiliate ON affiliate_asset_usage(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_created ON affiliate_asset_usage(created_at);

-- Knowledge base articles
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

CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON knowledge_base_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON knowledge_base_articles(slug);

-- Promotional calendar
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

CREATE INDEX IF NOT EXISTS idx_promo_cal_dates ON promotional_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promo_cal_published ON promotional_calendar(is_published);
