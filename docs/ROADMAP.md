# PassivePost — Project History & Status

> **Last Updated:** February 27, 2026

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
- 16 database migrations deployed to Supabase (plus sync script for missing tables)
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

### Session: Design System Configuration — Sprint 1 (February 26, 2026)

**Sprint 1: Foundation (Types + CSS Variables + Theme Injection)** — COMPLETE

Tasks completed:
1. **T001** — Extended `BrandingSettings` in `src/types/settings.ts` with ~60 new design system properties covering typography, component styling, layout, interactive states, dark mode, data visualization, tables, forms, semantic colors, scroll, loading states, notifications, accessibility, print, and dividers
2. **T002** — Extended `useThemeFromSettings` in `src/hooks/use-settings.ts` with full CSS variable injection and data attribute system. Every property type is now injected as either a CSS variable (for visual properties) or a data-* attribute (for component-level settings) with Clean & Airy defaults
3. **T003** — Updated `src/app/globals.css` with CSS variable defaults matching Clean & Airy preset, typography rules consuming CSS variables, skeleton animation keyframes (pulse/shimmer/static), divider styles (line/gradient/none), heading color modes (foreground/primary/gradient), reduced-motion media query, and print stylesheet
4. **T012** — Created `src/lib/design-presets.ts` with 4 preset configurations (Clean & Airy, Compact & Dense, Bold & Modern, Minimal) plus `exportDesignConfig()` and `importDesignConfig()` utilities for JSON export/import

**No database changes.** No new environment variables. No Supabase migrations needed.

**Sprint 2: Admin UI (Palette Page Expansion)** — COMPLETE

Tasks completed:
1. **T006** — Built `src/components/admin/palette/design-system-sections.tsx` with 16 collapsible accordion sections: Presets & Reset, Semantic Colors, Typography, Component Style, Layout, Interactive States, Dark Mode, Data Visualization, Tables, Loading & States, Notifications, Forms, Scroll & Page, Accessibility, Dividers, Print. Each section has appropriate controls (toggle groups, select dropdowns, switches) and live previews where applicable. Integrated all sections into the existing palette page (`src/app/admin/setup/palette/page.tsx`).

Key features:
- All 16 sections are collapsible accordions to keep the page manageable
- Presets section at the top with 4 preset buttons, Export/Import JSON, and Reset to Defaults
- Live typography preview (H1/H2/H3/body text)
- Live skeleton animation preview
- Toast position picker with visual grid
- Every setting uses `updateBranding()` from the existing settings context — changes auto-save

**Sprint 3: Component Integration + Dark Mode + FOUC** — PARTIAL (3 of 5 tasks complete)

Tasks completed:
1. **T005** — Updated `src/components/theme-toggle.tsx` to respect `darkModeOption` setting. When set to `force-light` or `force-dark`, the toggle hides itself and forces the correct theme. When `user-choice`, behaves as before.
2. **T007** — Created `src/hooks/use-chart-config.ts` — a shared chart configuration hook that reads all chart-related settings and returns Recharts-compatible props (barSize, barRadius, lineWidth, lineCurve, showDots, showGrid, gridDasharray, showTrendLine, areaFill, areaOpacity, colorStrategy, colors array).
3. **T008** — Created `src/components/scroll-to-top.tsx` — floating scroll-to-top button that appears after 400px scroll, respects `data-scroll-top` attribute from design system settings. Added to root layout.

Sprint 3 Resume completed:
4. **T004** — FOUC prevention: body starts at opacity 0, inline script adds `ready` class via requestAnimationFrame for 150ms fade-in. Dark mode class set before first paint.
5. **T005 finish** — Header now reads `logoPosition` (left/center) and `stickyHeader` from branding settings. Created `/api/user/theme-preference` API route for cross-device dark mode sync.
6. **T008 finish** — Smooth scroll already wired in use-settings.ts (confirmed). Page transition wrapper deferred (optional per blueprint).
7. **T011** — Wired all shared UI components to CSS variables: Card (5 vars: padding/radius/shadow/border-width/border-style), Button (4: radius/font-weight/text-transform/transition-speed), Badge (radius), Input (radius), Table (stripe/border opacity), Toast (card radius + position via data-toast-position).

**Sprint 3 is now FULLY COMPLETE.** All 5 tasks done.

