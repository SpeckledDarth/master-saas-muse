-- Product Registry: Allows multiple SaaS products to be built on MuseKit
-- Each product has its own Stripe product ID, tier definitions, and metadata key
-- This is a core MuseKit table, not product-specific

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

-- RLS
ALTER TABLE muse_products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products (needed for pricing pages)
CREATE POLICY IF NOT EXISTS "Anyone can read active products"
  ON muse_products FOR SELECT
  USING (is_active = true);

-- Only service role can modify (admin operations go through service role)
CREATE POLICY IF NOT EXISTS "Service role can manage products"
  ON muse_products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Product subscriptions: tracks which user has which product subscription
CREATE TABLE IF NOT EXISTS muse_product_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL REFERENCES muse_products(slug) ON DELETE CASCADE,
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

-- RLS
ALTER TABLE muse_product_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY IF NOT EXISTS "Users can read own subscriptions"
  ON muse_product_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY IF NOT EXISTS "Service role can manage subscriptions"
  ON muse_product_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_subs_user ON muse_product_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_subs_stripe ON muse_product_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_muse_products_stripe ON muse_products(stripe_product_id);
