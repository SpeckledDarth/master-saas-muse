-- Migration 009: Affiliate Enhancements Sprint 3
-- Features: Payout Accelerators (E6), Tier Perks (E7), Quarterly Contests (E10),
--           Scheduled Payout Runs (E27)
-- Run this in Supabase SQL Editor before testing Sprint 3 features.

-- E6: Payout Accelerators — tier-specific minimum payout overrides
ALTER TABLE affiliate_tiers
  ADD COLUMN IF NOT EXISTS min_payout_cents INTEGER;

-- E7: Exclusive Access / Tier Perks
ALTER TABLE affiliate_tiers
  ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb;

-- E10: Quarterly Contests
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
  winner_user_id UUID REFERENCES auth.users(id),
  winner_announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E27: Scheduled Payout Runs
CREATE TABLE IF NOT EXISTS affiliate_payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE NOT NULL,
  total_affiliates INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_payouts
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES affiliate_payout_batches(id);

-- E27: Add payout schedule settings
ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS auto_batch_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_schedule_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS auto_approve_threshold_cents INTEGER;

-- E25: Dormant re-engagement settings
ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS reengagement_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dormancy_threshold_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_reengagement_emails INTEGER DEFAULT 3;
