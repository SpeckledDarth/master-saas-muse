# PassivePost — Complete Feature Inventory

> **Last Updated:** February 25, 2026
> **Purpose:** Master inventory of everything already built. Search this document BEFORE building any new feature. If something similar exists, extend it — don't create a parallel system.

---

## How to Use This Document

1. **Before building a feature:** Search for keywords related to what you're building
2. **Find the existing system:** Note the files, tables, and API routes
3. **Plan your integration:** Your new feature should connect to the existing system, not duplicate it
4. **Update this document** when you add new features

---

## System 1: Authentication & User Management

### What's Built
- Email/password auth via Supabase
- OAuth providers: Twitter/X, LinkedIn, Facebook, Instagram
- SSO/SAML support
- Protected routes and middleware
- User impersonation (admin → any user)
- Role-based access: `user_roles` table + `organization_members`

### Key Files
- Auth: `src/lib/supabase/` (client/server helpers)
- Middleware: `src/middleware.ts`
- Roles: `src/app/api/admin/users/`
- Impersonation: `src/app/api/admin/impersonate/`

### Database Tables
- `auth.users` (Supabase managed)
- `user_roles` (role strings per user)
- `organizations`, `team_members`, `organization_members`

---

## System 2: Billing & Subscriptions (Stripe)

### What's Built
- Stripe checkout, subscription management, customer portal
- Feature gating by plan tier
- Webhook processing for payment events
- Local invoice/payment records synced from Stripe
- Branded payment receipt emails

### Key Files
- Stripe routes: `src/app/api/stripe/` (checkout, portal, products, subscription, webhook)
- Invoice routes: `src/app/api/user/invoices/`, `src/app/api/admin/invoices/`
- Payment routes: `src/app/api/user/payments/`
- Receipt email: `src/app/api/email/branded-receipt/`

### Database Tables
- `invoices`, `invoice_items` (local Stripe sync)
- `payments` (local payment records)
- `stripe_customers` (customer mapping)

### Integration Points for New Features
- Financial overview already pulls from `invoices` table for ROI calculations
- User billing page shows invoice history + subscription management
- Admin revenue attribution uses invoice data

---

## System 3: Affiliate Program (Core)

### What's Built
- Public signup + application flow
- Admin review and approval workflow
- Separate affiliate login and standalone dashboard
- Referral link generation with `?ref=CODE` tracking
- Cookie-based attribution (30-day, configurable)
- Commission tracking on Stripe payment events
- Rate lock-in (grandfathering)
- Fraud detection with automated scoring
- External network support (ShareASale, Impact, PartnerStack)

### Key Files
- Core logic: `src/lib/affiliate/index.ts` (fraud detection, calculations)
- Dashboard: `src/app/affiliate/dashboard/page.tsx` (~7000 lines, 11 navigation tabs)
- Admin management: `src/app/admin/setup/affiliate/page.tsx` (15+ tabs)
- Application routes: `src/app/api/affiliate/applications/`
- Dashboard API: `src/app/api/affiliate/dashboard/`
- Referral tracking: `src/components/referral-tracker.tsx`
- Activation: `src/app/api/affiliate/activate/`

### Database Tables
- `affiliate_profiles` — profile data, locked rates, status
- `affiliate_links` — referral codes and URLs
- `referral_clicks` — click tracking with geo/device (country, device_type columns from migration 014)
- `affiliate_referrals` — signup tracking (includes churned_at, churn_reason, last_active_at from migration 014)
- `affiliate_commissions` — commission records per payment
- `affiliate_payouts` — payout records
- `affiliate_payout_items` — junction: which commissions in which payout
- `affiliate_settings` — program-wide config

---

## System 4: Affiliate Tiers & Gamification

### What's Built
- **Performance Tiers:** Bronze → Silver → Gold → Platinum with referral thresholds and commission rates
- **Milestones:** One-time bonus rewards at referral count thresholds ($50 at 10 referrals, etc.)
- **Contests:** Time-bound competitions with prizes (most referrals in June, etc.)
- **Leaderboards:** Ranked lists by referrals, earnings, conversion rate across time periods
- **Badges/Achievements:** Earned badges ("First Sale", "Top 10%", etc.) with visual display
- **Earnings Goals:** Affiliate-set monthly targets with progress tracking
- **"Fastest to $X" Recognition:** Speed-based recognition moments

