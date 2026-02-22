-- Phase 3: Affiliate Marketing System
-- Program settings, referral tracking, commissions, payouts, tiers, marketing assets

-- Global affiliate program settings (single row, admin-configurable)
CREATE TABLE IF NOT EXISTS affiliate_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  commission_duration_months INTEGER NOT NULL DEFAULT 12,
  min_payout_cents INTEGER NOT NULL DEFAULT 5000,
  cookie_duration_days INTEGER NOT NULL DEFAULT 30,
  program_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Performance tiers (admin-configurable)
CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_referrals INTEGER NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade referral_links with affiliate fields
ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_commission_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS locked_duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_tier_id UUID REFERENCES affiliate_tiers(id),
  ADD COLUMN IF NOT EXISTS total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_earnings_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_earnings_cents INTEGER NOT NULL DEFAULT 0;

-- Track each referred signup
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code TEXT NOT NULL,
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'signed_up',
  fraud_flags JSONB DEFAULT '[]',
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON affiliate_referrals(ref_code);

-- Track each commission event (tied to Stripe invoice)
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL,
  invoice_amount_cents INTEGER NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_commissions_invoice ON affiliate_commissions(stripe_invoice_id);

-- Payout batches
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Marketing assets library
CREATE TABLE IF NOT EXISTS affiliate_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL DEFAULT 'banner',
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE affiliate_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_assets ENABLE ROW LEVEL SECURITY;

-- Program settings: admin read/write (service role bypasses RLS)
CREATE POLICY affiliate_settings_read ON affiliate_program_settings
  FOR SELECT USING (true);

-- Tiers: anyone can read
CREATE POLICY affiliate_tiers_read ON affiliate_tiers
  FOR SELECT USING (true);

-- Referrals: affiliates see their own
CREATE POLICY affiliate_referrals_own ON affiliate_referrals
  FOR SELECT USING (auth.uid() = affiliate_user_id);

-- Commissions: affiliates see their own
CREATE POLICY affiliate_commissions_own ON affiliate_commissions
  FOR SELECT USING (auth.uid() = affiliate_user_id);

-- Payouts: affiliates see their own
CREATE POLICY affiliate_payouts_own ON affiliate_payouts
  FOR SELECT USING (auth.uid() = affiliate_user_id);

-- Assets: anyone can read active assets
CREATE POLICY affiliate_assets_read ON affiliate_assets
  FOR SELECT USING (active = true);

-- Insert default program settings
INSERT INTO affiliate_program_settings (commission_rate, commission_duration_months, min_payout_cents, cookie_duration_days)
VALUES (20.00, 12, 5000, 30)
ON CONFLICT DO NOTHING;

-- Insert default tiers
INSERT INTO affiliate_tiers (name, min_referrals, commission_rate, sort_order) VALUES
  ('Bronze', 0, 20.00, 1),
  ('Silver', 25, 25.00, 2),
  ('Gold', 100, 30.00, 3)
ON CONFLICT DO NOTHING;
