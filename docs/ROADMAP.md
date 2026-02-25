# MuseKit + PassivePost — Development Roadmap

> **Revision:** 1.6 | **Last Updated:** February 25, 2026 | **Created:** February 20, 2026

> **IMPORTANT — READ THIS FILE AT THE START OF EVERY SESSION.** This is the single source of truth for the multi-week development plan. If agent memory resets, this file restores full context.

---

## ALL PHASES COMPLETE — Ready for Testing & Launch

**Where we are:** ALL build phases (1-3.6, 5, 6, 7) are COMPLETE. Phase 4 (Mobile PWA) was deprioritized.

**What's next:** Session A (Flywheel Accelerators) complete. Sessions B-F remain (~53 features). See Phase 8 below.

**Summary of what's built:**
- **Phases 1-3.6:** 42 PassivePost features + 32 affiliate enhancements + audit system
- **Phase 5:** CRM & invoicing data layer (10 tables, 20+ API routes)
- **Phase 6:** Dashboard UI layer (16 features across Admin/Affiliate/User dashboards)
- **Phase 7:** AI & cross-dashboard features (6 features: AI post writer, AI coach, commission renewals, YouTube analytics, earnings charts/analytics suite, dashboard customization)

**Migrations run on Supabase:** 001-013
**Migrations needed on Supabase:** 012 (commission_renewals), 014 (analytics columns: country/device_type on referral_clicks, churned_at/churn_reason/last_active_at on affiliate_referrals)

**Launch target:** April 1, 2026

---

## Current State (Before This Roadmap)

PassivePost is feature-complete with 42 features (38 flywheel + 4 bonus) across 7 phases, all E2E tested. Documentation is fully updated with version tracking. The product uses demo data paths — real platform APIs are not yet connected. The product is not yet launched.

---

## Phase Overview

| Phase | Name | Status | Target |
|-------|------|--------|--------|
| 1 | Testimonial/Success Metrics Dashboard | Complete | Week 1 |
| 1.5 | Launch Kit | Complete | Week 1-2 |
| 2 | Connect Real Platform APIs & Full Testing | Complete (All batches, engagement metrics, posting, guides) | Week 2-3 |
| 3 | Affiliate Marketing Features | Complete | Week 3-4 |
| 3.5 | Open Affiliate Program (Public Signup) | Complete | Week 3-4 |
| 3.6 | Affiliate Enhancements & Discount Codes | **COMPLETE** — All 32/32 features across 4 sprints + Audit System + Bug Fixes | Week 4-6 |
| 4 | Mobile App (PWA First) | Deprioritized | TBD |
| **5** | **CRM & Invoicing Foundation (Data Layer)** | **COMPLETE** — All 9/9 features across 2 sprints | **Week 7-9** |
| **6** | **Dashboard Enhancements (UI Layer)** | **COMPLETE** — All 16/16 features across 3 dashboard types | **Week 9-11** |
| **7** | **AI & Cross-Dashboard Features** | **COMPLETE** — All 7/7 features (1 pre-built, 6 new) | **Week 11** |
| **8** | **Flywheel Accelerators (Session A)** | **COMPLETE** — 20 features: churn intelligence, cohort analysis, AI analytics, geo/device, revenue charts | **Week 12** |

---

## Phase 1: Testimonial/Success Metrics Dashboard

**Goal:** Build social proof and credibility infrastructure for launch day.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.1 | Testimonial management system — database table, admin CRUD page (add, edit, approve, feature testimonials) | Complete | Migration: `migrations/core/003_testimonials.sql`, API: `src/app/api/admin/testimonials/route.ts`, Admin: `src/app/admin/setup/testimonials/page.tsx` |
| 1.2 | Public "Wall of Love" / success metrics page — displays featured testimonials and aggregate success stats | Complete | Public route: `/testimonials`, API: `src/app/api/public/testimonials/route.ts` |
| 1.3 | Live aggregate usage counters — wire landing page animated counters to real database data (total posts, users, platforms connected) | Complete | API: `src/app/api/public/stats/route.ts`, wired to Wall of Love stats section |
| 1.4 | Social proof notification popups — toast-style notifications on landing page ("Sarah from Austin just scheduled 12 posts") | Complete | Component: `src/components/landing/social-proof-popup.tsx`, togglable via `socialProofEnabled` in ContentSettings |

**Dependencies:** None — standalone features.

---

## Phase 1.5: Launch Kit

**Goal:** Maximize launch impact with viral mechanics, onboarding polish, and marketing tools.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.5.1 | Configurable watermark on published posts — admin toggle (on/off), position setting, appended as text line on published posts | Complete | API: `src/app/api/social/watermark/route.ts`, Admin: `src/app/admin/setup/watermark/page.tsx`, Integrated into cron post processor |
| 1.5.2 | Public changelog/roadmap page — markdown-driven, visible to visitors | Complete | Existing page at `/changelog`, public API: `src/app/api/public/changelog/route.ts`, DB table: `changelog_entries` |
| 1.5.3 | Onboarding email drip sequences via Resend — welcome series for new signups | Complete | Drip endpoint: `src/app/api/email/drip/route.ts`, 4-step welcome sequence, tracks in `email_drip_log` table |
| 1.5.4 | Simple share/referral link in user dashboard — unique URL per user, copy button, basic click tracking | Complete | API: `src/app/api/referral/route.ts`, Component: `src/components/social/share-link.tsx`, Tracker: `src/components/referral-tracker.tsx`, DB tables: `referral_links`, `referral_clicks` |
| 1.5.5 | Onboarding completion funnel tracking — track drop-off at each wizard step, display funnel metrics in admin dashboard | Complete | API: `src/app/api/onboarding/track/route.ts`, Admin: `src/app/admin/setup/funnel/page.tsx`, Integrated into onboarding wizard, DB table: `onboarding_events` |
| 1.5.6 | "How did you hear about us?" dropdown in feedback widget | Complete | Added to both `src/components/feedback-widget.tsx` and `src/components/help-widget.tsx` with 9 attribution sources, works in both widget modes |

**Dependencies:**
- 1.5.4 (share links) should use a URL structure that's compatible with Phase 3 affiliate tracking (e.g., `?ref=USER_CODE`)

---

## Phase 2: Connect Real Platform APIs & Full Testing

**Goal:** Move from demo data to production-ready platform integrations across all 10 social platforms + 3 blog platforms.

**Strategy:** Phased rollout in 4 batches, prioritizing platforms by audience value and API simplicity. Submit apps for platforms with review processes early to avoid blocking later work.

### Batch 1 — Core Social (Priority: Highest)
Wire up the 3 platforms where B2B/SaaS audiences live. API keys already obtained.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.1a | Twitter/X — OAuth 2.0 + posting | Connected | OAuth 2.0 flow fully working on Vercel. Uses `x.com` domain (not twitter.com). Requires `TWITTER_API_KEY` (OAuth 2.0 Client ID), `TWITTER_API_SECRET` (OAuth 2.0 Client Secret), `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL` in Vercel env vars. Migration `001_social_tables.sql` must be run in Supabase. |
| 2.1b | LinkedIn — OAuth 2.0 + posting | Connected | OAuth 2.0 flow working on Vercel. Uses OpenID Connect scopes (`openid profile email w_member_social`). Token exchange via `www.linkedin.com/oauth/v2/accessToken`. Profile via `/v2/userinfo`. |
| 2.1c | Facebook — OAuth + page posting | Connected | OAuth flow working on Vercel. Currently using basic scopes (`email,public_profile`). Page posting scopes (`pages_manage_posts`, `pages_read_engagement`, `pages_show_list`) to be added when posting feature is needed. |
| 2.1d | Real engagement metric pulling for Batch 1 platforms | Complete | Queue job (`processSocialEngagementPullJob`) pulls real metrics from Twitter/LinkedIn/Facebook APIs via `getPostEngagement()`. Cron endpoint triggers pulls. Engagement summary API (`/api/social/engagement/summary`) aggregates weekly/monthly metrics by platform. Manual pull endpoint (`/api/social/engagement/pull`). Dashboard upgraded with real metric cards (likes, comments, shares, impressions), platform breakdown table, "Refresh Metrics" button. Demo data fallback removed. |
| 2.1e | Error handling, rate limits, token refresh for Batch 1 | Complete | Token refresh for all 3 platforms (X 2hr refresh_token, LinkedIn 60d refresh_token, Facebook long-lived re-exchange). Auto-refresh middleware (`with-token-refresh.ts`). Validate All now attempts refresh before marking invalid. Reconnect button for expired tokens. Friendly OAuth error messages for denied, timeout, callback mismatch, credentials. `token_expires_at` tracked on initial connect and refresh. `TokenExpiredError` class distinguishes "needs reconnect" vs "temporary failure". |

### Batch 2 — Easy Wins (Priority: High)
Platforms with straightforward APIs. Instagram shares the Facebook/Meta app.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.2a | Instagram — via Instagram Graph API | Connected | Uses same FACEBOOK_APP_ID/SECRET (Meta app). OAuth via `api.instagram.com/oauth/authorize`, token exchange via `api.instagram.com/oauth/access_token`, long-lived exchange via `graph.instagram.com/access_token`. Refresh via `graph.instagram.com/refresh_access_token`. 60-day token expiry. Scopes: `instagram_basic`. Callback: `/api/social/callback/instagram`. |
| 2.2b | Reddit — OAuth 2.0 + posting | Connected | OAuth via `reddit.com/api/v1/authorize`. Uses Basic auth (client_id:client_secret) for token exchange. Permanent refresh tokens. 24-hour access token expiry. User-Agent header required. Scopes: `identity submit read`. Needs `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`. Callback: `/api/social/callback/reddit`. |
| 2.2c | Discord — OAuth 2.0 + webhook integration | Connected | OAuth via `discord.com/oauth2/authorize`. Token exchange via `discord.com/api/v10/oauth2/token`. 7-day token expiry with refresh_token. Scopes: `identify guilds webhook.incoming`. Needs `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`. Callback: `/api/social/callback/discord`. |

### Batch 3 — Review-Required Platforms (Priority: Medium)
These platforms have stricter app review processes. Submit applications early.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.3a | YouTube — Google/YouTube Data API v3 | Connected | Google OAuth2 (`accounts.google.com`). Scopes: `youtube.readonly`, `youtube`, `userinfo.profile`. Uses `access_type=offline&prompt=consent` for refresh_token. 1hr tokens, standard Google refresh. Validates via YouTube Data API v3 `channels?part=snippet&mine=true`. Needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. |
| 2.3b | Pinterest — OAuth 2.0 + pin creation | Connected | Pinterest OAuth2. Basic auth (app_id:secret) for token exchange. 30-day tokens with refresh. Validates via `/v5/user_account`. App ID: 1548296 (awaiting trial access approval, 1-3 business days). Needs `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`. |
| 2.3c | TikTok — Content Posting API | Deferred | Video-first platform — insufficient text surface for content flywheel. Removed from platform list. |
| 2.3d | Snapchat — Public Content API | Deferred | Video-first platform — insufficient text surface for content flywheel. Removed from platform list. |

### Batch 4 — Blog Platforms (Priority: Medium, Two Scenarios)
**Scenario 1 (Build First):** Users connect their existing WordPress/Ghost blogs via API credentials (URL + API key). No VPS or OAuth needed.
**Scenario 2 (Future):** PassivePost provisions blogs for users who don't have one. Requires VPS infrastructure.
PassivePost itself is just a user of its own service (dogfooding) — it will use Scenario 1 or 2 like any other customer.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.4a | WordPress — REST API posting (Scenario 1) | Complete | Client: `src/lib/social/blog-clients.ts` (WordPressClient). Validates via `/wp-json/wp/v2/users/me`. Publishes/updates/deletes via `/wp-json/wp/v2/posts`. Resolves tags (find or create). Uploads cover images as featured media. Auth: Application Password format `username:password`. Auto-validates on connect. |
| 2.4b | Ghost — Admin API posting (Scenario 1) | Complete | Client: `src/lib/social/blog-clients.ts` (GhostClient). JWT generation from Admin API key (`id:secret` hex). Validates via `/ghost/api/admin/site/`. Publishes/updates/deletes via `/ghost/api/admin/posts/`. Supports tags, excerpts, slugs, cover images. Auto-validates on connect. |
| 2.4c | Medium — API integration | Deferred | API closed to new integrations as of Jan 2025. Marked as "coming soon" in UI. |
| 2.4d | Blog validation endpoint | Complete | API: `/api/social/blog/connections/validate`. Supports pre-connect validation (raw credentials) and post-connect re-validation (stored encrypted credentials). Dashboard "Test" button for WordPress/Ghost. Auto-validates on initial connect (rejects bad credentials before saving). |

