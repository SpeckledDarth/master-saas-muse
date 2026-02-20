# Adding a New Product to MuseKit

## Overview

MuseKit is a multi-product SaaS foundation. Instead of building every SaaS from scratch, you clone MuseKit (which provides auth, billing, admin, email, etc.) and layer your own product on top. The **Product Registry** system lets you run multiple products within a single MuseKit instance, each with its own Stripe billing, tier system, and feature limits.

Each product you add gets its own:

- **Database tables** in `migrations/extensions/`
- **API routes** in `src/app/api/{product}/`
- **Dashboard pages** in `src/app/dashboard/{product}/`
- **Library code** in `src/lib/{product}/`
- **Stripe Product** with its own pricing tiers and metadata

MuseKit core handles the plumbing (user auth, Stripe webhooks, subscription tracking, admin UI) so your product code only needs to define its tiers, tables, and business logic.

## Prerequisites

Before adding a product, make sure you have:

- A running MuseKit instance (Next.js app with Supabase)
- Supabase database with core migrations applied, including `migrations/core/002_product_registry.sql` (creates the `muse_products` and `muse_product_subscriptions` tables)
- A Stripe account configured with your secret key and webhook endpoint
- Admin access to your MuseKit instance (your user must have the `admin` role in the `user_roles` table)

## Step-by-Step Guide

### Step 1: Create Your Stripe Product

1. Go to **Stripe Dashboard > Products** and click **Add Product**
2. Set the product name (e.g., "KidVault")
3. Add a **metadata key** on the product that your tier resolver will use. The key name should be unique to your product (e.g., `kidvault_tier`). Set the value to match one of your planned tier definitions (e.g., `pro`, `team`)
4. Create **Price** objects for each paid tier (e.g., $9/mo for Pro, $29/mo for Team)
5. Note the **Product ID** (`prod_xxx`) and each **Price ID** (`price_xxx`) — you will need these

**Example Stripe product metadata:**

| Metadata Key     | Value  |
|------------------|--------|
| `kidvault_tier`  | `pro`  |

If you have multiple tiers, create separate Price objects. The metadata value on the Stripe Product tells MuseKit which tier the subscriber should receive.

### Step 2: Register in the MuseKit Product Registry

You have two options:

#### Option A: Admin UI (Recommended)

1. Navigate to `/admin/setup/products` in your MuseKit admin panel
2. Click **Add Product** and fill in:
   - **Slug**: lowercase identifier, used in code and URLs (e.g., `kidvault`)
   - **Name**: display name shown to users (e.g., "KidVault")
   - **Stripe Product ID**: the `prod_xxx` from Step 1
   - **Metadata Key**: must exactly match the metadata key you set on your Stripe product (e.g., `kidvault_tier`)
   - **Tier Definitions**: define each tier your product supports

#### Option B: API

Send a `POST` request to `/api/admin/products` (requires admin authentication):

```json
{
  "slug": "kidvault",
  "name": "KidVault",
  "description": "Secure digital vault for family memories",
  "stripeProductId": "prod_xxx",
  "metadataKey": "kidvault_tier",
  "tierDefinitions": [
    {
      "id": "free",
      "displayName": "Free",
      "stripeMetadataValue": "free",
      "limits": {
        "maxItems": 50,
        "maxStorageMB": 500,
        "sharingEnabled": false
      }
    },
    {
      "id": "pro",
      "displayName": "Pro",
      "stripeMetadataValue": "pro",
      "stripePriceId": "price_xxx_pro",
      "limits": {
        "maxItems": 5000,
        "maxStorageMB": 50000,
        "sharingEnabled": true
      }
    },
    {
      "id": "team",
      "displayName": "Team",
      "stripeMetadataValue": "team",
      "stripePriceId": "price_xxx_team",
      "limits": {
        "maxItems": -1,
        "maxStorageMB": -1,
        "sharingEnabled": true
      }
    }
  ]
}
```

**Tier Definition fields:**

| Field                  | Description                                                     |
|------------------------|-----------------------------------------------------------------|
| `id`                   | Internal tier ID used in code (e.g., `free`, `pro`, `team`)     |
| `displayName`          | Human-readable name shown in UI                                 |
| `stripeMetadataValue`  | Must match the metadata value on your Stripe Product            |
| `stripePriceId`        | Optional — the Stripe Price ID for this tier                    |
| `limits`               | Key-value pairs defining feature limits for this tier           |

The product registry stores this in the `muse_products` table and MuseKit's tier resolver uses it to determine what features a user has access to.

### Step 3: Create Database Tables

Create a migration file for your product's tables:

