-- Replit Postgres Sync: All migrations 001-016 adapted for Replit
-- Strips out auth.users FK references, RLS policies, auth.uid() functions
-- Safe to re-run (uses IF NOT EXISTS / IF NOT EXISTS throughout)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 002: Product Registry
CREATE TABLE IF NOT EXISTS muse_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  stripe_product_id TEXT,
  metadata_key TEXT NOT NULL,
  tier_definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  feature_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS muse_product_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_slug TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  tier_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'free',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_slug)
);

CREATE INDEX IF NOT EXISTS idx_product_subs_user ON muse_product_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_subs_stripe ON muse_product_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_muse_products_stripe ON muse_products(stripe_product_id);

-- 003: Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL,
  avatar_url TEXT,
  company_logo_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_org ON testimonials(organization_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured);

-- 004: Launch Kit
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ref_code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_links_user ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(ref_code);

CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(ref_code);

CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  step INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'viewed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_step ON onboarding_events(step);

CREATE TABLE IF NOT EXISTS email_drip_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sequence_name TEXT NOT NULL DEFAULT 'welcome',
  step INTEGER NOT NULL,
  email_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_drip_user ON email_drip_log(user_id, sequence_name);

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

CREATE INDEX IF NOT EXISTS idx_changelog_published ON changelog_entries(published, published_at);

-- 005: Affiliate System
CREATE TABLE IF NOT EXISTS affiliate_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  commission_duration_months INTEGER NOT NULL DEFAULT 12,
  min_payout_cents INTEGER NOT NULL DEFAULT 5000,
  cookie_duration_days INTEGER NOT NULL DEFAULT 30,
  program_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_referrals INTEGER NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_commission_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS locked_duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_tier_id UUID,
  ADD COLUMN IF NOT EXISTS total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_earnings_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_earnings_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
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

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  referral_id UUID NOT NULL,
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

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

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

INSERT INTO affiliate_program_settings (commission_rate, commission_duration_months, min_payout_cents, cookie_duration_days)
SELECT 20.00, 12, 5000, 30
WHERE NOT EXISTS (SELECT 1 FROM affiliate_program_settings);

INSERT INTO affiliate_tiers (name, min_referrals, commission_rate, sort_order)
SELECT 'Bronze', 0, 20.00, 1 WHERE NOT EXISTS (SELECT 1 FROM affiliate_tiers WHERE name='Bronze');
INSERT INTO affiliate_tiers (name, min_referrals, commission_rate, sort_order)
SELECT 'Silver', 25, 25.00, 2 WHERE NOT EXISTS (SELECT 1 FROM affiliate_tiers WHERE name='Silver');
INSERT INTO affiliate_tiers (name, min_referrals, commission_rate, sort_order)
SELECT 'Gold', 100, 30.00, 3 WHERE NOT EXISTS (SELECT 1 FROM affiliate_tiers WHERE name='Gold');

-- 006: Affiliate Applications
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  website_url TEXT,
  promotion_method TEXT NOT NULL DEFAULT 'other',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_applications_email ON affiliate_applications(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);

CREATE TABLE IF NOT EXISTS affiliate_network_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name TEXT NOT NULL,
  network_slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  tracking_id TEXT,
  postback_url TEXT,
  api_key TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS affiliate_role TEXT NOT NULL DEFAULT 'user';

INSERT INTO affiliate_network_settings (network_name, network_slug, is_active)
SELECT 'ShareASale', 'shareasale', false WHERE NOT EXISTS (SELECT 1 FROM affiliate_network_settings WHERE network_slug='shareasale');
INSERT INTO affiliate_network_settings (network_name, network_slug, is_active)
SELECT 'Impact', 'impact', false WHERE NOT EXISTS (SELECT 1 FROM affiliate_network_settings WHERE network_slug='impact');
INSERT INTO affiliate_network_settings (network_name, network_slug, is_active)
SELECT 'PartnerStack', 'partnerstack', false WHERE NOT EXISTS (SELECT 1 FROM affiliate_network_settings WHERE network_slug='partnerstack');

-- 007: Enhancements P1 (Discount Codes, Milestones, Broadcasts)
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
  affiliate_user_id UUID,
  stripe_coupon_id TEXT,
  stripe_promotion_code_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  total_uses INTEGER NOT NULL DEFAULT 0,
  total_discount_cents INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discount_codes_affiliate ON discount_codes(affiliate_user_id);

