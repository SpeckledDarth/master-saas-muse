# Affiliate System — Feature Specifications

This document provides detailed technical specifications for all 32 affiliate features built into MuseKit. These features extend the core affiliate infrastructure (application, tracking, commissions, payouts) with gamification, marketing tools, communication, compliance, analytics, and social proof capabilities.

For a high-level overview of the affiliate system, see `docs/musekit/AFFILIATE.md`.

---

## Feature Summary

All 32 features are implemented across 4 development sprints and are available in the current codebase.

| # | Feature | Category | Key Files |
|---|---------|----------|-----------|
| E1 | Milestone Bonuses | Motivation | `src/app/api/affiliate/milestones/` |
| E2 | Affiliate Leaderboard | Motivation | `src/app/api/affiliate/leaderboard/` |
| E3 | Discount Code System | Revenue | `src/app/api/admin/discount-codes/`, `src/app/api/discount-codes/` |
| E4 | Deep Link Generator | Tools | Affiliate dashboard frontend |
| E5 | Real-Time Earnings Widget | UX | `src/app/api/affiliate/earnings/` |
| E6 | Payout Accelerators | Motivation | `affiliate_tiers.min_payout_cents` |
| E7 | Exclusive Access / Tier Perks | Motivation | `affiliate_tiers.perks` |
| E8 | Referral Sub-Tracking (Source Tags) | Analytics | `referral_clicks.source_tag` |
| E9 | UTM Parameter Support | Analytics | Deep link generator frontend |
| E10 | Contests | Engagement | `src/app/api/affiliate/contests/` |
| E11 | Onboarding Drip Sequence | Onboarding | `src/app/api/affiliate/drip/` |
| E12 | Resource Center | Content | `src/app/api/affiliate/knowledge-base/`, `src/app/api/affiliate/promotional-calendar/` |
| E13 | Co-Branded Landing Pages | Growth | `src/app/api/affiliate/landing-page/`, `src/app/partner/[slug]/` |
| E14 | Two-Tier Referrals | Growth | Second-tier commission logic in webhook handler |
| E15 | Tax Compliance (1099 / W-9) | Compliance | `src/app/api/affiliate/tax-info/`, `src/app/api/admin/affiliate/tax-export/` |
| E16 | Anti-Spam & Compliance Rules | Compliance | Fraud scoring in `src/lib/affiliate/index.ts` |
| E17 | Automated Fraud Scoring | Security | Enhanced `checkFraudFlags()` |
| E18 | Affiliate API Access | Developer | `src/app/api/affiliate/api-keys/`, `src/app/api/affiliate/v1/` |
| E19 | PassivePost Auto-Promo Integration | Dogfooding | `src/app/api/affiliate/auto-promo/` |
| E21 | Broadcast System | Communication | `src/app/api/admin/affiliate/broadcasts/` |
| E22 | Admin Program Health Dashboard | Analytics | `src/app/api/admin/affiliate/health/` |
| E23 | Conversion Funnel Visualization | Analytics | `src/app/api/affiliate/funnel/` |
| E24 | Earnings Forecast | UX | `src/app/api/affiliate/forecast/` |
| E25 | Dormant Re-Engagement | Automation | `src/app/api/affiliate/reengagement/` |
| E26 | Auto-Tier Promotion Notifications | Automation | Tier change notifications in commission handler |
| E27 | Scheduled Payout Runs | Automation | `src/app/api/admin/payouts/` |
| E28 | In-Dashboard Messaging | Communication | `src/app/api/affiliate/messages/`, `src/app/api/admin/affiliate/messages/` |
| E29 | Affiliate Satisfaction Surveys | Engagement | `src/app/api/affiliate/surveys/` |
| E30 | Affiliate Testimonials | Social Proof | `src/app/api/affiliate/testimonials/`, `src/app/api/admin/affiliate/testimonials/` |
| E31 | Verified Earnings Badges | Social Proof | `src/app/api/affiliate/badges/`, `src/app/partner/verify/[code]/` |
| E32 | Affiliate Webhook Notifications | Developer | `src/app/api/affiliate/webhooks/` |

---

## E1: Milestone Bonuses

One-time flat bonuses paid to affiliates when they hit specific referral counts (e.g., $50 at 10 referrals, $150 at 50 referrals). Layered on top of the existing percentage-based commission tiers.

**Admin configuration:**
- Milestone threshold (number of converted referrals)
- Bonus amount (in cents)
- Active/inactive toggle
- Description text (shown to affiliates)

