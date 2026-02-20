# MuseKit + PassivePost — Development Roadmap

> **Revision:** 1.0 | **Last Updated:** February 20, 2026 | **Created:** February 20, 2026

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
| 1.5.6 | "How did you hear about us?" dropdown in feedback widget | Complete | Added to `src/components/feedback-widget.tsx` with 9 attribution sources |

**Dependencies:**
- 1.5.4 (share links) should use a URL structure that's compatible with Phase 3 affiliate tracking (e.g., `?ref=USER_CODE`)

---

## Phase 2: Connect Real Platform APIs & Full Testing

**Goal:** Move from demo data to production-ready platform integrations.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.1 | Social platform OAuth + real posting (Twitter/X, LinkedIn, Facebook) | Not Started | Core value proposition |
| 2.2 | Blog platform connections (Medium, WordPress, Ghost) | Not Started | Blog-to-social flywheel |
| 2.3 | Real engagement metric pulling from platform APIs | Not Started | Powers analytics, content intelligence |
| 2.4 | Stress testing, edge cases, error handling | Not Started | Rate limits, token expiry, API failures |

**Dependencies:**
- Phase 1 and 1.5 should be complete so the product has social proof ready when real users arrive
- Platform developer accounts and API keys needed (Twitter, LinkedIn, Facebook, Medium, WordPress, Ghost)

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
