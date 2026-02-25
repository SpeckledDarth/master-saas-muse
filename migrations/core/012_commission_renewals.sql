CREATE TABLE IF NOT EXISTS commission_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id),
  referral_id UUID NOT NULL,
  original_end_date DATE NOT NULL,
  renewed_end_date DATE NOT NULL,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('email', 'call', 'note')),
  check_in_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_commission_renewals_affiliate ON commission_renewals(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_renewals_status ON commission_renewals(status);
CREATE INDEX IF NOT EXISTS idx_commission_renewals_referral ON commission_renewals(referral_id);

ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS commission_end_date DATE;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'active' CHECK (health_status IN ('active', 'at_risk', 'churned'));

ALTER TABLE commission_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own renewals" ON commission_renewals
  FOR SELECT USING (affiliate_user_id = auth.uid());

CREATE POLICY "Affiliates can insert own renewals" ON commission_renewals
  FOR INSERT WITH CHECK (affiliate_user_id = auth.uid());

CREATE POLICY "Service role full access to renewals" ON commission_renewals
  FOR ALL USING (auth.role() = 'service_role');
