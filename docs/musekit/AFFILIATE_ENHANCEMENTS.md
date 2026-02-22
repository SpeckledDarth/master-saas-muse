# Affiliate System Enhancements — Feature Plan

> **Version:** 2.0 | **Created:** February 22, 2026 | **Status:** Planning
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
| E21 | Affiliate Newsletter / Broadcast System | P1 — High | Communication | Medium |
| E22 | Admin Program Health Dashboard | P1 — High | Analytics | Medium |
| E23 | Conversion Funnel Visualization | P2 — Medium | Analytics | Medium |
| E24 | Earnings Forecast | P2 — Medium | UX | Low |
| E25 | Dormant Affiliate Re-Engagement | P2 — Medium | Automation | Medium |
| E26 | Auto-Tier Promotion Notifications | P2 — Medium | Automation | Low |
| E27 | Scheduled Payout Runs | P2 — Medium | Automation | Medium |
| E28 | In-Dashboard Messaging | P3 — Lower | Communication | Medium |
| E29 | Affiliate Satisfaction Surveys | P3 — Lower | Engagement | Low |
| E30 | Affiliate Testimonials | P3 — Lower | Social Proof | Medium |
| E31 | Verified Earnings Badges | P3 — Lower | Social Proof | Low |
| E32 | Affiliate Webhook Notifications | P3 — Lower | Developer | Medium |

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

**What:** Admin-created promotional codes that apply discounts at Stripe checkout. Works independently of the affiliate system but can optionally be tied to an affiliate for **dual-purpose attribution** — the code both gives the prospect a discount AND credits the affiliate for the conversion.

**Why:** Every SaaS needs promo codes. They drive conversions from marketing campaigns, partnerships, events, and retention offers. A sellable template must include this.

**Dual-Attribution Logic (Code as Secondary Affiliate Tracking):**

Affiliate discount codes serve as a fallback attribution method when no referral link cookie exists. This covers scenarios where someone hears about the product on a podcast, in a video, or in person — they never click a link, but they remember the code.

Attribution priority (configurable by admin):
1. **Cookie attribution exists** — affiliate linked to `pp_ref` cookie gets credit (default behavior)
2. **No cookie, but affiliate code used at checkout** — affiliate linked to the discount code gets credit
3. **Both exist (different affiliates)** — admin-configurable policy:
   - `cookie_wins` (default) — the cookie affiliate gets commission credit; code affiliate only gets the discount applied
   - `code_wins` — the code affiliate gets commission credit
   - `first_touch` — whichever attribution happened first wins
   - `split` — commission is split between both affiliates (advanced)

This is tracked on the `discount_code_redemptions` table via an `attributed_affiliate_id` column that records which affiliate ultimately received credit, regardless of method.

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
  attributed_affiliate_id UUID REFERENCES auth.users(id),
  attribution_method TEXT,
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

**Admin attribution policy setting:**

```sql
ALTER TABLE affiliate_program_settings
  ADD COLUMN IF NOT EXISTS attribution_conflict_policy TEXT NOT NULL DEFAULT 'cookie_wins';
-- Values: 'cookie_wins', 'code_wins', 'first_touch', 'split'
```

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

### E21: Affiliate Newsletter / Broadcast System

**What:** Admin can send announcements to all affiliates or filtered segments (by tier, status, activity level). Covers new feature announcements, contest launches, rate changes, tips, and program updates.

**Why:** Without bulk communication, the admin has no way to reach affiliates between drip emails. A broadcast system keeps the community alive and engaged.

**Implementation:**
- Admin composes a message (subject, body — rich text or markdown)
- Selects audience: all active affiliates, specific tier, top performers, dormant affiliates
- Sends via Resend (existing integration)
- Tracks delivery stats (sent, opened, clicked)

**Database:**

```sql
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
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_broadcast_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES affiliate_broadcasts(id) ON DELETE CASCADE,
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_receipts_broadcast ON affiliate_broadcast_receipts(broadcast_id);
```

**Audience filter examples:**

```json
{"type": "all"}
{"type": "tier", "tier_id": "uuid-of-gold-tier"}
{"type": "active", "min_referrals_last_30d": 1}
{"type": "dormant", "no_clicks_days": 30}
{"type": "top_performers", "limit": 50}
```