### Phase 2 Summary

| Batch | Platforms | API Keys | Status |
|-------|-----------|----------|--------|
| 1 — Core Social | Twitter/X, LinkedIn, Facebook | All credentials stored | Complete |
| 2 — Easy Wins | Instagram, Reddit, Discord | Instagram uses FB creds; Reddit + Discord need new creds | Complete |
| 3 — Remaining Social | YouTube, Pinterest | YouTube uses Google OAuth; Pinterest uses Pinterest OAuth | Complete |
| ~~TikTok, Snapchat~~ | ~~Deferred~~ | Video-first platforms — deferred (not enough text surface area for content flywheel) | Deferred |
| 4 — Blog Platforms | WordPress, Ghost, Medium | Scenario 1: user-provided credentials, no VPS. Medium deferred (API closed). | Complete (Scenario 1) |

**Pre-Flight Check System:**
A `/api/social/preflight` endpoint validates all prerequisites before attempting OAuth. The Connect button calls this automatically and shows clear, actionable error messages if anything is missing. This prevents the trial-and-error debugging that plagued the Twitter/X connection.

**Required Vercel Environment Variables per Platform:**

| Variable | Used By | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SITE_URL` | All platforms | Your production URL (e.g., `https://master-saas-muse-u7ga.vercel.app`). Required for callback URL generation. `getAppOrigin()` checks both `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL`. |
| `SESSION_SECRET` | All platforms | Random string for OAuth state signing. Generate with `openssl rand -hex 32`. |
| `SOCIAL_ENCRYPTION_KEY` | All platforms | 32-byte hex key for token encryption. Generate with `openssl rand -hex 32`. If missing, auto-generates and stores in database, but pre-setting avoids first-connection delay. |
| `TWITTER_API_KEY` | Twitter/X | OAuth 2.0 Client ID (NOT Consumer Key) from X Developer Portal. |
| `TWITTER_API_SECRET` | Twitter/X | OAuth 2.0 Client Secret from X Developer Portal. |
| `LINKEDIN_CLIENT_ID` | LinkedIn | From LinkedIn Developer Portal app credentials. |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | From LinkedIn Developer Portal app credentials. |
| `FACEBOOK_APP_ID` | Facebook, Instagram | From Meta Developer Portal app settings. Instagram uses the same Meta app. |
| `FACEBOOK_APP_SECRET` | Facebook, Instagram | From Meta Developer Portal app settings. |
| `REDDIT_CLIENT_ID` | Reddit | From Reddit app at https://www.reddit.com/prefs/apps (type: "web app"). |
| `REDDIT_CLIENT_SECRET` | Reddit | From Reddit app at https://www.reddit.com/prefs/apps. |
| `DISCORD_CLIENT_ID` | Discord | From Discord Developer Portal at https://discord.com/developers/applications. |
| `DISCORD_CLIENT_SECRET` | Discord | From Discord Developer Portal. |
| `GOOGLE_CLIENT_ID` | YouTube | From Google Cloud Console. Enable YouTube Data API v3. |
| `GOOGLE_CLIENT_SECRET` | YouTube | From Google Cloud Console OAuth 2.0 credentials. |
| `PINTEREST_APP_ID` | Pinterest | From Pinterest Developer Portal at https://developers.pinterest.com/apps/. |
| `PINTEREST_APP_SECRET` | Pinterest | From Pinterest Developer Portal. |

**Callback URLs to Register (replace `YOUR_DOMAIN`):**

| Platform | Callback URL |
|----------|-------------|
| Twitter/X | `https://YOUR_DOMAIN/api/social/callback/twitter` |
| LinkedIn | `https://YOUR_DOMAIN/api/social/callback/linkedin` |
| Facebook | `https://YOUR_DOMAIN/api/social/callback/facebook` |
| Instagram | `https://YOUR_DOMAIN/api/social/callback/instagram` |
| Reddit | `https://YOUR_DOMAIN/api/social/callback/reddit` |
| Discord | `https://YOUR_DOMAIN/api/social/callback/discord` |
| YouTube | `https://YOUR_DOMAIN/api/social/callback/youtube` |
| Pinterest | `https://YOUR_DOMAIN/api/social/callback/pinterest` |

**Database Prerequisites:**
- Run `migrations/core/001_social_tables.sql` in Supabase SQL Editor (creates `social_accounts` table)
- `config_secrets` table auto-creates via RPC on first use

**Dependencies:**
- Phase 1 and 1.5 should be complete so the product has social proof ready when real users arrive
- Batch 1: API keys obtained — ready to wire
- Batch 2: Instagram may reuse Facebook app; Reddit + Discord apps need creation
- Batch 3: Submit TikTok + Snapchat apps for review ASAP — approval takes time
- Batch 4: Requires VPS setup for self-hosted WordPress + Ghost (cloneable for future MuseKit products)
- Medium API is closed — monitor for reopening or mark as "coming soon"

---

## Phase 3: Affiliate Marketing Features

**Goal:** Build a referral/affiliate system that drives organic growth.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.1 | Upgrade Phase 1.5 share links to tracked affiliate links with attribution | Complete | `referral_links` table upgraded with `is_affiliate`, `locked_commission_rate`, `locked_duration_months`, `locked_at`, `total_earnings_cents`, `paid_earnings_cents`, `pending_earnings_cents`. Cookie attribution (`pp_ref` cookie, 30-day default). Signup tracking via `/api/affiliate/track-signup`. |
| 3.2 | Commission tracking on Stripe subscription events | Complete | `invoice.paid` webhook handler in `src/app/api/stripe/webhook/route.ts`. Calculates commission using locked-in rate, respects duration window, creates `affiliate_commissions` record, updates affiliate balance. Deduplicates by `stripe_invoice_id`. |
| 3.3 | Affiliate dashboard — referrals, earnings, payout status | Complete | User-facing page at `/dashboard/social/affiliate`. Shows stats cards (clicks, signups, pending earnings, total earned), tier progress bar, referral list, earnings breakdown, payout history, marketing assets browser. Activation flow with locked-in terms display. |
| 3.4 | Admin affiliate management — set rates, approve/deny affiliates, view program stats | Complete | Admin page at `/admin/setup/affiliate`. Tabs: Settings (commission rate/duration/min payout/cookie days/active toggle), Tiers (CRUD), Marketing Assets (CRUD with 4 types), Affiliates (ranked list with locked terms). Fraud alert cards. Stats dashboard. |
| 3.5 | Payout tracking (manual to start) | Complete | `affiliate_payouts` table. Admin creates/approves/marks paid via `/api/affiliate/payouts`. On payout completion: updates affiliate balance, marks commissions as paid, sends notification. Status flow: pending → approved → paid. |
| 3.6 | Configurable commission settings with grandfathering | Complete | `affiliate_program_settings` table. Admin adjusts rate/duration anytime. When affiliate activates, current terms are locked in via `lockInAffiliateTerms()`. Calculations always use locked-in terms, never global settings. |
| 3.7 | Performance tiers | Complete | `affiliate_tiers` table with default Bronze/Silver/Gold. Higher tier rate overrides locked-in rate if greater. Admin CRUD. Tier progress shown in affiliate dashboard. |
| 3.8 | Marketing assets library | Complete | `affiliate_assets` table (banner, email_template, social_post, text_snippet types). Admin uploads/manages. Affiliates browse and copy/download from their dashboard. |
| 3.9 | Cookie attribution (30-day window) | Complete | `ReferralTracker` component sets `pp_ref` cookie on `?ref=CODE` visits. Signup page reads cookie and calls `/api/affiliate/track-signup`. Cookie duration configurable in admin settings. |
| 3.10 | Fraud protection | Complete | `checkFraudFlags()` in `src/lib/affiliate/index.ts`. Checks: same email domain, suspicious IP volume (3+ from same IP in 1hr), self-referral. Flags stored on `affiliate_referrals.fraud_flags`. Admin sees flagged referrals with alert cards. |
| 3.11 | Real-time notifications | Complete | Notifications sent via existing `notifications` table: on link click, on signup, on commission earned, on payout processed. All link to `/dashboard/social/affiliate`. |
| 3.12 | Affiliate onboarding email drip | Complete | 3-email sequence via Resend: Welcome (immediate), Tips (24hr), Strategy (72hr). Uses existing `email_drip_log` table with `sequence_name='affiliate'`. Triggered on activation. |

**Dependencies:**
- Phase 1.5.4 (share links) — built, upgraded with affiliate fields
- Phase 2 — complete, product fully functional
- Stripe webhooks — `invoice.paid` handler added

**Decision:** Built as MuseKit core feature (available to all products).

### Phase 3.5: Open Affiliate Program (Public Signup)

**Goal:** Allow non-users (bloggers, YouTubers, influencers) to apply as affiliates with completely separate login and dashboard from product users.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.5.1 | Public affiliate landing page at /affiliate | Complete | Commission structure, benefits, 'Apply Now' CTA. Footer link added. |
| 3.5.2 | Affiliate application form at /affiliate/join | Complete | Name, email, website, promotion method, message. No account required. Duplicate detection. |
| 3.5.3 | affiliate_applications table + submission API | Complete | Migration: `migrations/core/006_affiliate_applications.sql`. API: `/api/affiliate/applications`. Admin notifications on new applications. |
| 3.5.4 | Separate affiliate login at /affiliate/login | Complete | Magic link + password login. Completely independent from product user login. Redirects to /affiliate/dashboard. |
| 3.5.5 | Standalone affiliate dashboard at /affiliate/dashboard | Complete | Own header/layout (no product sidebar). Stats, earnings, payouts, referral link, marketing assets. Auth-gated. |
| 3.5.6 | Admin applications tab | Complete | New tab on admin affiliate page. Filter by pending/approved/rejected. Approve creates Supabase user + referral link + role. Reject with notes. |
| 3.5.7 | Network integration infrastructure | Complete | `affiliate_network_settings` table. Admin tab for ShareASale, Impact, PartnerStack. Toggle active, set tracking ID and postback URL. |
| 3.5.8 | Product-side cleanup | Complete | Sidebar "Earn > Affiliate" now links to /affiliate (public landing page). Header/footer hidden on affiliate dashboard. Old dashboard page preserved for existing product-user affiliates. |

**Architecture Decision:** Affiliates are 100% separate from product users — different login (/affiliate/login vs /login), different dashboard (/affiliate/dashboard vs /dashboard), different purpose. Product side only has: ReferralTracker component on marketing pages + auth callback attribution.

---

## Phase 3.6: Affiliate Enhancements & Discount Codes

**Goal:** Elevate the affiliate system from functional to world-class with advanced motivation, analytics, compliance, and a standalone discount code system.

**Detailed plan:** See `docs/musekit/AFFILIATE_ENHANCEMENTS.md` for full feature specs, database schemas, and implementation notes.

### Sprint 1 — Core Revenue & Motivation (5 features)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.6.1 | Discount Code System with dual-attribution — admin CRUD, Stripe coupon sync, checkout integration, affiliate code-based attribution as fallback | Complete | Standalone admin page `/admin/setup/discount-codes`. Tables: `discount_codes`, `discount_code_redemptions`. Attribution conflict policy configurable in affiliate settings. API: `/api/admin/discount-codes`. Public validation: `/api/discount-codes/validate`. |
| 3.6.2 | Milestone Bonuses — flat bonuses at referral count thresholds | Complete | Tables: `affiliate_milestones`, `affiliate_milestone_awards`. Admin CRUD on Milestones tab. Affiliate dashboard progress card with per-milestone progress bars. API: `/api/affiliate/milestones`. |
| 3.6.3 | Real-Time Earnings Widget — live "today's earnings" counter on dashboard | Complete | No new tables. Aggregates existing commissions by period. Live earnings card on affiliate dashboard with Today/Week/Month toggle. API: `/api/affiliate/earnings`. |
| 3.6.4 | Affiliate Newsletter / Broadcast System — admin bulk email to affiliates | Complete | Tables: `affiliate_broadcasts`, `affiliate_broadcast_receipts`. Broadcasts tab on admin affiliate page with draft/send workflow and audience segmentation. API: `/api/admin/affiliate/broadcasts`. |
| 3.6.5 | Admin Program Health Dashboard — ROI, growth trends, churn risk, fraud alerts | Complete | No new tables. Aggregates existing data. Health tab (default) on admin affiliate page with KPI cards, revenue impact, engagement metrics, top performers. API: `/api/admin/affiliate/health`. |