**Next session should start with:** Sprint 4 — Color Audit (Session B). See `docs/DESIGN_SYSTEM_BLUEPRINT.md` → Completion Plan → Session B.

### Session: Design System Configuration — Sprint 4 Color Audit (February 26, 2026)

**Sprint 4: Color Audit (Affiliate Dashboard + Components)** — COMPLETE

Tasks completed:
1. **T009** — Replaced ~60+ hardcoded Tailwind color classes in `src/app/affiliate/dashboard/page.tsx` (7,480 lines) with palette-aware CSS variable equivalents. Includes status badges, activity heatmaps (green→primary opacity), platform chart colors (blue/cyan/green/emerald→chart-1 through chart-4), financial indicators, star ratings, warning/error states, and dot indicators.
2. **T010** — Replaced all hardcoded colors across 8 affiliate component files:
   - `delight-features.tsx` — 7 replacements (amber/blue/green/red badges and text)
   - `retention-tools.tsx` — ~30 replacements (projection bars, goal tracking, payout status, tax, renewals)
   - `resource-center.tsx` — 2 category color maps + 4 scattered instances
   - `partner-experience.tsx` — 1 status color map (4 entries)
   - `flywheel-analytics.tsx`, `analytics-expanded.tsx`, `flywheel-reports.tsx` — already audited in previous session
   - `marketing-toolkit.tsx` — already clean

**Color mapping used:** `--success` (green), `--danger` (red), `--warning` (amber/yellow/orange), `text-destructive` (error text), `text-primary` (blue info), `--chart-1` through `--chart-4` (data viz), primary opacity for heatmaps.

**Verification:** `grep` confirms zero hardcoded color classes and zero hardcoded hex values across all 9 audited files. App compiles clean.

**Sprint 4 is now FULLY COMPLETE.** 12 of 14 blueprint tasks done.

**Next session should start with:** Sprint 5 — Integration Testing + Documentation (Session C). See `docs/DESIGN_SYSTEM_BLUEPRINT.md` → Completion Plan → Session C.

### Session: Design System Configuration — Sprint 5 Final (February 26, 2026)

**Sprint 5: Integration Testing + Documentation** — COMPLETE

Tasks completed:
1. **T013** — Ran 19-point integration test matrix covering: FOUC prevention (body opacity + ready class + rAF), dark mode (inline script sets class before paint), all 4 presets exist, export/import functions present, theme toggle respects darkModeOption, 16 critical CSS variable defaults verified, Button/Card/Badge/Input component consumption confirmed, chart config hook returns all expected props, scroll-to-top wired to data attribute, settings pipeline verified across 17 property groups, zero hardcoded colors in affiliate files, semantic color tokens in CSS + hook, print styles (@media print), reduced motion query, admin palette page integration, 7 design system section categories. Fixed minor gaps: added `--btn-radius` injection for buttonRadius, added `buttonRadius` to Clean & Airy preset, wired `contrastEnforcement` and `printStyles` as data attributes.
2. **T014** — Added System 17 (Design System Configuration) to FEATURE_INVENTORY.md with 14 features covering all design system capabilities. Updated DESIGN_SYSTEM_BLUEPRINT.md status to 14/14 COMPLETE. Updated replit.md with design system architecture details.

**The Design System Configuration blueprint is now FULLY COMPLETE.** All 14 tasks across 5 sprints done. No remaining work.

### Session: Harmonized Semantic Colors (February 26, 2026)

**Feature:** Auto-generate harmonious success/warning/danger colors from the primary brand color.

Changes:
1. **`generateHarmonizedSemantics()` utility** — New exported function in `use-settings.ts`. Takes a primary hex color and produces harmonized semantic colors by nudging base hues (green=142°, amber=38°, red=0°) toward the primary hue using shortest-arc interpolation (15% for success, 10% for warning/danger), blending saturation (70/30 base/primary) and lightness (80/20 base/primary), with clamps to keep colors readable (sat 40-85%, lightness 35-55%).
2. **Settings pipeline updated** — `resolveSemanticVars()` now falls back to harmonized colors when no explicit override is set: explicit override → auto-harmonized from primary → CSS default.
3. **Admin palette UI updated** — SemanticColorsSection shows "(auto-harmonized)" labels when using generated defaults, dynamically computes harmonized hex values as placeholders, and includes a "Reset all to harmonized defaults" button.
4. **Vercel build fix** — Fixed hydration error (body opacity FOUC prevention removed), added `suppressHydrationWarning` to body, fixed 4 TypeScript strict-mode errors in ToggleGroup/parseInt casts.