**Affiliate experience:**
- Progress bar showing distance to next milestone on dashboard
- Notification when a milestone is reached
- Bonus auto-added to pending earnings

**Database tables:** `affiliate_milestones`, `affiliate_milestone_awards`

**API endpoints:** `GET/POST/PATCH/DELETE /api/affiliate/milestones` (admin CRUD). Milestone check runs automatically when a new referral converts.

---

## E2: Affiliate Leaderboard

A ranked list of top-performing affiliates visible on the affiliate dashboard. Shows position, anonymized name, and metrics.

**Display options:**
- Time period: This month, last month, all time
- Metrics: total referrals, total earnings, conversion rate
- Privacy: show initials + rank (e.g., "J.S. — #3") or allow opt-in to display name

**API:** `GET /api/affiliate/leaderboard?period=month&metric=referrals&limit=10`

**Admin configuration:** Leaderboard enabled/disabled toggle, privacy mode setting.

---

## E3: Discount Code System

Admin-created promotional codes that apply discounts at Stripe checkout. Can optionally be tied to an affiliate for dual-purpose attribution — the code both gives the prospect a discount AND credits the affiliate for the conversion.

### Dual-Attribution Logic

Affiliate discount codes serve as a fallback attribution method when no referral link cookie exists. Attribution priority (configurable by admin):
1. **Cookie attribution exists** — affiliate linked to `pp_ref` cookie gets credit (default)
2. **No cookie, but affiliate code used** — affiliate linked to the discount code gets credit
3. **Both exist (different affiliates)** — admin-configurable policy: `cookie_wins` (default), `code_wins`, `first_touch`, or `split`

### Configurable Fields Per Code

| Field | Type | Description |
|-------|------|-------------|
| Code | Text | The code users enter (e.g., `LAUNCH20`, `PARTNER-JANE`) |
| Description | Text | Internal note for admin |
| Discount type | Enum | `percentage`, `fixed_amount`, `free_trial`, `bundle`, and more (6 types) |
| Discount value | Number | Percentage or cents |
| Duration | Enum | `once`, `repeating`, `forever` |
| Duration months | Number | Only if duration = repeating |
| Max total uses | Number | Null = unlimited |
| Max uses per user | Number | Default 1 |
| Stackable | Boolean | Can combine with other codes (default false) |
| Expires at | Timestamp | Null = no expiration |
| Affiliate ID | UUID | Optional — ties code to an affiliate for attribution |
| Status | Enum | `active`, `paused`, `expired`, `archived` |

**Stripe integration:** On code creation, creates Stripe Coupon + Promotion Code via API. On checkout, applies the Stripe Promotion Code. On webhook (`invoice.paid`), records redemption and updates usage counters.

**Database tables:** `discount_codes`, `discount_code_redemptions`

**API endpoints:** Admin CRUD at `/api/admin/discount-codes`, public validation at `/api/discount-codes/validate`

**Admin UI:** `/admin/setup/discount-codes` with table, filters, create/edit modal, quick actions, and stats row.

---

## E4: Deep Link Generator

Affiliates create referral links to specific pages (pricing, features, blog posts, landing page), not just the homepage.

The system generates links like: `https://product.com/pricing?ref=ABC123&src=youtube-review`

Includes common page dropdown, custom URL input, generated link with copy button, and UTM parameter options. The existing `ReferralTracker` component already handles `?ref=` on any page.

---

## E5: Real-Time Earnings Widget

A live-updating "Today's earnings" counter on the affiliate dashboard header. Shows earnings accrued today with animation when new commissions arrive.

Supports time period tabs: today, this week, this month. Polls every 60 seconds for updates.

**API:** `GET /api/affiliate/earnings`

---

## E6-E7: Payout Accelerators & Tier Perks

**Payout Accelerators:** Lower minimum payout threshold for top-tier affiliates. Gold tier might have a $25 minimum instead of the default $50. Configured via `min_payout_cents` column on `affiliate_tiers`.

**Tier Perks:** Each tier can offer non-monetary perks — beta feature access, private Discord invite, early product access, priority support. Stored as `perks` JSONB column on `affiliate_tiers`.

---

## E8-E9: Source Tags & UTM Parameters

**Source Tags:** Affiliates tag referral links with a source identifier (`?ref=ABC123&src=youtube-review`). Performance by source is shown on the dashboard. Stored on `referral_clicks.source_tag` and `affiliate_referrals.source_tag`.

**UTM Parameters:** Auto-appended to affiliate referral links: `utm_source`, `utm_medium=affiliate`, `utm_campaign={affiliate_code}`, `utm_content={source_tag}`.