### Sprint 2 — Affiliate Tools & Analytics (6 features)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.6.6 | Deep Link Generator — affiliate links to specific pages | Complete | Frontend tool on affiliate dashboard Tools tab. Dropdown of common pages + custom URL. Copy button. `landing_page` column on `referral_clicks`. |
| 3.6.7 | Affiliate Leaderboard — ranked top performers | Complete | API with period/metric filters, privacy modes (initials/full name), admin toggle. Dashboard leaderboard card with top 10 + own position. |
| 3.6.8 | Referral Sub-Tracking — source tags on affiliate links | Complete | `source_tag` columns on `referral_clicks` and `affiliate_referrals`. ReferralTracker captures `?src=` param. Sources tab on dashboard. |
| 3.6.9 | UTM Parameter Support — auto-append UTM tags to affiliate links | Complete | Auto-append utm_source/medium/campaign/content to deep links. Toggle on/off in deep link generator. |
| 3.6.10 | Conversion Funnel Visualization — click→signup→trial→paid funnel | Complete | API aggregating clicks→signups→conversions→paid with drop-off rates. Visual funnel bars on dashboard with color-coded rates. Period selector. |
| 3.6.11 | Earnings Forecast — projected monthly earnings based on current pace | Complete | API projecting from 14-day rolling average. Optimistic/pessimistic range. Pace vs last month. Tier upgrade proximity alert. |

### Sprint 3 — Engagement, Automation & Content (8 features)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.6.12 | Payout Accelerators — lower min payout for top tiers | Complete | `min_payout_cents` column on `affiliate_tiers`. Admin tier form has "Min Payout Override" field. Payout batch generation respects tier-specific thresholds. |
| 3.6.13 | Exclusive Access / Tier Perks — non-monetary rewards per tier | Complete | `perks` field on tier form (comma-separated). Dashboard shows perk badges for current tier. Next tier perks shown as preview. |
| 3.6.14 | Quarterly Contests — time-bound competitions with prizes | Complete | Table: `affiliate_contests`. Full CRUD in admin Contests tab. Dashboard shows active/upcoming contests with countdown timer, prize info, and status badges. Auto-determines status from dates. |
| 3.6.15 | 7-Day Onboarding Sequence — expanded affiliate drip emails | Complete | 7-email sequence in `/api/affiliate/drip`: welcome (0h), share first link (24h), write review (48h), social promo (72h), check stats (5d), first week report (7d), level up (14d). |
| 3.6.16 | Affiliate Resource Center — swipe files, templates, FAQs, tutorials | Complete | 13 asset types (banner, email_template, social_post, text_snippet, video, case_study, one_pager, swipe_file, landing_page, faq, video_tutorial, best_practice, guide). Dashboard "Resources" tab with category filter and search. |
| 3.6.17 | Dormant Affiliate Re-Engagement — auto-email inactive affiliates | Complete | 3 reengagement emails via `/api/affiliate/reengagement`. Configurable: `reengagement_enabled`, `dormancy_threshold_days` (default 30), `max_reengagement_emails` (default 3). Tracks in `email_drip_log` with `sequence_name='reengagement'`. |
| 3.6.18 | Auto-Tier Promotion Notifications — alerts near tier thresholds | Complete | `checkTierProximityNotification()` in `src/lib/affiliate/index.ts`. Checks 80% (20% remaining), 90% (10% remaining), and 100% (promotion) thresholds. Called on every signup via track-signup route. Uses existing notifications table. |
| 3.6.19 | Scheduled Payout Runs — automated monthly payout batches | Complete | Table: `affiliate_payout_batches`. Full generate/approve/reject flow in admin Payout Runs tab. Settings: `auto_batch_enabled`, `payout_schedule_day`, `auto_approve_threshold_cents`. Column-resilient API. Audit logged. |

### Sprint 4 — Advanced, Compliance & Social Proof (13 features)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.6.20 | Anti-Spam & Compliance Rules — enforceable terms + violation tracking | Complete | `agreed_to_terms` checkbox on `/affiliate/join` form. Admin suspend/unsuspend controls with reason. Violation tracking on referral_links. PATCH endpoint on members route. Audit logged. |
| 3.6.21 | Automated Fraud Scoring — numeric score with auto-pause | Complete | `src/lib/affiliate/fraud.ts` with 6 scoring signals (IP cluster +20, rapid signups +15, self-referral +30, same domain +10, quick cancels +25, geo mismatch +5). Auto-pause at configurable threshold (default 60). Admin notification on auto-pause. Recalculate button in admin. Fraud score badge in member list. |
| 3.6.22 | Tax Compliance (1099 / W-9) — collect tax info before payouts | Complete | Table: `affiliate_tax_info`. W-9/W-8BEN form in affiliate Account tab. Admin Tax Info tab with verify button. Payouts blocked if no tax info on file. API: GET/POST /api/affiliate/tax-info, GET/PATCH admin routes. |
| 3.6.23 | Co-Branded Landing Pages — personalized affiliate partner pages | Complete | Table: `affiliate_landing_pages`. Landing page editor in Tools tab (headline, bio, photo, CTA, theme color). Public route: `/partner/[slug]` with ref code embedded. View counter. Auto-slug from name. |
| 3.6.24 | Two-Tier Referrals — earn from recruited affiliates' sales | Complete | `recruited_by_affiliate_id` set on track-signup. Second-tier commissions created in Stripe webhook handler. Table: `affiliate_second_tier_commissions`. Admin settings: `two_tier_enabled`, `second_tier_commission_rate`. Dashboard shows second-tier earnings card. |
| 3.6.25 | Affiliate API Access — RESTful API for power affiliates | Complete | Table: `affiliate_api_keys`. `src/lib/affiliate/api-auth.ts` with SHA-256 hashing + 100 req/hr rate limiting. API key CRUD in Account tab. v1 endpoints: /stats, /referrals, /commissions, /earnings. `X-API-Key` header auth. Rate limit headers. |
| 3.6.26 | In-Dashboard Messaging — admin ↔ affiliate direct messaging | Complete | Table: `affiliate_messages`. Thread-based messaging with unread badges. Affiliate Messages tab with chat UI + compose box. Admin Messages tab with thread list + reply. Mark-as-read on open. Audit logged. |
| 3.6.27 | Affiliate Satisfaction Surveys — periodic rating + feedback | Complete | Table: `affiliate_surveys`. 1-5 star rating + feedback + testimonial opt-in. Configurable interval (default 90 days). Survey card in Account tab. Auto-creates testimonial on opt-in. |
| 3.6.28 | Affiliate Testimonials — success stories for landing page | Complete | Table: `affiliate_testimonials`. Admin Testimonials tab with full CRUD (add/edit/feature/hide/delete). Public API serves active testimonials. Testimonial section on `/affiliate` landing page. Audit logged. |
| 3.6.29 | Verified Earnings Badges — embeddable partner badges | Complete | Tables: `affiliate_badges`, `affiliate_badge_tiers`. Auto-award at $500/$2500/$10000 thresholds. Dashboard "Your Badges" section with embed code + verification link. Public verification page: `/partner/verify/[code]`. Default tiers seeded in migration. |
| 3.6.30 | Affiliate Webhook Notifications — real-time event webhooks for power affiliates | Complete | Tables: `affiliate_webhooks`, `affiliate_webhook_deliveries`. `src/lib/affiliate/webhooks.ts` with HMAC-SHA256 signing + 3 retries + exponential backoff. 6 event types. Dashboard Webhooks section in Tools tab (add/test/view deliveries/delete). Auto-disable after 10 failures. |
| 3.6.31 | PassivePost Auto-Promo — auto-generate promo posts for affiliate-users | Complete | API: POST `/api/affiliate/auto-promo`. Uses xAI/OpenAI to generate platform-specific promo posts (7 platforms, 5 tones). Embeds ref link. Dashboard "Generate Promo Post" card in Tools tab with platform/tone selectors and copy button. |
| 3.6.32 | PartnerStack Seeding Strategy — operational playbook for network recruitment | Complete | "External Networks Playbook" section added to `docs/musekit/AFFILIATE.md`. Covers: network overview (ShareASale, Impact, PartnerStack), postback URL config, affiliate onboarding flow, direct vs network comparison, best practices, PartnerStack-specific notes. |

**Total: 32 features across 4 sprints. ALL COMPLETE.**

**Dependencies:**
- Phase 3.5 (Open Affiliate Program) must be complete — it is
- Stripe integration (Phase 3.2) required for discount codes — it is
- Resend integration required for broadcasts and re-engagement — it is
- Migrations 005 + 006 must be run on Supabase before testing

---

## Pending Bug Fixes

All previously pending bugs have been resolved.

| # | Bug | Status | Fix Summary |
|---|-----|--------|-------------|
| BF1 | Affiliate name not showing in Members table | **Fixed** | Members API now fetches `name` from `affiliate_applications` as fallback when `user_metadata` has no name. File: `src/app/api/affiliate/members/route.ts` |
| BF2 | Approval email PKCE redirect broken | **Fixed** | Magic link now uses `token_hash` approach instead of `action_link`. Auth callback (`/auth/callback`) handles both PKCE `code` exchange AND `token_hash` + `type` via `verifyOtp`. Files: `src/app/api/affiliate/applications/review/route.ts`, `src/app/auth/callback/route.ts` |
| BF3 | Conditional email logic for new vs existing users | **Fixed** | Was already implemented in code (lines 226-258 of review route). BF2 fix ensures the magic link for new users actually works, making the conditional emails function correctly. |

---

## Phase 4: Mobile App (Deprioritized)

**Goal:** Extend PassivePost to mobile users.
**Status:** Deprioritized — CRM/Invoicing (Phases 5-7) identified as more important for template sellability. Will revisit after Phase 7.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4.1 | PWA wrapper — service worker, manifest, install prompt | Not Started | Quick win, lowest effort |
| 4.2 | Mobile-optimized touch interactions and responsive polish | Not Started | Bigger tap targets, swipe gestures |
| 4.3 | Push notifications for post alerts, streaks, lead alerts | Not Started | Requires service worker + notification API |
| 4.4 | Evaluate native app upgrade based on usage data | Not Started | Decision point after PWA launch |

**Dependencies:**
- Phases 1-3 should be complete so the mobile experience is feature-complete
- Real user data from Phase 2+ informs which features matter most on mobile

---

## Phase 5: CRM & Invoicing Foundation (Data Layer)

**Goal:** Build the database tables and APIs that all three dashboards need. This is the foundation everything else depends on.

**Detailed vision:** See `docs/CRM_INVOICING_BRAINSTORM.md` for the full 217-feature brainstorm including dogfooding architecture, cross-Muse strategy, and the closed-loop BI vision.

### Sprint 1 — Universal Profiles & Financial Records

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.1.1 | Universal `user_profiles` table — replaces affiliate-only profiles. Stores display name, avatar, phone, address, bio, timezone, preferences for ALL user types. | Complete | Migration 011. API: GET/POST `/api/user/profile`, admin GET/PATCH `/api/admin/users/[id]/profile`. Column-resilient upserts. |
| 5.1.2 | `invoices` + `invoice_items` tables — local records of every Stripe transaction. Synced via Stripe webhooks. | Complete | Migration 011. User API: GET `/api/user/invoices`, GET `/api/user/invoices/[id]` (with items). Admin: GET `/api/admin/invoices`, GET `/api/admin/invoices/[id]`. Stripe sync via `syncInvoiceToLocal()`. |
| 5.1.3 | `payments` table — local payment transaction records with status tracking. | Complete | Migration 011. User API: GET `/api/user/payments`. Payment records created automatically by Stripe webhook sync. Tracks payment_intent, charge, method details. |
| 5.1.4 | `affiliate_payout_items` junction table — which commissions are included in which payout. | Complete | Migration 011. Payout batch generation now creates items linking commissions to payouts. API: GET `/api/affiliate/payouts/[id]/items`, admin GET `/api/admin/payouts/[id]/items`. |
| 5.1.5 | Stripe webhook sync — extend invoice.paid handler to create local invoice/payment records. | Complete | Added `syncInvoiceToLocal()` to Stripe webhook. Upserts invoice, inserts line items, creates payment record. Also handles `invoice.payment_failed`. Wrapped in try/catch — never breaks existing commission flow. |

