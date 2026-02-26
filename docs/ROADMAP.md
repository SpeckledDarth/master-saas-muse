# PassivePost — Project History & Status

> **Last Updated:** February 25, 2026

---

## Current Status

PassivePost is a social media content automation platform built on the MuseKit SaaS framework. It allows users to connect social media and blog accounts, schedule and publish posts across platforms, and grow their audience through an integrated affiliate marketing system.

**What's built:**

- Full social media management across 8 platforms (Twitter/X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, Pinterest)
- Blog publishing to WordPress and Ghost
- AI-powered content generation (post writer, weekly coaching, analytics insights)
- Complete affiliate marketing system with 80+ features (commissions, tiers, leaderboards, badges, webhooks, API access, co-branded pages, fraud detection, tax compliance)
- Admin dashboard with CRM, revenue analytics, program health monitoring, and user management
- User dashboard with billing, invoicing, support tickets, and account security
- Affiliate dashboard with earnings tracking, marketing tools, analytics, and self-service features
- 14 database migrations deployed to Supabase
- SEO meta tags on all public pages, mobile-responsive dashboards, accessibility improvements

**What's live:** The application is deployed on Vercel with Supabase as the production database. All OAuth integrations are wired and functional. The product uses real platform APIs (demo data fallbacks have been removed).

**Launch target:** April 1, 2026

---

## Phase Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Testimonial & social proof infrastructure | Complete |
| 1.5 | Launch kit (watermark, changelog, email drips, referral links, onboarding funnel) | Complete |
| 2 | Real platform API integrations (8 social + 2 blog) | Complete |
| 3 | Affiliate marketing system (core) | Complete |
| 3.5 | Open affiliate program (public signup, separate login/dashboard) | Complete |
| 3.6 | Affiliate enhancements & discount codes (32 features across 4 sprints) | Complete |
| 4 | Mobile app (PWA) | Deprioritized |
| 5 | CRM & invoicing foundation (10 tables, 20+ API routes) | Complete |
| 6 | Dashboard enhancements (16 features across admin/affiliate/user) | Complete |
| 7 | AI & cross-dashboard features (post writer, coach, renewals, analytics) | Complete |
| 8 | Flywheel Accelerators Session A (churn intelligence, cohort analysis, AI analytics) | Complete |
| 8.5 | Flywheel Accelerators Session B (connected analytics, predictions, reports) | Complete |
| Sessions C-F | Retention tools, resource center, delight features, polish | Complete |

---

## How PassivePost Was Built

### Phase 1 — Social Proof Infrastructure

Built the credibility layer needed for launch day: a testimonial management system with admin CRUD, a public "Wall of Love" page displaying featured testimonials and aggregate stats, live animated usage counters wired to real database data, and social proof notification popups on the landing page. These features ensure that when real users arrive, the product feels established and trustworthy.

### Phase 1.5 — Launch Kit

Added viral mechanics and onboarding polish: configurable watermarks on published posts, a public changelog page, a 4-step welcome email drip sequence via Resend, shareable referral links with click tracking, onboarding completion funnel tracking with admin metrics, and a "How did you hear about us?" attribution dropdown in the feedback widget.

### Phase 2 — Platform Integrations

Connected all target social platforms via OAuth 2.0 in four batches. Batch 1 (Twitter/X, LinkedIn, Facebook) established the core OAuth patterns including token refresh, error handling, and a pre-flight check system. Batch 2 added Instagram, Reddit, and Discord. Batch 3 brought YouTube and Pinterest (TikTok and Snapchat were deferred as video-first platforms). Batch 4 integrated WordPress and Ghost blog publishing via API credentials. Real engagement metric pulling was implemented with cron-based updates. A universal token refresh middleware handles automatic retry on expired tokens across all platforms.

### Phase 3 — Affiliate Marketing System

Built a complete referral and affiliate infrastructure: cookie-based attribution (30-day window), Stripe webhook commission tracking on invoice payments, configurable commission rates with grandfathering (terms locked at activation), performance tiers (Bronze/Silver/Gold), a marketing assets library, fraud detection (email domain, IP volume, self-referral checks), payout management with approval workflows, real-time notifications, and a 3-email onboarding drip sequence.

### Phase 3.5 — Open Affiliate Program