### Key Files
- Tier display: affiliate dashboard Overview tab (line ~1786)
- Milestones: affiliate dashboard Overview tab (line ~1826)
- Contests: affiliate dashboard Overview tab (line ~1871)
- Leaderboards: affiliate dashboard Overview tab (line ~1969)
- Badges: affiliate dashboard Overview tab (line ~2295)
- Goals API: `src/app/api/affiliate/goals/`
- Contest API: `src/app/api/affiliate/contests/`, `contest-leaderboard/`
- Milestone API: `src/app/api/affiliate/milestones/`
- Leaderboard API: `src/app/api/affiliate/leaderboard/`
- Tiers API: `src/app/api/affiliate/tiers/`
- Badges API: `src/app/api/affiliate/badges/`

### Database Tables
- `affiliate_tiers` — tier definitions (thresholds, rates, perks)
- `affiliate_milestones` — milestone definitions (threshold, bonus amount)
- `affiliate_milestone_awards` — awarded milestones per affiliate
- `affiliate_contests` — contest definitions (metric, dates, prizes)
- `affiliate_contest_entries` — contest participation tracking

### RESOLVED INTEGRATION GAPS (Fixed Feb 2026)
- ~~Contests data NOT flowing into AI analytics coaching~~ — FIXED: AI coach now queries `affiliate_contests` and includes active contest data in prompts
- ~~Milestones NOT referenced in predictive intelligence~~ — FIXED: Predictions now queries `affiliate_milestones` + `affiliate_milestone_awards`, includes next milestone in response
- ~~Leaderboard rank NOT used in AI insights~~ — FIXED: AI coach and AI analytics now query all affiliate links and calculate rank/percentile
- ~~Contest results NOT in weekly digest email~~ — FIXED: Weekly digest now queries active contests and includes standings + milestone proximity

---

## System 5: Affiliate Marketing Toolkit

### What's Built
- **Deep Link Generator:** Create tracking links to any page with source tags + UTM
- **QR Code Generator:** Downloadable QR codes with branding
- **Link Shortener:** Clean short links (`ppost.co/steele`)
- **Media Kit Page:** One-click professional partner page
- **Copy-Paste Captions:** Pre-written posts with referral link auto-inserted
- **Sharing Cards:** Pre-designed social images with referral code
- **Co-Branded Landing Pages:** Customizable partner page at `/partner/[slug]`
- **Discount Codes:** Branded codes (e.g., "STEELE40") with Stripe coupon sync
- **Email Templates:** Pre-written email sequences for affiliates
- **Starter Kit:** Curated bundle for new affiliates

### Key Files
- Components: `src/components/affiliate/marketing-toolkit.tsx`
- Deep links: `src/app/api/affiliate/link-presets/`
- Shortener: `src/app/api/affiliate/link-shortener/`
- Media kit: `src/app/api/affiliate/media-kit/`
- Sharing cards: `src/app/api/affiliate/sharing-cards/`
- Landing pages: `src/app/api/affiliate/landing-page/`
- Discount codes: `src/app/api/affiliate/discount-codes/`, `src/app/api/admin/discount-codes/`
- Email templates: `src/app/api/affiliate/email-templates/`

### Database Tables
- `affiliate_short_links` — shortened URLs
- `affiliate_landing_pages` — co-branded page content
- `discount_codes` — code definitions with Stripe coupon mapping
- `discount_code_redemptions` — usage tracking
- `affiliate_assets` — marketing materials library

### RESOLVED INTEGRATION GAP (Fixed Feb 2026)
- ~~Content intelligence disconnected from marketing toolkit~~ — FIXED: AI prompt now references available tools; response includes `suggestedTools` array with routes to Post Writer, Email Drafter, Deep Link Generator, QR Code Generator, and Content Calendar. ContentIntelligencePanel renders clickable tool links.

---

## System 6: Affiliate Communication & Engagement

### What's Built
- **Broadcasts:** Admin email announcements to all affiliates with tracking
- **In-App Messaging:** Two-way message threads between admin and affiliate
- **Drip Sequence:** 3-email automated onboarding (Welcome, Tips, Strategy)
- **Announcements:** Admin-created news items visible on dashboard
- **Spotlight:** Monthly featured affiliate recognition
- **What's New Digest:** Feature update notifications for affiliates
- **Surveys:** Affiliate satisfaction feedback collection
- **Testimonials:** Affiliate success story submissions