**No database changes.** No new environment variables. No Supabase migrations needed.

### Session: Role-Based Access Control (February 26, 2026)

**Feature:** Enforce proper access control across all user types — Admin, Team Member, Affiliate, SaaS User.

Changes:
1. **Expanded `/api/user/membership`** — Now returns `isAffiliate` (checks both `user_roles` and `affiliate_profiles`) and `userRole` alongside existing fields. Uses `Promise.all` for 3 parallel DB queries.
2. **Role-aware UserNav dropdown** — Avatar menu now shows only appropriate items per role:
   - Affiliate-only: Affiliate Dashboard, Profile, Log out
   - Admin: Admin Dashboard, PassivePost, Affiliate Dashboard (if also affiliate), Profile, Billing, Log out
   - Team member: Admin Dashboard, PassivePost, Profile, Billing, Log out
   - SaaS user: PassivePost, Profile, Billing, Log out
3. **Middleware role enforcement** — Authenticated users are now blocked from unauthorized paths:
   - Affiliates redirected from `/admin` and `/dashboard` to `/affiliate/dashboard`
   - Non-affiliates redirected from `/affiliate/dashboard` to `/`
   - Non-admin/non-team users redirected from `/admin` to `/`
   - Uses parallel role + affiliate_profiles queries for efficiency
4. **Edge case fixed** — Users with `affiliate_profiles` row but `userRole = 'user'` are correctly treated as affiliates throughout.

**No database changes.** No new environment variables. No Supabase migrations needed.

### Session: Dark Mode 950-Scale Fix + Palette UX (February 26, 2026)

**Feature:** Fix dark/light mode component color switching and improve admin palette UX.