### Sprint 2 — Support & Activity Tracking

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.2.1 | `tickets` + `ticket_comments` tables — basic support ticket system. | Complete | Migration 011. User API: GET/POST `/api/tickets`, GET/PATCH `/api/tickets/[id]`, GET/POST `/api/tickets/[id]/comments`. Admin: GET `/api/admin/tickets` with filters. Status flow: open → in_progress → resolved → closed. Internal comments hidden from non-admins. |
| 5.2.2 | `activities` table — log calls, notes, tasks, meetings on any account. | Complete | Migration 011. API: GET/POST `/api/activities`, PATCH/DELETE `/api/activities/[id]`. Admin: GET `/api/admin/activities`. Supports 6 types: call, note, task, meeting, email, other. Due dates + completion tracking. |
| 5.2.3 | `campaigns` table — marketing campaign tracking with UTM attribution. | Complete | Migration 011. API: GET/POST `/api/campaigns`, GET/PATCH/DELETE `/api/campaigns/[id]`. Admin: GET `/api/admin/campaigns`. Full UTM support (source, medium, campaign, term, content). Performance tracking: clicks, signups, conversions, revenue. |
| 5.2.4 | `contracts` / `agreements` table — formalized affiliate terms with version history. | Complete | Migration 011. API: GET `/api/contracts`, GET/PATCH `/api/contracts/[id]`. Admin: GET/POST `/api/admin/contracts`. Signing flow: user signs → admin countersigns. Version history via parent_contract_id. Status: draft → active → expired/terminated. |

**Dependencies:**
- Phase 3.6 Sprint 1 (discount codes, milestones) must be complete — it is
- Stripe webhook infrastructure must exist — it does
- Supabase migrations must be run by user

---

## Phase 6: Dashboard Enhancements (UI Layer)

**Goal:** Wire the Phase 5 data layer into all three dashboards with world-class UX.

### Admin Dashboard Enhancements

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6.1.1 | Affiliate "at a glance" CRM card — click name → full profile, earnings, payouts, tickets, activity log, notes | Complete | CRM drawer on admin affiliate page. Click member name → full profile with earnings, payouts, tickets, activities, notes. |
| 6.1.2 | Revenue attribution report — affiliate vs. direct revenue split | Complete | New API `/api/admin/revenue-attribution`. Revenue cards + visual bar chart in Health tab showing affiliate vs direct revenue split. |
| 6.1.3 | Bulk payout processing with auto receipt emails | Complete | "Process All" button → summary dialog → approve + auto-send receipt emails via Resend. New API `/api/admin/affiliate/payout-receipt`. |
| 6.1.4 | Affiliate health score — auto-calculated red/yellow/green indicator | Complete | Color-coded dot badges (green/yellow/red) on each member in Members tab. Calculated from activity recency, conversion rate, fraud score. |
| 6.1.5 | Quick notes on any account — admin internal notes | Complete | Notes section in CRM card. Stored as activities with type 'note'. Add/view notes in reverse chronological order. |

### Affiliate Dashboard Enhancements

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6.2.1 | Professional earnings statements — branded PDF with itemized commissions | Complete | "Download Statement" button on Earnings tab. Period selector (current/last month/custom). New API `/api/affiliate/earnings-statement` generates HTML-to-PDF. |
| 6.2.2 | "My Portfolio" view — referrals as investment portfolio with LTV | Complete | List/Portfolio toggle on Referrals tab. Shows referrals as investments with LTV, grouped by status (active/trial/churned). Summary cards for portfolio value. |
| 6.2.3 | Commission lifecycle tracker — full journey from click to payout | Complete | Expandable commission rows in Earnings tab. Horizontal stepper showing: Click → Signup → Trial → Paid → Created → Approved → Paid Out with status icons. |
| 6.2.4 | "My Terms" contract view — locked-in terms, rate lock guarantee | Complete | "My Terms" section in Account tab. Shows active contract, commission rate, effective date, sign button for drafts, version history. |
| 6.2.5 | Tax summary and 1099-ready annual report | Complete | Tax Summary section in Account tab. Annual earnings by year, 1099-ready format. New API `/api/affiliate/tax-summary`. Download button for tax summary PDF. |
| 6.2.6 | Campaign creator with per-campaign tracking | Complete | Campaigns section in Tools tab. Create/edit/delete campaigns with UTM fields. Per-campaign tracking stats (clicks, signups, conversions, revenue). Auto-generated trackable links. |

### User (Product) Dashboard Enhancements

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6.3.1 | Invoice history page — every payment, downloadable as PDF | Complete | Billing page at `/billing`. Invoice list with status filter, pagination. Click for detail dialog with line items. Download PDF via Stripe URL. Error states with retry. |
| 6.3.2 | Subscription management tab — plan, billing date, payment method, invoices | Complete | Subscription card on billing page. Shows current plan, tier icon, status, billing cycle, next payment date. "Manage Subscription" → Stripe portal. Payment method card. |
| 6.3.3 | Support ticket submission and history | Complete | Support page at `/support`. Ticket list with status badges, "New Ticket" form. Click ticket → detail view with comments thread. Add comment form. Status flow visible. |
| 6.3.4 | Account security page — password, sessions, 2FA future | Complete | Security page at `/security`. Change password form with Supabase auth. Active sessions info. 2FA "Coming Soon" placeholder. Last login display. |
| 6.3.5 | Affiliate program invitation prompt — "Love it? Earn 30%" | Complete | Invitation card on billing page. "Earn 30% commissions" CTA linking to `/affiliate/join`. Shown to non-affiliate users. |

**Dependencies:**
- Phase 5 data layer must be complete (tables must exist for UI to query)

---

## Phase 7: AI & Cross-Dashboard Features

**Goal:** Layer intelligence, automation, and advanced features on top of the foundation.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7.1 | AI Social Post Writer — generate promo content with affiliate code embedded | Complete | API `/api/affiliate/ai-post-writer`. 7 platforms, 5 tones, auto-embeds ref link. Enhanced existing Tools tab AI card. |
| 7.2 | AI Weekly Coach — personalized performance tips every Monday | Complete | API `/api/affiliate/ai-coach` (on-demand) + `/api/cron/weekly-coach` (cron-compatible). AI Coach card on Overview with 3-5 prioritized tips. |
| 7.3 | Commission renewal system — extend commission window via customer check-ins | Complete | Migration 012. APIs: `/api/affiliate/renewals` (GET/POST), `/api/admin/renewals` (GET/PATCH). Renewals section on Referrals tab + admin Renewals tab. |
| 7.4 | Connected analytics — YouTube integration for full-funnel view | Complete | API `/api/affiliate/analytics/youtube`. Content Analytics card on Overview showing video stats + referral attribution. Graceful fallback when not connected. |
| 7.5 | ~~In-app messaging~~ — **Already built in Phase 3.6 Sprint 4 (E28)** | Complete | Admin ↔ affiliate messaging built as feature 3.6.26. No additional work needed. |
| 7.6 | Earnings charts and analytics suite — line charts, heatmaps, funnels, benchmarks | Complete | API `/api/affiliate/analytics/charts`. New Analytics tab with SVG line chart, conversion funnel, GitHub-style heatmap, percentile benchmarks, top sources bar chart. All CSS/SVG, no external library. |
| 7.7 | Dashboard customization — drag/drop widgets | Complete | Widget-based Overview with show/hide toggles, drag-and-drop reordering (HTML5 drag API), localStorage persistence, "Customize Dashboard" mode, "Reset to Default" button. |

**Dependencies:**
- Phase 6 dashboards should be functional before adding advanced features
- AI features require xAI/OpenAI API key (already configured)

---

## Decision Log

Decisions made during planning, preserved for context.

| Date | Decision | Reasoning |
|------|----------|-----------|
| Feb 20, 2026 | Watermark is simple on/off toggle, no white-labeling | Market hasn't demanded it yet. Can add later if needed. |
| Feb 20, 2026 | Higher tiers can disable watermark | Creates natural upgrade incentive |
| Feb 20, 2026 | Watermark is text-based (appended line), not image overlay | Works across all platforms, no image manipulation needed, platforms don't flag it |
| Feb 20, 2026 | Affiliate payouts are manual to start | Gets 80% of value with 40% of effort. Stripe Connect automation can come later. |
| Feb 20, 2026 | Share links in Phase 1.5 use `?ref=CODE` format | Ensures seamless upgrade to tracked affiliate links in Phase 3 |
| Feb 20, 2026 | Mobile app starts as PWA, not native | Lowest effort, lets us validate demand before investing in native |
| Feb 20, 2026 | Affiliate system should be MuseKit core, not PassivePost-specific | Any product on the template benefits from referrals |
| Feb 20, 2026 | Live counters replace manually-set animated counter values | Authentic numbers are more compelling than round placeholder numbers |
| Feb 21, 2026 | Phase 2 uses 4-batch rollout: Core Social → Easy Wins → Review-Required → Blog Platforms | Prioritizes highest-value platforms first; submits slow-review apps (TikTok, Snapchat) early to avoid blocking |
| Feb 21, 2026 | WordPress + Ghost will be self-hosted on a VPS as cloneable infrastructure | Eliminates recurring SaaS fees, reusable template for all future MuseKit products |
| Feb 22, 2026 | Blog integration split into Scenario 1 (connect existing) and Scenario 2 (provision for users) | Scenario 1 requires no infrastructure — just API client code. Scenario 2 deferred for VPS setup later. PassivePost dogfoods its own service as a regular user. |
| Feb 21, 2026 | Medium marked as "coming soon" — API closed to new integrations since Jan 2025 | No viable path to integrate; monitor for reopening |
| Feb 21, 2026 | Instagram integration will attempt to reuse existing Facebook/Meta app credentials | Same Graph API, reduces credential management overhead |
| Feb 21, 2026 | 10 social platforms + 3 blog platforms = 13 total platform integrations as PassivePost USP | Broad platform support is the key differentiator |
| Feb 22, 2026 | Affiliates are 100% separate from product users — different login, dashboard, purpose | Two different audiences with different goals. Mixing creates confusion. Product side only needs ReferralTracker + auth callback attribution. |
| Feb 22, 2026 | Open affiliate program supports non-user applicants (bloggers, YouTubers, influencers) | Expands reach beyond existing customers. Application → admin review → auto-provisioned account. |
| Feb 22, 2026 | External affiliate network integration (ShareASale, Impact, PartnerStack) via postback URLs | Enables broader distribution through established affiliate networks. Server-side postbacks on Stripe conversions. |
| Feb 22, 2026 | Promotion method changed to multi-select checkboxes | Affiliates typically use multiple channels. Stored as comma-separated string in DB. |
| Feb 22, 2026 | Discount codes are a standalone system that can optionally tie to affiliates | Every SaaS needs promo codes regardless of affiliate program. Affiliate-linked codes get attribution credit. |
| Feb 22, 2026 | Phase 3.6 expanded to 32 affiliate enhancements across 4 sprints | Original 20 features + 12 new: newsletter/broadcast, program health dashboard, conversion funnel, earnings forecast, dormant re-engagement, auto-tier notifications, scheduled payouts, in-dashboard messaging, satisfaction surveys, affiliate testimonials, verified badges, webhook notifications. |
| Feb 22, 2026 | Discount codes serve as dual-purpose affiliate attribution | Code both applies discount AND credits the linked affiliate. Fallback when no cookie attribution exists (podcast, word-of-mouth). Attribution conflict policy configurable: cookie_wins (default), code_wins, first_touch, or split. |
| Feb 24, 2026 | CRM & Invoicing identified as critical gap — Phases 5-7 added | No universal user profiles (only affiliates have them), no local invoice/payment records (Stripe handles it but no local data), no support tickets, no activity tracking, no contract system. Every dashboard needs this. |
| Feb 24, 2026 | Phase 4 (Mobile PWA) deprioritized in favor of Phases 5-7 | CRM/invoicing infrastructure is more important for template sellability than mobile. Mobile can wait; data layer cannot. |
| Feb 24, 2026 | Two-document system established for CRM/invoicing planning | AFFILIATE_ENHANCEMENTS.md = implementation specs for 32 affiliate features (Phase 3.6). CRM_INVOICING_BRAINSTORM.md = 217-feature strategic vision for all dashboards (Phases 5-7). Cross-references added to both. |
| Feb 24, 2026 | Three-layer dogfooding architecture documented | Layer 1: PassivePost uses PassivePost. Layer 2: Affiliates use PassivePost to promote PassivePost. Layer 3: Customers become affiliates. Cross-Muse strategy: all future Muses need affiliates, all affiliates need PassivePost. |
| Feb 24, 2026 | Build approach: data layer first, then dashboards, then AI | Phase 5 = tables + APIs. Phase 6 = dashboard UI for all 3 user types. Phase 7 = AI, analytics, advanced features. Foundation before features. |
| Feb 24, 2026 | Three-Environment Sync Protocol codified in replit.md | Root cause of most wasted debugging time: agent tests on Replit Postgres + localhost, user tests on Supabase + Vercel. Mandatory Pre-Push Sync Checklist added: schema alignment, compile check, API smoke test, migration inventory, env vars, git status. |
| Feb 24, 2026 | Sprint 3 audit: 7/8 features already built during Sprints 1-2 | Code audit revealed Payout Accelerators, Tier Perks, Quarterly Contests, 7-Day Onboarding, Dormant Re-Engagement, Auto-Tier Notifications, and Scheduled Payout Runs were all built as part of Sprint 1-2 work. Only Resource Center (3.6.16) needed enhancement (category filter + search + 4 new asset types). |
| Feb 24, 2026 | Resource Center renamed from "Marketing" tab to "Resources" tab | Better describes the expanded scope: 13 asset types including swipe files, FAQs, video tutorials, best practices, and guides. Category filter dropdown with counts + text search. |
| Feb 24, 2026 | Sprint 2 ROADMAP entries updated from "Not Started" to "Complete" | Deep Link Generator, Leaderboard, Sub-Tracking, UTM Support, Conversion Funnel, and Earnings Forecast were all built but ROADMAP wasn't updated. Corrected with detailed notes on each. |
| Feb 24, 2026 | Phase 3.6 Sprint 4 complete — 13 features built, Phase 3.6 fully done (32/32) | Sprint 4 covered compliance, advanced features, social proof, and developer tools. All 13 features built with 10+ new database tables, 20+ API routes, admin tabs for Messages/Testimonials/Tax Info, settings for two-tier/fraud/surveys. Migration 010 created. |
| Feb 24, 2026 | Webhook architecture uses per-webhook plaintext secret, not hashed | For HMAC-SHA256 signing, webhooks need the raw secret to compute the signature. Secret stored as plaintext (not hashed). Affiliates see secret once on creation. |
| Feb 25, 2026 | Phase 5 complete — 9 features, all data layer (tables + APIs) | Migration 011 with 9 tables (user_profiles, invoices, invoice_items, payments, affiliate_payout_items, tickets, ticket_comments, activities, campaigns, contracts). 20+ API routes. Stripe webhook extended with syncInvoiceToLocal(). No dashboard UI — that's Phase 6. |
| Feb 25, 2026 | user_profiles coexists with affiliate_profiles | user_profiles is universal (all user types). affiliate_profiles remains for affiliate-specific data (payout method, bank details). No migration/merge needed — they serve different purposes. |
| Feb 25, 2026 | Payout items inserted during batch generation, not retroactively | Only new batches will have payout_items. Existing batches won't have items. This is fine — the feature is forward-looking. |
| Feb 25, 2026 | Stripe webhook sync is additive-only, wrapped in try/catch | syncInvoiceToLocal() runs AFTER existing commission logic and is wrapped in its own try/catch. If it fails, commissions still process normally. This ensures zero regression risk. |
| Feb 25, 2026 | Phase 6 is purely UI — no new database migrations | All 16 features wire existing Phase 5 tables/APIs into visible dashboard UI. Only 4 new API routes needed (revenue-attribution, earnings-statement, tax-summary, payout-receipt). |
| Feb 25, 2026 | Health scores calculated client-side from existing data | No new table/API needed. Score based on: days since last activity (30d green, 60d yellow, 60d+ red), conversion rate (>5% green, 1-5% yellow, <1% red), fraud score (>40 red). |
| Feb 25, 2026 | Billing page uses explicit error states with retry buttons | Code review caught silent fallback to Free tier on subscription load failure. Fixed: subscription, invoice list, and invoice detail all show clear error messages with "Try Again" buttons. |
| Feb 25, 2026 | User dashboard sidebar gets Account section (Billing, Support, Security) | Added "Account" nav group to social sidebar with links to /billing, /support, /security pages. |
| Feb 25, 2026 | Phase 7 scoped YouTube analytics only (GA/podcast deferred) | YouTube OAuth already exists in the platform. GA and podcast would require new OAuth flows and credentials. YouTube is highest value for affiliate content creators. |
| Feb 25, 2026 | AI Post Writer enhances existing auto-promo (3.6.31) | Replaced the old auto-promo card in Tools tab with a more comprehensive AI Post Writer. Same concept, better execution with structured output (post + hashtags + character count). |
| Feb 25, 2026 | Commission renewals extend commission window by 3 months | When affiliate does a customer check-in and admin approves the renewal, commission_end_date extends by 3 months. Simple and effective. |
| Feb 25, 2026 | Analytics charts use pure CSS/SVG (no charting library) | Keeps bundle small. Line charts, funnels, heatmaps, bar charts all rendered with SVG elements. Responsive and dark-mode compatible. |
| Feb 25, 2026 | Dashboard customization uses localStorage (not database) | MVP approach — no migration needed. Widget visibility and order stored in browser localStorage. Can upgrade to database storage later if needed. |
| Feb 25, 2026 | Weekly coach cron uses CRON_SECRET bearer token auth | Vercel cron jobs can set Authorization header. Route checks for matching CRON_SECRET env var. Prevents unauthorized access. |

