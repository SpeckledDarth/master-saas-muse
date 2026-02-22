# Affiliate System Enhancements — Feature Plan

> **Version:** 1.0 | **Created:** February 22, 2026 | **Status:** Planning
>
> This document covers all planned enhancements to the MuseKit affiliate system, organized by priority. These features build on the existing Phase 3 + 3.5 infrastructure (core affiliate system, open signup, admin management, Stripe integration).

---

## Feature Summary

| # | Feature | Priority | Category | Complexity |
|---|---------|----------|----------|------------|
| E1 | Milestone Bonuses | P1 — High | Motivation | Medium |
| E2 | Affiliate Leaderboard | P1 — High | Motivation | Medium |
| E3 | Discount Code System | P1 — High | Revenue | High |
| E4 | Deep Link Generator | P1 — High | Tools | Medium |
| E5 | Real-Time Earnings Widget | P1 — High | UX | Low |
| E6 | Payout Accelerators | P2 — Medium | Motivation | Low |
| E7 | Exclusive Access / Tier Perks | P2 — Medium | Motivation | Medium |
| E8 | Referral Sub-Tracking (Source Tags) | P2 — Medium | Analytics | Medium |
| E9 | UTM Parameter Support | P2 — Medium | Analytics | Low |
| E10 | Quarterly Contests | P2 — Medium | Engagement | Medium |
| E11 | Affiliate Onboarding Guide (7-Day Sequence) | P2 — Medium | Onboarding | Medium |
| E12 | Affiliate Resource Center | P2 — Medium | Content | Medium |
| E13 | Co-Branded Landing Pages | P3 — Lower | Growth | High |
| E14 | Two-Tier Referrals | P3 — Lower | Growth | High |
| E15 | Tax Compliance (1099 / W-9) | P3 — Lower | Compliance | High |
| E16 | Anti-Spam & Compliance Rules | P3 — Lower | Compliance | Medium |
| E17 | Automated Fraud Scoring | P3 — Lower | Security | Medium |
| E18 | Affiliate API Access | P3 — Lower | Developer | Medium |
| E19 | PassivePost Auto-Promo Integration | P3 — Lower | Dogfooding | Medium |
| E20 | PartnerStack Seeding Strategy | P3 — Lower | Distribution | Low |

---

## Priority 1 — Build First

These features have the highest impact on affiliate motivation, admin usefulness, and revenue.

---

### E1: Milestone Bonuses

**What:** One-time flat bonuses paid to affiliates when they hit specific referral counts (e.g., $50 at 10 referrals, $150 at 50 referrals). Layered on top of the existing percentage-based commission tiers.

**Why:** Tiers increase the ongoing rate, but milestones create short-term goals. "3 more referrals and you unlock a $50 bonus" is a powerful motivator.

**Admin configuration:**
- Milestone threshold (number of converted referrals)
- Bonus amount (in cents)
- Active/inactive toggle
- Description text (shown to affiliates)

**Affiliate experience:**
- Progress bar showing distance to next milestone on dashboard
- Notification when a milestone is reached
- Bonus auto-added to pending earnings

**Database:**

```sql
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
```

**API endpoints:**
- `GET/POST/PATCH/DELETE /api/affiliate/milestones` — Admin CRUD
- Milestone check runs automatically when a new referral converts

**Admin UI:** New "Milestones" section in the affiliate admin page (similar to existing Tiers CRUD).

**Affiliate UI:** Milestone progress card on dashboard showing next milestone, current count, and bonus amount.

---

### E2: Affiliate Leaderboard

**What:** A ranked list of top-performing affiliates visible on the affiliate dashboard. Shows position, anonymized name, and metrics.

**Why:** Competition drives performance. Even a simple "you're #7 this month" creates motivation to climb.

**Display options:**
- Time period: This month, last month, all time
- Metrics: total referrals, total earnings, conversion rate
- Privacy: show initials + rank (e.g., "J.S. — #3") or allow opt-in to display name

**Database:** No new tables — query existing `affiliate_referrals` and `affiliate_commissions` with aggregation.

**API endpoints:**
- `GET /api/affiliate/leaderboard?period=month&metric=referrals&limit=10`
- Returns: rank, display name (initials or opted-in name), metric value, own position

**Admin configuration:**
- Leaderboard enabled/disabled toggle (in affiliate program settings)
- Privacy mode: initials only vs. opt-in full name

**Affiliate UI:** Leaderboard card on dashboard with top 10 + "Your position: #X" highlight.

