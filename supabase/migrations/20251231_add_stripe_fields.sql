-- Add Stripe fields to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Comment for documentation
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Active Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: free, active, past_due, canceled';
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription tier: free, pro, team';