```
migrations/extensions/001_kidvault_tables.sql
```

Follow these conventions:

```sql
-- KidVault Extension: Tables for family memory vault
-- Run AFTER core migrations

CREATE TABLE IF NOT EXISTS kv_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kv_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES kv_vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'photo',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on ALL tables
ALTER TABLE kv_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY IF NOT EXISTS "Users can view own vaults"
  ON kv_vaults FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own vaults"
  ON kv_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own vaults"
  ON kv_vaults FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own vaults"
  ON kv_vaults FOR DELETE USING (auth.uid() = user_id);

-- Repeat for kv_items...

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kv_vaults_user ON kv_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_kv_items_vault ON kv_items(vault_id);
```

**Migration rules:**

- Use `CREATE TABLE IF NOT EXISTS` for idempotency
- Use a **table prefix** unique to your product (e.g., `kv_` for KidVault) to avoid name collisions
- Always reference `auth.users(id)` for `user_id` foreign keys
- Enable **Row Level Security** on every table
- Add RLS policies so users can only access their own data
- Never modify core MuseKit tables — only add new tables

**Run the migration** in the Supabase SQL Editor or via CLI:

```bash
psql $DATABASE_URL -f migrations/extensions/001_kidvault_tables.sql
```

### Step 4: Build Your Product Code

Create these directories for your product:

```
src/lib/kidvault/               # Business logic
  types.ts                      # Product-specific TypeScript types
  service.ts                    # Database queries and business logic

src/app/api/kidvault/           # API routes
  vaults/route.ts               # CRUD for vaults
  items/route.ts                # CRUD for items

src/app/dashboard/kidvault/     # Dashboard pages
  page.tsx                      # Main product dashboard
  settings/page.tsx             # Product-specific settings
```

**Product types** go in your own types file, not in `src/types/settings.ts`:

```typescript
// src/lib/kidvault/types.ts

export interface Vault {
  id: string
  userId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface VaultItem {
  id: string
  vaultId: string
  userId: string
  title: string
  itemType: string
  metadata: Record<string, unknown>
  createdAt: string
}
```

### Step 5: Use the Product Registry for Tier Resolution

MuseKit provides `getUserProductTier` to check what tier a user is on for your product. Use this to gate features and enforce limits.

```typescript
import { getUserProductTier } from '@/lib/products'

// In your API route or server component:
const { tier, limits, source } = await getUserProductTier(userId, 'kidvault')

// tier = 'free', 'pro', 'team', etc.
// limits = { maxItems: 50, maxStorageMB: 500, sharingEnabled: false }
// source = 'subscription' | 'product-registry' | 'default'

// Example: enforce item limit
if (typeof limits.maxItems === 'number' && limits.maxItems > 0) {
  const currentCount = await getItemCount(userId)
  if (currentCount >= limits.maxItems) {
    return NextResponse.json(
      { error: 'Item limit reached. Upgrade to add more.' },
      { status: 403 }
    )
  }
}

// Example: check boolean feature flag
if (!limits.sharingEnabled) {
  return NextResponse.json(
    { error: 'Sharing requires a Pro plan.' },
    { status: 403 }
  )
}
```

The tier resolver checks in this order:
1. **Product subscription table** (`muse_product_subscriptions`) — fastest, cached from previous lookups
2. **Stripe subscription** — fetches from Stripe API and caches the result back to the subscription table
3. **Default** — falls back to the first tier definition (usually your free tier)

You can also use the shorthand helper:

```typescript
import { getProductLimits } from '@/lib/products'

const limits = await getProductLimits(userId, 'kidvault')
```

### Step 6: Set Up Checkout

MuseKit has a built-in checkout API at `/api/stripe/checkout`. Pass your product's slug so the subscription is tagged correctly:

```typescript
// Client-side: trigger checkout
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx',
    productSlug: 'kidvault',
  }),
})

const { url } = await response.json()
window.location.href = url // Redirect to Stripe Checkout
```

The `productSlug` gets stored in the Stripe subscription's metadata as `muse_product`, which the webhook handler uses to update the correct product subscription when payments come in.

### Step 7: Test the Integration

1. **Register your product** via the admin UI at `/admin/setup/products` and verify it appears in the list
2. **Subscribe using Stripe test mode**: trigger a checkout with a test card (`4242 4242 4242 4242`)
3. **Verify tier resolution** by calling `getUserProductTier(userId, 'kidvault')` in your API routes — it should return the correct tier and limits
4. **Check the subscription table**: the `muse_product_subscriptions` table should have a row with your user's subscription details
5. **Test tier enforcement**: verify that free users are blocked from premium features and paid users can access them
6. **Test cancellation**: cancel the subscription in Stripe and verify the user falls back to the free tier