### Key Files
- Broadcasts: `src/app/api/admin/affiliate/broadcasts/`
- Messages: `src/app/api/affiliate/messages/`, `src/app/api/admin/affiliate/messages/`
- Drip: `src/app/api/affiliate/drip/`
- Announcements: `src/app/api/admin/announcements/`
- Spotlight: `src/app/api/admin/spotlight/`
- Surveys: `src/app/api/affiliate/surveys/`
- Testimonials: `src/app/api/affiliate/testimonials/`, `src/app/api/admin/affiliate/testimonials/`

### Database Tables
- `affiliate_broadcasts`, `affiliate_broadcast_receipts`
- `affiliate_messages` (admin ↔ affiliate threads)
- `affiliate_surveys`, `affiliate_survey_responses`

---

## System 7: Affiliate Payouts & Financial

### What's Built
- **Payout Lifecycle:** Pending → Approved → Paid workflow
- **Batch Processing:** Bulk payout runs with receipt emails
- **Payout Schedule:** Widget showing next payout date, threshold progress
- **Tax Info Collection:** W-9/W-8BEN forms with admin verification
- **Tax Summary:** Yearly tax summary for 1099 preparation
- **Earnings Statements:** PDF-style downloadable statements
- **Commission Lifecycle Tracker:** Visual journey Click → Signup → Paid → Approved → Payout
- **Second-Tier Commissions:** Earnings from sub-affiliate referrals
- **Commission Renewals:** Extend commission window via customer check-ins
- **Earnings Forecast:** Predicted monthly earnings from recent trends
- **Financial Tools:** Commission split estimator, ROI calculations

### Key Files
- Payouts: `src/app/api/affiliate/payouts/`, `payout-batches/`, `payout-schedule/`
- Tax: `src/app/api/affiliate/tax-info/`, `tax-summary/`
- Admin tax: `src/app/api/admin/affiliate/tax-info/`
- Earnings: `src/app/api/affiliate/earnings/`, `earnings-statement/`
- Financial tools: `src/app/api/affiliate/financial-tools/`
- Forecast: `src/app/api/affiliate/forecast/`
- Renewals: `src/app/api/affiliate/renewals/`, `src/app/api/admin/renewals/`
- Payout receipt: `src/app/api/admin/affiliate/payout-receipt/`

### Database Tables
- `affiliate_payouts`, `affiliate_payout_items`
- `affiliate_tax_info` — W-9/W-8 data
- `commission_renewals` — renewal requests and check-ins

### RESOLVED INTEGRATION GAP (Fixed Feb 2026)
- ~~Financial overview panel doesn't pull from payout schedule widget data~~ — FIXED: Financial overview now queries `affiliate_program_settings` + `referral_links.pending_earnings_cents`, uses same pending calculation as payout-schedule route (max of approved commissions vs link pending), returns `payoutSchedule` object with `nextPayoutDate`, `minimumThresholdCents`, `thresholdProgress`

---

## System 8: Analytics & Intelligence (Flywheel)