---

### E3: Discount Code System

**What:** Admin-created promotional codes that apply discounts at Stripe checkout. Works independently of the affiliate system but can optionally be tied to an affiliate for attribution.

**Why:** Every SaaS needs promo codes. They drive conversions from marketing campaigns, partnerships, events, and retention offers. A sellable template must include this.

**Configurable fields per code:**

| Field | Type | Description |
|-------|------|-------------|
| Code | Text | The code users enter (e.g., `LAUNCH20`, `PARTNER-JANE`) |
| Description | Text | Internal note for admin |
| Discount type | Enum | `percentage` or `fixed_amount` |
| Discount value | Number | Percentage (e.g., 20) or cents (e.g., 1000 = $10) |
| Duration | Enum | `once` (first payment), `repeating` (X months), `forever` |
| Duration months | Number | Only if duration = repeating |
| Max total uses | Number | Null = unlimited |
| Max uses per user | Number | Default 1 |
| Minimum plan | Text | Null = any plan, or specific plan slug |
| Stackable | Boolean | Can combine with other codes (default false) |
| Expires at | Timestamp | Null = no expiration |
| Affiliate ID | UUID | Optional — ties code to an affiliate for attribution |
| Status | Enum | `active`, `paused`, `expired`, `archived` |

**Database:**

```sql
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

CREATE TABLE IF NOT EXISTS discount_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_invoice_id TEXT,
  discount_amount_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code ON discount_code_redemptions(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user ON discount_code_redemptions(user_id);
```

**Stripe integration:**
- On code creation: create Stripe Coupon + Promotion Code via API
- On checkout: apply Stripe Promotion Code to checkout session
- On webhook (`invoice.paid`): record redemption, update usage counters
- Expired/paused codes: deactivate Stripe Promotion Code

**API endpoints:**
- `GET /api/admin/discount-codes` — List all codes with filters (status, search)
- `POST /api/admin/discount-codes` — Create new code (also creates Stripe coupon)
- `PATCH /api/admin/discount-codes/[id]` — Update code (pause, activate, archive)
- `DELETE /api/admin/discount-codes/[id]` — Archive code
- `GET /api/discount-codes/validate?code=LAUNCH20` — Public validation endpoint
- `POST /api/discount-codes/apply` — Apply code to checkout session

**Admin UI:** New "Discount Codes" page at `/admin/setup/discount-codes` with:
- Table: code, type, value, uses/max, expires, status, actions
- Filters: active, paused, expired, archived
- Create/edit modal with all configurable fields
- Quick actions: pause, activate, archive, copy code
- Stats row: total codes, active codes, total redemptions, total discount given

**Checkout integration:**
- "Have a promo code?" input on pricing/checkout page
- Validates code via API before applying
- Shows discount preview before payment

---

### E4: Deep Link Generator

**What:** Let affiliates create referral links to specific pages (pricing, features, blog posts, landing page), not just the homepage.

**Why:** An affiliate writing a blog post about pricing wants to link directly to the pricing page with their ref code. Homepage-only links lose context.

**How it works:**
- Affiliate enters any URL path on the product site
- System generates: `https://product.com/pricing?ref=ABC123`
- Click tracking attributes to the affiliate regardless of landing page
- Existing `ReferralTracker` component already reads `?ref=` on any page

**Affiliate UI:** "Create Link" section on dashboard with:
- Dropdown of common pages (Home, Pricing, Features, Blog) + custom URL input
- Generated link with copy button
- Preview of how the link will look

**API:** No new endpoints needed — the `ReferralTracker` component already handles `?ref=` on any page. The deep link generator is purely a frontend tool on the affiliate dashboard.

**Database:** Optional — track which destination URLs perform best:

```sql
ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS landing_page TEXT;
```

---

### E5: Real-Time Earnings Widget

**What:** A live-updating "Today's earnings" counter on the affiliate dashboard header. Shows earnings accrued today with a gentle animation when new commissions arrive.

**Why:** Dopamine hit. "You've earned $12.50 today" keeps affiliates engaged and checking their dashboard.

**Implementation:**
- Query today's commissions on dashboard load
- Optional: polling every 60 seconds or SSE for real-time updates
- Animated counter (count-up effect when value changes)
- Shows: today, this week, this month as tabs

**No new database tables** — aggregates existing `affiliate_commissions` by date range.

**API:** `GET /api/affiliate/earnings/live?period=today` — returns earnings for the requested period.

---