---

## Open Questions

Questions to resolve during implementation.

| # | Question | Phase | Status |
|---|----------|-------|--------|
| 1 | Commission model: one-time per signup, recurring percentage, or tiered? | Phase 3 | Resolved — recurring percentage with tiered rates (Bronze 20%, Silver 25%, Gold 30%), locked in on activation |
| 2 | Who can be an affiliate: any user, application-based, or Premium only? | Phase 3 | Resolved — open application (anyone can apply), admin review required |
| 3 | Payout method: PayPal, bank transfer, or account credit? | Phase 3 | Resolved — manual payouts to start, Stripe Connect automation deferred |
| 4 | PWA vs Capacitor vs React Native for mobile? | Phase 4 | Leaning PWA first |
| 5 | Should the testimonial system allow user-submitted testimonials or admin-only entry? | Phase 1 | Undecided |
| 6 | What onboarding email sequence length? 3 emails? 5? 7? | Phase 1.5 | Undecided |

---

## Session Log

Running log of what was accomplished each session. Update at the end of every session.

| Date | Session Summary | Phase Progress |
|------|----------------|----------------|
| Feb 20, 2026 | Completed all 42 PassivePost features. Updated all documentation with visual diagrams, scalability sections, deployment guides, pricing tie-ins, access levels, and screenshot placeholders. Added version tracking to all 16 docs (8 PassivePost + 8 MuseKit). Created this roadmap. | Pre-Phase 1 |
| Feb 20, 2026 | Built Phase 1: Testimonial management (migration, API, admin CRUD page), public Wall of Love page with live stats, aggregate stats API endpoint, social proof notification popups on landing page. All 4 features complete. | Phase 1 Complete |
| Feb 21, 2026 | Post-deployment fixes: (1) Moved ShareLink component from accounts page to social overview dashboard so users see it on main page. (2) Added "How did you hear about us?" dropdown to HelpWidget (was only in FeedbackWidget). (3) Fixed Quick Generate FAB button overlapping with Support Widget — moved FAB to `bottom-20` above the support widget. (4) Added empty-state card for ShareLink when referral tables aren't migrated yet. All Phase 1.5 polish complete. | Phase 1.5 Polish |
| Feb 21, 2026 | Planned Phase 2 in detail: 4-batch platform rollout (Core Social → Easy Wins → Review-Required → Blog Platforms). Documented all 13 platform integrations, API key status, and infrastructure decisions. WordPress + Ghost will be self-hosted as cloneable VPS templates. Medium API closed — marked "coming soon". | Phase 2 Planning |
| Feb 21, 2026 | **Twitter/X OAuth fully connected on Vercel.** Fixed 4 issues: (1) URL encoding — switched to URLSearchParams for proper parameter encoding. (2) Encryption key — made encryptToken/decryptToken async, added auto-generation of SOCIAL_ENCRYPTION_KEY with DB storage. (3) Domain migration — changed OAuth URLs from twitter.com to x.com (documented cause of infinite redirect loops). (4) Missing Supabase table — ran `001_social_tables.sql` migration in Supabase to create `social_accounts` table. Also added: reliable origin detection via `getAppOrigin()` utility (NEXT_PUBLIC_APP_URL > VERCEL_URL > headers > fallback), dedicated `/oauth/error` page with contextual help, diagnostic logging in OAuth routes. Key lesson: Vercel env vars are separate from Replit — must set TWITTER_API_KEY, TWITTER_API_SECRET, SESSION_SECRET, NEXT_PUBLIC_APP_URL in Vercel dashboard. | Phase 2 Batch 1 — Twitter Connected |
| Feb 21, 2026 | **Built pre-flight check system** (`/api/social/preflight`) to verify all OAuth prerequisites before attempting connection — env vars, database tables, encryption key, origin consistency. Connect button now calls pre-flight first and shows actionable errors. Documented all required Vercel env vars, callback URLs, and database prerequisites in this roadmap. | Phase 2 — Infrastructure |
| Feb 21, 2026 | **LinkedIn connected.** Fixed `getAppOrigin()` to check both `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` (the actual env var in Vercel). Added `.trim()` to handle whitespace in env var values. Fixed LinkedIn URL encoding — replaced blanket `+` to `%20` replacement with proper `encodeURIComponent` per parameter. Fixed preflight double-`https://` bug by using resolved `origin` instead of re-processing raw env var. | Phase 2 Batch 1 — LinkedIn Connected |
| Feb 21, 2026 | **Facebook connected.** Reduced OAuth scopes to `email,public_profile` (the permissions currently approved in Meta Developer Portal). Page posting scopes (`pages_manage_posts`, `pages_read_engagement`, `pages_show_list`) to be added later when posting feature is needed. **Batch 1 complete — all 3 core social platforms (X, LinkedIn, Facebook) connected.** | Phase 2 Batch 1 — Complete |
| Feb 22, 2026 | **Token refresh + error hardening (2.1e) complete.** Built universal token refresh for all 3 platforms: X uses refresh_token (2hr expiry), LinkedIn uses refresh_token (60d), Facebook re-exchanges long-lived token. Added `with-token-refresh.ts` middleware for automatic retry on 401s. Validate All now attempts token refresh before marking accounts invalid. Added `token_expires_at` tracking on initial connect and refresh. Added `Reconnect` button in UI for expired tokens. Improved OAuth error page with friendly messages for denied, timeout, callback mismatch, credentials not configured. Established `TokenExpiredError` class to distinguish "needs reconnect" vs "temporary failure". **Lessons learned:** Facebook has no refresh_token — must re-exchange current access_token for new long-lived token before it expires. X tokens rotate on every refresh (new refresh_token issued). LinkedIn refresh_token availability depends on OAuth app configuration. | Phase 2.1e — Complete |
| Feb 22, 2026 | **Batch 2 complete — Instagram, Reddit, Discord all wired.** Instagram uses same FACEBOOK_APP_ID/SECRET via Instagram Graph API (`api.instagram.com` for OAuth, `graph.instagram.com` for API/refresh). 60-day long-lived tokens with `ig_refresh_token` refresh. Reddit uses Basic auth (base64 client_id:secret) for token exchange, permanent refresh tokens, 24h access tokens, requires User-Agent header. Discord uses standard OAuth2 with 7-day tokens and refresh_token support. All 3 have real `validateToken`/`getUserProfile` implementations, preflight checks, token refresh in `token-refresh.ts`, and are wired into dashboard UI. Total platforms connected: 6 (X, LinkedIn, Facebook, Instagram, Reddit, Discord). **Next:** Reddit + Discord need developer apps created and credentials added to Vercel env vars. Instagram needs `instagram_basic` scope enabled in Meta app. | Phase 2 Batch 2 — Complete |
| Feb 22, 2026 | **YouTube + Pinterest wired. TikTok/Snapchat deferred.** YouTube uses Google OAuth2 (`accounts.google.com` for auth, `oauth2.googleapis.com` for token exchange/refresh). Scopes: `youtube.readonly`, `youtube`, `userinfo.profile`. Uses `access_type=offline&prompt=consent` to get refresh_token. 1hr access tokens with refresh via standard Google OAuth refresh. Validates via YouTube Data API v3 `channels?part=snippet&mine=true`. Pinterest uses Pinterest OAuth2 (`pinterest.com/oauth` for auth, `api.pinterest.com/v5/oauth/token` for tokens). Uses Basic auth (base64 app_id:secret). 30-day access tokens, refresh_token for re-auth. Validates via `api.pinterest.com/v5/user_account`. Removed TikTok and Snapchat from platform list — deferred as video-first platforms with insufficient text surface for content flywheel. **Total platforms: 8 social (X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, Pinterest).** Next: Blog platforms (WordPress, Ghost, Medium). | Phase 2 Batch 3 — Complete |
| Feb 22, 2026 | **Blog platform integrations (Scenario 1) built.** Created `blog-clients.ts` with WordPress REST API client (validates via `/wp-json/wp/v2/users/me`, publishes/updates/deletes via `/wp-json/wp/v2/posts`, resolves tags, uploads featured images) and Ghost Admin API client (JWT token generation from `id:secret` key, validates via `/ghost/api/admin/site/`, publishes/updates/deletes via `/ghost/api/admin/posts/`). Added `/api/social/blog/connections/validate` endpoint for testing existing connections. Updated blog connections POST to auto-validate on connect (WordPress/Ghost). Enhanced dashboard blog page with "Test" button for connected platforms and improved connection dialog with credential format guidance. Added "Blog Platforms" card to social accounts page linking to blog dashboard. **Decision:** Blog strategy split into Scenario 1 (connect existing — built) and Scenario 2 (provision for users — deferred). Medium API closed — deferred. | Phase 2 Batch 4 — Complete |
| Feb 22, 2026 | **Phase 2 fully complete.** (1) In-app setup guides for all platforms: social platforms show pre-OAuth guide dialog with numbered steps, security reassurance, and time estimates; blog platforms have collapsible credential generation guides with navigation paths. (2) Engagement metrics infrastructure: summary API (`/api/social/engagement/summary`), manual pull trigger (`/api/social/engagement/pull`), dashboard upgraded with real metric cards and "Refresh Metrics" button. (3) Real posting flow wired: "Post Now" and "Publish" buttons on draft posts, blog publishing endpoint (`/api/social/blog/posts/publish`). (4) All demo data fallbacks removed from posts and engagement pages. (5) Display Name field restored in blog connection form. (6) Discord guide language corrected. **Phase 2 is complete — ready for Phase 3 (Affiliate Marketing).** | Phase 2 — Complete |
| Feb 22, 2026 | **Phase 3 fully complete — Affiliate Marketing System.** Built complete affiliate infrastructure: (1) Database migration with 6 new tables (affiliate_program_settings, affiliate_tiers, affiliate_referrals, affiliate_commissions, affiliate_payouts, affiliate_assets) plus referral_links upgrade. (2) Core library with grandfathering (lock-in rates on activation), fraud detection (email domain, IP volume, self-referral), performance tiers, and notification helpers. (3) Admin management page with settings, tier CRUD, marketing assets, affiliate rankings, and fraud alerts. (4) User affiliate dashboard with stats cards, tier progress, referral/earnings/payout history, marketing assets browser. (5) Cookie attribution (30-day pp_ref cookie, configurable duration). (6) Stripe webhook commission tracking on invoice.paid with deduplication. (7) Payout management (pending → approved → paid workflow). (8) 3-email onboarding drip sequence via Resend. (9) Real-time notifications for clicks, signups, conversions, and payouts. **Phase 3 complete — ready for Phase 4.** | Phase 3 — Complete |
| Feb 22, 2026 | **Phase 3.5 — Open Affiliate Program built.** Architecture decision: affiliates are 100% separate from product users (different login, dashboard, purpose). Built: (1) Public affiliate landing page at /affiliate with commission structure, benefits, "How It Works" steps, audience types, CTAs. (2) Application form at /affiliate/join with name, email, website, promotion method, message — duplicate detection (pending/approved). (3) `affiliate_applications` table + `affiliate_network_settings` table (migration 006). (4) Separate login at /affiliate/login with magic link + password modes. (5) Standalone dashboard at /affiliate/dashboard with own header, no product sidebar — full stats, earnings, payouts, referral link, marketing assets. (6) Admin applications tab with approve/reject workflow — approve auto-creates Supabase user with 'affiliate' role + referral link. (7) Admin networks tab for ShareASale, Impact, PartnerStack integration (tracking IDs, postback URLs, toggle active). (8) Cleaned up product sidebar — "Earn > Affiliate" now links to /affiliate landing page. Header/footer hidden on affiliate dashboard. Footer gets "Affiliate Program" link. | Phase 3.5 — Complete |
| Feb 22, 2026 | **Phase 3.6 Sprint 1 — Complete (5/5 features).** Built all 5 core affiliate enhancements: (1) **Discount Code System** — standalone admin page at `/admin/setup/discount-codes` with full CRUD, 6 discount types (percentage, fixed_amount, free_trial, bogo, tiered, bundle), affiliate linking for dual-attribution, usage limit tracking, public validation API. Attribution conflict policy (cookie_wins/code_wins/first_touch/split) added to affiliate settings. (2) **Milestone Bonuses** — admin CRUD on new Milestones tab in affiliate page, affiliate dashboard shows milestone progress card with per-milestone progress bars and achieved status. (3) **Real-Time Earnings Widget** — live earnings card on affiliate dashboard with Today/Week/Month toggle, aggregates from existing commissions table. (4) **Broadcast System** — Broadcasts tab on admin affiliate page with draft creation, audience segmentation (all/top_performers/dormant), send tracking (sent/opened/clicked counts). (5) **Program Health Dashboard** — new default Health tab on admin affiliate page with KPI cards (active/dormant affiliates, net ROI, conversion rate), revenue impact breakdown, engagement metrics, top performers ranking. Migration 007 with all Sprint 1 tables. All APIs handle missing tables gracefully (42P01 error code). | Phase 3.6 Sprint 1 — Complete |
| Feb 22, 2026 | **Phase 3.6 Sprint 2 — Complete (6/6 features).** Built all 6 affiliate tools & analytics features: (1) **Deep Link Generator** — affiliate dashboard tool to create referral links to specific pages (Home, Pricing, Features, Blog, custom) with copy button. (2) **UTM Parameter Support** — auto-append utm_source, utm_medium, utm_campaign, utm_content to deep links for Google Analytics tracking, with toggle on/off. (3) **Referral Sub-Tracking** — `?src=` parameter captured by ReferralTracker, stored on referral_clicks and affiliate_referrals tables, "Sources" tab on affiliate dashboard shows per-source-tag performance breakdown. (4) **Affiliate Leaderboard** — API with period/metric filters, privacy modes (initials/full name), admin toggle in settings, dashboard card with top 10 ranked affiliates + own position indicator. (5) **Conversion Funnel** — API aggregating clicks→signups→conversions→paid with drop-off rates, visual horizontal funnel bars on dashboard with color-coded conversion percentages, period selector. (6) **Earnings Forecast** — API projecting monthly earnings from 14-day rolling average with optimistic/pessimistic range, pace vs last month comparison, tier upgrade proximity alert. Migration 008 with landing_page/source_tag columns and leaderboard settings. | Phase 3.6 Sprint 2 — Complete |
| Feb 23, 2026 | **Phase 3.6 Sprint 3 — Audit Log System built.** Complete audit trail infrastructure: (1) **Audit Log Table** — migration `005_audit_log.sql` with `affiliate_audit_log` table (UUID PK, admin_user_id, admin_email, action, entity_type, entity_id, entity_name, details JSONB, created_at). Indexes on created_at, entity, admin. (2) **Audit Utility** — `src/lib/affiliate/audit.ts` with fire-and-forget `logAuditEvent()` function using Supabase admin client. (3) **All 10 CRUD routes instrumented** — tiers, assets, milestones, broadcasts, applications, application review, contests, settings, networks, payout-batches all log create/update/delete/approve/reject/send actions with entity details. (4) **Soft-delete for applications** — DELETE handler now sets `deleted_at`/`deleted_by` instead of hard delete, GET filters by `deleted_at IS NULL`, re-applications allowed after soft-delete. (5) **Audit Log Admin Tab** — 12th tab on affiliate admin page with entity type + action dropdown filters, refresh button, clickable timeline entries with detail modals showing action badge, entity info, admin, timestamp, and JSON details. (6) **API endpoint** — `/api/admin/affiliate/audit` with entity_type/action/limit/offset query params, handles missing table gracefully. | Phase 3.6 Sprint 3 — Audit System |
| Feb 23, 2026 | **Round 4 + Round 5 Bug Fixes — 11 persistent bugs resolved.** All fixes use column-resilient "try → catch → retry with fewer fields" pattern so they work regardless of which optional DB columns exist. Fixes: (1) **Networks** — tracking ID and postback URL now read-only in table, editable via DetailModal click only. (2) **Members status** — considers signups > 0 or approved application as "Active" instead of requiring lastSignIn. (3) **Members earnings** — shows em-dash instead of $0.00, pending line always visible when pending > $0. (4) **Broadcasts CRUD** — insert/update/send helpers retry without optional columns (sent_by, updated_at, sent_at, audience_filter). (5) **Application delete** — falls back from soft-delete to hard delete if deleted_at/deleted_by columns missing. (6) **Payout batches** — fully rewritten with column-resilient inserts, computing pending from both commissions and referral_links.pending_earnings_cents. (7) **Contest create** — auto-determines status (upcoming/active/completed) from dates, retries without status column. (8) **Audit logging** — logAuditEvent tries progressively simpler inserts. Audit logs page has Suspense wrapper, click-to-expand Dialog, URL category filter. (9) **Milestones** — always shows "X affiliates earned" count (green for >0, muted for 0). (10) **Contests** — Trophy icon with winner email on completed contests. (11) **Broadcast update** — retry covers all optional columns, not just updated_at. Self-testing completed: dev server clean, all APIs return proper auth responses, no 500s. Testing plan updated with Round 5 (35 tests across 10 sections). | Phase 3.6 — Bug Fixes Complete, Round 5 Testing Pending |
| Feb 24, 2026 | **CRM & Invoicing brainstorm session.** (1) Documented 217 features across all three dashboards in `docs/CRM_INVOICING_BRAINSTORM.md`. (2) Identified critical gap: no universal profiles, no local invoice/payment records, no support tickets, no contracts. (3) Designed three-layer dogfooding architecture (company uses product, affiliates use product to promote product, customers become affiliates). (4) Documented cross-Muse strategy (MuseKit built once, every Muse benefits). (5) Compared AFFILIATE_ENHANCEMENTS.md (32 features, implementation specs) with brainstorm doc (217 features, strategic vision) — kept both with cross-references. (6) Added Phases 5-7 to roadmap: data layer → dashboards → AI. (7) Deprioritized Phase 4 (Mobile PWA). (8) Recorded 3 pending affiliate onboarding bugs (BF1-BF3). (9) Updated replit.md with document map and session protocol. | Phases 5-7 Added, Documentation Overhaul |
| Feb 24, 2026 | **Bug fixes (BF1-BF3) + Three-Environment Sync Protocol.** (1) Fixed BF1: Members API fetches `name` from `affiliate_applications` as fallback for existing users without `user_metadata` name. (2) Fixed BF2: Approval magic link now uses `token_hash` approach — auth callback (`/auth/callback`) handles both PKCE code exchange AND `token_hash`+`type` via `verifyOtp()`. No more PKCE code_verifier dependency for server-generated magic links. (3) Fixed BF3: Confirmed conditional email logic was already correct in code; BF2 fix makes it functional. (4) Codified Three-Environment Sync Protocol in `replit.md` — Replit (editor + local Postgres) vs GitHub (version control) vs Vercel+Supabase (production). Mandatory Pre-Push Sync Checklist: schema alignment, compile check, API smoke test, migration inventory, env var list, git status. This protocol addresses the root cause of most wasted debugging hours. | BF1-BF3 Fixed, Sync Protocol Added |
| Feb 24, 2026 | **Phase 3.6 Sprint 3 — Complete (8/8 features).** Code audit revealed 7/8 features already built during Sprints 1-2. Only Resource Center (3.6.16) needed enhancement: (1) Added 4 new asset types to admin (faq, video_tutorial, best_practice, guide) — total now 13 types. (2) Added `ASSET_TYPE_LABELS` and `ASSET_TYPE_ICONS` mappings for all types. (3) Added category filter dropdown with per-type counts on affiliate dashboard. (4) Added text search filtering by title/description. (5) Renamed tab from "Marketing" to "Resources" with Bookmark icon. (6) Added "Clear Filters" button when no results match. (7) Updated video_tutorial label in admin file URL field. (8) Updated Sprint 2 ROADMAP entries from "Not Started" → "Complete" with detailed notes. (9) Updated Sprint 3 ROADMAP entries with comprehensive implementation notes. Dev server compiles clean, no errors. | Phase 3.6 Sprint 3 Complete |
| Feb 25, 2026 | **Phase 6 — COMPLETE (16/16 features, 3 dashboard types).** Built all 16 dashboard UI features wiring Phase 5 data layer into visible UI. **Admin Dashboard (5 features):** (1) CRM card — click affiliate name → full profile drawer with earnings, payouts, tickets, activities, notes. (2) Revenue attribution — new `/api/admin/revenue-attribution` API, stats cards + bar chart in Health tab showing affiliate vs direct revenue split. (3) Bulk payouts — "Process All" → summary dialog → approve + auto-send receipt emails via Resend (`/api/admin/affiliate/payout-receipt`). (4) Health scores — green/yellow/red dot badges on each member calculated from activity recency, conversion rate, fraud score. (5) Quick notes — notes section in CRM card using activities API. **Affiliate Dashboard (6 features):** (6) Earnings statements — "Download Statement" with period selector, HTML-to-PDF via `/api/affiliate/earnings-statement`. (7) Portfolio view — list/portfolio toggle on Referrals tab showing referrals as investments with LTV. (8) Commission lifecycle — expandable rows with 7-step horizontal stepper (Click→Signup→Trial→Paid→Created→Approved→Paid Out). (9) Contract view — "My Terms" in Account tab with sign button, version history. (10) Tax summary — annual 1099-ready report via `/api/affiliate/tax-summary`. (11) Campaign creator — campaigns section in Tools tab with UTM auto-generation. **User Dashboard (5 features):** (12) Invoice history — `/billing` page with list, status filter, pagination, detail dialog, PDF download. (13) Subscription management — plan card with tier icon, status, billing cycle, Stripe portal link. (14) Support tickets — `/support` page with ticket list, new ticket form, comments thread. (15) Account security — `/security` page with password change, sessions, 2FA placeholder. (16) Affiliate invite — "Earn 30%" card on billing page linking to /affiliate/join. Code review: fixed billing page error handling (subscription/invoice/detail errors with retry buttons instead of silent fallback). Added "Account" nav group (Billing, Support, Security) to user sidebar. 4 new API routes total. No new migrations needed. | Phase 6 Complete |
| Feb 25, 2026 | **Phase 7 — COMPLETE (7/7 features, 6 new + 1 pre-built).** Built all 6 remaining Phase 7 features. **AI Features (2):** (1) AI Social Post Writer — `/api/affiliate/ai-post-writer` with 7 platforms, 5 tones, auto-embeds ref link. Replaced old auto-promo card in Tools tab. (2) AI Weekly Coach — `/api/affiliate/ai-coach` (on-demand) + `/api/cron/weekly-coach` (cron-compatible). AI Coach card on Overview with prioritized tips. **Commission Renewals (1):** (3) Full renewal system — migration 012, `commission_renewals` table + `commission_end_date`/`health_status` on `affiliate_referrals`. APIs: `/api/affiliate/renewals` (GET/POST), `/api/admin/renewals` (GET/PATCH). Renewals section on affiliate Referrals tab + admin Renewals tab. **Connected Analytics (1):** (4) YouTube analytics — `/api/affiliate/analytics/youtube`. Content Analytics card on Overview with video stats + referral attribution. Graceful fallback when not connected. **Analytics Suite (1):** (5) Earnings charts — `/api/affiliate/analytics/charts`. New Analytics tab with SVG line chart, conversion funnel, GitHub-style heatmap, percentile benchmarks, top sources bar chart. Period selector (7D/30D/90D/1Y). Pure CSS/SVG. **Dashboard Customization (1):** (6) Widget system — show/hide toggles, drag-and-drop reordering via HTML5 drag API, localStorage persistence. "Customize Dashboard" mode with reset. **ALL BUILD PHASES COMPLETE.** Next: deep testing sweep + launch prep. | Phase 7 Complete — ALL PHASES DONE |
| Feb 25, 2026 | **Phase 5 — COMPLETE (9/9 features, 2 sprints).** Built entire CRM & Invoicing Foundation data layer in one session: (1) **Migration 011** — 10 new tables: user_profiles, invoices, invoice_items, payments, affiliate_payout_items, tickets, ticket_comments, activities, campaigns, contracts. (2) **User Profiles API (5.1.1)** — GET/POST `/api/user/profile` for users, admin GET/PATCH `/api/admin/users/[id]/profile`. (3) **Invoice Sync (5.1.2 + 5.1.5)** — `syncInvoiceToLocal()` added to Stripe webhook (additive-only, try/catch wrapped). Upserts invoices, inserts line items, creates payments. Also handles `invoice.payment_failed`. User GET `/api/user/invoices` + `[id]`, admin GET `/api/admin/invoices` + `[id]`. (4) **Payments API (5.1.3)** — User GET `/api/user/payments`. (5) **Payout Items (5.1.4)** — Junction table created, batch generation inserts items, GET `/api/affiliate/payouts/[id]/items` + admin version. (6) **Tickets (5.2.1)** — Full CRUD: user GET/POST, GET/PATCH `[id]`, comments GET/POST. Admin GET with filters. Status flow + internal comments. (7) **Activities (5.2.2)** — CRUD for 6 activity types, admin view across users. (8) **Campaigns (5.2.3)** — Full CRUD with UTM tracking + performance counters. (9) **Contracts (5.2.4)** — CRUD with signing flow (user sign → admin countersign) + version history via parent_contract_id. All 20+ API routes return 401/403 (not 500) without auth. Zero compile errors. | Phase 5 Complete |
| Feb 24, 2026 | **Phase 3.6 Sprint 4 — Complete (13/13 features). PHASE 3.6 FULLY DONE (32/32).** Built all 13 Sprint 4 features in one session using parallel subagents: (1) **Anti-Spam/Compliance (3.6.20)** — `agreed_to_terms` checkbox on join form, admin suspend/unsuspend with reason. (2) **Fraud Scoring (3.6.21)** — `src/lib/affiliate/fraud.ts` with 6 scoring signals, auto-pause at configurable threshold, admin recalculate button. (3) **Tax Compliance (3.6.22)** — `affiliate_tax_info` table, W-9/W-8BEN forms in Account tab, admin Tax Info tab with verify, payouts blocked without tax info. (4) **Co-Branded Pages (3.6.23)** — `affiliate_landing_pages` table, editor in Tools tab, public `/partner/[slug]` route with ref code, view counter. (5) **Two-Tier Referrals (3.6.24)** — `recruited_by_affiliate_id` tracking, second-tier commissions in Stripe webhook, admin toggle + rate setting. (6) **API Access (3.6.25)** — `affiliate_api_keys` table, SHA-256 hashed keys, 100 req/hr rate limiting, 4 v1 endpoints (stats/referrals/commissions/earnings). (7) **Messaging (3.6.26)** — `affiliate_messages` table, chat UI on both dashboards, unread badges, mark-as-read. (8) **Surveys (3.6.27)** — `affiliate_surveys` table, 1-5 stars + feedback, configurable interval, auto-testimonial on opt-in. (9) **Testimonials (3.6.28)** — `affiliate_testimonials` table, admin CRUD tab, public display on `/affiliate` page. (10) **Badges (3.6.29)** — `affiliate_badges`/`affiliate_badge_tiers` tables, auto-award at $500/$2500/$10000, public `/partner/verify/[code]` page, embed code copy. (11) **Webhooks (3.6.30)** — `affiliate_webhooks`/`_deliveries` tables, HMAC-SHA256 signing, 3 retries, 6 event types, test button, delivery log. (12) **Auto-Promo (3.6.31)** — AI-powered promo post generator (7 platforms, 5 tones) with ref link embedding. (13) **PartnerStack Docs (3.6.32)** — External Networks Playbook added to AFFILIATE.md. Migration 010 created. Admin page gained Messages, Testimonials, Tax Info tabs + two-tier/fraud/survey settings. All 16+ new API endpoints tested with zero 500s. | Phase 3.6 Sprint 4 Complete — PHASE 3.6 DONE |

