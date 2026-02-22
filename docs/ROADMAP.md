# MuseKit + PassivePost — Development Roadmap

> **Revision:** 1.2 | **Last Updated:** February 22, 2026 | **Created:** February 20, 2026

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
| 2 | Connect Real Platform APIs & Full Testing | Complete (All batches, engagement metrics, posting, guides) | Week 2-3 |
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
| Feb 22, 2026 | Blog integration split into Scenario 1 (connect existing) and Scenario 2 (provision for users) | Scenario 1 requires no infrastructure — just API client code. Scenario 2 deferred for VPS setup later. PassivePost dogfoods its own service as a regular user. |
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
| Feb 22, 2026 | **Token refresh + error hardening (2.1e) complete.** Built universal token refresh for all 3 platforms: X uses refresh_token (2hr expiry), LinkedIn uses refresh_token (60d), Facebook re-exchanges long-lived token. Added `with-token-refresh.ts` middleware for automatic retry on 401s. Validate All now attempts token refresh before marking accounts invalid. Added `token_expires_at` tracking on initial connect and refresh. Added `Reconnect` button in UI for expired tokens. Improved OAuth error page with friendly messages for denied, timeout, callback mismatch, credentials not configured. Established `TokenExpiredError` class to distinguish "needs reconnect" vs "temporary failure". **Lessons learned:** Facebook has no refresh_token — must re-exchange current access_token for new long-lived token before it expires. X tokens rotate on every refresh (new refresh_token issued). LinkedIn refresh_token availability depends on OAuth app configuration. | Phase 2.1e — Complete |
| Feb 22, 2026 | **Batch 2 complete — Instagram, Reddit, Discord all wired.** Instagram uses same FACEBOOK_APP_ID/SECRET via Instagram Graph API (`api.instagram.com` for OAuth, `graph.instagram.com` for API/refresh). 60-day long-lived tokens with `ig_refresh_token` refresh. Reddit uses Basic auth (base64 client_id:secret) for token exchange, permanent refresh tokens, 24h access tokens, requires User-Agent header. Discord uses standard OAuth2 with 7-day tokens and refresh_token support. All 3 have real `validateToken`/`getUserProfile` implementations, preflight checks, token refresh in `token-refresh.ts`, and are wired into dashboard UI. Total platforms connected: 6 (X, LinkedIn, Facebook, Instagram, Reddit, Discord). **Next:** Reddit + Discord need developer apps created and credentials added to Vercel env vars. Instagram needs `instagram_basic` scope enabled in Meta app. | Phase 2 Batch 2 — Complete |
| Feb 22, 2026 | **YouTube + Pinterest wired. TikTok/Snapchat deferred.** YouTube uses Google OAuth2 (`accounts.google.com` for auth, `oauth2.googleapis.com` for token exchange/refresh). Scopes: `youtube.readonly`, `youtube`, `userinfo.profile`. Uses `access_type=offline&prompt=consent` to get refresh_token. 1hr access tokens with refresh via standard Google OAuth refresh. Validates via YouTube Data API v3 `channels?part=snippet&mine=true`. Pinterest uses Pinterest OAuth2 (`pinterest.com/oauth` for auth, `api.pinterest.com/v5/oauth/token` for tokens). Uses Basic auth (base64 app_id:secret). 30-day access tokens, refresh_token for re-auth. Validates via `api.pinterest.com/v5/user_account`. Removed TikTok and Snapchat from platform list — deferred as video-first platforms with insufficient text surface for content flywheel. **Total platforms: 8 social (X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, Pinterest).** Next: Blog platforms (WordPress, Ghost, Medium). | Phase 2 Batch 3 — Complete |
| Feb 22, 2026 | **Blog platform integrations (Scenario 1) built.** Created `blog-clients.ts` with WordPress REST API client (validates via `/wp-json/wp/v2/users/me`, publishes/updates/deletes via `/wp-json/wp/v2/posts`, resolves tags, uploads featured images) and Ghost Admin API client (JWT token generation from `id:secret` key, validates via `/ghost/api/admin/site/`, publishes/updates/deletes via `/ghost/api/admin/posts/`). Added `/api/social/blog/connections/validate` endpoint for testing existing connections. Updated blog connections POST to auto-validate on connect (WordPress/Ghost). Enhanced dashboard blog page with "Test" button for connected platforms and improved connection dialog with credential format guidance. Added "Blog Platforms" card to social accounts page linking to blog dashboard. **Decision:** Blog strategy split into Scenario 1 (connect existing — built) and Scenario 2 (provision for users — deferred). Medium API closed — deferred. | Phase 2 Batch 4 — Complete |
| Feb 22, 2026 | **Phase 2 fully complete.** (1) In-app setup guides for all platforms: social platforms show pre-OAuth guide dialog with numbered steps, security reassurance, and time estimates; blog platforms have collapsible credential generation guides with navigation paths. (2) Engagement metrics infrastructure: summary API (`/api/social/engagement/summary`), manual pull trigger (`/api/social/engagement/pull`), dashboard upgraded with real metric cards and "Refresh Metrics" button. (3) Real posting flow wired: "Post Now" and "Publish" buttons on draft posts, blog publishing endpoint (`/api/social/blog/posts/publish`). (4) All demo data fallbacks removed from posts and engagement pages. (5) Display Name field restored in blog connection form. (6) Discord guide language corrected. **Phase 2 is complete — ready for Phase 3 (Affiliate Marketing).** | Phase 2 — Complete |
| Feb 22, 2026 | **Phase 3 fully complete — Affiliate Marketing System.** Built complete affiliate infrastructure: (1) Database migration with 6 new tables (affiliate_program_settings, affiliate_tiers, affiliate_referrals, affiliate_commissions, affiliate_payouts, affiliate_assets) plus referral_links upgrade. (2) Core library with grandfathering (lock-in rates on activation), fraud detection (email domain, IP volume, self-referral), performance tiers, and notification helpers. (3) Admin management page with settings, tier CRUD, marketing assets, affiliate rankings, and fraud alerts. (4) User affiliate dashboard with stats cards, tier progress, referral/earnings/payout history, marketing assets browser. (5) Cookie attribution (30-day pp_ref cookie, configurable duration). (6) Stripe webhook commission tracking on invoice.paid with deduplication. (7) Payout management (pending → approved → paid workflow). (8) 3-email onboarding drip sequence via Resend. (9) Real-time notifications for clicks, signups, conversions, and payouts. **Phase 3 complete — ready for Phase 4.** | Phase 3 — Complete |

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
- Admin page: `src/app/admin/setup/affiliate/page.tsx` (settings, tiers, assets, management)
- User dashboard: `src/app/dashboard/social/affiliate/page.tsx` (stats, tiers, earnings, payouts, assets)
- API routes: `src/app/api/affiliate/` (settings, tiers, assets, payouts, referrals, dashboard, activate, track-signup, drip)
- Stripe webhook: `src/app/api/stripe/webhook/route.ts` (invoice.paid handler with commission creation)
- Cookie tracking: `src/components/referral-tracker.tsx` (pp_ref cookie on ?ref= visits)
- Signup integration: `src/app/(auth)/signup/page.tsx` (reads pp_ref cookie, calls track-signup)

### Phase 4
- PWA: `public/manifest.json`, service worker, `next.config.js` PWA config
- Push notifications: Service worker registration, notification API

---

*This document is the project's persistent memory. Update it every session.*