## Priority 2 — Build Second

Important features that improve the affiliate experience but aren't critical for launch.

---

### E6: Payout Accelerators

**What:** Lower the minimum payout threshold for top-tier affiliates. Gold tier might have a $25 minimum instead of the default $50.

**Implementation:** Add `min_payout_cents` column to `affiliate_tiers` table. When calculating payout eligibility, use the affiliate's tier threshold instead of the global setting.

**Database change:**

```sql
ALTER TABLE affiliate_tiers
  ADD COLUMN IF NOT EXISTS min_payout_cents INTEGER;
```

Null means "use global default." A value overrides for that tier.

**Admin UI:** Add "Min Payout" field to the existing tier edit modal.

---

### E7: Exclusive Access / Tier Perks

**What:** Each tier can offer non-monetary perks — beta feature access, private Discord invite, early product access, priority support.

**Implementation:** Add a `perks` JSONB column to `affiliate_tiers` storing an array of perk descriptions. Display perks on the affiliate dashboard next to tier info.

**Database change:**

```sql
ALTER TABLE affiliate_tiers
  ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb;
```

**Perk structure:**

```json
[
  { "icon": "star", "title": "Beta Feature Access", "description": "Try new features before public launch" },
  { "icon": "message-circle", "title": "Private Discord", "description": "Join our affiliate-only Discord channel", "link": "https://discord.gg/..." }
]
```

**Admin UI:** Add "Perks" section to the tier edit modal — dynamic list of perk entries.

**Affiliate UI:** "Your Perks" card on dashboard showing unlocked perks for current tier + preview of next tier's perks.

---

### E8: Referral Sub-Tracking (Source Tags)

**What:** Let affiliates tag their referral links with a source identifier so they can see which campaigns or channels drive their conversions.

**Example:** `https://product.com/?ref=ABC123&src=youtube-review` vs `https://product.com/?ref=ABC123&src=newsletter-jan`

**Why:** Power affiliates optimize across channels. Knowing "my YouTube review drove 40 signups but my newsletter only drove 5" helps them focus.

**Database change:**

```sql
ALTER TABLE referral_clicks
  ADD COLUMN IF NOT EXISTS source_tag TEXT;

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS source_tag TEXT;
```

**Implementation:**
- `ReferralTracker` reads `?src=` parameter alongside `?ref=`
- Source tag stored with click and signup attribution
- Affiliate dashboard shows breakdown by source tag

**Affiliate UI:** "Performance by Source" table on dashboard showing clicks, signups, and conversion rate per source tag.

---

### E9: UTM Parameter Support

**What:** Auto-append UTM tags to affiliate referral links so affiliates can track performance in their own analytics tools (Google Analytics, etc.).

**Implementation:**
- Deep link generator adds UTM parameters:
  - `utm_source=product-name`
  - `utm_medium=affiliate`
  - `utm_campaign={affiliate_code}`
  - `utm_content={source_tag}` (if sub-tracking is used)
- Purely a frontend enhancement to the deep link generator
- No database changes needed

---

### E10: Quarterly Contests

**What:** Admin-configurable time-bound competitions with prizes. "Highest converter in Q1 wins $500."

**Why:** Creates urgency and engagement spikes. Works especially well when announced via the affiliate drip emails.

**Database:**

```sql
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
```

**Admin UI:** "Contests" tab in affiliate admin — create/edit contests with name, dates, metric, prize description. Mark winner when contest ends.

**Affiliate UI:** Active contest banner on dashboard with countdown timer, current standings, and prize info.

---

### E11: Affiliate Onboarding Guide (7-Day Sequence)

**What:** Expand the existing 3-email drip (welcome, tips, strategy) to a 7-day "First Week Success" sequence with actionable daily tasks.

**Sequence:**
1. Day 0: Welcome + dashboard tour (existing)
2. Day 1: "Share your first link" — step-by-step guide
3. Day 2: "Write your first review" — templates and tips
4. Day 3: "Promote on social media" — swipe copy + best times
5. Day 5: "Check your stats" — how to read the dashboard
6. Day 7: "Your first week report" — personalized stats summary
7. Day 14: "Level up" — advanced strategies for top earners

**Implementation:** Extend existing `email_drip_log` system with 4 additional emails in the `affiliate` sequence.

---

### E12: Affiliate Resource Center

**What:** A dedicated content hub in the affiliate dashboard with swipe files, email templates, social post templates, FAQ, video tutorials, and best practices.

