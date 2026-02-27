# PassivePost — Sitemap

PassivePost is a closed-loop business intelligence platform for content creators that combines content scheduling (8 social platforms + 2 blog platforms), affiliate marketing (3 dashboards), connected analytics, and AI coaching. This document is a complete reference of every page, API endpoint, and route in the application.

---

## Table of Contents

1. [Admin Dashboard Pages](#1-admin-dashboard-pages)
2. [Affiliate Dashboard Pages](#2-affiliate-dashboard-pages)
3. [User Dashboard Pages](#3-user-dashboard-pages)
4. [Social Scheduling Pages](#4-social-scheduling-pages)
5. [Public Pages](#5-public-pages)
6. [Authentication Pages](#6-authentication-pages)
7. [Marketing Pages](#7-marketing-pages)
8. [API Endpoints](#8-api-endpoints)
9. [Visual Sitemap](#9-visual-sitemap)

---

## 1. Admin Dashboard Pages

The admin dashboard provides full control over the platform, affiliate program, and business operations.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/admin` | **Admin Home** | Overview with key metrics and quick actions |
| `/admin/analytics` | **Analytics** | Platform-wide analytics and reporting |
| `/admin/audit-logs` | **Audit Logs** | Record of every admin action with timestamps |
| `/admin/blog` | **Blog Management** | Manage public blog posts |
| `/admin/email-templates` | **Email Templates** | Customize all email templates |
| `/admin/feedback` | **Feedback** | View user feedback and suggestions |
| `/admin/metrics` | **Metrics & KPIs** | Configurable alerts and health dashboards |
| `/admin/onboarding` | **Onboarding Funnel** | Track user drop-off at each setup step |
| `/admin/queue` | **Queue Management** | View and manage background job queues |
| `/admin/settings` | **Settings** | Platform-wide settings |
| `/admin/sso` | **SSO Configuration** | Enterprise SSO/SAML setup |
| `/admin/team` | **Team Management** | Manage admin and team member accounts |
| `/admin/users` | **User Management** | View, search, filter, and manage all user accounts |
| `/admin/waitlist` | **Waitlist** | Manage pre-launch or beta waitlist |

### Admin Setup Wizard (`/admin/setup/`)

| Route | Tab | Description |
|-------|-----|-------------|
| `/admin/setup/affiliate` | **Affiliate Program** | Commission rates, tiers, contests, payout settings (15+ sub-tabs) |
| `/admin/setup/branding` | **Branding** | Logo, colors, company name |
| `/admin/setup/compliance` | **Compliance** | Legal and regulatory settings |
| `/admin/setup/content` | **Content** | Default content settings |
| `/admin/setup/discount-codes` | **Discount Codes** | Create and manage Stripe-synced discount codes |
| `/admin/setup/features` | **Features** | Enable/disable platform features |
| `/admin/setup/funnel` | **Funnel** | Conversion funnel configuration |
| `/admin/setup/integrations` | **Integrations** | Third-party integration settings |
| `/admin/setup/pages` | **Pages** | Marketing page configuration |
| `/admin/setup/palette` | **Color Palette** | Theme and color customization |
| `/admin/setup/passivepost` | **PassivePost Config** | Social module settings, platform toggles, niche guidance, tier definitions |
| `/admin/setup/pricing` | **Pricing** | Subscription plan configuration |
| `/admin/setup/products` | **Products** | Product registry management |
| `/admin/setup/security` | **Security** | Security policies and settings |
| `/admin/setup/social` | **Social** | Social media platform configuration |
| `/admin/setup/support` | **Support** | Support system configuration |
| `/admin/setup/testimonials` | **Testimonials** | Manage customer testimonials |
| `/admin/setup/watermark` | **Watermark** | Content watermark settings |

---

## 2. Affiliate Dashboard Pages

The affiliate dashboard is a standalone experience for content creators who promote PassivePost as affiliates.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/affiliate/dashboard` | **Affiliate Dashboard** | Main dashboard with 11 navigation tabs: Overview, Links, Analytics, Marketing, Resources, Earnings, Contests, Settings, Messages, Support, What's New |
| `/affiliate/join` | **Application** | Public affiliate application form |
| `/affiliate/login` | **Affiliate Login** | Dedicated login page |
| `/affiliate/forgot-password` | **Forgot Password** | Password recovery |
| `/affiliate/set-password` | **Set Password** | Initial password setup after approval |
| `/affiliate/test-links` | **Test Links** | Validate referral link tracking |

---

## 3. User Dashboard Pages

The user dashboard provides customer self-service and billing management.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/dashboard` | **Main Dashboard** | User home with product access and account overview |
| `/billing` | **Billing** | Subscription management, Stripe customer portal |
| `/profile` | **Profile** | Display name, avatar, email management |
| `/security` | **Security** | Password change and account security |
| `/support` | **Support** | Submit and track support tickets |

---

## 4. Social Scheduling Pages

All social scheduling pages live under `/dashboard/social/` with a dedicated sidebar layout.

### Navigation Structure

```
PassivePost Social Dashboard
+-- Dashboard
|   +-- Overview        /dashboard/social/overview
|   +-- Posts            /dashboard/social/posts
|   +-- Queue            /dashboard/social/queue
|   +-- Calendar         /dashboard/social/calendar
+-- Blog
|   +-- Blog Home        /dashboard/social/blog
|   +-- Compose          /dashboard/social/blog/compose
|   +-- Articles         /dashboard/social/blog/posts
+-- Automation           /dashboard/social/automation
+-- Insights
|   +-- Engagement       /dashboard/social/engagement
|   +-- Intelligence     /dashboard/social/intelligence
|   +-- Distribution     /dashboard/social/distribution
|   +-- Revenue & ROI    /dashboard/social/revenue
|   +-- Retention        /dashboard/social/retention
|   +-- Leads            /dashboard/social/leads
+-- Collaborate
|   +-- Approvals        /dashboard/social/collaboration
+-- Setup
    +-- Brand Voice      /dashboard/social/brand
    +-- Accounts         /dashboard/social
    +-- Settings         /dashboard/social/settings
```

### Page Details

| Route | Page Name | Access Level | Description |
|-------|-----------|-------------|-------------|
| `/dashboard/social/overview` | **Overview** | All tiers | Main landing page with usage progress bars, quick stats, coaching card, flywheel health score, Quick Generate button |
| `/dashboard/social/posts` | **Posts** | All tiers | Post management hub with filtering by platform, status, and date range; bulk actions and detail dialogs |
| `/dashboard/social/queue` | **Queue** | All tiers | Scheduled posts ordered by time with reorder, edit, and cancel options |
| `/dashboard/social/calendar` | **Calendar** | All tiers | Month-grid calendar with social and blog posts and per-platform count tooltips |
| `/dashboard/social/blog` | **Blog Home** | All tiers | Blog dashboard with flywheel metrics, connected platforms (WordPress, Ghost), and content pipeline |
| `/dashboard/social/blog/compose` | **Blog Compose** | All tiers | Markdown editor with SEO preview and one-click publish to connected blog platforms |
| `/dashboard/social/blog/posts` | **Blog Articles** | All tiers | Blog post list with status filtering and search |
| `/dashboard/social/automation` | **Automation** | Basic+ | Calendar autopilot, batch repurpose, content recycling, evergreen content, blog-to-thread, cross-post timing, repurpose chains, draft warnings, content decay alerts |
| `/dashboard/social/engagement` | **Engagement** | All tiers | Analytics with Recharts charts, per-platform breakdowns, and best-performing content |
| `/dashboard/social/intelligence` | **Intelligence** | Basic+ | AI content grader, DNA analyzer, topic fatigue, content mix, tone drift, cannibalization, engagement prediction, content briefs |
| `/dashboard/social/distribution` | **Distribution** | Premium | Platform timing optimizer, hashtag tracker, audience personas, competitor gap analysis |
| `/dashboard/social/revenue` | **Revenue & ROI** | Premium | ROI calculator, cost per post, monthly report card, white-label report exports |
| `/dashboard/social/retention` | **Retention** | All tiers | Posting streaks, weekly digest preview, content templates, leaderboard |
| `/dashboard/social/leads` | **Leads** | Basic+ | Lead tracking, gig scanner, reply templates, mini CRM, CSV export |
| `/dashboard/social/collaboration` | **Collaboration** | Premium | Client approval queue and team approval workflows |
| `/dashboard/social/brand` | **Brand Voice** | All tiers | Brand identity settings: tone, niche, location, audience, goals, platforms, frequency, and voice fine-tuner |
| `/dashboard/social` | **Accounts** | All tiers | Connect and disconnect social accounts, validate credentials |
| `/dashboard/social/settings` | **Settings** | All tiers | Notification preferences and module settings |
| `/dashboard/social/onboarding` | **Onboarding** | All tiers | Guided setup wizard for new users |
| `/dashboard/social/affiliate` | **Affiliate** | All tiers | Affiliate integration within social dashboard |

---

## 5. Public Pages

Pages accessible without authentication.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/approve/[token]` | **Client Approval Portal** | External clients review and approve content via unique token |
| `/partner/[slug]` | **Partner Landing Page** | Co-branded affiliate landing pages |
| `/partner/verify/[code]` | **Badge Verification** | Verify affiliate badges |
| `/partners` | **Affiliate Directory** | Public opt-in directory of affiliates with tier badges |
| `/testimonials` | **Testimonials** | Customer and affiliate success stories |
| `/changelog` | **Changelog** | Product update history |
| `/blog` | **Blog** | Public blog |
| `/blog/[slug]` | **Blog Post** | Individual blog articles |

---

## 6. Authentication Pages

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/login` | **Login** | Email/password and OAuth login |
| `/signup` | **Sign Up** | New account registration |
| `/reset-password` | **Reset Password** | Password recovery |
| `/update-password` | **Update Password** | Set new password from reset link |
| `/auth/callback` | **Auth Callback** | OAuth callback handler |
| `/invite/[token]` | **Invitation** | Accept team or organization invitation |

---

## 7. Marketing Pages

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/` | **Home** | Marketing landing page |
| `/about` | **About** | Company information |
| `/contact` | **Contact** | Contact form |
| `/faq` | **FAQ** | Frequently asked questions |
| `/features` | **Features** | Feature overview |
| `/features/[slug]` | **Feature Detail** | Individual feature pages |
| `/pricing` | **Pricing** | Subscription plan comparison |
| `/docs` | **Documentation** | Public documentation |
| `/privacy` | **Privacy Policy** | Privacy policy |
| `/terms` | **Terms of Service** | Terms and conditions |
| `/acceptable-use` | **Acceptable Use** | Acceptable use policy |
| `/accessibility` | **Accessibility** | Accessibility statement |
| `/ai-data-usage` | **AI Data Usage** | AI data handling policy |
| `/cookie-policy` | **Cookie Policy** | Cookie usage policy |
| `/data-handling` | **Data Handling** | Data processing information |
| `/dmca` | **DMCA** | DMCA policy |
| `/security-policy` | **Security Policy** | Security practices |

---

## 8. API Endpoints

### Social Scheduling API (`/api/social/`)

| Category | Key Routes |
|----------|-----------|
| Posts | `posts`, `posts/[id]`, `bulk-import`, `preflight` |
| Accounts | `accounts`, `accounts/[id]`, `accounts/validate`, `connect`, `callback/[platform]`, `redirect` |
| AI | `generate-post` |
| Configuration | `tier`, `brand-preferences`, `posting-preferences`, `brand-voice`, `brand-voice/fine-tune`, `watermark` |
| Blog | `blog/connections`, `blog/connections/[id]`, `blog/connections/validate`, `blog/posts`, `blog/posts/[id]`, `blog/posts/publish`, `blog/repurpose`, `blog/schedule-snippets`, `blog/[id]/snippets` |
| Flywheel | `flywheel/metrics` |
| Intelligence | `intelligence/grade`, `intelligence/content-dna`, `intelligence/topic-fatigue`, `intelligence/content-mix`, `intelligence/tone-drift`, `intelligence/cannibalization`, `intelligence/engagement-prediction`, `intelligence/brief` |
| Automation | `automation/calendar-autopilot`, `automation/batch-repurpose`, `automation/recycling-queue`, `automation/evergreen-scan`, `automation/blog-to-thread`, `automation/crosspost-timing`, `automation/repurpose-chains`, `automation/draft-warnings`, `automation/content-decay`, `automation/hashtag-suggest` |
| Distribution | `distribution/platform-timing`, `distribution/hashtag-tracker`, `distribution/audience-personas`, `distribution/competitor-gap` |
| Revenue | `revenue/roi-calculator`, `revenue/cost-per-post`, `revenue/report-card`, `revenue/export-report` |
| Engagement | `engagement/streak`, `engagement/digest-preview`, `engagement/templates`, `engagement/scorecard/[username]`, `engagement/summary`, `engagement/pull` |
| Collaboration | `collaboration/approval-portal`, `collaboration/approval-action` |
| Leads | `leads/gig-scanner`, `leads/reply-templates`, `leads/manage`, `leads/export` |
| Trends | `trend-alerts`, `trend-alerts/generate` |
| Monitoring | `health`, `debug` |
| Cron | `cron/process-scheduled`, `cron/pull-engagement` |

### Affiliate API (`/api/affiliate/`)

| Category | Key Routes |
|----------|-----------|
| Dashboard | `dashboard`, `profile`, `settings`, `notifications` |
| AI Tools | `ai-coach`, `ai-post-writer`, `ai-email-draft`, `ai-blog-outline`, `ai-video-script`, `ai-objection-handler`, `ai-ad-copy`, `ai-pitch-customizer`, `ai-audience-content`, `ai-promo-ideas`, `ai-onboarding-advisor`, `ai-conversion-optimizer`, `ai-analytics`, `ai-posting-strategy`, `ai-conversion-insights` |
| Analytics | `analytics`, `analytics/charts`, `analytics/churn`, `analytics/cohort`, `analytics/sources`, `analytics/connected-overview`, `analytics/content-intelligence`, `analytics/financial-overview`, `analytics/predictions`, `analytics/expanded`, `analytics/youtube`, `analytics/earnings-projections` |
| Financial | `earnings`, `earnings-statement`, `commissions`, `payouts`, `payout-history`, `payout-schedule`, `payout-batches`, `forecast`, `financial-tools`, `renewals`, `tax-info`, `tax-summary`, `invoice` |
| Marketing | `link-presets`, `link-shortener`, `assets`, `asset-analytics`, `swipe-files`, `sharing-cards`, `media-kit`, `email-templates`, `promotional-calendar`, `discount-codes`, `landing-page`, `landing-page/[slug]` |
| Gamification | `contests`, `contest-leaderboard`, `challenges`, `milestones`, `leaderboard`, `badges`, `badges/verify`, `badges/verify/[code]`, `goals`, `tiers`, `fastest-recognition`, `anniversary` |
| Communication | `messages`, `messages/read`, `notifications`, `whats-new`, `surveys`, `testimonials`, `announcements` |
| Other | `api-keys`, `webhooks`, `webhooks/[id]`, `webhooks/[id]/deliveries`, `webhooks/[id]/test`, `export-csv`, `reports`, `reports/custom-range`, `terms-changelog`, `promotion-quiz`, `analyze-audience`, `auto-promo`, `track-signup`, `transactions`, `referrals`, `members`, `funnel`, `disputes`, `case-studies`, `knowledge-base`, `drip`, `connected-analytics`, `reengagement`, `applications`, `applications/review`, `activate` |
| v1 API | `v1/commissions`, `v1/earnings`, `v1/referrals`, `v1/stats` |

### Admin API (`/api/admin/`)

| Category | Key Routes |
|----------|-----------|
| Users | `users`, `users/[userId]`, `users/[userId]/profile`, `team`, `invitations` |
| Affiliates | `affiliates`, `affiliates/[userId]`, `affiliate/broadcasts`, `affiliate/messages`, `affiliate/messages/[affiliate_id]`, `affiliate/health`, `affiliate/program-intelligence`, `affiliate/payout-receipt`, `affiliate/tax-export`, `affiliate/tax-info`, `affiliate/tax-info/[id]`, `affiliate/tax-info/[id]/verify`, `affiliate/testimonials` |
| Financial | `payouts`, `payouts/[id]`, `payouts/[id]/items`, `invoices`, `invoices/[id]`, `renewals`, `revenue-attribution`, `revenue-waterfall`, `discount-codes` |
| Content | `posts`, `products`, `products/[slug]`, `campaigns`, `case-studies`, `contracts`, `knowledge-base`, `testimonials`, `announcements`, `spotlight` |
| System | `setup`, `settings`, `stats`, `metrics`, `metrics/alerts`, `metrics/report`, `audit-logs`, `queue`, `onboarding`, `email-templates`, `email-templates/test`, `webhooks`, `webhooks/test`, `sso`, `impersonate`, `impersonate/status`, `notes`, `tickets`, `feedback` |

### Other API Routes

| Category | Key Routes |
|----------|-----------|
| Stripe | `stripe/checkout`, `stripe/portal`, `stripe/products`, `stripe/publishable-key`, `stripe/subscription`, `stripe/webhook` |
| Auth | `auth/sso`, `auth/sso/check` |
| AI | `ai/chat`, `ai/providers` |
| Email | `email/send`, `email/drip`, `email/branded-receipt` |
| User | `user/profile`, `user/email-preferences`, `user/invoices`, `user/invoices/[id]`, `user/membership`, `user/payments`, `user/usage-insights` |
| Support | `tickets`, `tickets/[id]`, `tickets/[id]/comments`, `support/chat`, `contact`, `feedback` |
| Public | `public/settings`, `public/stats`, `public/testimonials`, `public/changelog`, `public/affiliate-directory` |
| Cron | `cron/anniversary`, `cron/monthly-earnings`, `cron/scheduled-reports`, `cron/trial-alerts`, `cron/weekly-affiliate-digest`, `cron/weekly-coach`, `cron/weekly-performance`, `cron/weekly-stats`, `cron/whats-new` |

---

## 9. Visual Sitemap

```
/ (Landing Page)
+-- /login, /signup, /reset-password
+-- /about, /contact, /faq, /features, /pricing, /docs
+-- /privacy, /terms, /accessibility, /security-policy, etc.
+-- /blog, /blog/[slug]
+-- /changelog, /testimonials
+-- /partners (Affiliate Directory)
+-- /partner/[slug] (Co-branded Pages)
+-- /approve/[token] (Client Approval Portal)
+-- /invite/[token]
|
+-- /affiliate/ (Affiliate Dashboard)
|   +-- /affiliate/join
|   +-- /affiliate/login
|   +-- /affiliate/dashboard (11 tabs)
|
+-- /dashboard/ (User Dashboard)
|   +-- /billing, /profile, /security, /support
|   +-- /dashboard/social/ (Social Scheduling - 20+ pages)
|       +-- /overview, /posts, /queue, /calendar
|       +-- /blog, /blog/compose, /blog/posts
|       +-- /automation
|       +-- /engagement, /intelligence, /distribution
|       +-- /revenue, /retention, /leads
|       +-- /collaboration
|       +-- /brand, /settings, /onboarding
|       +-- /affiliate
|
+-- /admin/ (Admin Dashboard)
|   +-- /analytics, /audit-logs, /blog
|   +-- /email-templates, /feedback, /metrics
|   +-- /onboarding, /queue, /settings
|   +-- /sso, /team, /users, /waitlist
|   +-- /setup/ (18 configuration tabs)
|
+-- /api/ (200+ API routes)
    +-- /api/social/ (60+ routes)
    +-- /api/affiliate/ (80+ routes)
    +-- /api/admin/ (40+ routes)
    +-- /api/stripe/, /api/ai/, /api/email/
    +-- /api/user/, /api/tickets/
    +-- /api/public/, /api/cron/
    +-- /api/auth/, /api/social/cron/
```

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [PRODUCT_GUIDE.md](./PRODUCT_GUIDE.md) | Complete product reference |
| [FLYWHEEL_MASTER_PLAN.md](./FLYWHEEL_MASTER_PLAN.md) | Content flywheel strategy and all 42 features |
| [USER_GUIDE.md](./USER_GUIDE.md) | Step-by-step end-user documentation |

---