**API endpoints:**
- `GET /api/admin/affiliate/broadcasts` — List all broadcasts
- `POST /api/admin/affiliate/broadcasts` — Create draft
- `PATCH /api/admin/affiliate/broadcasts/[id]` — Edit draft
- `POST /api/admin/affiliate/broadcasts/[id]/send` — Send broadcast
- `GET /api/admin/affiliate/broadcasts/[id]/stats` — Delivery stats

**Admin UI:** New "Broadcasts" tab in affiliate admin:
- Compose form with rich text editor, audience selector, preview
- History table showing past broadcasts with open/click rates
- Draft management (save, edit, send)

---

### E22: Admin Program Health Dashboard

**What:** A high-level analytics dashboard showing the overall health and ROI of the affiliate program. Gives the admin a single view of whether the program is working.

**Why:** Without this, the admin has to manually piece together metrics from multiple tabs. A health dashboard makes the program manageable at scale.

**Metrics displayed:**
- **Program Overview:** Total affiliates, active (generated a click in last 30d), dormant, suspended
- **Revenue Impact:** Total revenue from affiliate referrals, total commissions paid, net ROI (revenue - commissions)
- **Growth Trends:** New affiliates this month, new referrals this month, conversion rate trend (line chart)
- **Top Performers:** Top 5 affiliates by revenue this month
- **Program Engagement:** Average referrals per affiliate, average earnings per affiliate, median time to first referral
- **Churn Risk:** Affiliates with declining activity, affiliates approaching payout threshold (about to cash out)
- **Fraud Alerts:** Total flagged referrals, affiliates with high fraud scores

**Database:** No new tables — aggregates existing data from `referral_links`, `affiliate_referrals`, `affiliate_commissions`, `affiliate_payouts`.

**API endpoint:** `GET /api/admin/affiliate/health` — Returns all metrics in a single response.

**Admin UI:** New "Program Health" card or tab at the top of the affiliate admin page. Dashboard-style layout with stat cards, a trend chart, and quick-action links.

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

### E23: Conversion Funnel Visualization

**What:** Show affiliates the full conversion funnel for their referrals: click → visit → signup → trial → paid subscription. Highlights where their referrals are dropping off.

**Why:** Affiliates who understand their funnel can optimize their messaging. "Your signups convert to paid at 15% — the average is 25%. Try targeting a more qualified audience." This turns them from passive promoters into active optimizers.

**Implementation:**
- Aggregate existing data: `referral_clicks` (clicks) → `affiliate_referrals` (signups) → `affiliate_commissions` (paid conversions)
- Calculate drop-off rates between each stage
- Display as a visual funnel chart on the affiliate dashboard

**API endpoint:** `GET /api/affiliate/funnel?period=30d` — Returns funnel data with counts and conversion rates per stage.

**Affiliate UI:** Funnel visualization card on dashboard with:
- Horizontal or vertical funnel bars (Clicks → Signups → Trials → Paid)
- Conversion rate percentages between each stage
- Comparison to program average (if enabled by admin)
- Time period selector (7d, 30d, 90d, all time)

**Database:** No new tables — aggregates existing data.

---

### E24: Earnings Forecast

**What:** A projected earnings estimate based on the affiliate's current performance trajectory. "Based on your current pace, you'll earn ~$X this month."

**Why:** Forward-looking motivation. Seeing a projection creates a target to beat and keeps affiliates focused.

**Implementation:**
- Calculate daily average earnings over the last 14 days
- Project to end of current month
- Show optimistic/pessimistic range based on variance
- Factor in tier upgrades (if affiliate is close to next tier, show projected earnings at both rates)

**API endpoint:** `GET /api/affiliate/forecast` — Returns current pace, projected monthly total, and range.

**Affiliate UI:** "Earnings Forecast" card on dashboard:
- Current monthly earnings so far
- Projected total for the month
- Pace indicator (up/down arrow vs. last month)
- "On track for [tier name]" message if close to tier upgrade

**Database:** No new tables — calculated from existing `affiliate_commissions`.

---

### E25: Dormant Affiliate Re-Engagement

**What:** Automated email outreach to affiliates who haven't generated a click in X days (configurable, default 30). Includes tips, encouragement, and a nudge to get active again.

**Why:** Most affiliate programs lose 60-70% of affiliates to inactivity within 90 days. Automated re-engagement catches them before they fully disengage.

