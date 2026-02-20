# PassivePost — Sitemap

A complete reference of every page, API endpoint, and route in PassivePost.

---

## Table of Contents

1. [Dashboard Pages](#1-dashboard-pages)
2. [Admin Pages](#2-admin-pages)
3. [API Endpoints](#3-api-endpoints)
4. [Shared Pages (MuseKit Core)](#4-shared-pages-musekit-core)

---

## 1. Dashboard Pages

All user-facing PassivePost pages live under `/dashboard/social/`. The dashboard uses a dedicated sidebar layout with navigation grouped into Dashboard, Insights, and Setup sections.

### Navigation Structure

```
PassivePost Dashboard
├── Dashboard
│   ├── Overview        /dashboard/social/overview
│   ├── Posts            /dashboard/social/posts
│   ├── Queue            /dashboard/social/queue
│   └── Calendar         /dashboard/social/calendar
├── Insights
│   ├── Engagement       /dashboard/social/engagement
│   └── Leads            /dashboard/social/leads
└── Setup
    ├── Brand Voice      /dashboard/social/brand
    ├── Accounts         /dashboard/social
    └── Settings         /dashboard/social/settings
```

### Page Details

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/dashboard/social/overview` | **Overview** | Main landing page. Usage progress bars, quick stats (posts created, accounts connected, AI generations used), coaching card with rotating tips, and Quick Generate button. |
| `/dashboard/social/posts` | **Posts** | Post management hub. Filter by platform, status, and date range. Bulk actions (delete, reschedule). Click any post to open the detail dialog. |
| `/dashboard/social/queue` | **Queue** | Scheduled posts waiting to publish, ordered by time. Reorder, edit, or cancel queued posts. |
| `/dashboard/social/calendar` | **Calendar** | Month-grid calendar showing scheduled and published posts. Hover tooltips show per-platform counts per day. |
| `/dashboard/social/engagement` | **Engagement** | Analytics dashboard with Recharts charts. Engagement metrics (likes, shares, comments), per-platform breakdowns, best-performing content. |
| `/dashboard/social/leads` | **Leads** | Lead tracking from social engagement. Contact info, source platform, engagement history. |
| `/dashboard/social/brand` | **Brand Voice** | Brand identity configuration: tone, niche, location, sample URLs, audience, goals, platforms, frequency. |
| `/dashboard/social` | **Accounts** | Connected account management. Connect/disconnect social accounts, validate credentials, view connection status. |
| `/dashboard/social/settings` | **Settings** | PassivePost-specific settings: notification preferences, module configuration. |
| `/dashboard/social/onboarding` | **Onboarding** | Guided setup wizard for new users: connect first account, set brand voice, generate first post. |

### Layout

All dashboard pages share a common layout (`src/app/dashboard/social/layout.tsx`) that includes:
- Social sidebar (left)
- Main content area (right)
- Quick Generate floating action button (bottom-right)
- Upgrade banner (top, conditional — appears when usage is 80%+ of any tier limit)

---

## 2. Admin Pages

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

## 3. API Endpoints

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

---

## 4. Shared Pages (MuseKit Core)

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
├── /dashboard (Main Dashboard)
│   └── /dashboard/social (PassivePost)
│       ├── /dashboard/social/overview
│       ├── /dashboard/social/posts
│       ├── /dashboard/social/queue
│       ├── /dashboard/social/calendar
│       ├── /dashboard/social/engagement
│       ├── /dashboard/social/leads
│       ├── /dashboard/social/brand
│       ├── /dashboard/social/settings
│       └── /dashboard/social/onboarding
├── /admin
│   └── /admin/setup/passivepost
└── /api/social/
    ├── /api/social/posts
    ├── /api/social/posts/[id]
    ├── /api/social/accounts
    ├── /api/social/accounts/[id]
    ├── /api/social/accounts/validate
    ├── /api/social/connect
    ├── /api/social/callback/[platform]
    ├── /api/social/generate-post
    ├── /api/social/brand-preferences
    ├── /api/social/posting-preferences
    ├── /api/social/tier
    ├── /api/social/bulk-import
    ├── /api/social/trend-alerts
    ├── /api/social/trend-alerts/generate
    ├── /api/social/health
    ├── /api/social/debug
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

---

*Last Updated: February 20, 2026*
