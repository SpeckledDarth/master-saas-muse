ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS referral_link_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_user ON referral_clicks(referral_link_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_country ON referral_clicks(country);

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_churned ON affiliate_referrals(churned_at);

CREATE POLICY "Service role full access referral_clicks" ON referral_clicks FOR ALL USING (auth.role() = 'service_role');
