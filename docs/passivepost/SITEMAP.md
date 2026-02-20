# PassivePost — Sitemap

> **Revision:** 2 | **Last Updated:** February 20, 2026 | **Created:** February 20, 2026

A complete reference of every page, API endpoint, and route in PassivePost.

---

## Table of Contents

1. [Dashboard Pages](#1-dashboard-pages)
2. [Public Pages](#2-public-pages)
3. [Admin Pages](#3-admin-pages)
4. [API Endpoints](#4-api-endpoints)
5. [Shared Pages (MuseKit Core)](#5-shared-pages-musekit-core)

---

## 1. Dashboard Pages

All user-facing PassivePost pages live under `/dashboard/social/`. The dashboard uses a dedicated sidebar layout with navigation grouped into Dashboard, Blog, Automation, Insights, Collaborate, and Setup sections.

### Navigation Structure

```
PassivePost Dashboard
├── Dashboard
│   ├── Overview        /dashboard/social/overview
│   ├── Posts            /dashboard/social/posts
│   ├── Queue            /dashboard/social/queue
│   └── Calendar         /dashboard/social/calendar
├── Blog
│   ├── Blog Home        /dashboard/social/blog
│   ├── Compose          /dashboard/social/blog/compose
│   └── Articles         /dashboard/social/blog/posts
├── Automation           /dashboard/social/automation
├── Insights
│   ├── Engagement       /dashboard/social/engagement
│   ├── Intelligence     /dashboard/social/intelligence
│   ├── Distribution     /dashboard/social/distribution
│   ├── Revenue & ROI    /dashboard/social/revenue
│   ├── Retention        /dashboard/social/retention
│   └── Leads            /dashboard/social/leads
├── Collaborate
│   └── Approvals        /dashboard/social/collaboration
└── Setup
    ├── Brand Voice      /dashboard/social/brand
    ├── Accounts         /dashboard/social
    └── Settings         /dashboard/social/settings
```

### Page Details

| Route | Page Name | Access Level | Description |
|-------|-----------|-------------|-------------|
| `/dashboard/social/overview` | **Overview** | All tiers | Main landing page. Usage progress bars, quick stats (posts created, accounts connected, AI generations used), coaching card with rotating tips, and Quick Generate button. |
| `/dashboard/social/posts` | **Posts** | All tiers | Post management hub. Filter by platform, status, and date range. Bulk actions (delete, reschedule). Click any post to open the detail dialog. |
| `/dashboard/social/queue` | **Queue** | All tiers | Scheduled posts waiting to publish, ordered by time. Reorder, edit, or cancel queued posts. |
| `/dashboard/social/calendar` | **Calendar** | All tiers | Month-grid calendar showing scheduled and published posts. Hover tooltips show per-platform counts per day. |
| `/dashboard/social/blog` | **Blog Home** | All tiers | Blog publishing dashboard with flywheel metrics, connected blog platform management, and blog-to-social content pipeline overview. |
| `/dashboard/social/blog/compose` | **Blog Compose** | All tiers | Full Markdown editor with live SEO preview, meta tag editing, and one-click publish to connected blog platforms. |
| `/dashboard/social/blog/posts` | **Blog Articles** | All tiers | List of all blog posts with status filtering (draft, published, scheduled), search, and bulk actions. |
| `/dashboard/social/automation` | **Automation** | Basic+ | Advanced automation hub: calendar autopilot, batch repurpose, content recycling, evergreen content identifier, blog-to-thread converter, cross-post timing optimizer, repurpose chains, draft expiration warnings, and content decay alerts. |
| `/dashboard/social/engagement` | **Engagement** | All tiers | Analytics dashboard with Recharts charts. Engagement metrics (likes, shares, comments), per-platform breakdowns, best-performing content. |
| `/dashboard/social/intelligence` | **Content Intelligence** | Basic+ | AI-powered content analysis: content grader, content DNA analyzer, topic fatigue detection, content mix optimizer, tone drift monitor, cannibalization detector, engagement prediction, and content brief generator. |
| `/dashboard/social/distribution` | **Distribution Intelligence** | Premium | Platform-specific timing optimizer, hashtag performance tracker, audience persona builder, and competitor content gap analysis. |
| `/dashboard/social/revenue` | **Revenue & ROI** | Premium | Content ROI calculator, cost per post tracking, monthly content report card, and white-label report exports. |
| `/dashboard/social/retention` | **Retention** | All tiers | Streak system, weekly flywheel digest preview, content templates library, and leaderboard. |
| `/dashboard/social/leads` | **Leads** | Basic+ | Lead tracking from social engagement. Contact info, source platform, engagement history, gig scanner, reply templates, lead CRM, and CSV export. |
| `/dashboard/social/collaboration` | **Collaboration** | Premium | Team workflows, client approval queue, and shared content library. Manage content review and approval workflows with external clients. |
| `/dashboard/social/brand` | **Brand Voice** | All tiers | Brand identity configuration: tone, niche, location, sample URLs, audience, goals, platforms, frequency. |
| `/dashboard/social` | **Accounts** | All tiers | Connected account management. Connect/disconnect social accounts, validate credentials, view connection status. |
| `/dashboard/social/settings` | **Settings** | All tiers | PassivePost-specific settings: notification preferences, module configuration. |
| `/dashboard/social/onboarding` | **Onboarding** | All tiers | Guided setup wizard for new users: connect first account, set brand voice, generate first post. |

**Access Level Key:**
- **All tiers** — Available to Starter, Basic, and Premium users
- **Basic+** — Requires Basic or Premium subscription
- **Premium** — Requires Premium subscription only

### Layout

All dashboard pages share a common layout (`src/app/dashboard/social/layout.tsx`) that includes:
- Social sidebar (left)
- Main content area (right)
- Quick Generate floating action button (bottom-right)
- Upgrade banner (top, conditional — appears when usage is 80%+ of any tier limit)

---

## 2. Public Pages

These pages are accessible without authentication.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/approve/[token]` | **Client Approval Portal** | Public page where external clients can review, approve, or reject content submitted for approval. No login required — authenticated via unique token. |

---

## 3. Admin Pages

PassivePost admin configuration is accessible to users with admin roles.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/admin/setup/passivepost` | **PassivePost Config** | Full admin control panel. Module toggle, platform enables/disables, API credentials, niche guidance editor, tier definitions, engagement settings, health checker config. |

### Admin Config Sections

The admin page at `/admin/setup/passivepost` includes these configuration sections:

| Section | What It Controls |
|---------|-----------------|
| Module Toggle | Enable/disable the entire PassivePost module |
| Default Tier | Which tier new users start on |
| Platform Toggles | Enable/disable individual social platforms |
| Platform API Credentials | API keys and secrets for each platform's OAuth |
| Niche Guidance Editor | Add/edit/remove niche-specific AI prompt entries |
| Tier Definitions | Customize tier names and usage limits |
| Engagement Pull Settings | Pull frequency (1–168 hours) and lookback window |
| API Health Checker | Enable/disable, failure threshold, alert settings |

---

## 4. API Endpoints

All PassivePost API routes are under `/api/social/`.

### Post Management

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/posts` | List posts (supports filters: platform, status, date range) |
| `POST` | `/api/social/posts` | Create a new post |
| `GET` | `/api/social/posts/[id]` | Get a single post by ID |
| `PUT` | `/api/social/posts/[id]` | Update a post |
| `DELETE` | `/api/social/posts/[id]` | Delete a post |
| `POST` | `/api/social/bulk-import` | Bulk import multiple posts |

### Account Management

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/accounts` | List all connected social accounts |
| `DELETE` | `/api/social/accounts/[id]` | Disconnect a social account |
| `POST` | `/api/social/accounts/validate` | Validate account credentials are still valid |
| `POST` | `/api/social/connect` | Start OAuth connection flow for a platform |
| `GET` | `/api/social/callback/[platform]` | Handle OAuth callback after user authorization |

### AI & Content Generation

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/social/generate-post` | Generate AI-powered post content using brand voice |

### User Configuration

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/tier` | Get current user's tier info, limits, and usage |
| `GET` | `/api/social/brand-preferences` | Retrieve brand voice settings |
| `PUT` | `/api/social/brand-preferences` | Update brand voice settings |
| `GET` | `/api/social/posting-preferences` | Retrieve posting schedule preferences |
| `PUT` | `/api/social/posting-preferences` | Update posting schedule preferences |

### Monitoring & Debug

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/health` | Platform API health status for all connected platforms |
| `GET` | `/api/social/debug` | Internal debug data (requires `MUSE_DEBUG_MODE=true`) |

### Trend Alerts

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/trend-alerts` | List all trend alerts for the current user |
| `POST` | `/api/social/trend-alerts` | Create or manage trend alert subscriptions |
| `POST` | `/api/social/trend-alerts/generate` | Generate an AI post from a trending topic |

### Cron Jobs (Vercel Scheduled)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/cron/process-scheduled` | Process posts with past `scheduled_at` timestamps |
| `GET` | `/api/social/cron/pull-engagement` | Pull engagement metrics from platform APIs |

### Blog Publishing

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/blog/connections` | List blog platform connections |
| `POST` | `/api/social/blog/connections` | Connect a blog platform |
| `DELETE` | `/api/social/blog/connections/[id]` | Disconnect a blog platform |
| `GET` | `/api/social/blog/posts` | List blog posts |
| `POST` | `/api/social/blog/posts` | Create blog post |
| `GET` | `/api/social/blog/posts/[id]` | Get blog post |
| `PATCH` | `/api/social/blog/posts/[id]` | Update blog post |
| `DELETE` | `/api/social/blog/posts/[id]` | Delete blog post |
| `POST` | `/api/social/blog/repurpose` | AI-generate social snippets from blog post |
| `POST` | `/api/social/blog/schedule-snippets` | Schedule repurposed snippets |
| `GET` | `/api/social/blog/[id]/snippets` | Get snippets for a blog post |

### Flywheel

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/flywheel/metrics` | Flywheel health scores and velocity |

### Content Intelligence (Phase 2)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/social/intelligence/grade` | AI content grader |
| `GET` | `/api/social/intelligence/content-dna` | Best performing content DNA |
| `GET` | `/api/social/intelligence/topic-fatigue` | Topic fatigue detection |
| `GET` | `/api/social/intelligence/content-mix` | Content mix optimizer |
| `GET` | `/api/social/intelligence/tone-drift` | Tone drift monitor |
| `GET` | `/api/social/intelligence/cannibalization` | Content cannibalization detector |
| `POST` | `/api/social/intelligence/engagement-prediction` | Engagement prediction |
| `POST` | `/api/social/intelligence/brief` | Content brief generator |

### Advanced Automation (Phase 3)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/social/automation/calendar-autopilot` | Calendar autopilot |
| `POST` | `/api/social/automation/batch-repurpose` | Batch repurpose |
| `GET` | `/api/social/automation/recycling-queue` | Content recycling queue |
| `GET` | `/api/social/automation/evergreen-scan` | Evergreen content identifier |
| `POST` | `/api/social/automation/blog-to-thread` | Blog-to-thread converter |
| `GET` | `/api/social/automation/crosspost-timing` | Cross-post timing optimizer |
| `POST` | `/api/social/automation/repurpose-chains` | Repurpose chains |
| `GET` | `/api/social/automation/draft-warnings` | Draft expiration warnings |
| `GET` | `/api/social/automation/content-decay` | Content decay alerts |

### Distribution Intelligence (Phase 4)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/distribution/platform-timing` | Platform-specific timing optimizer |
| `GET` | `/api/social/distribution/hashtag-tracker` | Hashtag performance tracker |
| `POST` | `/api/social/distribution/audience-personas` | Audience persona builder |
| `POST` | `/api/social/distribution/competitor-gap` | Competitor content gap analysis |

### Revenue & ROI (Phase 5)

| Method | Route | Description |
|--------|-------|-------------|
| `GET/POST` | `/api/social/revenue/roi-calculator` | Content ROI calculator |
| `GET` | `/api/social/revenue/cost-per-post` | Cost per post tracking |
| `GET` | `/api/social/revenue/report-card` | Monthly content report card |
| `POST` | `/api/social/revenue/export-report` | White-label report export |

### Engagement & Retention (Phase 6)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/social/engagement/streak` | Streak system |
| `GET` | `/api/social/engagement/digest-preview` | Weekly flywheel digest |
| `GET` | `/api/social/engagement/templates` | Content templates library (public) |
| `GET` | `/api/social/engagement/scorecard/[username]` | Public content scorecard |

### Collaboration (Phase 7)

| Method | Route | Description |
|--------|-------|-------------|
| `GET/POST` | `/api/social/collaboration/approval-portal` | Client approval portal |
| `POST` | `/api/social/collaboration/approval-action` | Approve/reject content |

### Bonus Features

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/social/automation/hashtag-suggest` | AI hashtag suggestions |
| `GET/POST` | `/api/social/leads/gig-scanner` | Gig lead scanner |
| `GET/POST` | `/api/social/leads/reply-templates` | Lead reply templates |
| `GET/POST` | `/api/social/brand-voice/fine-tune` | AI voice fine-tuner |
| `GET/POST/PATCH` | `/api/social/leads/manage` | Lead CRM (CRUD) |
| `GET` | `/api/social/leads/export` | Lead CSV export |

---

## 5. Shared Pages (MuseKit Core)

PassivePost users also interact with these MuseKit core pages:

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/` | **Home** | Marketing landing page |
| `/login` | **Login** | Authentication page |
| `/signup` | **Sign Up** | Registration page |
| `/dashboard` | **Main Dashboard** | MuseKit core dashboard (PassivePost is accessible from here) |
| `/profile` | **Profile** | User profile management |
| `/billing` | **Billing** | Stripe customer portal, subscription management |
| `/admin` | **Admin Dashboard** | Admin overview and setup pages |

### Navigation Between Core and PassivePost

- From the **Main Dashboard** (`/dashboard`): Users navigate to PassivePost via a product card or menu link
- From **PassivePost Sidebar**: "Back to Dashboard" link returns to `/dashboard`
- From **PassivePost Sidebar User Menu**: Links to Profile (`/profile`), Billing (`/billing`), Main Site (`/`), and Log Out

---

## Visual Sitemap

```
/ (Landing Page)
├── /login
├── /signup
├── /profile
├── /billing
├── /approve/[token] (Public Client Approval Portal)
├── /dashboard (Main Dashboard)
│   └── /dashboard/social (PassivePost)
│       ├── /dashboard/social/overview
│       ├── /dashboard/social/posts
│       ├── /dashboard/social/queue
│       ├── /dashboard/social/calendar
│       ├── /dashboard/social/blog
│       │   ├── /dashboard/social/blog/compose
│       │   └── /dashboard/social/blog/posts
│       ├── /dashboard/social/automation
│       ├── /dashboard/social/engagement
│       ├── /dashboard/social/intelligence
│       ├── /dashboard/social/distribution
│       ├── /dashboard/social/revenue
│       ├── /dashboard/social/retention
│       ├── /dashboard/social/leads
│       ├── /dashboard/social/collaboration
│       ├── /dashboard/social/brand
│       ├── /dashboard/social/settings
│       └── /dashboard/social/onboarding
├── /admin
│   └── /admin/setup/passivepost
└── /api/social/
    ├── Posts & Bulk
    │   ├── /api/social/posts
    │   ├── /api/social/posts/[id]
    │   └── /api/social/bulk-import
    ├── Accounts & OAuth
    │   ├── /api/social/accounts
    │   ├── /api/social/accounts/[id]
    │   ├── /api/social/accounts/validate
    │   ├── /api/social/connect
    │   └── /api/social/callback/[platform]
    ├── AI & Generation
    │   └── /api/social/generate-post
    ├── Configuration
    │   ├── /api/social/tier
    │   ├── /api/social/brand-preferences
    │   ├── /api/social/posting-preferences
    │   └── /api/social/brand-voice/fine-tune
    ├── Trend Alerts
    │   ├── /api/social/trend-alerts
    │   └── /api/social/trend-alerts/generate
    ├── Blog Publishing
    │   ├── /api/social/blog/connections
    │   ├── /api/social/blog/connections/[id]
    │   ├── /api/social/blog/posts
    │   ├── /api/social/blog/posts/[id]
    │   ├── /api/social/blog/repurpose
    │   ├── /api/social/blog/schedule-snippets
    │   └── /api/social/blog/[id]/snippets
    ├── Flywheel
    │   └── /api/social/flywheel/metrics
    ├── Content Intelligence
    │   ├── /api/social/intelligence/grade
    │   ├── /api/social/intelligence/content-dna
    │   ├── /api/social/intelligence/topic-fatigue
    │   ├── /api/social/intelligence/content-mix
    │   ├── /api/social/intelligence/tone-drift
    │   ├── /api/social/intelligence/cannibalization
    │   ├── /api/social/intelligence/engagement-prediction
    │   └── /api/social/intelligence/brief
    ├── Advanced Automation
    │   ├── /api/social/automation/calendar-autopilot
    │   ├── /api/social/automation/batch-repurpose
    │   ├── /api/social/automation/recycling-queue
    │   ├── /api/social/automation/evergreen-scan
    │   ├── /api/social/automation/blog-to-thread
    │   ├── /api/social/automation/crosspost-timing
    │   ├── /api/social/automation/repurpose-chains
    │   ├── /api/social/automation/draft-warnings
    │   ├── /api/social/automation/content-decay
    │   └── /api/social/automation/hashtag-suggest
    ├── Distribution Intelligence
    │   ├── /api/social/distribution/platform-timing
    │   ├── /api/social/distribution/hashtag-tracker
    │   ├── /api/social/distribution/audience-personas
    │   └── /api/social/distribution/competitor-gap
    ├── Revenue & ROI
    │   ├── /api/social/revenue/roi-calculator
    │   ├── /api/social/revenue/cost-per-post
    │   ├── /api/social/revenue/report-card
    │   └── /api/social/revenue/export-report
    ├── Engagement & Retention
    │   ├── /api/social/engagement/streak
    │   ├── /api/social/engagement/digest-preview
    │   ├── /api/social/engagement/templates
    │   └── /api/social/engagement/scorecard/[username]
    ├── Collaboration
    │   ├── /api/social/collaboration/approval-portal
    │   └── /api/social/collaboration/approval-action
    ├── Leads
    │   ├── /api/social/leads/gig-scanner
    │   ├── /api/social/leads/reply-templates
    │   ├── /api/social/leads/manage
    │   └── /api/social/leads/export
    ├── Monitoring & Debug
    │   ├── /api/social/health
    │   └── /api/social/debug
    └── Cron Jobs
        ├── /api/social/cron/process-scheduled
        └── /api/social/cron/pull-engagement
```

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [OVERVIEW.md](./OVERVIEW.md) | Elevator pitch, target audience, pricing |
| [FEATURES.md](./FEATURES.md) | Deep dive into every feature |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical blueprint: database, APIs, OAuth |
| [USER_GUIDE.md](./USER_GUIDE.md) | How to use PassivePost |
| [FLYWHEEL_MASTER_PLAN.md](./FLYWHEEL_MASTER_PLAN.md) | Content flywheel strategy, phases, and metrics |
| [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md) | Blog publishing pipeline and platform integrations |

---