Opened the affiliate program to non-users (bloggers, YouTubers, influencers) with a completely separate experience: public landing page, application form, independent login (magic link + password), and standalone dashboard. Admin application review auto-provisions Supabase users with affiliate roles. Network integration infrastructure was added for ShareASale, Impact, and PartnerStack.

### Phase 3.6 — Affiliate Enhancements (32 Features)

Elevated the affiliate system to world-class across four sprints. Sprint 1 added discount codes with dual-attribution, milestone bonuses, real-time earnings widgets, admin broadcast/newsletter system, and a program health dashboard. Sprint 2 added deep link generation, UTM parameters, referral sub-tracking, leaderboards, conversion funnels, and earnings forecasting. Sprint 3 built a complete audit log system with soft-delete and 10 instrumented CRUD routes. Sprint 4 delivered anti-spam compliance, fraud scoring, tax compliance (W-9/W-8BEN), co-branded landing pages, two-tier referrals, API access with rate limiting, messaging, surveys, testimonials, badges with public verification, webhooks with HMAC signing, and AI-powered auto-promo generation.

### Phase 5 — CRM & Invoicing Foundation

Built the data layer for customer relationship management: 10 new database tables (user profiles, invoices, invoice items, payments, payout items, tickets, ticket comments, activities, campaigns, contracts). Stripe webhook sync automatically upserts invoices and payments. Support ticket system includes status flows and internal comments. Contract system supports signing workflows with version history.

### Phase 6 — Dashboard Enhancements

Wired the Phase 5 data layer into visible UI across all three dashboard types. Admin gained CRM profile drawers, revenue attribution charts, bulk payout processing with receipt emails, and health score badges. Affiliates got downloadable earnings statements, portfolio views, commission lifecycle steppers, contract management, tax summaries, and campaign creators. Users received invoice history with PDF downloads, subscription management, support ticket interfaces, and account security pages.

### Phase 7 — AI & Cross-Dashboard Features

Added AI-powered capabilities: a social post writer supporting 7 platforms and 5 tones, an AI weekly coach with prioritized tips, commission renewal tracking, YouTube analytics with referral attribution, an earnings analytics suite with SVG charts and heatmaps, and a widget-based dashboard customization system with drag-and-drop reordering.

### Phase 8 & 8.5 — Flywheel Accelerators

Session A (20 features) delivered churn intelligence, cohort analysis, revenue and traffic breakdowns, geo/device analytics, and AI-powered analytics insights. Session B (18 features) added connected cross-platform analytics, content intelligence, custom date range reports, financial overview with ROI calculations, predictive intelligence, admin program intelligence, and automated weekly digest emails.

### Sessions C-F — Retention, Resources & Polish

Session C added earnings projections, tax export tools, payout history with CSV export, and bulk commission renewal capabilities. Session D built a searchable knowledge base, swipe file library with merge tags, promotional calendar with countdowns, and asset usage analytics. Session E delivered weekly challenges with badge rewards, a public partner directory, case study library with AI drafting, promotion quizzes, and audience analysis tools. Session F polished everything: mobile-responsive grids across all dashboards, SEO meta tags on 21 public pages, consistent loading/error states with retry buttons, and accessibility improvements (ARIA labels, roles, screen reader support).

---

## Required Vercel Environment Variables

