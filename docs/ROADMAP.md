# MuseKit + PassivePost — Development Roadmap

> **Revision:** 1.1 | **Last Updated:** February 21, 2026 | **Created:** February 20, 2026

> **IMPORTANT — READ THIS FILE AT THE START OF EVERY SESSION.** This is the single source of truth for the multi-week development plan. If agent memory resets, this file restores full context.

---

## Current State (Before This Roadmap)

PassivePost is feature-complete with 42 features (38 flywheel + 4 bonus) across 7 phases, all E2E tested. Documentation is fully updated with version tracking. The product uses demo data paths — real platform APIs are not yet connected. The product is not yet launched.

---

## Phase Overview

| Phase | Name | Status | Target |
|-------|------|--------|--------|
| 1 | Testimonial/Success Metrics Dashboard | Complete | Week 1 |
| 1.5 | Launch Kit | Complete | Week 1-2 |
| 2 | Connect Real Platform APIs & Full Testing | Not Started | Week 2-3 |
| 3 | Affiliate Marketing Features | Not Started | Week 3-4 |
| 4 | Mobile App (PWA First) | Not Started | Week 4+ |

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
| 2.1d | Real engagement metric pulling for Batch 1 platforms | Not Started | Powers analytics, content intelligence |
| 2.1e | Error handling, rate limits, token refresh for Batch 1 | Not Started | Edge cases, API failures, retry logic |

### Batch 2 — Easy Wins (Priority: High)
Platforms with straightforward APIs. Instagram shares the Facebook/Meta app.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.2a | Instagram — via Facebook/Meta Graph API | Not Started | May use existing FB app credentials. Requires Instagram Business account. |
| 2.2b | Reddit — OAuth 2.0 + posting | Not Started | Need to create Reddit app at https://www.reddit.com/prefs/apps |
| 2.2c | Discord — Bot/webhook integration | Not Started | Need to create Discord app at https://discord.com/developers |

### Batch 3 — Review-Required Platforms (Priority: Medium)
These platforms have stricter app review processes. Submit applications early.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.3a | YouTube — Google/YouTube Data API v3 | Not Started | Need Google Cloud project with YouTube API enabled |
| 2.3b | Pinterest — OAuth 2.0 + pin creation | Not Started | Need Pinterest developer app |
| 2.3c | TikTok — Content Posting API | Not Started | Requires app review — submit early, approval can take weeks |
| 2.3d | Snapchat — Public Content API | Not Started | Requires app review — submit early |

### Batch 4 — Blog Platforms (Priority: Medium, Self-Hosted Infrastructure)
Build cloneable self-hosted WordPress + Ghost as reusable infrastructure for all MuseKit products.

| # | Platform | Status | Notes |
|---|----------|--------|-------|
| 2.4a | WordPress (self-hosted) — REST API posting | Not Started | Set up on a VPS (e.g., $5/mo DigitalOcean), create cloneable template for all MuseKit products |
| 2.4b | Ghost (self-hosted) — Admin API posting | Not Started | Co-locate with WordPress on same VPS, cloneable setup |
| 2.4c | Medium — API integration | Not Started | API closed to new integrations as of Jan 2025. Mark as "coming soon" or find workaround. |

### Phase 2 Summary

| Batch | Platforms | API Keys | Status |
|-------|-----------|----------|--------|
| 1 — Core Social | Twitter/X, LinkedIn, Facebook | All credentials stored | In Progress |
| 2 — Easy Wins | Instagram, Reddit, Discord | Need to obtain | Not Started |
| 3 — Review-Required | YouTube, Pinterest, TikTok, Snapchat | Need to obtain + submit for review | Not Started |
| 4 — Blog Platforms | WordPress, Ghost, Medium | Self-hosted setup needed | Not Started |

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
| `FACEBOOK_APP_ID` | Facebook | From Meta Developer Portal app settings. |
| `FACEBOOK_APP_SECRET` | Facebook | From Meta Developer Portal app settings. |

**Callback URLs to Register (replace `YOUR_DOMAIN`):**

| Platform | Callback URL |
|----------|-------------|
| Twitter/X | `https://YOUR_DOMAIN/api/social/callback/twitter` |
| LinkedIn | `https://YOUR_DOMAIN/api/social/callback/linkedin` |
| Facebook | `https://YOUR_DOMAIN/api/social/callback/facebook` |

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
| 3.1 | Upgrade Phase 1.5 share links to tracked affiliate links with attribution | Not Started | Builds on existing share link infrastructure |
| 3.2 | Commission tracking on Stripe subscription events | Not Started | Listen for `invoice.paid`, check `referred_by` |
| 3.3 | Affiliate dashboard — referrals, earnings, payout status | Not Started | User-facing page in dashboard |
| 3.4 | Admin affiliate management — set rates, approve/deny affiliates, view program stats | Not Started | Admin dashboard page |
| 3.5 | Payout tracking (manual to start) | Not Started | Admin marks payouts as complete |

**Dependencies:**
- Phase 1.5.4 (share links) must be built first — affiliate system upgrades those links
- Phase 2 should be complete so affiliates send traffic to a fully working product
- Stripe webhooks already wired — just adding a handler

**Open Decision:** Build as MuseKit core feature (available to all products) vs. PassivePost-specific. Recommendation: MuseKit core, since any product benefits from referrals.

---

## Phase 4: Mobile App

**Goal:** Extend PassivePost to mobile users.

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
| Feb 21, 2026 | Medium marked as "coming soon" — API closed to new integrations since Jan 2025 | No viable path to integrate; monitor for reopening |
| Feb 21, 2026 | Instagram integration will attempt to reuse existing Facebook/Meta app credentials | Same Graph API, reduces credential management overhead |
| Feb 21, 2026 | 10 social platforms + 3 blog platforms = 13 total platform integrations as PassivePost USP | Broad platform support is the key differentiator |

---

## Open Questions

Questions to resolve during implementation.

| # | Question | Phase | Status |
|---|----------|-------|--------|
| 1 | Commission model: one-time per signup, recurring percentage, or tiered? | Phase 3 | Undecided |
| 2 | Who can be an affiliate: any user, application-based, or Premium only? | Phase 3 | Undecided |
| 3 | Payout method: PayPal, bank transfer, or account credit? | Phase 3 | Undecided |
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
- Affiliate system: New migration in `migrations/core/`, new dashboard section, Stripe webhook handler
- Builds on Phase 1.5.4 share link infrastructure

### Phase 4
- PWA: `public/manifest.json`, service worker, `next.config.js` PWA config
- Push notifications: Service worker registration, notification API

---

*This document is the project's persistent memory. Update it every session.*
