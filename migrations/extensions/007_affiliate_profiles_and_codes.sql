-- Affiliate Profiles: stores contact info, payout preferences, and tax data
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  legal_name TEXT,
  phone TEXT,
  website TEXT,
  bio TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  payout_method TEXT DEFAULT 'paypal',
  payout_email TEXT,
  payout_bank_name TEXT,
  payout_bank_routing TEXT,
  payout_bank_account TEXT,
  tax_id TEXT,
  onboarded_at TIMESTAMPTZ,
  tour_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user ON affiliate_profiles(user_id);

-- Affiliate Discount Codes: each affiliate gets a personal promo code
CREATE TABLE IF NOT EXISTS affiliate_discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_discount_codes_user ON affiliate_discount_codes(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_discount_codes_code ON affiliate_discount_codes(code);

-- Affiliate Code Requests: affiliates can request custom promo codes
CREATE TABLE IF NOT EXISTS affiliate_code_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  requested_code TEXT NOT NULL,
  requested_discount_percent INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_code_requests_user ON affiliate_code_requests(affiliate_user_id);

-- Affiliate Transactions: financial ledger for all affiliate money movements
CREATE TABLE IF NOT EXISTS affiliate_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  type TEXT NOT NULL, -- commission_earned, bonus_awarded, payout_processed, adjustment
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  description TEXT,
  source_id TEXT, -- reference to commission/payout/milestone ID
  source_type TEXT, -- commission, payout, milestone, adjustment
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_user ON affiliate_transactions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_type ON affiliate_transactions(type);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_created ON affiliate_transactions(created_at DESC);

-- Saved Link Presets: affiliates save favorite deep link configurations
CREATE TABLE IF NOT EXISTS affiliate_link_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '/',
  source_tag TEXT,
  include_utm BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_link_presets_user ON affiliate_link_presets(affiliate_user_id);