---

## E10: Contests

Admin-configurable time-bound competitions with prizes. "Highest converter in Q1 wins $500."

**Database table:** `affiliate_contests`, `affiliate_contest_entries`

**Admin UI:** Create/edit contests with name, dates, metric, prize description. Mark winner when contest ends.

**Affiliate UI:** Active contest banner with countdown timer, current standings, and prize info.

---

## E11: Onboarding Drip Sequence

A 3-email onboarding sequence sent to new affiliates via Resend:

1. **Welcome email** (sent immediately) — "You're In!" with referral link and dashboard link
2. **Tips email** (sent 24 hours later) — "How top affiliates earn the most" with promotion tactics
3. **Strategy email** (sent 72 hours later) — "Your first-week affiliate strategy" with the story formula

The drip endpoint is idempotent — safe to call repeatedly via cron or queue worker.

**API:** `POST /api/affiliate/drip`

---

## E12: Resource Center

**Knowledge Base:** Searchable help articles organized by category with view tracking. Admin creates and manages content.

**Promotional Calendar:** Admin-set upcoming campaigns with countdown timers, content suggestions, and linked assets.

**API endpoints:** `/api/affiliate/knowledge-base`, `/api/affiliate/promotional-calendar`, `/api/admin/knowledge-base`

---

## E13: Co-Branded Landing Pages

Customizable partner pages at `/partner/[slug]` featuring the affiliate's branding alongside the product. Each page includes the affiliate's name, bio, photo, social links, and a referral-tracked CTA.

**Database table:** `affiliate_landing_pages`

**API:** `/api/affiliate/landing-page/[slug]`

---

## E14: Two-Tier Referrals

Affiliates earn a percentage when someone they recruited as an affiliate generates sales. This creates a recruitment incentive — top affiliates become program evangelists, growing the affiliate base organically.

---

## E15: Tax Compliance

**Tax Info Collection:** Affiliates submit W-9 (US) or W-8BEN (international) tax forms through the dashboard. Admin can verify and flag incomplete submissions.

**Tax Summary:** Annual tax summary showing total earnings, estimated withholding (self-employment + federal), monthly breakdown, and 1099 threshold status.

**Admin 1099 Tax Export:** Year-end CSV export of all affiliates earning over $600, with tax info status, legal name, address, and gross earnings.

**Database table:** `affiliate_tax_info`

**API endpoints:** `/api/affiliate/tax-info`, `/api/affiliate/tax-summary`, `/api/admin/affiliate/tax-info/[id]`, `/api/admin/affiliate/tax-export`

---

## E16-E17: Anti-Spam & Fraud Scoring

Enhanced fraud detection that builds on the existing `checkFraudFlags()` function:
- Same email domain detection
- Suspicious IP volume detection
- Self-referral detection
- Configurable fraud score thresholds
- Admin-visible health scores (green/yellow/red) per affiliate
- Fraud alerts in admin program health dashboard

---

## E18: Affiliate API Access

RESTful API endpoints for power affiliates to access their data programmatically:
- `GET /api/affiliate/v1/stats` — Dashboard statistics
- `GET /api/affiliate/v1/referrals` — Referral history
- `GET /api/affiliate/v1/commissions` — Commission records
- `GET /api/affiliate/v1/earnings` — Earnings data

API key management through the affiliate dashboard at `/api/affiliate/api-keys`.

---

## E21: Broadcast System

Admin sends announcements to all affiliates or filtered segments (by tier, status, activity level).

**Audience filters:** All active, specific tier, top performers (top N), dormant (no clicks in N days).

**Database tables:** `affiliate_broadcasts`, `affiliate_broadcast_receipts`

**API endpoints:** `/api/admin/affiliate/broadcasts` (CRUD + send)

**Admin UI:** Compose form with audience selector, preview. History table with open/click rates.

---

## E22: Admin Program Health Dashboard

High-level analytics dashboard showing overall affiliate program health and ROI:
- **Program Overview:** Total affiliates, active, dormant, suspended
- **Revenue Impact:** Total affiliate revenue, commissions paid, net ROI
- **Growth Trends:** New affiliates, new referrals, conversion rate trend
- **Top Performers:** Top 5 by revenue
- **Churn Risk:** Declining activity, approaching payout threshold
- **Fraud Alerts:** Flagged referrals, high fraud scores

**API:** `GET /api/admin/affiliate/health`

---

## E23-E24: Conversion Funnel & Earnings Forecast