| Variable | Used By | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SITE_URL` | All platforms | Production URL (e.g., `https://your-app.vercel.app`). Required for callback URL generation. |
| `SESSION_SECRET` | All platforms | Random string for OAuth state signing. Generate with `openssl rand -hex 32`. |
| `SOCIAL_ENCRYPTION_KEY` | All platforms | 32-byte hex key for token encryption. Generate with `openssl rand -hex 32`. |
| `TWITTER_API_KEY` | Twitter/X | OAuth 2.0 Client ID from X Developer Portal. |
| `TWITTER_API_SECRET` | Twitter/X | OAuth 2.0 Client Secret from X Developer Portal. |
| `LINKEDIN_CLIENT_ID` | LinkedIn | From LinkedIn Developer Portal. |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | From LinkedIn Developer Portal. |
| `FACEBOOK_APP_ID` | Facebook, Instagram | From Meta Developer Portal. Instagram uses the same Meta app. |
| `FACEBOOK_APP_SECRET` | Facebook, Instagram | From Meta Developer Portal. |
| `REDDIT_CLIENT_ID` | Reddit | From Reddit app preferences (type: "web app"). |
| `REDDIT_CLIENT_SECRET` | Reddit | From Reddit app preferences. |
| `DISCORD_CLIENT_ID` | Discord | From Discord Developer Portal. |
| `DISCORD_CLIENT_SECRET` | Discord | From Discord Developer Portal. |
| `GOOGLE_CLIENT_ID` | YouTube | From Google Cloud Console. Enable YouTube Data API v3. |
| `GOOGLE_CLIENT_SECRET` | YouTube | From Google Cloud Console OAuth 2.0 credentials. |
| `PINTEREST_APP_ID` | Pinterest | From Pinterest Developer Portal. |
| `PINTEREST_APP_SECRET` | Pinterest | From Pinterest Developer Portal. |

## OAuth Callback URLs

Register these URLs in each platform's developer portal (replace `YOUR_DOMAIN` with your production domain):

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

---

## Database Migrations

All migrations have been run on Supabase (001-016):

| Migration | Purpose |
|-----------|---------|
| 001 | Social accounts table |
| 003 | Testimonials |
| 005 | Affiliate system (6 tables + referral_links upgrade), audit log |
| 006 | Affiliate applications & network settings |
| 007 | Sprint 1 enhancements (discount codes, milestones, broadcasts) |
| 008 | Sprint 2 enhancements (deep links, leaderboard settings) |
| 009 | Sprint 3 enhancements (tier perks, contests, payout batches) |
| 010 | Sprint 4 (tax info, landing pages, API keys, messages, webhooks, badges) |
| 011 | CRM foundation (profiles, invoices, payments, tickets, contracts) |
| 012 | Commission renewals |
| 013 | Delight features (goals, disputes, short links, announcements) |
| 014 | Analytics columns (geo, device, churn tracking) |
| 015 | Session D tables (asset usage, knowledge base, promotional calendar) |
| 016 | Session E tables (challenge progress, case studies) |

---

## Development Timeline

| Date | Milestone |
|------|-----------|
| Feb 20, 2026 | Project created with 42 PassivePost features documented. Roadmap established. |
| Feb 20, 2026 | Phase 1 complete — testimonials, Wall of Love, live counters, social proof popups. |
| Feb 21, 2026 | Phase 1.5 complete — watermark, changelog, email drips, referral links, onboarding funnel. |
| Feb 21, 2026 | Twitter/X OAuth connected on Vercel. Pre-flight check system built. |
| Feb 21, 2026 | LinkedIn and Facebook connected. Batch 1 (core social) complete. |
| Feb 22, 2026 | Token refresh and error hardening complete for all Batch 1 platforms. |
| Feb 22, 2026 | Batch 2 complete — Instagram, Reddit, Discord connected. |
| Feb 22, 2026 | Batch 3 complete — YouTube, Pinterest connected. TikTok/Snapchat deferred. |
| Feb 22, 2026 | Batch 4 complete — WordPress and Ghost blog integrations built. Phase 2 done. |
| Feb 22, 2026 | Phase 3 complete — full affiliate marketing system with 12 features. |
| Feb 22, 2026 | Phase 3.5 complete — open affiliate program with separate login/dashboard. |
| Feb 22, 2026 | Phase 3.6 Sprints 1-2 complete — 11 affiliate enhancements. |
| Feb 23, 2026 | Phase 3.6 Sprint 3 complete — audit log system. |
| Feb 24, 2026 | Phase 3.6 Sprint 4 complete — all 32/32 affiliate features done. |
| Feb 24, 2026 | Phases 5-7 planned. Bug fixes (BF1-BF3) resolved. |
| Feb 25, 2026 | Phase 5 complete — CRM & invoicing data layer (10 tables, 20+ routes). |
| Feb 25, 2026 | Phase 6 complete — 16 dashboard UI features across admin/affiliate/user. |
| Feb 25, 2026 | Phase 7 complete — AI features, renewals, analytics, dashboard customization. |
| Feb 25, 2026 | Phase 8 complete — 20 flywheel accelerator features (Session A). |
| Feb 25, 2026 | Phase 8.5 complete — 18 flywheel accelerator features (Session B). |
| Feb 25, 2026 | All 7 integration debt items resolved. |
| Feb 25, 2026 | Sessions C-F complete — retention tools, resources, delight features, polish. |

