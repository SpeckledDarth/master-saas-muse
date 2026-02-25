# PassivePost — Technical Architecture

A technical reference covering PassivePost's system design, database schema, API surface, OAuth flows, background jobs, AI pipeline, and infrastructure. PassivePost is a closed-loop business intelligence platform for content creators that combines content scheduling, affiliate marketing, connected analytics, and AI coaching.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [The Three Dashboards](#4-the-three-dashboards)
5. [Database Schema](#5-database-schema)
6. [API Routes](#6-api-routes)
7. [OAuth Flows](#7-oauth-flows)
8. [Token Security](#8-token-security)
9. [Background Jobs (BullMQ)](#9-background-jobs-bullmq)
10. [Tier Resolution](#10-tier-resolution)
11. [AI Generation Pipeline](#11-ai-generation-pipeline)
12. [Rate Limiting](#12-rate-limiting)
13. [Email & Notifications](#13-email--notifications)
14. [Cron Endpoints](#14-cron-endpoints)
15. [Scalability](#15-scalability)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel (Hosting)                    │
├─────────────────────────────────────────────────────────┤
│  Next.js 16+ App Router (Frontend + API)                 │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  Core Platform       │  │  PassivePost Product     │  │
│  │  - Auth (Supabase)   │  │  - Social Scheduling     │  │
│  │  - Billing (Stripe)  │  │  - Affiliate Program     │  │
│  │  - Admin Dashboard   │  │  - AI Coaching (xAI)     │  │
│  │  - Email (Resend)    │  │  - Connected Analytics   │  │
│  │  - Queue (BullMQ)    │  │  - Blog Publishing       │  │
│  │  - CRM & Support     │  │  - Content Flywheel      │  │
│  └──────────┬──────────┘  └─────────────┬────────────┘  │
│             │                           │                │
│             ▼                           ▼                │
│  ┌─────────────────────────────────────────────────────┐│
│  │            Supabase (PostgreSQL + Auth)              ││
│  │  Core Tables + Extension Tables + RLS Policies      ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  External Services                                       │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌───────────────┐        │
│  │Stripe│ │ Resend │ │ xAI  │ │ Upstash Redis │        │
│  │      │ │ (email)│ │(Grok)│ │ (BullMQ)      │        │
│  └──────┘ └────────┘ └──────┘ └───────────────┘        │
│  ┌──────────────────────────────────────────────────────┤
│  │ Connected Platform APIs                               │
│  │ Twitter/X · LinkedIn · Facebook · Instagram           │
│  │ Reddit · Discord · YouTube · Pinterest                │
│  │ WordPress · Ghost                                     │
│  └──────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Frontend | React, Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth (email, OAuth, SSO/SAML) |
| Payments | Stripe (subscriptions, webhooks, portal) |
| Email | Resend |
| AI | xAI Grok (`grok-3-mini-fast`) |
| Queue | BullMQ with Upstash Redis |
| Rate Limiting | Upstash Redis sliding window + in-memory fallback |
| Deployment | Vercel |

---

## 3. Directory Structure

```
src/
├── app/
│   ├── (auth)/                          # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── reset-password/
│   │   └── update-password/
│   ├── (dashboard)/                     # User dashboard pages
│   │   ├── billing/
│   │   ├── profile/
│   │   ├── security/
│   │   └── support/
│   ├── (marketing)/                     # Public marketing pages
│   │   ├── about/, contact/, faq/
│   │   ├── features/, pricing/
│   │   ├── docs/, blog/
│   │   ├── privacy/, terms/, etc.
│   │   └── p/[slug]/                    # Dynamic marketing pages
│   ├── admin/                           # Admin dashboard (20+ pages)
│   │   ├── analytics/, audit-logs/
│   │   ├── blog/, email-templates/
│   │   ├── feedback/, metrics/
│   │   ├── onboarding/, queue/
│   │   ├── settings/, sso/
│   │   ├── team/, users/, waitlist/
│   │   └── setup/                       # Admin setup wizard (18 tabs)
│   │       ├── affiliate/, branding/
│   │       ├── compliance/, content/
│   │       ├── discount-codes/, features/
│   │       ├── funnel/, integrations/
│   │       ├── pages/, palette/
│   │       ├── passivepost/, pricing/
│   │       ├── products/, security/
│   │       ├── social/, support/
│   │       ├── testimonials/, watermark/
│   ├── affiliate/                       # Affiliate dashboard
│   │   ├── dashboard/                   # Main dashboard (11 tabs)
│   │   ├── join/                        # Public application page
│   │   ├── login/, forgot-password/
│   │   ├── set-password/
│   │   └── test-links/
│   ├── dashboard/social/               # Social scheduling dashboard (20+ pages)
│   │   ├── overview/, posts/, queue/, calendar/
│   │   ├── blog/, blog/compose/, blog/posts/
│   │   ├── automation/, engagement/
│   │   ├── intelligence/, distribution/
│   │   ├── revenue/, retention/
│   │   ├── leads/, collaboration/
│   │   ├── brand/, settings/, onboarding/
│   │   └── affiliate/
│   ├── approve/[token]/                 # Public client approval page
│   ├── partner/[slug]/                  # Co-branded affiliate pages
│   ├── partners/                        # Public affiliate directory
│   └── api/                             # API routes (200+)
│       ├── admin/                       # Admin API (40+ routes)
│       ├── affiliate/                   # Affiliate API (80+ routes)
│       ├── social/                      # Social scheduling API (60+ routes)
│       ├── stripe/                      # Payment API
│       ├── ai/                          # AI chat API
│       ├── cron/                        # Scheduled job endpoints
│       ├── email/                       # Email sending API
│       ├── tickets/                     # Support ticket API
│       └── user/                        # User self-service API
├── components/
│   ├── admin/                           # Admin UI components
│   ├── affiliate/                       # Affiliate dashboard components
│   ├── analytics/                       # Chart and analytics components
│   ├── social/                          # Social scheduling components
│   ├── landing/                         # Marketing page components
│   ├── layout/                          # Layout components
│   └── ui/                              # shadcn/ui base components
├── hooks/                               # React hooks
├── lib/
│   ├── affiliate/                       # Affiliate program logic
│   ├── ai/                              # AI provider (xAI Grok)
│   ├── social/                          # Social scheduling logic
│   │   ├── types.ts                     # TypeScript types
│   │   ├── client.ts                    # Platform API clients
│   │   ├── blog-clients.ts             # WordPress, Ghost clients
│   │   ├── user-tier.ts                # Tier resolution
│   │   ├── rate-limits.ts              # Usage enforcement
│   │   ├── token-refresh.ts            # OAuth token refresh
│   │   ├── queue-jobs.ts               # Background job definitions
│   │   └── crypto.ts                   # Token encryption
│   ├── stripe/                          # Stripe integration
│   ├── supabase/                        # Database helpers
│   ├── email/                           # Email utilities
│   ├── queue/                           # BullMQ queue system
│   ├── products/                        # Product registry
│   ├── settings/                        # Settings management
│   └── validation/                      # Input validation
└── types/                               # Shared TypeScript types

migrations/
├── core/                                # Core platform tables
└── extensions/                          # Product-specific tables
```

---

## 4. The Three Dashboards

PassivePost's UI is organized into three separate dashboard experiences:

### Admin Dashboard (`/admin/`)
For platform owners and administrators:
- User management with role assignment
- Affiliate program configuration (15+ setup tabs)
- Revenue attribution and waterfall reports
- Audit logging and metrics alerts
- Email template management
- Queue monitoring
- SSO/SAML configuration

### Affiliate Dashboard (`/affiliate/dashboard`)
A standalone business command center for content creators:
- 11 navigation tabs covering all affiliate operations
- Performance analytics with charts and sparklines
- AI coaching and 14+ AI-powered tools
- Marketing toolkit (links, QR codes, media kit, sharing cards)
- Financial tools (payouts, tax prep, earnings forecasts)
- Contest participation and leaderboard
- Knowledge base and promotional calendar

### User Dashboard (`/dashboard/`)
Customer self-service hub:
- Invoice history and subscription management
- Support tickets with comment threads
- Account security settings
- Usage insights
- Email preference management
- Social scheduling access (`/dashboard/social/`)

---

## 5. Database Schema

### Core Tables

#### `social_accounts`
Stores connected social media account credentials.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | TEXT | Platform name (twitter, linkedin, facebook, instagram, reddit, discord, youtube, pinterest) |
| `platform_user_id` | TEXT | User's ID on the external platform |
| `platform_username` | TEXT | Username on the external platform |
| `display_name` | TEXT | Display name |
| `access_token_encrypted` | TEXT | Encrypted OAuth access token |
| `refresh_token_encrypted` | TEXT | Encrypted OAuth refresh token |
| `token_expires_at` | TIMESTAMPTZ | Access token expiration |
| `scopes` | TEXT[] | Granted OAuth scopes |
| `is_valid` | BOOLEAN | Whether credentials are valid |
| `last_validated_at` | TIMESTAMPTZ | Last successful validation |
| `last_error` | TEXT | Most recent error message |
| `connected_at` | TIMESTAMPTZ | Connection timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

Unique constraint: `(user_id, platform)` — one account per platform per user.

#### `social_posts`
Stores all social media posts with content, status, and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | TEXT | Target platform |
| `content` | TEXT | Post content |
| `media_urls` | TEXT[] | Attached media URLs |
| `status` | TEXT | draft, scheduled, queued, approved, posting, posted, failed, ignored |
| `scheduled_at` | TIMESTAMPTZ | When to publish |
| `posted_at` | TIMESTAMPTZ | When published |
| `platform_post_id` | TEXT | Post ID on external platform |
| `engagement_data` | JSONB | Engagement metrics |
| `error_message` | TEXT | Error details if failed |
| `ai_generated` | BOOLEAN | Whether AI-generated |
| `brand_voice` | TEXT | Brand voice used |
| `trend_source` | TEXT | Where the idea originated |
| `niche_triggered` | TEXT | Which niche prompted content |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

#### `blog_connections`
Stores blog platform credentials and connection status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | TEXT | Blog platform (wordpress, ghost) |
| `credentials_encrypted` | TEXT | Encrypted API keys/tokens |
| `platform_username` | TEXT | Username on blog platform |
| `blog_url` | TEXT | URL of the blog |
| `is_valid` | BOOLEAN | Whether credentials are valid |
| `connected_at` | TIMESTAMPTZ | Connection timestamp |

#### `blog_posts`
Stores blog articles with content, SEO metadata, and cross-post status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `title` | TEXT | Article title |
| `content` | TEXT | Markdown content |
| `excerpt` | TEXT | Article summary |
| `seo_title` | TEXT | SEO-optimized title |
| `seo_description` | TEXT | Meta description |
| `slug` | TEXT | URL slug |
| `status` | TEXT | draft, scheduled, publishing, published, failed |
| `platforms` | JSONB | Cross-post targets and status per platform |
| `series_name` | TEXT | Content series grouping |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `published_at` | TIMESTAMPTZ | Publication timestamp |

#### `brand_preferences`
Stores each user's brand identity configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `tone` | TEXT | Voice style (default: 'professional') |
| `niche` | TEXT | Business category |
| `location` | TEXT | Geographic area |
| `sample_urls` | TEXT[] | Reference content URLs |
| `target_audience` | TEXT | Ideal customer description |
| `posting_goals` | TEXT | Goals for social media |
| `preferred_platforms` | TEXT[] | Priority platforms |
| `post_frequency` | TEXT | Posting cadence |

#### Affiliate Tables

| Table | Purpose |
|-------|---------|
| `affiliate_profiles` | Affiliate account data, quiz results, directory visibility |
| `affiliate_links` | Referral links with source tags |
| `referral_clicks` | Click tracking with device and geo data |
| `affiliate_referrals` | Referral records linking affiliates to customers |
| `affiliate_commissions` | Commission calculations and status |
| `affiliate_payouts` | Payout batches and processing status |
| `affiliate_payout_items` | Individual items within payout batches |
| `affiliate_settings` | Program-wide configuration |
| `affiliate_tiers` | Performance tier definitions |
| `affiliate_milestones` | Milestone threshold definitions |
| `affiliate_milestone_awards` | Awarded milestones per affiliate |
| `affiliate_contests` | Contest definitions with prizes |
| `affiliate_contest_entries` | Contest participation records |
| `challenge_progress` | Weekly challenge tracking |
| `affiliate_broadcasts` | Broadcast email records |
| `affiliate_broadcast_receipts` | Email delivery tracking |
| `affiliate_messages` | Admin-affiliate messaging threads |
| `affiliate_surveys` | Satisfaction survey definitions |
| `affiliate_survey_responses` | Survey response data |
| `affiliate_short_links` | Shortened referral URLs |
| `affiliate_landing_pages` | Co-branded partner pages |
| `affiliate_assets` | Marketing asset library |
| `affiliate_asset_usage` | Asset download/usage tracking |
| `affiliate_tax_info` | W-9/W-8BEN tax form data |
| `discount_codes` | Branded discount codes synced with Stripe |
| `discount_code_redemptions` | Code usage tracking |
| `knowledge_base_articles` | Help documentation for affiliates |
| `promotional_calendar` | Upcoming campaign schedules |
| `commission_renewals` | Extended commission windows |

### Row Level Security (RLS)
All user-facing tables have RLS enabled. Users can only access their own data. Supabase enforces RLS at the database level, below the application layer.

---

## 6. API Routes

PassivePost has 200+ API routes organized by system:

### Social Scheduling API (`/api/social/`)

| Category | Routes | Description |
|----------|--------|-------------|
| Post Management | `posts`, `posts/[id]`, `bulk-import` | CRUD for social posts |
| Account Management | `accounts`, `accounts/[id]`, `accounts/validate`, `connect`, `callback/[platform]` | OAuth connections |
| AI & Content | `generate-post` | AI post generation |
| Configuration | `tier`, `brand-preferences`, `posting-preferences`, `brand-voice/fine-tune` | User settings |
| Blog Publishing | `blog/connections`, `blog/posts`, `blog/repurpose`, `blog/schedule-snippets` | Blog cross-posting |
| Flywheel | `flywheel/metrics` | Flywheel health scores |
| Intelligence | `intelligence/grade`, `content-dna`, `topic-fatigue`, `content-mix`, `tone-drift`, `cannibalization`, `engagement-prediction`, `brief` | Content analysis |
| Automation | `automation/calendar-autopilot`, `batch-repurpose`, `recycling-queue`, `evergreen-scan`, `blog-to-thread`, `crosspost-timing`, `repurpose-chains`, `draft-warnings`, `content-decay`, `hashtag-suggest` | Content automation |
| Distribution | `distribution/platform-timing`, `hashtag-tracker`, `audience-personas`, `competitor-gap` | Distribution optimization |
| Revenue | `revenue/roi-calculator`, `cost-per-post`, `report-card`, `export-report` | ROI tracking |
| Engagement | `engagement/streak`, `digest-preview`, `templates`, `scorecard/[username]`, `summary`, `pull` | Engagement features |
| Collaboration | `collaboration/approval-portal`, `approval-action` | Client approvals |
| Leads | `leads/gig-scanner`, `reply-templates`, `manage`, `export` | Lead management |
| Monitoring | `health`, `debug` | Platform health |
| Cron | `cron/process-scheduled`, `cron/pull-engagement` | Scheduled tasks |

### Affiliate API (`/api/affiliate/`)
80+ routes covering:
- Dashboard data and statistics
- AI tools (14+ endpoints)
- Analytics (churn, cohort, sources, connected-overview, content-intelligence, financial-overview, predictions, charts, youtube, earnings-projections)
- Financial tools (payouts, payout-history, tax-info, tax-summary, earnings, earnings-statement, forecast, renewals, financial-tools)
- Marketing toolkit (link-presets, link-shortener, assets, asset-analytics, swipe-files, sharing-cards, media-kit, email-templates, promotional-calendar)
- Communication (messages, notifications, whats-new, surveys, testimonials)
- Gamification (contests, challenges, milestones, leaderboard, badges, goals, tiers)
- Profile and settings (profile, settings, api-keys, webhooks)

### Admin API (`/api/admin/`)
40+ routes covering:
- User and team management
- Affiliate program administration
- Revenue reports and attribution
- Email template management
- Metrics and audit logs
- Queue monitoring

---

## 7. OAuth Flows

### Implemented OAuth Providers

#### Twitter/X (OAuth 2.0 with PKCE)
1. User clicks "Connect Twitter" on the Accounts page
2. `POST /api/social/connect` generates a PKCE code challenge and state parameter
3. User is redirected to Twitter's authorization page
4. After authorization, Twitter redirects to `/api/social/callback/twitter`
5. The callback exchanges the authorization code for access + refresh tokens
6. Tokens are encrypted and stored in `social_accounts`

#### LinkedIn (OAuth 2.0 with PKCE)
Same flow as Twitter, using LinkedIn's OAuth endpoints and requesting posting scopes.

#### Facebook (OAuth 2.0 — Page Access)
1. User clicks "Connect Facebook"
2. `POST /api/social/connect` initiates the OAuth flow requesting page-level permissions
3. After authorization, the callback retrieves the user's page access token
4. The page token (which doesn't expire) is encrypted and stored

#### Additional Platforms
Instagram, YouTube, Reddit, Discord, and Pinterest use platform-specific OAuth flows through the same connection infrastructure.

---

## 8. Token Security

### Encryption
OAuth tokens are encrypted before database storage using AES-256-GCM via `src/lib/social/crypto.ts`. The encryption key is stored as the `SOCIAL_ENCRYPTION_KEY` environment variable.

Blog platform API keys (WordPress app passwords, Ghost admin API keys) are encrypted using the same `encryptToken()` / `decryptToken()` functions before storage in `blog_connections.credentials_encrypted`.

### Token Refresh
`src/lib/social/token-refresh.ts` automatically refreshes expired access tokens when platform API calls are made. If a refresh fails, the account is marked as invalid (`is_valid = false`) with an error message.

### Validation
The `/api/social/accounts/validate` endpoint tests whether stored credentials can still make API calls. The Accounts page shows validation status for each connected account.

---

## 9. Background Jobs (BullMQ)

PassivePost uses BullMQ with Upstash Redis for background job processing. There are 4 social-specific job types:

| Job Type | Purpose | Retry Policy |
|----------|---------|--------------|
| `social-post` | Deliver scheduled posts to platform APIs | 3 retries, exponential backoff |
| `social-health-check` | Monitor platform API connectivity | Standard retry |
| `social-trend-monitor` | Track trending topics across platforms | Standard retry |
| `social-engagement-pull` | Fetch engagement metrics from APIs | Standard retry |

### Job Flow (Post Publishing)
1. User schedules a post — status becomes `scheduled`
2. Cron endpoint or scheduler picks up due posts — status becomes `queued`
3. `social-post` job attempts delivery — status becomes `posting`
4. On success — status becomes `posted`, `platform_post_id` and `posted_at` are set
5. On failure — retry with exponential backoff; after 3 failures — status becomes `failed` with `error_message`

---

## 10. Tier Resolution

Tier resolution determines a user's subscription level and enforces usage limits:

1. Look up the user's Stripe subscription
2. Check subscription metadata for tier information
3. Match against admin-configured tier definitions
4. Fall back to `DEFAULT_TIER_DEFINITIONS` in `src/lib/social/types.ts`
5. Return the corresponding `TierLimits`
6. If nothing matches, default to Starter tier

### Tier Definitions Source
Tier definitions are loaded from:
1. **Admin-configured**: Stored in organization settings
2. **Default fallback**: `DEFAULT_TIER_DEFINITIONS` in `src/lib/social/types.ts`

---

## 11. AI Generation Pipeline

### Architecture
All AI features use the xAI Grok model (`grok-3-mini-fast`) via the `XAI_API_KEY` environment variable.

### Content Generation Flow
1. `POST /api/social/generate-post` receives the request
2. User's brand preferences are loaded from the database
3. Niche guidance text is retrieved (if a niche is selected)
4. A system prompt is constructed combining brand voice, niche guidance, platform constraints, and image context
5. The xAI Grok model generates the content
6. The response is returned to the user

### Affiliate AI Tools
14+ AI-powered tools for affiliates, each pulling real user data:
- AI Coach pulls from commissions, tiers, contests, milestones, leaderboard rank, and connected platform metrics
- AI Post Writer generates platform-specific content with referral links embedded
- AI Analytics generates six insight types using actual performance data
- Promotion Strategy Quiz results are saved to `affiliate_profiles.quiz_results` for future AI context

---

## 12. Rate Limiting

### Tier-Based Limits
Usage is enforced per-user based on their subscription tier:
- Daily AI generations
- Daily posts
- Monthly posts
- Maximum connected platforms

Checks happen before every post creation and AI generation request. Exceeded limits return a `429` response.

### API Rate Limiting
API endpoints are protected by `src/lib/social/api-rate-limiter.ts`, which uses Upstash Redis sliding window rate limiting with an in-memory fallback when Redis is unavailable.

---

## 13. Email & Notifications

### Email System (Resend)
| Type | Description |
|------|-------------|
| Transactional | Signup confirmations, password resets, payment receipts |
| Drip Sequences | 3-email affiliate onboarding series |
| Weekly Digests | Performance summaries for affiliates |
| Monthly Statements | Formatted earnings summaries |
| Broadcasts | Admin announcements to affiliate segments |
| Alert Emails | Post failures, trend detections, usage warnings, trial expiry |

### In-App Notifications
- Real-time notification bell with unread badges
- Upgrade banners when approaching tier limits
- Post failure indicators
- Contest and milestone alerts

### Automated Cron Emails
| Endpoint | Purpose |
|----------|---------|
| `/api/cron/weekly-performance` | Weekly affiliate performance email |
| `/api/cron/monthly-earnings` | Monthly earnings statement |
| `/api/cron/weekly-affiliate-digest` | Comprehensive weekly digest |
| `/api/cron/trial-alerts` | Trial expiry warnings |
| `/api/cron/weekly-coach` | AI coaching recommendations |
| `/api/cron/weekly-stats` | Weekly stats summary |
| `/api/cron/scheduled-reports` | Admin revenue reports |

---

## 14. Cron Endpoints

For serverless deployments on Vercel, cron endpoints provide scheduled task execution:

| Endpoint | Purpose |
|----------|---------|
| `/api/social/cron/process-scheduled` | Process posts with past `scheduled_at` timestamps |
| `/api/social/cron/pull-engagement` | Pull engagement metrics from platform APIs |
| `/api/cron/anniversary` | Affiliate anniversary recognition |
| `/api/cron/whats-new` | Feature update notifications |

---

## 15. Scalability

### Database Scalability
- **Row Level Security (RLS)** provides data isolation in a multi-tenant environment
- **Indexes** on frequently queried columns (`user_id`, `status`, `scheduled_at`) maintain performance as data grows

### Queue Scalability
- **Horizontal scaling**: Multiple workers can process jobs concurrently
- **Retry with backoff**: Failed jobs retry with exponential backoff
- **Rate limiting**: Tier-based caps prevent any single user from overwhelming the queue
- **Serverless fallback**: Cron endpoints provide equivalent functionality on Vercel

### High-Volume Use Cases
- **Batch operations** process multiple items in a single request
- **Content recycling** and **calendar autopilot** run as background processes
- **White-label report exports** are generated server-side

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [OVERVIEW.md](./OVERVIEW.md) | Product overview and positioning |
| [FEATURES.md](./FEATURES.md) | Detailed feature breakdown |
| [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md) | Blog cross-posting details |

---