## Architecture Rules

1. **One-way dependency**: Your product code imports from MuseKit core (`@/lib/products`, `@/lib/stripe`, `@/lib/supabase`), never the reverse. Core MuseKit must never import from `@/lib/kidvault/`.

2. **No core modifications**: Never add product-specific code to MuseKit core files. If you need a new core capability, add it generically so all products can use it.

3. **Own your types**: Product-specific types go in `src/lib/{product}/types.ts`, not in `src/types/settings.ts` or any other core type file.

4. **Prefix tables**: Use a unique prefix for all your database tables (e.g., `kv_` for KidVault, `fin_` for a finance product). This prevents collisions and makes it clear which tables belong to which product.

5. **Scoped metadata**: Use a unique metadata key for your Stripe product (e.g., `kidvault_tier`). Never reuse another product's metadata key.

6. **Idempotent migrations**: Always use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `CREATE POLICY IF NOT EXISTS` so migrations can be re-run safely.

7. **RLS everywhere**: Every table must have Row Level Security enabled with appropriate policies.

## Example: PassivePost

PassivePost is the reference implementation of a product built on MuseKit. Here is how it follows the pattern:

### Product Registration

PassivePost is registered with slug `passive-post` and uses the metadata key `muse_tier` on its Stripe product. Its tier definitions include `tier_1` (Starter), `tier_2` (Basic), and `tier_3` (Premium), each with limits like `dailyPosts`, `dailyAiGenerations`, `monthlyPosts`, and `maxPlatforms`.

### Database Tables

- **Core tables** (in `migrations/core/001_social_tables.sql`): `social_accounts`, `social_posts` — shared social infrastructure
- **Extension tables** (in `migrations/extensions/001_passivepost_tables.sql`): `brand_preferences`, `alert_logs`, plus additional columns on `social_posts` (`trend_source`, `niche_triggered`)

### Code Structure

```
src/lib/social/                  # Business logic
  types.ts                       # PassivePost-specific types & tier definitions
  user-tier.ts                   # Tier resolution wrapper using getUserProductTier
  client.ts                      # Social platform API clients
  posts.sql                      # SQL queries for post management

src/app/api/social/              # API routes
  posts/route.ts                 # CRUD for social posts
  accounts/route.ts              # Social account management
  tier/route.ts                  # Tier info endpoint
  generate-post/route.ts         # AI post generation

src/app/dashboard/social/        # Dashboard pages
  page.tsx                       # Main social dashboard
  posts/page.tsx                 # Post management
  calendar/page.tsx              # Content calendar
  brand/page.tsx                 # Brand preferences
  queue/page.tsx                 # Post queue
```

### Tier Resolution Usage

PassivePost wraps `getUserProductTier` in a helper (`src/lib/social/user-tier.ts`):

```typescript
import { getUserProductTier } from '@/lib/products'

export async function getUserSocialTier(userId: string) {
  const result = await getUserProductTier(userId, 'passive-post')
  return {
    tier: result.tier,
    source: result.source === 'subscription' ? 'subscription' : 'admin',
  }
}
```

This pattern (a thin wrapper around the core tier resolver) is recommended for all products.

For complete PassivePost documentation including all dashboard pages, API routes, OAuth flows, and tier details, see `docs/passivepost/PRODUCT_GUIDE.md`.

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/products/types.ts` | TypeScript interfaces for products, tiers, and subscriptions |
| `src/lib/products/registry.ts` | `ProductRegistry` class — CRUD for products and subscriptions |
| `src/lib/products/tier-resolver.ts` | `getUserProductTier` — resolves a user's tier for any product |
| `src/lib/products/index.ts` | Public exports for the products module |
| `src/app/api/admin/products/route.ts` | Admin API — list and create products (GET/POST) |
| `src/app/api/admin/products/[slug]/route.ts` | Admin API — update and delete products (PUT/DELETE) |
| `src/app/api/stripe/checkout/route.ts` | Checkout API — accepts `productSlug` for scoped subscriptions |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook — updates product subscriptions on payment events |
| `src/app/admin/setup/products/page.tsx` | Admin UI for managing the product registry |
| `migrations/core/002_product_registry.sql` | Database tables: `muse_products`, `muse_product_subscriptions` |
| `migrations/extensions/` | Directory for product-specific migration files |
| `scripts/seed-products.ts` | Example script for seeding Stripe products |

*Last Updated: February 19, 2026*