CREATE TABLE IF NOT EXISTS discount_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL,
  user_id UUID NOT NULL,
  stripe_invoice_id TEXT,
  discount_amount_cents INTEGER NOT NULL,
  attributed_affiliate_id UUID,
  attribution_method TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code ON discount_code_redemptions(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user ON discount_code_redemptions(user_id);

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS attribution_conflict_policy TEXT NOT NULL DEFAULT 'cookie_wins';

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
  affiliate_user_id UUID NOT NULL,
  milestone_id UUID NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bonus_amount_cents INTEGER NOT NULL,
  UNIQUE(affiliate_user_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_milestone_awards_affiliate ON affiliate_milestone_awards(affiliate_user_id);

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
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_broadcast_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL,
  affiliate_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_receipts_broadcast ON affiliate_broadcast_receipts(broadcast_id);

-- 008: Enhancements P2 (Deep Link, Source Tags, Leaderboard)
ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS landing_page TEXT;

ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS source_tag TEXT;

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS source_tag TEXT;

CREATE INDEX IF NOT EXISTS idx_referral_clicks_source_tag ON referral_clicks(source_tag);

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS leaderboard_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS leaderboard_privacy_mode TEXT NOT NULL DEFAULT 'initials';

-- 009: Enhancements P3 (Payout Accelerators, Tier Perks, Contests)
ALTER TABLE affiliate_tiers
  ADD COLUMN IF NOT EXISTS min_payout_cents INTEGER;

ALTER TABLE affiliate_tiers
  ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS affiliate_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL DEFAULT 'referrals',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_description TEXT NOT NULL,
  prize_amount_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming',
  winner_user_id UUID,
  winner_announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE NOT NULL,
  total_affiliates INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_payouts
  ADD COLUMN IF NOT EXISTS batch_id UUID;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS auto_batch_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_schedule_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS auto_approve_threshold_cents INTEGER;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS reengagement_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dormancy_threshold_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_reengagement_emails INTEGER DEFAULT 3;

-- 010: Sprint 4 (Tax, Landing Pages, Two-Tier, API, Messaging, Surveys, Badges, Webhooks)
ALTER TABLE affiliate_applications
  ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS fraud_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fraud_score_updated_at TIMESTAMPTZ;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS fraud_auto_pause_threshold INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS fraud_scoring_enabled BOOLEAN DEFAULT false;

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS recruited_by_affiliate_id UUID;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS two_tier_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS second_tier_commission_rate NUMERIC(5,2) DEFAULT 5.00;

ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS survey_interval_days INTEGER DEFAULT 90;

CREATE TABLE IF NOT EXISTS affiliate_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  tax_id_type TEXT NOT NULL DEFAULT 'ssn',
  tax_id_last4 TEXT,
  tax_id_encrypted TEXT,
  address_line1 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT NOT NULL DEFAULT 'US',
  form_type TEXT NOT NULL DEFAULT 'w9',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_tax_info_user ON affiliate_tax_info(affiliate_user_id);

CREATE TABLE IF NOT EXISTS affiliate_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,
  bio TEXT,
  photo_url TEXT,
  custom_cta TEXT,
  theme_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_landing_pages_slug ON affiliate_landing_pages(slug);

CREATE TABLE IF NOT EXISTS affiliate_second_tier_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier1_affiliate_id UUID NOT NULL,
  tier2_affiliate_id UUID NOT NULL,
  original_commission_id UUID,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_second_tier_tier1 ON affiliate_second_tier_commissions(tier1_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_second_tier_tier2 ON affiliate_second_tier_commissions(tier2_affiliate_id);

CREATE TABLE IF NOT EXISTS affiliate_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_api_keys_user ON affiliate_api_keys(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_api_keys_hash ON affiliate_api_keys(api_key_hash);

CREATE TABLE IF NOT EXISTS affiliate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'affiliate',
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_messages_affiliate ON affiliate_messages(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_messages_unread ON affiliate_messages(affiliate_user_id, is_read);

CREATE TABLE IF NOT EXISTS affiliate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  can_use_as_testimonial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_surveys_affiliate ON affiliate_surveys(affiliate_user_id);

CREATE TABLE IF NOT EXISTS affiliate_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID,
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  earnings_display TEXT,
  tier_name TEXT,
  avatar_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_badge_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  threshold_cents INTEGER NOT NULL,
  badge_image_url TEXT,
  embed_html TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  threshold_cents INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_affiliate_badges_user ON affiliate_badges(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_badges_verification ON affiliate_badges(verification_code);

INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Verified Partner', 50000, 1 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name='Verified Partner');
INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Top Partner', 250000, 2 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name='Top Partner');
INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Elite Partner', 1000000, 3 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name='Elite Partner');

CREATE TABLE IF NOT EXISTS affiliate_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['affiliate.commission', 'affiliate.payout'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_webhooks_user ON affiliate_webhooks(affiliate_user_id);

CREATE TABLE IF NOT EXISTS affiliate_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON affiliate_webhook_deliveries(webhook_id);

-- 011: CRM Foundation
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  bio TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  invoice_number TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  currency TEXT NOT NULL DEFAULT 'usd',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  amount_due_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  invoice_pdf_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_line_item_id TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_amount_cents INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  price_id TEXT,
  product_id TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'succeeded',
  payment_method_type TEXT,
  payment_method_last4 TEXT,
  payment_method_brand TEXT,
  refunded_amount_cents INTEGER NOT NULL DEFAULT 0,
  failure_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS affiliate_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL,
  commission_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payout_id, commission_id)
);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout ON affiliate_payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_commission ON affiliate_payout_items(commission_id);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assigned_to UUID,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  ticket_number SERIAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  performed_by UUID NOT NULL,
  activity_type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_performed_by ON activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(related_entity_type, related_entity_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget_cents INTEGER,
  clicks INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_utm ON campaigns(utm_campaign);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  contract_type TEXT NOT NULL DEFAULT 'affiliate_terms',
  effective_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by UUID,
  countersigned_at TIMESTAMPTZ,
  countersigned_by UUID,
  parent_contract_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);

-- 012: Commission Renewals
CREATE TABLE IF NOT EXISTS commission_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  referral_id UUID NOT NULL,
  original_end_date DATE NOT NULL,
  renewed_end_date DATE NOT NULL,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('email', 'call', 'note')),
  check_in_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_commission_renewals_affiliate ON commission_renewals(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_renewals_status ON commission_renewals(status);
CREATE INDEX IF NOT EXISTS idx_commission_renewals_referral ON commission_renewals(referral_id);

ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS commission_end_date DATE;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'active';

-- 013: Delight Features
CREATE TABLE IF NOT EXISTS affiliate_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
  affiliate_user_id UUID NOT NULL,
  referral_id UUID,
  commission_id UUID,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'approved', 'denied')),
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_commission_disputes_affiliate ON commission_disputes(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_disputes_status ON commission_disputes(status);

CREATE TABLE IF NOT EXISTS affiliate_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
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
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_spotlight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  month TEXT NOT NULL,
  affiliate_name TEXT NOT NULL,
  affiliate_avatar TEXT DEFAULT '',
  story TEXT DEFAULT '',
  stats_summary TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
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
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connected_platforms_user ON connected_platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_platform_metrics_user ON connected_platform_metrics(user_id, platform, date);

-- 014: Analytics Columns
ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS referral_link_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_referral_clicks_user ON referral_clicks(referral_link_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_country ON referral_clicks(country);

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_churned ON affiliate_referrals(churned_at);

-- 015: Session D tables (asset_usage already exists, just add missing cols)
-- knowledge_base_articles already created earlier in core tables

-- 016: Session E tables
-- challenge_progress and case_studies already exist in core tables

-- Affiliate profiles table (referenced by 016 ALTER)
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  payout_method TEXT DEFAULT 'paypal',
  payout_email TEXT,
  tour_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user ON affiliate_profiles(user_id);

DO $$ BEGIN
  ALTER TABLE affiliate_profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT false;
EXCEPTION WHEN others THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE affiliate_profiles ADD COLUMN IF NOT EXISTS quiz_results JSONB;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Link presets table (used by affiliate dashboard)
CREATE TABLE IF NOT EXISTS affiliate_link_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  landing_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_link_presets_user ON affiliate_link_presets(affiliate_user_id);
