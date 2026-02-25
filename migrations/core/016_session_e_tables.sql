-- Migration 016: Session E tables — Challenges, Case Studies, Directory
-- Run on both Replit Postgres and Supabase

-- Challenge progress tracking (links to affiliate_contests)
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

CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_affiliate ON challenge_progress(affiliate_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_progress_unique ON challenge_progress(challenge_id, affiliate_id);

-- Case studies (rich cards with affiliate attribution)
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

CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_affiliate ON case_studies(affiliate_user_id);

-- Add show_in_directory column to affiliate_profiles if not exists
DO $$ BEGIN
  ALTER TABLE affiliate_profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Add quiz_results column to affiliate_profiles if not exists
DO $$ BEGIN
  ALTER TABLE affiliate_profiles ADD COLUMN IF NOT EXISTS quiz_results JSONB;
EXCEPTION WHEN others THEN
  NULL;
END $$;