---

## What's Next

### Pre-Launch (Before April 1, 2026)

- **End-to-end testing sweep** across all user flows (signup, connect platforms, schedule posts, affiliate activation, billing)
- **Production hardening** — rate limiting, error monitoring, and alerting
- **Content seeding** — blog posts, help articles, and changelog entries for launch day
- **Stripe product/pricing configuration** for production billing
- **Pinterest trial access approval** (submitted, awaiting response)

### Post-Launch

- **Phase 4: Mobile PWA** — Progressive web app with push notifications (deprioritized during build, planned for post-launch)
- **Medium integration** — API was closed to new integrations as of Jan 2025; monitoring for reopening
- **Blog Scenario 2** — PassivePost-provisioned blogs for users who don't have their own (requires VPS infrastructure)
- **Advanced analytics** — A/B testing for post content, deeper engagement correlation analysis
- **Affiliate payout automation** — Stripe Connect or PayPal mass payouts to replace manual payout processing
- **Multi-product expansion** — MuseKit framework supports launching additional SaaS products that share the affiliate, billing, and admin infrastructure

---

## Architecture Notes

- **Framework:** Next.js on Vercel
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with magic links and password
- **Payments:** Stripe (subscriptions, invoices, webhooks)
- **Email:** Resend (drip sequences, receipts, digests)
- **AI:** xAI/Grok via OpenAI-compatible API
- **Social OAuth:** Platform-native OAuth 2.0 with universal token refresh middleware
- **Blog APIs:** WordPress REST API, Ghost Admin API (user-provided credentials)

---

## Session Log

### Session — February 26, 2026 (Schema Sync & Data Seeding)
**Objective:** Fix Replit/Supabase database sync gap, seed all admin content, verify dashboard rendering.

**Completed:**
1. **Schema gap analysis** — Identified that migrations 013-016 were never applied to Supabase. Also found `notifications` and `affiliate_link_presets` tables missing from Supabase entirely.
2. **Created Supabase sync script** — `migrations/supabase/sync_013_016_plus_missing.sql` combines all missing migrations (15 tables, RLS policies, indexes) into one idempotent script for the user to run in Supabase SQL Editor.
3. **Rewrote comprehensive seed data** — `migrations/seed/comprehensive-seed-data.sql` covers 21 table systems: contests, challenges, knowledge base (10 articles), announcements (5), promotional calendar (3), case studies (3), marketing assets (8), spotlight, discount codes (5), badge tiers (4), badges, milestones (3), link presets (3), short links (3), notifications (5), messages (3), landing page, testimonials (3), broadcasts (2), affiliate profile, milestone awards.
4. **Verified on Replit** — Seed SQL ran with zero errors on Replit Postgres. All 21 tables confirmed populated.
5. **Verified API routes** — 101 affiliate API routes exist, all query correct columns matching seed data. Zero TypeScript compilation errors.
6. **Updated documentation** — Feature Discovery Guide, Roadmap session log.

**User action required before testing on Vercel:**
1. Run `migrations/supabase/sync_013_016_plus_missing.sql` in Supabase SQL Editor
2. Run `migrations/seed/comprehensive-seed-data.sql` in Supabase SQL Editor
3. Push to GitHub (Vercel auto-deploys)

**Honest feature status:**
- ~113 features genuinely visible/working
- ~46 need admin-seeded content (addressed by this session's seed data)
- ~42 need user interaction to trigger (by design — AI tools, quizzes, goals, etc.)
- ~32 are duplicate counts of the same underlying system

---

## Related Documentation

- `docs/PRODUCT_IDENTITY.md` — Product vision, positioning, and target audience
- `docs/FEATURE_INVENTORY.md` — Complete feature list with access levels and pricing tiers
- `docs/LESSONS_LEARNED.md` — Anti-patterns and debugging lessons from development
- `docs/musekit/AFFILIATE_ENHANCEMENTS.md` — Detailed specs for the 32 affiliate enhancement features