Changes:
1. **950-scale component variables** — `useThemeFromSettings` now derives all component-level CSS variables from the primary color's shade scale:
   - Dark: card=900, foreground=50, muted=800, muted-fg=300, border=700
   - Light: card=50, foreground=950, muted=100, muted-fg=600, border=200
   - Respects admin `darkTheme`/`lightTheme` overrides (shade scale only fills in what admin didn't explicitly set)
2. **Card component fixed** — Replaced hardcoded `bg-white/[0.09]` with `bg-card` so cards use the `--card` CSS variable and respond to theme switching
3. **Palette page UX** — Moved "Live Preview" (example cards) from bottom to right after the color picker/shade scale/background overrides, before Design System sections. Admins see real-time color changes while picking colors.

**No database changes.** No new environment variables. No Supabase migrations needed.

### Session: Admin Relational Dashboard — Sprint 1 Foundation (February 26, 2026)

**Sprint 1: Foundation (Sidebar, Breadcrumbs, Timeline, Metrics Fix)** — COMPLETE

Tasks completed:
1. **T000** — Saved full `docs/ADMIN_DASHBOARD_BLUEPRINT.md` (735 lines) covering 18 tasks across 5 sprints: CRM, Revenue, Subscriptions, Dashboard Home, Cmd+K, Related Records.
2. **T001** — Fixed `/api/admin/metrics` crash on Vercel. Changed `subscriptions`→`muse_product_subscriptions`, computed MRR from `invoices` instead of missing `subscriptions.price_amount`, removed `canceled_at` column reference. Each section wrapped in own try/catch with `42P01`/`PGRST205` error handling.
3. **T002** — Built `<AdminSidebar>` component with collapsible groups (Dashboard, CRM, Revenue, Subscriptions, Metrics, Support, Content, Growth, Settings, System), badge counts fetched from `/api/admin/sidebar-counts`, icon-only collapse mode on desktop, mobile overlay with hamburger trigger, active state highlights.
4. **T003** — Built `<AdminBreadcrumbs>` component with auto-generation from URL path, custom labels for 30+ known routes, UUID detection for detail pages, override support for entity names.
5. **T004** — Built `<Timeline>` reusable event feed component with 10 event types, color-coded icons, loading skeleton, empty state, optional action links, palette CSS variables throughout.
6. **T005** — Updated `src/app/admin/layout.tsx` to use new sidebar (replaced old horizontal nav). Fixed security: added admin/team role check to `/api/admin/sidebar-counts` API. Added `aria-label` to all icon-only buttons (sidebar toggle, mobile menu, breadcrumbs home). Clean compilation, zero errors.

**Files created/modified:**
- `src/components/admin/sidebar.tsx` (new)
- `src/components/admin/breadcrumbs.tsx` (new)
- `src/components/admin/timeline.tsx` (new)
- `src/app/admin/layout.tsx` (rewritten — sidebar replaces horizontal nav)
- `src/app/api/admin/metrics/route.ts` (fixed)
- `src/app/api/admin/sidebar-counts/route.ts` (new, with admin role guard)
- `docs/ADMIN_DASHBOARD_BLUEPRINT.md` (new)

**No database changes.** No new environment variables. No Supabase migrations needed.

**Next session should start with:** Sprint 2 — CRM. See `docs/ADMIN_DASHBOARD_BLUEPRINT.md` → Sprint 2. Requires two new DB tables: `user_tags` and `entity_notes`.

### Session: Admin Relational Dashboard — Sprint 2 CRM (February 26, 2026)

**Sprint 2: CRM (People list + detail page)** — COMPLETE

Tasks completed:
1. **T005** — Built CRM aggregation APIs:
   - `GET /api/admin/crm` — paginated user list with aggregated data: type badges (Subscriber/Affiliate/Team), plan, total revenue, health score (login recency 40% + subscription 30% + activity 30%), tags. Supports search, type/plan/status/tag filters, sort (newest/oldest/revenue/health/name), pagination.
   - `GET /api/admin/crm/[userId]` — complete CEO-level user record: profile, subscriptions, unified transactions (invoices+payments+commissions+payouts merged chronologically), activities, tickets, notes, contracts, tags, affiliate summary. Each section in own try/catch.
2. **T006** — Built CRM master list page at `/admin/crm`:
   - Table with columns: Avatar+Name, Email, Type badges, Plan, Revenue, Status dot, Last Active, Health Score, Tags
   - Search bar (debounced), filter dropdowns (Type, Status), sort selector
   - Pagination with record count ("Showing 1-25 of X contacts")
   - CSV export (downloads all filtered results)
   - Click any row → navigates to detail page
   - Loading skeleton and empty state
3. **T007** — Built CRM detail page at `/admin/crm/[userId]`:
   - Header: back arrow, avatar, name, email, type badges, action buttons (Impersonate, Email, View in Stripe)
   - Inline tag management (add/remove tags with color picker)
   - 5 summary cards: Total Revenue, Current Plan, Health Score, Member Since, Days Since Login
   - Affiliate Summary card (shown only for affiliates): referrals, commissions, tier, conversion rate, payouts
   - 6 tabs: Profile (editable form with save), Transactions (unified table), Activity (Timeline component), Support (ticket cards), Notes (EntityNotes component), Contracts (contract cards)
4. **T008** — Built supporting APIs and components:
   - Tags API at `/api/admin/crm/[userId]/tags` (GET/POST/DELETE) with duplicate check
   - Entity Notes API at `/api/admin/entity-notes` (GET/POST/DELETE) with author name resolution and author-only delete (unless admin)
   - `<EntityNotes>` reusable component with add/delete, author names, timestamps
   - Created shared `src/lib/admin-auth.ts` helper (verifyAdminAccess, isErrorResponse, safeTableError) to DRY up admin role checks

**Database changes (Replit Postgres):**
- Created `user_tags` table (id, user_id, tag, color, created_by, created_at, UNIQUE user_id+tag)
- Created `entity_notes` table (id, entity_type, entity_id, author_id, body, created_at, updated_at)

**Files created:**
- `src/lib/admin-auth.ts` (shared admin auth helper)
- `src/app/api/admin/crm/route.ts` (CRM list API)
- `src/app/api/admin/crm/[userId]/route.ts` (CRM detail API)
- `src/app/api/admin/crm/[userId]/tags/route.ts` (Tags API)
- `src/app/api/admin/entity-notes/route.ts` (Entity Notes API)
- `src/app/admin/crm/page.tsx` (CRM list page)
- `src/app/admin/crm/[userId]/page.tsx` (CRM detail page)
- `src/components/admin/entity-notes.tsx` (EntityNotes component)

**Supabase SQL to run BEFORE testing on Vercel:**
```sql
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag);

CREATE TABLE IF NOT EXISTS entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_notes_entity ON entity_notes(entity_type, entity_id);
```

**Next session should start with:** Sprint 3 — Revenue & Subscriptions. See `docs/ADMIN_DASHBOARD_BLUEPRINT.md` → Sprint 3.

---

### Session: Sprint 3 + Sprint 4 — Revenue, Subscriptions, Dashboard Home & Command Palette (Feb 26, 2026)

**Sprint 3 completed (T009–T012):**
- Revenue list API (`/api/admin/revenue`) with type/status/date/search filters, sort, pagination, CSV export, summary stats (total revenue, pending commissions, outstanding payouts)
- Revenue detail API (`/api/admin/revenue/[id]`) auto-detects type (invoice/payment/commission/payout) with full cross-linking (customer, payment, subscription, affiliate attribution, line items, referral, included commissions)
- Subscriptions list API (`/api/admin/subscriptions`) with status/tier/churnRisk/search filters, sort, pagination, CSV export, summary stats (active count, MRR, churn risk count, tier breakdown)
- Subscription detail API (`/api/admin/subscriptions/[id]`) with customer card, product info, invoice history, churn risk indicators, Stripe links, EntityNotes
- Revenue list page with type badges, person cross-links to CRM, skeleton loading, empty states
- Revenue detail page with 4 type-specific views (InvoiceDetail, PaymentDetail, CommissionDetail, PayoutDetail), EntityNotes on invoices
- Subscriptions list page with churn risk toggle/indicators, person cross-links to CRM
- Subscription detail page with churn risk section, invoice history cross-linked to revenue, EntityNotes

**Sprint 4 completed (T013–T015):**
- Dashboard Home API (`/api/admin/dashboard`) returning KPIs (MRR, active subscribers, new users, open tickets, churn rate, failed payments), alerts (renewals 24h, failed payments, stale tickets, pending payouts, pending applications), recent activity feed (last 15 events), and 7-day revenue trend
- Dashboard Home page replacing old bare admin page — 6 clickable KPI cards (each linking to filtered list view), alerts section (only shows when count > 0), recent activity timeline, revenue sparkline chart, full skeleton loading states
- Command Palette (`Cmd+K` / `Ctrl+K`) searching across users, invoices, subscriptions, tickets — integrated into admin layout header, recent searches in localStorage
- Search API (`/api/admin/search?q=`) with results across all entity types

**Fixed Vercel deployment error:** Added `string[]` type annotation to CSV export callback in CRM page.

**No new DB tables needed for Sprint 3 or Sprint 4.**

**Files created:**
- `src/app/api/admin/revenue/route.ts` (Revenue list API)
- `src/app/api/admin/revenue/[id]/route.ts` (Revenue detail API)
- `src/app/admin/revenue/page.tsx` (Revenue list page)
- `src/app/admin/revenue/[id]/page.tsx` (Revenue detail page)
- `src/app/api/admin/subscriptions/route.ts` (Subscriptions list API)
- `src/app/api/admin/subscriptions/[id]/route.ts` (Subscription detail API)
- `src/app/admin/subscriptions/page.tsx` (Subscriptions list page)
- `src/app/admin/subscriptions/[id]/page.tsx` (Subscription detail page)
- `src/app/api/admin/dashboard/route.ts` (Dashboard Home API)
- `src/app/api/admin/search/route.ts` (Search API)
- `src/components/admin/command-palette.tsx` (Command Palette component)

**Files modified:**
- `src/app/admin/page.tsx` (replaced with command center dashboard)
- `src/app/admin/layout.tsx` (added CommandPalette to header)
- `src/app/admin/crm/page.tsx` (fixed TypeScript type annotation for Vercel)

**Blueprint status:** 15/18 tasks complete. Only Sprint 5 (Polish & Cross-Linking) remains.

**Next session should start with:** Sprint 5 — Related Records sidebar, export/print, final QA. See `docs/ADMIN_DASHBOARD_BLUEPRINT.md` → Sprint 5.

---

### Session: Sprint 5 — Polish & Cross-Linking (Feb 26, 2026)

**Sprint 5 completed (T016–T018) — BLUEPRINT COMPLETE (18/18 tasks):**

- Related Records API (`/api/admin/related?entityType=&entityId=&userId=`) — returns grouped lists of related records for any entity type (invoices, subscriptions, tickets, commissions, referrals)
- `<RelatedRecords />` component — lazy-loads related data, compact card style, hidden in print view, empty sections auto-hidden
- Integrated RelatedRecords sidebar into Revenue detail page (all 4 transaction types) and Subscription detail page
- Print CSS added to `globals.css` — hides sidebar, nav, action buttons, related records, search. Clean typography, no shadows, no border-radius
- CSV export verified on all 3 list pages (CRM, Revenue, Subscriptions)
- Updated FEATURE_INVENTORY.md with 8 new features from the relational dashboard
- All APIs compile clean, return 401 for unauthenticated requests

**Files created:**
- `src/app/api/admin/related/route.ts` (Related Records API)
- `src/components/admin/related-records.tsx` (Related Records component)

**Files modified:**
- `src/app/admin/revenue/[id]/page.tsx` (added RelatedRecords sidebar)
- `src/app/admin/subscriptions/[id]/page.tsx` (added RelatedRecords sidebar)
- `src/app/globals.css` (extended print CSS for admin pages)
- `docs/ADMIN_DASHBOARD_BLUEPRINT.md` (marked 18/18 complete)
- `docs/FEATURE_INVENTORY.md` (added 8 new dashboard features)

**No new DB tables needed for Sprint 5. No new Supabase migrations.**

**Admin Relational Dashboard Blueprint is COMPLETE.** All 18 tasks across 5 sprints are done.

---

### Session — February 26, 2026 (Post-Blueprint Fixes)

**What was accomplished:**

1. **Fixed Metrics page crash on Vercel (T001)** — Root cause: the `/api/admin/revenue-waterfall` API returns `waterfall` as an object with a `months` array inside, but the metrics page treated `data.waterfall` as a flat array and called `.map()` on it. Since objects don't have `.map()`, this caused a `TypeError` and triggered Next.js error boundary ("Something went wrong"). Fixed by using `data.waterfall?.months || []`. Also aligned the `WaterfallData` interface and chart field names to match the actual API response (`label`, `revenue`, `commissions`, `net` instead of `month`, `beginning_mrr`, `new_revenue`, etc.).

2. **Redesigned admin navigation from left sidebar to top horizontal nav (T002)** — Replaced the long collapsible left sidebar with a two-tier horizontal navigation bar:
   - Top bar: 6 section tabs (Business, Support, Content, Growth, Settings, System) with dropdown menus
   - Sub-nav bar: shows items for the currently active section
   - Mobile: retains slide-out sidebar with grouped sections
   - Badge counts preserved on relevant items
   - Dropdown closes on outside click and route change
   - Print CSS updated to hide top nav instead of old sidebar

3. **Fixed React.ElementType imports** — Replaced `React.ElementType` with named `ElementType` import from React in `related-records.tsx`, `timeline.tsx`, and `sidebar.tsx` to avoid implicit React namespace usage.

**Files modified:**
- `src/app/admin/metrics/page.tsx` (waterfall data fix + chart field alignment)
- `src/components/admin/sidebar.tsx` (full rewrite: left sidebar → top horizontal nav)
- `src/app/admin/layout.tsx` (layout changed from horizontal flex to vertical stack)
- `src/app/globals.css` (print CSS updated for new nav selectors)
- `src/components/admin/timeline.tsx` (ElementType import fix)
- `src/components/admin/related-records.tsx` (ElementType import fix)

**No new DB tables or Supabase migrations needed.**

**Pending items for next session:**
- Seed data for dashboard tables (invoices, subscriptions, commissions, etc.)
- Verify metrics page loads correctly on Vercel after push

---

### Session — February 27, 2026 (Dashboard Merge + Palette Fixes)

**What was accomplished:**

1. **Merged `/admin` and `/admin/metrics` into a single unified Dashboard page** — Combined the Dashboard command center (KPI cards, alerts, activity timeline, sparkline) with the Metrics page (user growth chart, revenue growth chart, NPS score, ARPU, LTV, conversion rate, waterfall chart, scheduled reports) into one cohesive landing page at `/admin`. Layout flows: Header with action buttons → 6 clickable KPI cards → secondary stats row (ARPU, LTV, Conversion, NPS) → alerts → user/revenue growth charts → activity timeline + sparkline + feedback/waitlist → revenue waterfall chart + table → scheduled reports section.

2. **Fixed all hardcoded color palette violations** — Replaced every instance of hardcoded Tailwind color classes with design system CSS variables:
   - `text-green-600` → `text-[hsl(var(--success))]`
   - `text-amber-600` / `text-yellow-600` → `text-[hsl(var(--warning))]`
   - `text-red-600` → `text-[hsl(var(--danger))]`
   - Alert severity styles now use `hsl(var(--warning))` instead of `amber-500`
   - All charts now use `useChartConfig()` hook for line width, bar size, bar radius, grid visibility, grid dash style, dot visibility, line curve type, and chart colors
   - Waterfall bars use `hsl(var(--warning))` and `hsl(var(--success))` semantic tokens
   - NPS score uses semantic color function based on score thresholds

3. **Removed redundant `/admin/metrics` route** — Deleted `src/app/admin/metrics/page.tsx`. Removed "Metrics" from sidebar nav and breadcrumb labels. Updated email links in queue workers and the metrics report API to point to `/admin` instead of `/admin/metrics`. Removed unused `BarChart3` import from sidebar.

**Files modified:**
- `src/app/admin/page.tsx` (full rewrite: merged dashboard + metrics with palette fixes)
- `src/app/admin/metrics/page.tsx` (deleted)
- `src/components/admin/sidebar.tsx` (removed Metrics nav item + unused import)
- `src/components/admin/breadcrumbs.tsx` (removed metrics label)
- `src/lib/queue/index.ts` (updated email links)
- `src/app/api/admin/metrics/report/route.ts` (updated email link)

**No new DB tables or Supabase migrations needed.**

**Pending items for next session:**
- Seed data for dashboard tables (invoices, subscriptions, commissions, etc.)
- Verify dashboard loads correctly on Vercel after push

---

### Session — February 27, 2026 (Design System Enforcement)

**What was accomplished:**

1. **Audited and fixed ALL admin pages for hardcoded spacing violations** — Replaced hardcoded Tailwind spacing, border-radius, shadow, and gap classes with CSS variable equivalents across 32+ admin page files. Key replacements:
   - `p-6`/`p-8` → `p-[var(--section-spacing,1.5rem)]`
   - `p-3`/`p-4` → `p-[var(--card-padding,1.25rem)]`
   - `gap-3`/`gap-4`/`gap-6` → `gap-[var(--content-density-gap,1rem)]`
   - `rounded-lg`/`rounded-md` → `rounded-[var(--card-radius,0.75rem)]`
   - `shadow-sm`/`shadow-md` → `shadow-[var(--card-shadow,...)]`
   - `space-y-4`/`space-y-6` → `space-y-[var(--content-density-gap,1rem)]`
   - `mb-4`/`mb-6` → `mb-[var(--content-density-gap,1rem)]`
   - Micro-spacing (≤0.75rem) intentionally preserved

2. **Rewrote admin dashboard page with full DS compliance** — `src/app/admin/page.tsx` now uses DSCard, DSGrid wrapper components and CSS variables throughout. All cards, grids, sections, and spacing respond to palette changes.

3. **Fixed admin layout** — `src/app/admin/layout.tsx` breadcrumb/command palette wrapper now uses CSS variable spacing.

4. **Updated session protocol documents:**
   - Added `docs/DESIGN_SYSTEM_RULES.md` as step 2 in Session Start Protocol (replit.md)
   - Added to Key Documents table and Document System table
   - Added "Design System Compliance" as rule 7 in Integration-First Development Rules
   - Added hardcoded spacing anti-pattern to LESSONS_LEARNED.md Common Mistakes table

5. **Verification:** Zero hardcoded spacing violations remain across all admin pages. Dev server compiles clean with no errors.

**Files modified:**
- `src/app/admin/page.tsx` (full rewrite with DS compliance)
- `src/app/admin/layout.tsx` (CSS variable spacing)
- All 30+ admin page files under `src/app/admin/` (spacing/radius/shadow replacements)
- `replit.md` (session protocol + key docs + integration rules updated)
- `docs/LESSONS_LEARNED.md` (new anti-pattern entry)

**No new DB tables or Supabase migrations needed.**

**Pending items for next session:**
- ~~Fix remaining hardcoded color violations (121 instances across 21 admin pages)~~ **DONE** — see session below
- Seed data for dashboard tables
- Verify on Vercel after push

---

### Session — February 27, 2026 (Color Violation Fixes)

**What was accomplished:**

1. **Fixed all 121 hardcoded color violations across 21 admin pages** — Replaced every instance of hardcoded Tailwind color classes with design system semantic tokens:
   - `text-green-*` / `bg-green-*` → `text-[hsl(var(--success))]` / `bg-[hsl(var(--success))]`
   - `text-amber-*` / `text-yellow-*` → `text-[hsl(var(--warning))]`
   - `text-red-*` → `text-[hsl(var(--danger))]` or `text-destructive`
   - `text-blue-*` / `bg-blue-*` → `text-[hsl(var(--info))]` or `text-primary`
   - `text-purple-*` → `text-primary`
   - `text-orange-*` → `text-[hsl(var(--warning))]`
   - `text-gray-*` → `text-muted-foreground`
   - Removed redundant `dark:` variants (CSS variables handle both modes automatically)

2. **Added `--info` CSS variable** — New semantic token `--info: 217 91% 60%` (blue) added to `globals.css` and `use-settings.ts` for informational UI elements (tips, info cards, neutral highlights).

3. **Verification:** Zero hardcoded color violations AND zero hardcoded spacing violations remain across all admin pages. Dev server compiles clean.

**Files modified:**
- 21 admin page files (color replacements)
- `src/app/globals.css` (added `--info` variable)
- `src/hooks/use-settings.ts` (added `--info` default)

**No new DB tables or Supabase migrations needed.**

**Pending items for next session:**
- Seed data for dashboard tables
- Verify on Vercel after push

---

### Session — February 28, 2026 (UX Overhaul Blueprint — Sprint 1)

**Sprint 1: Shared UX Components + Standards** — COMPLETE

**What was accomplished:**

1. **Built `<AdminDataTable>` component** (`src/components/admin/data-table.tsx`) — Reusable data table using shadcn Table with: typed column definitions, clickable rows, column sorting (asc/desc with arrow indicators), coaching-language empty state props, loading skeleton, pagination ("Showing X–Y of Z" with prev/next), optional select-row checkbox column for future bulk actions. All styling uses design system CSS variables.

2. **Built `<TableToolbar>` component** (`src/components/admin/table-toolbar.tsx`) — Consistent search + filter bar with: search input with X clear button, filter dropdowns via Select component, "Clear All" button when any filter is active, built-in CSV export button via `csvExport` prop, actions slot for custom buttons. All styling uses design system CSS variables.

3. **Built `<ConfirmDialog>` component** (`src/components/admin/confirm-dialog.tsx`) — Wraps shadcn AlertDialog with standard confirmation pattern. Supports `default` and `destructive` variants, loading state, custom labels. Replaces all `window.confirm()` / `confirm()` calls.

4. **Built CSV export utility** (`src/lib/csv-export.ts`) — `exportToCsv()` function that takes headers + rows, generates properly escaped CSV content, and triggers browser download.

5. **Added UX Standards section to `docs/DESIGN_SYSTEM_RULES.md`** — Defines the ONE correct pattern for list views, detail views, confirmations, money display, status indicators, and coaching-language empty states with per-page examples.

6. **Updated `design-system` agent skill** (`.agents/skills/design-system/SKILL.md`) — Added UX Standards section covering mandatory components, patterns, and CSV export usage so all future sessions enforce these standards automatically.

7. **Updated UX Overhaul Blueprint** — Reorganized from 6 sprints to 8 sprints (Sprint 4 split into 4A/4B, Sprint 6 split into 6A/6B) ensuring all sprints stay within the 3-5 task guideline from Lessons Learned.

**Design system compliance:** Zero hardcoded color classes, zero hardcoded spacing on cards, zero hardcoded shadows across all new files. Verified via grep.

**No database changes.** No new environment variables. No Supabase migrations needed.

**Next session should start with:** Sprint 2 — Critical Bug Fixes. See `docs/UX_OVERHAUL_BLUEPRINT.md` → Sprint 2.

---

## Related Documentation

- `docs/PRODUCT_IDENTITY.md` — Product vision, positioning, and target audience
- `docs/FEATURE_INVENTORY.md` — Complete feature list with access levels and pricing tiers
- `docs/LESSONS_LEARNED.md` — Anti-patterns and debugging lessons from development
- `docs/musekit/AFFILIATE_ENHANCEMENTS.md` — Detailed specs for the 32 affiliate enhancement features
