-- Phase 3.6 Sprint 1: Core Revenue & Motivation
-- Tables: discount_codes, discount_code_redemptions, affiliate_milestones,
--         affiliate_milestone_awards, affiliate_broadcasts, affiliate_broadcast_receipts
-- Alterations: attribution_conflict_policy on affiliate_program_settings

-- ============================================================
-- E3: Discount Code System with Dual-Attribution
-- ============================================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value INTEGER NOT NULL,
  duration TEXT NOT NULL DEFAULT 'once',
  duration_months INTEGER,
  max_uses INTEGER,
  max_uses_per_user INTEGER NOT NULL DEFAULT 1,
  min_plan TEXT,
  stackable BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  affiliate_user_id UUID REFERENCES auth.users(id),
  stripe_coupon_id TEXT,
  stripe_promotion_code_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  total_uses INTEGER NOT NULL DEFAULT 0,
  total_discount_cents INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discount_codes_affiliate ON discount_codes(affiliate_user_id);

CREATE TABLE IF NOT EXISTS discount_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_invoice_id TEXT,
  discount_amount_cents INTEGER NOT NULL,
  attributed_affiliate_id UUID REFERENCES auth.users(id),
  attribution_method TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code ON discount_code_redemptions(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user ON discount_code_redemptions(user_id);

-- Attribution conflict policy on program settings
ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS attribution_conflict_policy TEXT NOT NULL DEFAULT 'cookie_wins';

-- RLS for discount tables
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY discount_codes_read ON discount_codes
  FOR SELECT USING (true);

CREATE POLICY discount_redemptions_own ON discount_code_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- E1: Milestone Bonuses
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  referral_threshold INTEGER NOT NULL,
  bonus_amount_cents INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_milestone_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES affiliate_milestones(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bonus_amount_cents INTEGER NOT NULL,
  UNIQUE(affiliate_user_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_milestone_awards_affiliate ON affiliate_milestone_awards(affiliate_user_id);

-- RLS for milestone tables
ALTER TABLE affiliate_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_milestone_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_milestones_read ON affiliate_milestones
  FOR SELECT USING (true);

CREATE POLICY affiliate_milestone_awards_own ON affiliate_milestone_awards
  FOR SELECT USING (auth.uid() = affiliate_user_id);

-- ============================================================
-- E21: Affiliate Newsletter / Broadcast System
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_filter JSONB NOT NULL DEFAULT '{"type": "all"}'::jsonb,
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_broadcast_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES affiliate_broadcasts(id) ON DELETE CASCADE,
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_receipts_broadcast ON affiliate_broadcast_receipts(broadcast_id);

-- RLS for broadcast tables
ALTER TABLE affiliate_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_broadcast_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_broadcasts_read ON affiliate_broadcasts
  FOR SELECT USING (true);

CREATE POLICY affiliate_broadcast_receipts_own ON affiliate_broadcast_receipts
  FOR SELECT USING (auth.uid() = affiliate_user_id);