| Feb 25, 2026 | **81-Feature Build — Sprints 4-8 Complete.** Built remaining 30+ features across Partner Experience, Marketing Toolkit, Analytics Expansion, and Connected Analytics. **New API Routes (13):** goals, fastest-recognition, anniversary, whats-new, disputes, media-kit, link-shortener, sharing-cards, email-templates, analytics/expanded, connected-analytics, admin/announcements, admin/spotlight. **New Cron:** weekly-performance email. **New Components (3 files):** `partner-experience.tsx` (EarningsGoalSetter, CommissionDisputes, ReferralOfMonth, GracePeriodNotice, AffiliateManagerCard), `marketing-toolkit.tsx` (LinkShortener, QRCodeGenerator, MediaKitPage, CopyPasteCaptions, StarterKit), `analytics-expanded.tsx` (ClickHeatmap, ConversionByChannel, MoMScorecard, PersonalBestCard, EfficiencyMetrics, DualAxisChart, CampaignComparison, ExpandedAnalyticsSection). **Migration 013** — 8 new tables: affiliate_goals, commission_disputes, affiliate_short_links, announcements, affiliate_spotlight, affiliate_asset_usage, email_preferences, connected_platforms, connected_platform_metrics. All components wired into affiliate dashboard (Overview, Tools, Analytics sections). All 13 routes smoke-tested: zero 500s. Clean compile. | Sprints 4-8 Complete — ALL 81 BUILD-NOW FEATURES DONE |