**Why:** Good affiliates want to promote well but need help. A resource center reduces the support burden and improves content quality.

**Implementation:**
- New tab or page on the affiliate dashboard: `/affiliate/dashboard/resources`
- Content organized by type: Swipe Files, Email Templates, Social Posts, FAQs, Videos
- Admin manages content via the existing marketing assets system (extend with new asset types)

**Database change:** Add new asset types to `affiliate_assets`:

```sql
-- No schema change needed — just add new values for asset_type:
-- 'swipe_file', 'faq', 'video_tutorial', 'best_practice'
-- alongside existing: 'banner', 'email_template', 'social_post', 'text_snippet'
```

---

## Priority 3 — Build When Ready

Advanced features that differentiate the template as world-class but require more infrastructure.

---

### E13: Co-Branded Landing Pages

**What:** Each affiliate gets a personalized landing page with their name/photo/bio alongside the product branding. URL: `https://product.com/partner/jane-doe`

**Why:** Builds trust when an affiliate's audience clicks through — they see a familiar face endorsing the product.

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
```

**Affiliate UI:** "Your Landing Page" editor on dashboard — edit headline, bio, photo, CTA text, preview.

**Public route:** `/partner/[slug]` — renders the co-branded page with the affiliate's ref code baked in.

---

### E14: Two-Tier Referrals

**What:** Affiliates earn a small percentage (e.g., 5%) when someone they referred also becomes an affiliate who generates sales.

**Why:** Creates exponential growth incentive. Affiliate A recruits Affiliate B, and A earns from B's sales too.

**Database:**

```sql
ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS recruited_by_affiliate_id UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS affiliate_second_tier_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier1_affiliate_id UUID NOT NULL REFERENCES auth.users(id),
  tier2_affiliate_id UUID NOT NULL REFERENCES auth.users(id),
  original_commission_id UUID NOT NULL REFERENCES affiliate_commissions(id),
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin configuration:**
- Two-tier enabled/disabled toggle
- Second-tier commission rate (e.g., 5%)

**Implementation:** When a commission is created for Affiliate B, check if B was recruited by Affiliate A. If so, create a second-tier commission for A at the configured rate.

---

### E15: Tax Compliance (1099 / W-9)

**What:** Collect tax information (W-9 for US, W-8BEN for international) before first payout. Flag affiliates who cross the $600 IRS reporting threshold.

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
```

**Workflow:**
1. Affiliate applies for first payout
2. System checks if tax info is on file
3. If not, shows tax form (W-9 or W-8BEN based on country)
4. Admin can view submitted forms (redacted) and mark verified
5. At year-end, admin can export 1099 data for affiliates over $600

**Admin UI:** "Tax Info" column in affiliate list — status indicator (submitted, verified, missing). Bulk export for 1099 generation.

---

### E16: Anti-Spam & Compliance Rules

**What:** Enforceable rules that affiliates agree to, with automated detection of violations.

**Rules to enforce:**
- No spam email promotion
- No misleading claims about the product
- No bidding on brand keywords in paid ads (unless approved)
- Required FTC disclosure on all promotional content
- No cookie stuffing or forced clicks

**Implementation:**
- Terms of service checkbox on application form
- Admin can flag/suspend affiliates for violations
- "Report Affiliate" mechanism for end users who receive spam
- Violation tracking on affiliate record

**Database change:**

```sql
ALTER TABLE affiliate_applications
  ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
```

---

### E17: Automated Fraud Scoring

**What:** A numeric fraud score (0-100) per affiliate based on behavioral signals, with auto-pause at a threshold.

**Scoring factors:**
- Same IP cluster across referrals (+20)
- Rapid signups with no conversions (+15)
- Self-referral detected (+30)
- All referrals from same email domain (+10)
- Referrals that cancel within 24 hours (+25)
- Geographic mismatch between affiliate and referrals (+5)

**Implementation:**
- Fraud score recalculated on each new referral/commission event
- Stored on the referral link record
- Auto-pause affiliate if score exceeds threshold (configurable, default 60)
- Admin notification when affiliate is auto-paused
- Admin can review and override (restore or permanently ban)

**Database change:**

```sql
ALTER TABLE referral_links
  ADD COLUMN IF NOT EXISTS fraud_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fraud_score_updated_at TIMESTAMPTZ;