**Implementation:**
- Cron job (or queue task) runs daily
- Queries affiliates with no `referral_clicks` in the configured window
- Sends re-engagement email via Resend
- Tracks in `email_drip_log` with `sequence_name='reengagement'`
- Only sends once per dormancy period (doesn't spam)

**Email content options (admin-configurable templates):**
1. "We miss you!" — gentle nudge with current program stats
2. "Quick tips to get your first referral" — actionable advice
3. "New features you can promote" — product updates relevant to affiliates

**Admin configuration:**
- Dormancy threshold (days without a click)
- Re-engagement enabled/disabled toggle
- Maximum re-engagement emails per affiliate (default 3 per dormancy cycle)

**Database:**

```sql
-- No new tables — uses existing email_drip_log with sequence_name='reengagement'
-- Tracking deduplication uses existing drip infrastructure
```

---

### E26: Auto-Tier Promotion Notifications

**What:** Automated notifications when an affiliate is approaching the next tier threshold. "2 more referrals and you unlock Silver tier with 25% commission!"

**Why:** Creates urgency and a clear next action. The affiliate knows exactly what to do to earn more.

**Implementation:**
- Check runs after each new referral conversion
- If affiliate is within 20% of next tier threshold, send a notification
- Use existing `notifications` table for in-app notification
- Optionally send email via Resend

**Notification triggers:**
- At 80% of next tier threshold: "You're close! X more referrals to unlock [tier]"
- At 90% of next tier threshold: "Almost there! Just X more referrals to [tier]"
- On tier promotion: "Congratulations! You've reached [tier] — your commission rate is now X%"

**Database:** No new tables — uses existing `notifications` table and checks against `affiliate_tiers`.

---

### E27: Scheduled Payout Runs

**What:** Admin can configure automated monthly payout batches instead of processing each payout manually. The system generates a batch of pending payouts for all eligible affiliates, and the admin reviews and approves in bulk.

**Why:** At scale (50+ affiliates), manual payouts become unmanageable. Batch processing saves admin hours per month.

**Implementation:**
- Admin sets payout schedule: monthly (1st, 15th) or custom dates
- Cron job runs on scheduled date
- Creates payout records for all affiliates with balance above min threshold
- Admin gets notification with batch summary
- Admin reviews batch: approve all, approve individual, reject individual
- Approved payouts proceed through existing payout flow

**Database:**

```sql
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
```

**Admin configuration (in program settings):**
- Auto-batch enabled/disabled toggle
- Payout schedule: monthly date (1-28) or "manual only"
- Auto-approve threshold: payouts under $X auto-approve (optional)

**Admin UI:** "Payout Batches" section in affiliate admin:
- Upcoming batch preview (who would be included, total amount)
- Batch history table
- Bulk approve/reject controls

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

### E28: In-Dashboard Messaging

**What:** A simple inbox where admin and affiliates can communicate directly within the affiliate dashboard. No need to switch to email for payout questions, custom deal negotiations, or support.

**Why:** Keeps conversations in context. Admin can reference the affiliate's stats while chatting. Reduces support email volume.

**Implementation:**
- Thread-based messaging (one thread per affiliate ↔ admin conversation)
- Admin can initiate or respond from the affiliate management page
- Affiliate sees messages in a "Messages" tab on their dashboard
- Unread badge indicator
- Email notification for new messages (optional, configurable)

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL DEFAULT 'affiliate',
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_messages_affiliate ON affiliate_messages(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_messages_unread ON affiliate_messages(affiliate_user_id, is_read) WHERE is_read = false;
```

**API endpoints:**
- `GET /api/affiliate/messages` — Affiliate's message thread
- `POST /api/affiliate/messages` — Send a message (affiliate or admin)
- `PATCH /api/affiliate/messages/read` — Mark messages as read
- `GET /api/admin/affiliate/messages/[affiliate_id]` — Admin view of specific affiliate's thread
- `GET /api/admin/affiliate/messages/unread` — Count of unread threads for admin

**Admin UI:** Message panel in the affiliate detail view. Unread count badge on the Affiliates tab.

**Affiliate UI:** "Messages" tab on dashboard with thread view, compose box, and unread indicator.

---

### E29: Affiliate Satisfaction Surveys

**What:** Periodic in-dashboard surveys asking affiliates how the program is working for them. Quick 1-5 star rating plus optional feedback text.

**Why:** Catches churn signals early. If satisfaction drops below a threshold, admin gets an alert. Also provides testimonial material from happy affiliates.

**Implementation:**
- Survey prompt appears on dashboard at configurable intervals (e.g., every 90 days)
- Quick 1-5 star rating + optional text field
- Results aggregated in admin health dashboard
- Low scores trigger admin notification
- High scores can be flagged for testimonial use (with affiliate's permission)

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  can_use_as_testimonial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_surveys_affiliate ON affiliate_surveys(affiliate_user_id);
```

**Admin UI:** Survey results summary in program health dashboard. Average satisfaction score over time. Recent survey responses with feedback.

---

### E30: Affiliate Testimonials

**What:** Display quotes from successful affiliates on the `/affiliate` landing page to build trust with prospective affiliates. "I earned $2,000 in my first 3 months." — Jane S.

**Why:** Social proof for the affiliate program itself. Prospective affiliates are more likely to apply when they see real success stories.

**Sources:**
1. High-rated satisfaction surveys where affiliate opted in for testimonial use
2. Admin-manually-added testimonials
3. Auto-generated from milestone achievements ("Jane S. unlocked Gold tier in just 60 days")

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID REFERENCES auth.users(id),
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
```

**Admin UI:** Testimonials management section — add/edit/feature/hide testimonials. Pull from survey responses.

**Public UI:** Testimonial carousel or grid on the `/affiliate` landing page.

---

### E31: Verified Earnings Badges

**What:** Affiliates who've earned above certain thresholds get a verifiable badge they can display on their website or social profiles. "Verified Partner — $5K+ earned."

**Why:** Builds credibility for the affiliate when promoting the product. Their audience trusts endorsed partners more than random promoters.

**Badge tiers:**
- $500+ earned — "Verified Partner"
- $2,500+ earned — "Top Partner"
- $10,000+ earned — "Elite Partner"

**Implementation:**
- Auto-awarded when total earnings cross thresholds
- Badge is an embeddable HTML/image snippet with a verification URL
- Verification URL (`/partner/verify/[badge_id]`) confirms the badge is real and shows the partner's tier
- Admin can customize badge thresholds and designs

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  threshold_cents INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true
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
```

**Affiliate UI:** "Your Badges" section on dashboard with embed code copy button and verification link.

**Public route:** `/partner/verify/[code]` — public verification page confirming the badge.

---

### E32: Affiliate Webhook Notifications

**What:** Power affiliates can register a webhook URL to receive real-time event notifications (click, signup, commission, payout). Pairs with E18 (Affiliate API Access).

**Why:** Some affiliates build their own tools or dashboards. Webhooks let them react to events programmatically — e.g., auto-post a "thank you" when someone signs up via their link.

**Events fired:**
- `affiliate.click` — new click on referral link
- `affiliate.signup` — new referred signup
- `affiliate.commission` — commission earned
- `affiliate.payout` — payout processed
- `affiliate.tier_change` — tier promotion/demotion
- `affiliate.milestone` — milestone achieved

**Implementation:**
- Affiliate registers a webhook URL in dashboard settings
- Each event is POSTed to the URL with HMAC-SHA256 signature (using a per-affiliate secret)
- Retry logic: 3 attempts with exponential backoff
- Delivery log visible in dashboard

**Database:**

```sql
CREATE TABLE IF NOT EXISTS affiliate_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['affiliate.commission', 'affiliate.payout'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES affiliate_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON affiliate_webhook_deliveries(webhook_id);
```

**Affiliate UI:** "Webhooks" section in dashboard settings:
- Add/edit webhook URL
- Select which events to subscribe to
- View delivery log with status
- Test webhook button (sends test payload)

---

## Implementation Sequence

**Recommended build order** (respects dependencies and maximizes early value):

### Sprint 1 — Core Revenue & Motivation
1. E3: Discount Code System with dual-attribution (highest standalone value, Stripe integration)
2. E1: Milestone Bonuses (extends existing tiers)
3. E5: Real-Time Earnings Widget (quick win, high engagement)
4. E21: Affiliate Newsletter / Broadcast System (admin communication)
5. E22: Admin Program Health Dashboard (program oversight)

### Sprint 2 — Affiliate Tools & Analytics
6. E4: Deep Link Generator (extends dashboard)
7. E2: Affiliate Leaderboard (social motivation)
8. E8: Referral Sub-Tracking (analytics depth)
9. E9: UTM Parameter Support (pairs with E4)
10. E23: Conversion Funnel Visualization (affiliate analytics)
11. E24: Earnings Forecast (motivation via projection)

### Sprint 3 — Engagement, Automation & Content
12. E6: Payout Accelerators (simple tier extension)
13. E7: Exclusive Access / Tier Perks (extends tiers)
14. E10: Quarterly Contests (engagement spikes)
15. E11: 7-Day Onboarding Sequence (email extension)
16. E12: Affiliate Resource Center (content hub)
17. E25: Dormant Affiliate Re-Engagement (churn prevention)
18. E26: Auto-Tier Promotion Notifications (urgency)
19. E27: Scheduled Payout Runs (admin efficiency)

### Sprint 4 — Advanced, Compliance & Social Proof
20. E16: Anti-Spam & Compliance Rules (protect the program)
21. E17: Automated Fraud Scoring (builds on existing fraud flags)
22. E15: Tax Compliance (required before significant payouts)
23. E13: Co-Branded Landing Pages (growth multiplier)
24. E14: Two-Tier Referrals (exponential growth)
25. E18: Affiliate API Access (power user feature)
26. E28: In-Dashboard Messaging (communication)
27. E29: Affiliate Satisfaction Surveys (churn detection)
28. E30: Affiliate Testimonials (social proof for program)
29. E31: Verified Earnings Badges (credibility)
30. E32: Affiliate Webhook Notifications (developer feature)
31. E19: PassivePost Auto-Promo (dogfooding)
32. E20: PartnerStack Seeding (operational, not code)

---

## Migration Plan

All database changes will be consolidated into migration files following existing conventions:

- `migrations/core/007_affiliate_enhancements_p1.sql` — Sprint 1: Milestones, discount codes (with dual-attribution), referral click landing_page, broadcasts, attribution_conflict_policy on program settings
- `migrations/core/008_affiliate_enhancements_p2.sql` — Sprint 2 & 3: Tier perks, payout accelerators, sub-tracking, contests, payout batches
- `migrations/core/009_affiliate_enhancements_p3.sql` — Sprint 4: Co-branded pages, two-tier, tax info, compliance, fraud scoring, API keys, messaging, surveys, testimonials, badges, webhooks

---

## Admin Dashboard Updates

The existing admin affiliate page (`/admin/setup/affiliate`) will gain new tabs:

| Current Tabs | New Tabs |
|-------------|----------|
| Settings | + Attribution conflict policy (E3), + Dormancy threshold (E25), + Payout schedule (E27) |
| Tiers | + Milestones (E1), + Perks editing (E7) |
| Marketing Assets | + Resource Center management (E12) |
| Affiliates | + Fraud scores (E17), + Tax info status (E15), + Messages (E28), + Satisfaction scores (E29) |
| Applications | (unchanged) |
| Networks | (unchanged) |
| — | Program Health (E22) — dashboard-style overview |
| — | Broadcasts (E21) — compose, send, track emails |
| — | Contests (E10) |
| — | Leaderboard Config (E2) |
| — | Testimonials (E30) — manage affiliate success stories |
| — | Badges (E31) — configure earning badge tiers |
| — | Payout Batches (E27) — scheduled batch management |

**New standalone admin pages:**
- `/admin/setup/discount-codes` for the Discount Code System (E3)
- `/admin/setup/affiliate/health` for Program Health Dashboard (E22) — may also be embedded as a top-level card on the main affiliate admin page

---

## Notes

- All features are designed as MuseKit core — available to any product built on the template.
- Stripe integration (E3) should use the existing Stripe secret key and webhook infrastructure.
- Email features (E11, E21, E25) extend the existing Resend integration and drip log system.
- Fraud scoring (E17) builds on the existing `checkFraudFlags()` in `src/lib/affiliate/index.ts`.
- The discount code system (E3) is the only feature that works independently of the affiliate system — it has value even without affiliates.
- Discount codes with dual-attribution (E3) provide a secondary tracking method when cookie-based attribution isn't available (podcast mentions, word-of-mouth, offline channels).
- The affiliate newsletter system (E21) should respect unsubscribe preferences and CAN-SPAM compliance.
- Program health dashboard (E22) should be the first thing admin sees when managing the affiliate program.
- Scheduled payout runs (E27) should always require admin approval — never auto-send money.
- Webhook notifications (E32) pair naturally with Affiliate API Access (E18) for power users.
- Total feature count: 32 enhancements across 4 sprints.