---

## File References

Key files for each phase, so agents can find relevant code quickly.

### Phase 1
- Testimonials: New migration in `migrations/core/`, admin page in `src/app/admin/`, public page at new route
- Live counters: `src/components/landing/` (animated counters component), new API endpoint for aggregate stats
- Social proof popups: New component in `src/components/landing/`

### Phase 1.5
- Watermark: `src/app/api/social/` (post publishing logic), admin settings page
- Changelog: New public route, markdown files
- Email drips: Resend integration at `src/app/api/`, email templates
- Share links: New migration for referral codes, dashboard component
- Onboarding funnel: `src/app/dashboard/social/onboarding/` (existing wizard), new tracking logic
- Feedback widget: Existing feedback component (add dropdown)

### Phase 2
- OAuth flows: `src/lib/social/` (existing crypto, token refresh)
- Platform APIs: `src/app/api/social/` (existing routes with demo data paths)
- Engagement pulling: `src/app/api/social/cron/` (existing cron endpoints)

### Phase 3
- Migration: `migrations/core/005_affiliate_system.sql` (6 tables + referral_links upgrade)
- Core library: `src/lib/affiliate/index.ts` (grandfathering, fraud detection, notifications, tier logic)
- Admin page: `src/app/admin/setup/affiliate/page.tsx` (settings, tiers, assets, management, applications, networks)
- Product user dashboard: `src/app/dashboard/social/affiliate/page.tsx` (stats, tiers, earnings, payouts, assets — for existing product-user affiliates)
- API routes: `src/app/api/affiliate/` (settings, tiers, assets, payouts, referrals, dashboard, activate, track-signup, drip, applications, applications/review, networks)
- Stripe webhook: `src/app/api/stripe/webhook/route.ts` (invoice.paid handler with commission creation)
- Cookie tracking: `src/components/referral-tracker.tsx` (pp_ref cookie on ?ref= visits)
- Signup integration: `src/app/(auth)/signup/page.tsx` (reads pp_ref cookie, calls track-signup)

### Phase 3.5 (Open Affiliate Program)
- Migration: `migrations/core/006_affiliate_applications.sql` (affiliate_applications, affiliate_network_settings, referral_links affiliate_role)
- Public landing page: `src/app/affiliate/page.tsx`
- Application form: `src/app/affiliate/join/page.tsx`
- Affiliate login: `src/app/affiliate/login/page.tsx` (magic link + password, independent from product login)
- Standalone dashboard: `src/app/affiliate/dashboard/page.tsx` (own header, no product sidebar)
- Application API: `src/app/api/affiliate/applications/route.ts` (POST for public, GET for admin)
- Review API: `src/app/api/affiliate/applications/review/route.ts` (approve/reject with auto-provisioning)
- Networks API: `src/app/api/affiliate/networks/route.ts` (GET, PUT for admin)
- Footer link: `src/components/layout/footer.tsx` (Affiliate Program in Company section)
- Sidebar cleanup: `src/components/social/social-sidebar.tsx` (Earn > Affiliate links to /affiliate)