```

---

### E18: Affiliate API Access

**What:** RESTful API for power affiliates to programmatically pull their stats, earnings, and referral data.

**Endpoints (affiliate-authenticated):**
- `GET /api/affiliate/v1/stats` — Summary stats
- `GET /api/affiliate/v1/referrals` — Referral list with pagination
- `GET /api/affiliate/v1/commissions` — Commission history
- `GET /api/affiliate/v1/earnings` — Earnings by period

**Authentication:** API key per affiliate (generated in dashboard settings). Rate limited to 100 requests/hour.

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### E19: PassivePost Auto-Promo Integration

**What:** Affiliates who are also PassivePost users can auto-generate promotional social posts about the product using the content flywheel.

**How it works:**
- "Generate Promo Post" button on affiliate dashboard
- Uses the AI content engine to create a promotional post
- Affiliate can edit, schedule, and publish via their connected social accounts
- Ref link is automatically embedded in the post

**Implementation:** Bridge between the affiliate dashboard and the product's social posting API. Requires the affiliate to also be a product user (optional crossover).

---

### E20: PartnerStack Seeding Strategy

**What:** Operational playbook for using PartnerStack (or ShareASale/Impact) to recruit affiliates at scale, then funneling them to the in-house dashboard.

**Implementation:**
- Not a code feature — this is a process/documentation enhancement
- Configure network postback URLs to fire on Stripe conversions
- Network tracks the initial click; in-house dashboard tracks everything else
- Affiliates recruited via networks get invited to create an in-house account for deeper engagement
- Add to the AFFILIATE.md documentation as an "External Networks Playbook" section

---

## Implementation Sequence

**Recommended build order** (respects dependencies and maximizes early value):

### Sprint 1 — Core Revenue & Motivation
1. E3: Discount Code System (highest standalone value, Stripe integration)
2. E1: Milestone Bonuses (extends existing tiers)
3. E5: Real-Time Earnings Widget (quick win, high engagement)

### Sprint 2 — Affiliate Tools
4. E4: Deep Link Generator (extends dashboard)
5. E2: Affiliate Leaderboard (social motivation)
6. E8: Referral Sub-Tracking (analytics depth)
7. E9: UTM Parameter Support (pairs with E4)

### Sprint 3 — Engagement & Content
8. E6: Payout Accelerators (simple tier extension)
9. E7: Exclusive Access / Tier Perks (extends tiers)
10. E10: Quarterly Contests (engagement spikes)
11. E11: 7-Day Onboarding Sequence (email extension)
12. E12: Affiliate Resource Center (content hub)

### Sprint 4 — Advanced & Compliance
13. E16: Anti-Spam & Compliance Rules (protect the program)
14. E17: Automated Fraud Scoring (builds on existing fraud flags)
15. E15: Tax Compliance (required before significant payouts)
16. E13: Co-Branded Landing Pages (growth multiplier)
17. E14: Two-Tier Referrals (exponential growth)
18. E18: Affiliate API Access (power user feature)
19. E19: PassivePost Auto-Promo (dogfooding)
20. E20: PartnerStack Seeding (operational, not code)

---

## Migration Plan

All database changes will be consolidated into migration files following existing conventions:

- `migrations/core/007_affiliate_enhancements_p1.sql` — Milestones, discount codes, referral click landing_page
- `migrations/core/008_affiliate_enhancements_p2.sql` — Tier perks, payout accelerators, sub-tracking, contests
- `migrations/core/009_affiliate_enhancements_p3.sql` — Co-branded pages, two-tier, tax info, compliance, fraud scoring, API keys

---

## Admin Dashboard Updates

The existing admin affiliate page (`/admin/setup/affiliate`) will gain new tabs:

| Current Tabs | New Tabs |
|-------------|----------|
| Settings | (unchanged) |
| Tiers | + Milestones (E1), + Perks editing (E7) |
| Marketing Assets | + Resource Center management (E12) |
| Affiliates | + Fraud scores (E17), + Tax info status (E15) |
| Applications | (unchanged) |
| Networks | (unchanged) |
| — | Contests (E10) |
| — | Leaderboard Config (E2) |

**New standalone admin page:** `/admin/setup/discount-codes` for the Discount Code System (E3).

---

## Notes

- All features are designed as MuseKit core — available to any product built on the template.
- Stripe integration (E3) should use the existing Stripe secret key and webhook infrastructure.
- Email features (E11) extend the existing Resend integration and drip log system.
- Fraud scoring (E17) builds on the existing `checkFraudFlags()` in `src/lib/affiliate/index.ts`.
- The discount code system (E3) is the only feature that works independently of the affiliate system — it has value even without affiliates.