### What's Built
- **Churn Intelligence:** Churn rate, reasons, timing, at-risk alerts, net growth (#168-172)
- **Cohort Analysis:** Retention curve, conversion trends, trial benchmarks (#156, #160, #162)
- **Revenue Analytics:** Revenue pie by source, cumulative earnings, dropoff funnel (#154, #158, #161)
- **Traffic Insights:** Geo breakdown, device breakdown, repeat visitors (#164-166)
- **AI Analytics Intelligence:** 6 insight types — conversion drop, content recs, channel optimization, audience fit, seasonal trends, competitor tips (#177-182)
- **AI Posting Strategy:** Best time to post, promotional calendar (#90, #93)
- **AI Conversion Insights:** Unconverted trial analysis, revenue attribution, platform correlation (#92, #196-198)
- **Connected Analytics Dashboard:** Merged platform metrics + affiliate data (#193, #194)
- **Content Intelligence:** Promotion frequency analysis, platform correlation (#197, #214)
- **Financial Overview:** Unified earnings vs costs, ROI, break-even, projections (#215)
- **Predictive Intelligence:** Tier trajectory, churn windows, seasonal patterns (#217)
- **Custom Range Reports:** Any date range + period-over-period comparison (#201, #202)
- **Admin Program Intelligence:** Program-wide stats, coaching insights (#212, #216)

### Key Files
- Flywheel analytics component: `src/components/affiliate/flywheel-analytics.tsx`
- Flywheel reports component: `src/components/affiliate/flywheel-reports.tsx`
- Expanded analytics component: `src/components/affiliate/analytics-expanded.tsx`
- Partner experience component: `src/components/affiliate/partner-experience.tsx`
- Churn API: `src/app/api/affiliate/analytics/churn/`
- Cohort API: `src/app/api/affiliate/analytics/cohort/`
- Sources API: `src/app/api/affiliate/analytics/sources/`
- Connected overview API: `src/app/api/affiliate/analytics/connected-overview/`
- Content intelligence API: `src/app/api/affiliate/analytics/content-intelligence/`
- Financial overview API: `src/app/api/affiliate/analytics/financial-overview/`
- Predictions API: `src/app/api/affiliate/analytics/predictions/`
- Custom range API: `src/app/api/affiliate/reports/custom-range/`
- Program intelligence API: `src/app/api/admin/affiliate/program-intelligence/`
- AI analytics: `src/app/api/affiliate/ai-analytics/`
- AI posting: `src/app/api/affiliate/ai-posting-strategy/`
- AI conversion: `src/app/api/affiliate/ai-conversion-insights/`
- Charts: `src/app/api/affiliate/analytics/charts/`
- Expanded: `src/app/api/affiliate/analytics/expanded/`
- YouTube: `src/app/api/affiliate/analytics/youtube/`

### UX Utilities
- `MetricTooltip` — Hover tooltips explaining metrics (#209)
- `LastUpdated` — Timestamp showing data freshness (#206)
- `Sparkline` — Mini trend charts in referral rows (#208)
- `ExportButton` — CSV download for any data table (#210)

---

## System 9: AI Tools (Affiliate)

### What's Built
- **AI Post Writer:** Platform-specific social posts with referral link embedded
- **AI Email Drafter:** Professional email sequences for promotion
- **AI Blog Outline Generator:** Blog post structure for affiliate content
- **AI Video Script Generator:** Video talking points for promotions
- **AI Objection Handler:** Responses to common sales objections
- **AI Coach:** Personalized performance tips from actual data
- **AI Ad Copy Generator:** Promotional ad text
- **AI Pitch Customizer:** Tailored pitches for different audiences
- **AI Audience Content:** Content ideas matched to audience type
- **AI Promo Ideas Generator:** Creative promotion suggestions
- **AI Onboarding Advisor:** Getting-started guidance for new affiliates
- **AI Conversion Optimizer:** Suggestions to improve conversion rates

### Key Files
- All under `src/app/api/affiliate/ai-*/`
- AI provider: `src/lib/ai/provider.ts` (chatCompletion function)
- Model: `grok-3-mini-fast` via XAI_API_KEY

### CRITICAL PATTERN
- `AISettings` type REQUIRES `systemPrompt: string` field — never omit it
- All AI routes should pull real user data (commissions, referrals, tiers, contests) to provide context

---

## System 10: CRM & Support

### What's Built
- **Universal User Profiles:** `user_profiles` table for all user types
- **Support Tickets:** Open → In Progress → Resolved → Closed workflow
- **CRM Activity Log:** Calls, notes, tasks, meetings per account
- **Marketing Campaigns:** Campaign tracking with UTM attribution
- **Contracts/Agreements:** Signing flow with version history
- **Admin CRM Card:** Full affiliate profile view (earnings, payouts, tickets, activities, notes)
- **Admin Quick Notes:** Internal notes on any account
- **Affiliate Health Scores:** Auto-calculated red/yellow/green indicators

### Key Files
- Tickets: `src/app/api/tickets/`
- Activities: `src/app/api/activities/`
- Campaigns: `src/app/api/campaigns/`
- Contracts: `src/app/api/contracts/`
- Admin tickets: `src/app/api/admin/tickets/`
- Admin notes: `src/app/api/admin/notes/`
- Admin activities: `src/app/api/admin/activities/`
- User profile: `src/app/api/user/profile/`
- Admin user profiles: `src/app/api/admin/users/[userId]/profile/`

### Database Tables
- `user_profiles` — universal profile (all user types)
- `tickets`, `ticket_comments` — support system
- `activities` — CRM activity log
- `campaigns` — marketing campaigns
- `contracts`, `contract_versions` — agreement management

---

## System 11: Content Scheduling (PassivePost Product)

### What's Built
- 7-phase content flywheel (38 core + 4 bonus features)
- Blog-to-social repurposing across 5 blog platforms
- AI content grader, topic fatigue detection, content DNA analysis
- Calendar autopilot, batch repurpose, content recycling
- Platform-specific timing optimization
- Content ROI calculator, cost per post tracking
- Streak system for consistency gamification
- Client approval portal
- Connected platform integrations: Twitter/X, LinkedIn, Facebook, Instagram

### Key Files
- Social dashboard: `src/app/dashboard/social/`
- Social APIs: `src/app/api/social/` (50+ routes)
- Blog publishing: `src/app/api/social/blog/`
- Intelligence: `src/app/api/social/intelligence/`
- Automation: `src/app/api/social/automation/`
- Revenue: `src/app/api/social/revenue/`
- Flywheel metrics: `src/app/api/social/flywheel/metrics/`

### Database Tables
- `social_accounts` — connected platform accounts
- `social_posts` — scheduled/published posts
- `social_engagement_metrics` — pulled engagement data
- `connected_platform_metrics` — external analytics sync
- `blog_posts`, `blog_connections` — blog publishing

---

## System 12: Email & Notifications

### What's Built
- Resend integration for transactional emails
- Editable email templates with category tagging
- Drip email sequences (onboarding, affiliate welcome)
- Weekly performance emails (cron)
- Monthly earnings statements (cron)
- Weekly affiliate digest (cron)
- Trial expiry alerts (cron)
- Branded payment receipts
- In-app notification bell with unread badges
- Email preferences center

### Key Files
- Email send: `src/app/api/email/send/`, `drip/`, `branded-receipt/`
- Cron jobs: `src/app/api/cron/` (weekly-performance, monthly-earnings, weekly-affiliate-digest, trial-alerts, scheduled-reports, weekly-coach, weekly-stats)
- Templates: `src/app/api/admin/email-templates/`
- Preferences: `src/app/api/user/email-preferences/`

---

## System 13: Admin Dashboard & Reporting

### What's Built
- Admin setup wizard with task-based navigation
- User management with role assignment
- Revenue attribution report
- Revenue waterfall visualization
- Scheduled email reports (weekly revenue, activity digest)
- Metrics alerts and KPI dashboard
- Audit logging for admin actions
- Onboarding funnel tracking
- Queue management UI
- Product registry for multi-product support

### Key Files
- Admin pages: `src/app/admin/`
- Stats: `src/app/api/admin/stats/`
- Revenue attribution: `src/app/api/admin/revenue-attribution/`
- Revenue waterfall: `src/app/api/admin/revenue-waterfall/`
- Metrics: `src/app/api/admin/metrics/`
- Audit: `src/app/api/admin/audit-logs/`
- Scheduled reports: `src/app/api/cron/scheduled-reports/`

---

## System 14: User Dashboard

### What's Built
- Invoice history with PDF download
- Subscription management + Stripe portal link
- Support ticket submission and history
- Account security (password change, 2FA placeholder)
- Usage insights ("You published 12 posts this month")
- Affiliate invitation prompt
- Email preferences

### Key Files
- User invoices: `src/app/api/user/invoices/`
- Payments: `src/app/api/user/payments/`
- Membership: `src/app/api/user/membership/`
- Usage insights: `src/app/api/user/usage-insights/`
- Profile: `src/app/api/user/profile/`

---

## Database Migration History

All migrations 001-014 have been run on both Replit Postgres and Supabase.

| # | File | Contents |
|---|------|----------|
| 001 | `migrations/core/001_social_tables.sql` | Social platform tables |
| 002 | `migrations/core/002_product_registry.sql` | Multi-product support |
| 003 | `migrations/core/003_testimonials.sql` | Testimonial management |
| 004 | `migrations/core/004_launch_kit.sql` | Launch features (drip, referral, funnel) |
| 005 | `migrations/core/005_affiliate_system.sql` | Core affiliate tables |
| 006 | `migrations/core/006_affiliate_applications.sql` | Application workflow |
| 007 | `migrations/core/007_affiliate_enhancements_p1.sql` | Milestones, discount codes, broadcasts |
| 008 | `migrations/core/008_affiliate_enhancements_p2.sql` | Tiers, payouts, contests, source tags |
| 009 | `migrations/core/009_affiliate_enhancements_p3.sql` | Co-branded pages, tax, fraud, API keys, webhooks, messaging |
| 010 | `migrations/core/010_affiliate_sprint4.sql` | Sprint 4 features |
| 011 | `migrations/core/011_crm_foundation.sql` | CRM tables (profiles, invoices, tickets, activities, campaigns, contracts) |
| 012 | `migrations/core/012_commission_renewals.sql` | Commission renewal system |
| 013 | `migrations/core/013_delight_features.sql` | Partner experience, toolkit, expanded analytics |
| 014 | `migrations/core/014_analytics_columns.sql` | Analytics columns (geo/device on clicks, churn fields on referrals) |

---

*Update this document every time new features are added. This is the single source of truth for "what already exists."*