### Phase 3.6 (Affiliate Enhancements & Discount Codes — 32 features)
- Feature plan: `docs/musekit/AFFILIATE_ENHANCEMENTS.md` (full specs, schemas, implementation notes for all 32 features)
- Sprint 1 migration: `migrations/core/007_affiliate_enhancements_p1.sql` (discount_codes, discount_code_redemptions, affiliate_milestones, affiliate_milestone_awards, affiliate_broadcasts, affiliate_broadcast_receipts, attribution_conflict_policy column)
- Discount codes admin: `src/app/admin/setup/discount-codes/page.tsx` (full CRUD, 6 discount types, affiliate linking, usage tracking)
- Discount codes API: `src/app/api/admin/discount-codes/route.ts` (admin CRUD), `src/app/api/discount-codes/validate/route.ts` (public validation)
- Milestones API: `src/app/api/affiliate/milestones/route.ts` (admin CRUD via ?admin=true, affiliate progress via GET)
- Earnings API: `src/app/api/affiliate/earnings/route.ts` (aggregated by today/week/month/allTime)
- Broadcasts API: `src/app/api/admin/affiliate/broadcasts/route.ts` (admin CRUD + send)
- Program Health API: `src/app/api/admin/affiliate/health/route.ts` (ROI, engagement, growth, alerts, top performers)
- Admin affiliate page: `src/app/admin/setup/affiliate/page.tsx` (new Health/Milestones/Broadcasts tabs, attribution policy in settings)
- Affiliate dashboard: `src/app/affiliate/dashboard/page.tsx` (live earnings widget, milestone progress card)
- Sprint 2 migration: `migrations/core/008_affiliate_enhancements_p2.sql` (landing_page, source_tag columns, leaderboard settings)
- Leaderboard API: `src/app/api/affiliate/leaderboard/route.ts` (ranked affiliates with period/metric filters, privacy modes)
- Conversion Funnel API: `src/app/api/affiliate/funnel/route.ts` (click→signup→conversion→paid with rates)
- Earnings Forecast API: `src/app/api/affiliate/forecast/route.ts` (14-day rolling projection with range and tier alerts)
- ReferralTracker: `src/components/referral-tracker.tsx` (captures ?src= param alongside ?ref=)
- Referral click API: `src/app/api/referral/route.ts` (stores landing_page, source_tag on clicks)
- Track-signup API: `src/app/api/affiliate/track-signup/route.ts` (stores source_tag on referrals)
- Affiliate dashboard: `src/app/affiliate/dashboard/page.tsx` (deep link generator, UTM support, leaderboard, funnel, forecast, source breakdown)
- Audit log migration: `migrations/extensions/005_audit_log.sql` (affiliate_audit_log table + soft-delete columns on applications)
- Audit utility: `src/lib/affiliate/audit.ts` (fire-and-forget logAuditEvent function)
- Audit API: `src/app/api/admin/affiliate/audit/route.ts` (GET with entity_type/action/limit/offset filters)
- Reusable admin components: `src/components/admin/DetailModal.tsx`, `HelpTooltip.tsx`, `SortableHeader.tsx`
- Sprint 3 migration: `migrations/core/009_affiliate_enhancements_p3.sql` (tier perks, min_payout, contests, payout batches, dormancy settings)
- Sprint 4 migration: `migrations/core/010_affiliate_sprint4.sql` (10+ new tables: tax_info, landing_pages, second_tier_commissions, api_keys, messages, surveys, testimonials, badges, badge_tiers, webhooks, webhook_deliveries + compliance/fraud/two-tier columns)
- Fraud scoring: `src/lib/affiliate/fraud.ts` (6 scoring signals, auto-pause, admin notification)
- Badge system: `src/lib/affiliate/badges.ts` (auto-award, public verification)
- Webhook system: `src/lib/affiliate/webhooks.ts` (HMAC-SHA256 signing, retry logic, delivery logging)
- API key auth: `src/lib/affiliate/api-auth.ts` (SHA-256 hashing, rate limiting, key validation)
- Sprint 4 API routes: tax-info/, landing-page/, api-keys/, messages/, messages/read/, surveys/, badges/, badges/verify/[code]/, testimonials/, webhooks/, webhooks/[id]/, webhooks/[id]/test/, webhooks/[id]/deliveries/, auto-promo/, v1/stats/, v1/referrals/, v1/commissions/, v1/earnings/
- Admin Sprint 4 routes: admin/affiliate/tax-info/, admin/affiliate/tax-info/[id]/verify/, admin/affiliate/messages/, admin/affiliate/messages/[affiliate_id]/, admin/affiliate/testimonials/
- Public routes: `/partner/[slug]/page.tsx` (co-branded landing pages), `/partner/verify/[code]/page.tsx` (badge verification)
- Admin page: Added Messages, Testimonials, Tax Info tabs + settings for two-tier, fraud detection, surveys
- Affiliate dashboard: Added Messages tab, tax info + badges + surveys + API keys in Account tab, landing page editor + auto-promo + webhooks in Tools tab, second-tier earnings in Earnings tab
- PartnerStack docs: `docs/musekit/AFFILIATE.md` (External Networks Playbook section)
- Column-resilient pattern: All affiliate API routes use a "try full insert → catch column error (42703) → retry with minimal required fields" pattern. This ensures APIs work regardless of which optional columns exist in Supabase.

### Phase 4
- PWA: `public/manifest.json`, service worker, `next.config.js` PWA config
- Push notifications: Service worker registration, notification API

### Phase 5 (CRM & Invoicing Foundation)
- Migration: `migrations/core/011_crm_foundation.sql` (10 tables: user_profiles, invoices, invoice_items, payments, affiliate_payout_items, tickets, ticket_comments, activities, campaigns, contracts)
- User Profile API: `src/app/api/user/profile/route.ts` (GET/POST)
- Admin Profile API: `src/app/api/admin/users/[userId]/profile/route.ts` (GET/PATCH)
- Invoice APIs: `src/app/api/user/invoices/route.ts`, `src/app/api/user/invoices/[id]/route.ts`, `src/app/api/admin/invoices/route.ts`, `src/app/api/admin/invoices/[id]/route.ts`
- Payments API: `src/app/api/user/payments/route.ts`
- Payout Items APIs: `src/app/api/affiliate/payouts/[id]/items/route.ts`, `src/app/api/admin/payouts/[id]/items/route.ts`
- Stripe webhook sync: `src/app/api/stripe/webhook/route.ts` (added `syncInvoiceToLocal()` + `invoice.payment_failed` handler)
- Tickets APIs: `src/app/api/tickets/route.ts`, `src/app/api/tickets/[id]/route.ts`, `src/app/api/tickets/[id]/comments/route.ts`, `src/app/api/admin/tickets/route.ts`
- Activities APIs: `src/app/api/activities/route.ts`, `src/app/api/activities/[id]/route.ts`, `src/app/api/admin/activities/route.ts`
- Campaigns APIs: `src/app/api/campaigns/route.ts`, `src/app/api/campaigns/[id]/route.ts`, `src/app/api/admin/campaigns/route.ts`
- Contracts APIs: `src/app/api/contracts/route.ts`, `src/app/api/contracts/[id]/route.ts`, `src/app/api/admin/contracts/route.ts`

### Phase 6 (Dashboard Enhancements)
- Admin CRM card + health scores + bulk payouts + revenue attribution + quick notes: Extended `src/app/admin/setup/affiliate/page.tsx`
- Revenue attribution API: `src/app/api/admin/revenue-attribution/route.ts`
- Payout receipt email API: `src/app/api/admin/affiliate/payout-receipt/route.ts`
- Affiliate earnings statement API: `src/app/api/affiliate/earnings-statement/route.ts`
- Affiliate tax summary API: `src/app/api/affiliate/tax-summary/route.ts`
- Affiliate portfolio view + commission lifecycle + contract view + campaigns: Extended `src/app/affiliate/dashboard/page.tsx`
- User billing page (invoices + subscription): `src/app/(dashboard)/billing/page.tsx`
- User support tickets: `src/app/(dashboard)/support/page.tsx`
- User account security: `src/app/(dashboard)/security/page.tsx`
- User sidebar updated: `src/components/social/social-sidebar.tsx` (added Account group with Billing, Support, Security)

### Phase 7 (AI & Cross-Dashboard)
- AI Post Writer: `src/app/api/affiliate/ai-post-writer/route.ts` (uses `src/lib/ai/provider.ts`)
- AI Weekly Coach: `src/app/api/affiliate/ai-coach/route.ts` (on-demand), `src/app/api/cron/weekly-coach/route.ts` (cron)
- Commission Renewals: `migrations/core/012_commission_renewals.sql`, `src/app/api/affiliate/renewals/route.ts`, `src/app/api/admin/renewals/route.ts`
- YouTube Analytics: `src/app/api/affiliate/analytics/youtube/route.ts`
- Earnings Charts: `src/app/api/affiliate/analytics/charts/route.ts`
- Dashboard Customization: Widget system in `src/app/affiliate/dashboard/page.tsx` (localStorage-based)
- Admin Renewals Tab: Added to `src/app/admin/setup/affiliate/page.tsx`
- Affiliate Analytics Tab: Added to `src/app/affiliate/dashboard/page.tsx`

### 81-Feature Build (Sprints 4-8)
- Migration: `migrations/core/013_delight_features.sql` (8 tables: affiliate_goals, commission_disputes, affiliate_short_links, announcements, affiliate_spotlight, affiliate_asset_usage, email_preferences, connected_platforms, connected_platform_metrics)
- Partner Experience APIs: `src/app/api/affiliate/goals/route.ts`, `fastest-recognition/route.ts`, `anniversary/route.ts`, `whats-new/route.ts`, `disputes/route.ts`
- Marketing Toolkit APIs: `src/app/api/affiliate/media-kit/route.ts`, `link-shortener/route.ts`, `sharing-cards/route.ts`, `email-templates/route.ts`
- Analytics APIs: `src/app/api/affiliate/analytics/expanded/route.ts`, `connected-analytics/route.ts`
- Admin APIs: `src/app/api/admin/announcements/route.ts`, `src/app/api/admin/spotlight/route.ts`
- Cron: `src/app/api/cron/weekly-performance/route.ts`
- Components: `src/components/affiliate/partner-experience.tsx`, `marketing-toolkit.tsx`, `analytics-expanded.tsx`
- Dashboard wiring: All components imported and rendered in `src/app/affiliate/dashboard/page.tsx` (Overview, Tools, Analytics sections)

### Phase 8 (Flywheel Accelerators — Session A)
- Migration: `migrations/core/014_analytics_columns.sql` (adds country, device_type, referral_link_user_id to referral_clicks; churned_at, churn_reason, last_active_at to affiliate_referrals)
- Churn Intelligence API: `src/app/api/affiliate/analytics/churn/route.ts` — churn rate, reasons, timing, at-risk alerts, net growth (#168-172)
- Cohort & Trends API: `src/app/api/affiliate/analytics/cohort/route.ts` — retention curve, conversion trends, trial benchmarks (#156, #160, #162)
- Revenue & Traffic API: `src/app/api/affiliate/analytics/sources/route.ts` — revenue pie, cumulative earnings, dropoff funnel, geo, devices, repeat visitors (#154, #158, #161, #164-166)
- AI Analytics Intelligence API: `src/app/api/affiliate/ai-analytics/route.ts` — 6 AI insight types: conversion drop, content recs, channel optimization, audience fit, seasonal trends, competitor tips (#177-182)
- AI Posting Strategy API: `src/app/api/affiliate/ai-posting-strategy/route.ts` — best time to post, promotional calendar (#90, #93)
- AI Conversion Insights API: `src/app/api/affiliate/ai-conversion-insights/route.ts` — unconverted trial analysis, revenue attribution, platform correlation (#92, #196-198)
- Components: `src/components/affiliate/flywheel-analytics.tsx` — ChurnRateCard, ChurnReasonsChart, ChurnTimingChart, AtRiskAlerts, NetGrowthCard, RetentionCurve, ConversionTrendLine, TrialBenchmarks, RevenuePieChart, CumulativeEarningsChart, DropoffAnalysis, GeoBreakdown, DeviceBreakdown, RepeatVisitors, AIInsightsPanel, BestTimeToPost, FlywheelAnalyticsSection
- Dashboard wiring: FlywheelAnalyticsSection imported and rendered in Analytics tab of `src/app/affiliate/dashboard/page.tsx`
- Seed data: Expanded `scripts/seed-affiliate-data.ts` with 12-month historical clicks (geo/device), churned referrals, trial referrals, 12-month commission history, 90-day connected platform metrics, goals, disputes, announcements, spotlight, short links, email preferences, asset usage

**Remaining Sessions (B-F):**
| Session | Tier | Features | Focus |
|---------|------|----------|-------|
| B | Flywheel cont. | ~8 | Connected data insights, auto promo calendar, best-time-to-post polish |
| C | Retention Deepeners | ~15 | Financial tools, tax center, reports, commission renewal polish |
| D | Retention Deepeners cont. | ~10 | Resource center, knowledge base, swipe files, content calendar |
| E | Delight Multipliers | ~12 | Challenges, directory, case studies, quiz, analyze-audience |
| F | Polish & External | ~8 | Mobile responsive, sparklines, export charts, OAuth integrations |

---

## Session Log

### Session 8 — February 25, 2026 (Flywheel Accelerators)
**Features built:** 20 features (#90, #92, #93, #154, #156, #158, #160, #161, #162, #164, #165, #166, #168, #169, #170, #171, #172, #177-182, #196-198)
**New files:** 7 (6 API routes + 1 component file)
**New migration:** 014_analytics_columns.sql (NOT YET RUN on Supabase)
**Seed data:** Massively expanded with historical time-series data across all feature areas
**Status:** All routes return 200/401 (no 500s), dev server compiles clean

---

*This document is the project's persistent memory. Update it every session.*