**Conversion Funnel:** Visual funnel from click -> signup -> trial -> paid -> commission showing drop-off at each stage.

**Earnings Forecast:** Projected monthly earnings based on 14-day rolling average with optimistic/pessimistic range and tier upgrade proximity alerts.

**API endpoints:** `/api/affiliate/funnel`, `/api/affiliate/forecast`

---

## E25-E27: Automation Features

**Dormant Re-Engagement:** Identifies affiliates with declining activity and triggers re-engagement outreach.

**Auto-Tier Promotion Notifications:** Automatic notifications when affiliates are close to a tier upgrade or when they level up.

**Scheduled Payout Runs:** Batch payout processing with admin approval requirement. Never auto-sends money — always requires admin confirmation.

---

## E28: In-Dashboard Messaging

Thread-based messaging between admin and affiliates within the dashboard. Admin can reference affiliate stats while chatting.

**Database table:** `affiliate_messages`

**API endpoints:** `/api/affiliate/messages` (GET/POST), `/api/affiliate/messages/read` (PATCH), `/api/admin/affiliate/messages/[affiliate_id]` (GET)

---

## E29: Satisfaction Surveys

Periodic in-dashboard surveys asking affiliates about program satisfaction. Quick 1-5 star rating plus optional feedback. Positive reviews can auto-convert to testimonials with affiliate permission.

**Database table:** `affiliate_surveys`, `affiliate_survey_responses`

---

## E30: Affiliate Testimonials

Success story submissions from affiliates, manageable by admin. Displayed on the `/affiliate` landing page. Sources include manual admin entry, survey opt-ins, and auto-generated from milestone achievements.

**API endpoints:** `/api/affiliate/testimonials`, `/api/admin/affiliate/testimonials`

---

## E31: Verified Earnings Badges

Embeddable badges for affiliates who've earned above certain thresholds:
- $500+ — "Verified Partner"
- $2,500+ — "Top Partner"
- $10,000+ — "Elite Partner"

Auto-awarded when earnings cross thresholds. Badge includes an embeddable HTML/image snippet with a verification URL (`/partner/verify/[code]`) that confirms the badge is real.

**Database tables:** `affiliate_badges`, `affiliate_badge_tiers`

**API:** `/api/affiliate/badges`, `/api/affiliate/badges/verify/[code]`

---

## E32: Affiliate Webhook Notifications

Power affiliates register webhook URLs to receive real-time event notifications:
- `affiliate.click` — new click on referral link
- `affiliate.signup` — new referred signup
- `affiliate.commission` — commission earned
- `affiliate.payout` — payout processed
- `affiliate.tier_change` — tier promotion/demotion
- `affiliate.milestone` — milestone achieved

Each event is POSTed with HMAC-SHA256 signature using a per-affiliate secret. Retry logic: 3 attempts with exponential backoff. Delivery log visible in dashboard.

**Database tables:** `affiliate_webhooks`, `affiliate_webhook_deliveries`

**API endpoints:** `/api/affiliate/webhooks` (CRUD), `/api/affiliate/webhooks/[id]/test` (test delivery), `/api/affiliate/webhooks/[id]/deliveries` (delivery log)

---

## Database Migration Files

All affiliate database changes are in these migration files:

| File | Contents |
|------|----------|
| `migrations/core/005_affiliate_system.sql` | Core affiliate tables (settings, tiers, referrals, commissions, payouts, assets) |
| `migrations/core/006_affiliate_applications.sql` | Application workflow, network settings |
| `migrations/core/007_affiliate_enhancements_p1.sql` | Milestones, discount codes, broadcasts, attribution policy |
| `migrations/core/008_affiliate_enhancements_p2.sql` | Tier perks, payout accelerators, sub-tracking, contests |
| `migrations/core/009_affiliate_enhancements_p3.sql` | Co-branded pages, tax info, fraud scoring, API keys, webhooks, messaging, surveys, testimonials, badges |

---

## Design Notes

- All features are designed as MuseKit core — available to any product built on the template.
- Stripe integration uses the existing Stripe secret key and webhook infrastructure.
- Email features extend the existing Resend integration and drip log system.
- The discount code system works independently of the affiliate system — it has value even without affiliates.
- Discount codes with dual-attribution provide a secondary tracking method when cookie-based attribution is not available (podcast mentions, word-of-mouth, offline channels).
- Scheduled payout runs always require admin approval — never auto-send money.
- Webhook notifications pair naturally with Affiliate API Access for power users.
