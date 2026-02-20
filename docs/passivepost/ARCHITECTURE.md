# PassivePost — Technical Architecture

A technical reference covering PassivePost's system design, database schema, API surface, OAuth flows, background jobs, and how it integrates with the MuseKit template.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Extension Pattern](#3-extension-pattern)
4. [Directory Structure](#4-directory-structure)
5. [Database Schema](#5-database-schema)
6. [API Routes](#6-api-routes)
7. [OAuth Flows](#7-oauth-flows)
8. [Token Security](#8-token-security)
9. [Background Jobs (BullMQ)](#9-background-jobs-bullmq)
10. [Tier Resolution](#10-tier-resolution)
11. [AI Generation Pipeline](#11-ai-generation-pipeline)
12. [Rate Limiting](#12-rate-limiting)
13. [Email Notifications](#13-email-notifications)
14. [n8n Workflow Templates](#14-n8n-workflow-templates)
15. [Cron Endpoints (Vercel)](#15-cron-endpoints-vercel)
16. [Testing](#16-testing)
17. [Scalability](#17-scalability)

---

## 1. System Overview

PassivePost is a product extension built on the MuseKit SaaS template. It adds social media management capabilities without modifying any MuseKit core code.

```
┌─────────────────────────────────────────────────┐
│                  Vercel (Hosting)                │
├─────────────────────────────────────────────────┤
│  Next.js App Router (Frontend + API)            │
│  ┌───────────────────┐  ┌────────────────────┐  │
│  │  MuseKit Core     │  │  PassivePost       │  │
│  │  - Auth           │  │  - Social API      │  │
│  │  - Billing        │  │  - AI Generation   │  │
│  │  - Admin          │  │  - Platform Clients │  │
│  │  - Email          │  │  - Brand Voice     │  │
│  │  - Queue          │  │  - Analytics       │  │
│  └───────┬───────────┘  └────────┬───────────┘  │
│          │                       │               │
│          ▼                       ▼               │
│  ┌───────────────────────────────────────────┐  │
│  │          Supabase (PostgreSQL + Auth)      │  │
│  │  ┌─────────────┐  ┌────────────────────┐  │  │
│  │  │ Core Tables  │  │ Extension Tables   │  │  │
│  │  │ (profiles,   │  │ (brand_preferences,│  │  │
│  │  │  social_     │  │  alert_logs,       │  │  │
│  │  │  accounts,   │  │  social_posts      │  │  │
│  │  │  social_     │  │  extensions)       │  │  │
│  │  │  posts)      │  │                    │  │  │
│  │  └─────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  External Services                               │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌───────────────┐│
│  │Stripe│ │ Resend │ │ xAI/ │ │ Upstash Redis ││
│  │      │ │ (email)│ │OpenAI│ │ (BullMQ)      ││
│  └──────┘ └────────┘ └──────┘ └───────────────┘│
│  ┌──────────────────────────────────────────────┤
│  │ Social Platform APIs                          │
│  │ Twitter/X · LinkedIn · Facebook · Instagram  │
│  │ YouTube · TikTok · Reddit · Pinterest        │
│  │ Snapchat · Discord                           │
│  └──────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Frontend | React 18+, Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth (email, OAuth, SSO/SAML) |
| Payments | Stripe (subscriptions, webhooks, portal) |
| Email | Resend |
| AI | xAI, OpenAI, or Anthropic (pluggable) |
| Queue | BullMQ with Upstash Redis |
| Rate Limiting | Upstash Redis sliding window + in-memory fallback |
| Hosting | Vercel |

---

## 3. Extension Pattern

PassivePost demonstrates MuseKit's database extension pattern. The key principles:

### One-Way Dependencies
PassivePost imports from MuseKit core (`@/lib/products`, `@/lib/supabase`, `@/lib/stripe`, `@/lib/queue`), but MuseKit core never imports from PassivePost. The core remains product-agnostic.

### Scoped Code
All PassivePost code lives in clearly named directories (see Section 4). No PassivePost logic is scattered across core files.

### Extension Migrations
Database changes are separated:
- **Core tables** (`migrations/core/`): Shared infrastructure, never modified by extensions
- **Extension tables** (`migrations/extensions/`): Product-specific tables and column additions

### Clean Removal
To remove PassivePost from a MuseKit clone:
1. Delete all `/social/` directories
2. Delete `migrations/extensions/` files
3. Delete `src/app/admin/setup/passivepost/`
4. No core files need modification

### Product-Scoped Types
All PassivePost TypeScript types live in `src/lib/social/types.ts`, not in core type files.

---

## 4. Directory Structure

```
src/
├── app/
│   ├── dashboard/social/              # Dashboard pages (17+ pages)
│   │   ├── layout.tsx                 # Social dashboard layout with sidebar
│   │   ├── page.tsx                   # Accounts management page
│   │   ├── overview/page.tsx          # Overview dashboard
│   │   ├── posts/page.tsx             # Post management
│   │   ├── queue/page.tsx             # Post queue
│   │   ├── calendar/page.tsx          # Content calendar
│   │   ├── engagement/page.tsx        # Analytics
│   │   ├── leads/page.tsx             # Lead tracking + CRM
│   │   ├── brand/page.tsx             # Brand voice config + voice fine-tuner
│   │   ├── settings/page.tsx          # Module settings
│   │   ├── onboarding/page.tsx        # Setup wizard
│   │   ├── blog/page.tsx              # Blog home dashboard
│   │   ├── blog/compose/page.tsx      # Blog article editor
│   │   ├── blog/posts/page.tsx        # Blog article list
│   │   ├── intelligence/page.tsx      # Content intelligence (Phase 2)
│   │   ├── automation/page.tsx        # Advanced automation (Phase 3)
│   │   ├── distribution/page.tsx      # Distribution intelligence (Phase 4)
│   │   ├── revenue/page.tsx           # Revenue & ROI (Phase 5)
│   │   ├── retention/page.tsx         # Engagement & retention (Phase 6)
│   │   └── collaboration/page.tsx     # Collaboration & approvals (Phase 7)
│   ├── approve/[token]/page.tsx       # Public client approval page
│   ├── api/social/                    # API routes (60+ endpoints)
│   │   ├── accounts/                  # Account CRUD + validation
│   │   ├── posts/                     # Post CRUD
│   │   ├── connect/                   # OAuth initiation
│   │   ├── callback/[platform]/       # OAuth callbacks
│   │   ├── generate-post/             # AI generation
│   │   ├── brand-preferences/         # Brand voice API
│   │   ├── brand-voice/fine-tune/     # AI voice fine-tuner
│   │   ├── posting-preferences/       # Posting schedule API
│   │   ├── tier/                      # Tier info
│   │   ├── bulk-import/               # Bulk post import
│   │   ├── trend-alerts/              # Trend monitoring
│   │   ├── health/                    # Platform health check
│   │   ├── debug/                     # Debug mode
│   │   ├── cron/                      # Scheduled task endpoints
│   │   ├── blog/                      # Blog publishing (connections, posts, repurpose, snippets)
│   │   ├── flywheel/                  # Flywheel metrics
│   │   ├── intelligence/              # Content intelligence (8 endpoints)
│   │   ├── automation/                # Advanced automation (10 endpoints incl. hashtag-suggest)
│   │   ├── distribution/             # Distribution intelligence (4 endpoints)
│   │   ├── revenue/                   # Revenue & ROI (4 endpoints)
│   │   ├── engagement/               # Engagement & retention (4 endpoints)
│   │   ├── collaboration/            # Collaboration (2 endpoints)
│   │   └── leads/                     # Lead management (gig-scanner, manage, export, reply-templates)
│   └── admin/setup/passivepost/       # Admin configuration page
├── components/social/                 # UI components (10+ components)
│   ├── social-sidebar.tsx             # Dashboard sidebar navigation
│   ├── coaching-card.tsx              # Motivational tips card
│   ├── platform-icon.tsx              # Platform icons with brand colors
│   ├── post-detail-dialog.tsx         # Post detail overlay
│   ├── post-preview.tsx               # Compact post preview
│   ├── quick-generate-fab.tsx         # Floating AI generate button
│   ├── bulk-import.tsx                # Bulk import UI
│   ├── help-tooltip.tsx               # Contextual help tooltips
│   └── lead-crm.tsx                   # Lead CRM component (tags, notes, export)
└── lib/social/                        # Business logic (14 files)
    ├── types.ts                       # All TypeScript types and defaults
    ├── client.ts                      # Platform API clients (10 platforms)
    ├── user-tier.ts                   # Tier resolution via Product Registry
    ├── rate-limits.ts                 # Tier-based usage enforcement
    ├── api-rate-limiter.ts            # API endpoint rate limiting
    ├── token-refresh.ts               # OAuth token refresh
    ├── queue-jobs.ts                  # BullMQ job definitions
    ├── trend-alerts.ts                # Trend monitoring logic
    ├── email-notifications.ts         # Social email notifications
    ├── crypto.ts                      # Token encryption utilities
    ├── debug.ts                       # Debug mode support
    ├── demo-data.ts                   # Development mock data
    ├── schema.sql                     # Core social_accounts schema
    ├── posts.sql                      # Core social_posts schema
    └── n8n-templates/                 # Automation workflow templates
        ├── index.ts                   # Template registry
        ├── auto-post-rss.json
        ├── ai-generate-and-schedule.json
        ├── engagement-monitor.json
        ├── trend-monitor.json
        └── alert-and-approve.json

migrations/
├── core/
│   └── 001_social_tables.sql          # Core social_accounts + social_posts
└── extensions/
    ├── 001_passivepost_tables.sql      # brand_preferences, alert_logs, post extensions
    └── 002_engagement_metrics_placeholder.sql  # Future normalized metrics (commented out)
```

---

## 5. Database Schema

### Core Tables

#### `social_accounts`
Stores connected social media account credentials.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | TEXT | Platform name (twitter, linkedin, etc.) |
| `platform_user_id` | TEXT | User's ID on the external platform |
| `platform_username` | TEXT | Username on the external platform |
| `display_name` | TEXT | Display name on the external platform |
| `access_token_encrypted` | TEXT | Encrypted OAuth access token |
| `refresh_token_encrypted` | TEXT | Encrypted OAuth refresh token |
| `token_expires_at` | TIMESTAMPTZ | When the access token expires |
| `scopes` | TEXT[] | Granted OAuth scopes |
| `is_valid` | BOOLEAN | Whether credentials are currently valid |
| `last_validated_at` | TIMESTAMPTZ | Last successful validation |
| `last_error` | TEXT | Most recent error message |
| `connected_at` | TIMESTAMPTZ | When the account was connected |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

Unique constraint: `(user_id, platform)` — one account per platform per user.

#### `social_posts`
Stores all social media posts with their content, status, and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | TEXT | Target platform |
| `content` | TEXT | Post content |
| `media_urls` | TEXT[] | Attached media URLs |
| `status` | TEXT | Post status (draft, scheduled, queued, approved, posting, posted, failed, ignored) |
| `scheduled_at` | TIMESTAMPTZ | When to publish |
| `posted_at` | TIMESTAMPTZ | When it was published |
| `platform_post_id` | TEXT | Post ID on the external platform |
| `engagement_data` | JSONB | Engagement metrics (likes, shares, comments, etc.) |
| `error_message` | TEXT | Error details if publishing failed |
| `ai_generated` | BOOLEAN | Whether content was AI-generated |
| `brand_voice` | TEXT | Brand voice used for generation |
| `trend_source` | TEXT | Where the post idea originated *(extension column)* |
| `niche_triggered` | TEXT | Which niche prompted the content *(extension column)* |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

Composite index: `(user_id, status)` for fast queue and status views.

### Extension Tables

#### `brand_preferences`
Stores each user's brand identity configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `org_id` | UUID | Optional organization context |
| `tone` | TEXT | Voice style (default: 'professional') |
| `niche` | TEXT | Business category (default: 'other') |
| `location` | TEXT | Geographic area |
| `sample_urls` | TEXT[] | Reference content URLs |
| `target_audience` | TEXT | Ideal customer description |
| `posting_goals` | TEXT | What user wants to achieve |
| `preferred_platforms` | TEXT[] | Priority platforms |
| `post_frequency` | TEXT | Posting cadence (default: 'daily') |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

Unique constraint: `(user_id)` — one brand preference set per user.

#### `alert_logs`
Stores trend alert history and actions taken.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `org_id` | UUID | Optional organization context |
| `trend_text` | TEXT | Description of the trend |
| `suggested_post_id` | UUID | References `social_posts(id)` |
| `action_taken` | TEXT | What the user did (approved, ignored, etc.) |
| `platform` | TEXT | Platform where the trend was detected |
| `source_url` | TEXT | URL to the trending content |
| `created_at` | TIMESTAMPTZ | When the alert was created |

Index: `(user_id, created_at DESC)` for chronological alert feeds.

#### `blog_connections` (Extension — `migrations/extensions/003_blog_publishing_tables.sql`)
Stores blog platform credentials and connection status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | TEXT | Blog platform (medium, wordpress, ghost, linkedin, substack) |
| `credentials_encrypted` | TEXT | Encrypted API keys/tokens |
| `platform_username` | TEXT | Username on blog platform |
| `blog_url` | TEXT | URL of the blog |
| `is_valid` | BOOLEAN | Whether credentials are valid |
| `connected_at` | TIMESTAMPTZ | Connection timestamp |

#### `blog_posts` (Extension — `migrations/extensions/003_blog_publishing_tables.sql`)
Stores blog articles with content, SEO metadata, and cross-post status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `title` | TEXT | Article title |
| `content` | TEXT | Markdown content |
| `excerpt` | TEXT | Article excerpt/summary |
| `seo_title` | TEXT | SEO-optimized title |
| `seo_description` | TEXT | Meta description |
| `slug` | TEXT | URL slug |
| `status` | TEXT | draft, scheduled, publishing, published, failed |
| `platforms` | JSONB | Cross-post targets and status per platform |
| `series_name` | TEXT | Optional content series grouping |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `published_at` | TIMESTAMPTZ | Publication timestamp |

### Row Level Security (RLS)
All tables have RLS enabled. Users can only access their own data:
- `social_accounts`: Users view/manage their own connected accounts
- `social_posts`: Users view/manage their own posts
- `brand_preferences`: Users view/manage their own brand settings
- `alert_logs`: Users view/create their own alert entries

---

## 6. API Routes

All PassivePost API routes are under `/api/social/`.

### Post Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/posts` | List posts with optional filters (platform, status, date range) |
| `POST` | `/api/social/posts` | Create a new post |
| `GET` | `/api/social/posts/[id]` | Get a single post by ID |
| `PUT` | `/api/social/posts/[id]` | Update a post |
| `DELETE` | `/api/social/posts/[id]` | Delete a post |
| `POST` | `/api/social/bulk-import` | Import multiple posts at once |

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/accounts` | List connected social accounts |
| `DELETE` | `/api/social/accounts/[id]` | Disconnect a social account |
| `POST` | `/api/social/accounts/validate` | Validate account credentials |
| `POST` | `/api/social/connect` | Initiate OAuth connection flow |
| `GET` | `/api/social/callback/[platform]` | Handle OAuth callback |

### AI & Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/social/generate-post` | Generate AI post content |

### User Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/tier` | Get current user's tier info and limits |
| `GET/PUT` | `/api/social/brand-preferences` | Read/update brand preferences |
| `GET/PUT` | `/api/social/posting-preferences` | Read/update posting schedule |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/health` | Platform API health status |
| `GET` | `/api/social/debug` | Debug data (requires `MUSE_DEBUG_MODE=true`) |

### Trend Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/trend-alerts` | List trend alerts |
| `POST` | `/api/social/trend-alerts` | Create/manage trend alerts |
| `POST` | `/api/social/trend-alerts/generate` | Generate post from trending topic |

### Cron Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/cron/process-scheduled` | Process due scheduled posts |
| `GET` | `/api/social/cron/pull-engagement` | Pull engagement metrics |

### Blog Publishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/blog/connections` | List blog platform connections |
| `POST` | `/api/social/blog/connections` | Connect a blog platform |
| `DELETE` | `/api/social/blog/connections/[id]` | Disconnect a blog platform |
| `GET` | `/api/social/blog/posts` | List blog posts |
| `POST` | `/api/social/blog/posts` | Create a blog post |
| `GET/PATCH/DELETE` | `/api/social/blog/posts/[id]` | Get/update/delete a blog post |
| `POST` | `/api/social/blog/repurpose` | AI-generate social snippets from blog |
| `POST` | `/api/social/blog/schedule-snippets` | Schedule repurposed snippets |
| `GET` | `/api/social/blog/[id]/snippets` | Get snippets for a blog post |

### Content Flywheel & Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/flywheel/metrics` | Flywheel health scores and velocity |
| `POST` | `/api/social/intelligence/grade` | AI content grader |
| `GET` | `/api/social/intelligence/content-dna` | Best performing content DNA |
| `GET` | `/api/social/intelligence/topic-fatigue` | Topic fatigue detection |
| `GET` | `/api/social/intelligence/content-mix` | Content mix optimizer |
| `GET` | `/api/social/intelligence/tone-drift` | Tone drift monitor |
| `GET` | `/api/social/intelligence/cannibalization` | Content cannibalization |
| `POST` | `/api/social/intelligence/engagement-prediction` | Engagement prediction |
| `POST` | `/api/social/intelligence/brief` | Content brief generator |

### Advanced Automation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/social/automation/calendar-autopilot` | Calendar autopilot |
| `POST` | `/api/social/automation/batch-repurpose` | Batch repurpose |
| `GET` | `/api/social/automation/recycling-queue` | Content recycling queue |
| `GET` | `/api/social/automation/evergreen-scan` | Evergreen content identifier |
| `POST` | `/api/social/automation/blog-to-thread` | Blog-to-thread converter |
| `GET` | `/api/social/automation/crosspost-timing` | Cross-post timing optimizer |
| `POST` | `/api/social/automation/repurpose-chains` | Repurpose chains |
| `GET` | `/api/social/automation/draft-warnings` | Draft expiration warnings |
| `GET` | `/api/social/automation/content-decay` | Content decay alerts |
| `POST` | `/api/social/automation/hashtag-suggest` | AI hashtag suggestions (bonus) |

### Distribution Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/distribution/platform-timing` | Platform timing optimizer |
| `GET` | `/api/social/distribution/hashtag-tracker` | Hashtag performance tracker |
| `POST` | `/api/social/distribution/audience-personas` | Audience persona builder |
| `POST` | `/api/social/distribution/competitor-gap` | Competitor gap analysis |

### Revenue & ROI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/social/revenue/roi-calculator` | Content ROI calculator |
| `GET` | `/api/social/revenue/cost-per-post` | Cost per post tracking |
| `GET` | `/api/social/revenue/report-card` | Monthly report card |
| `POST` | `/api/social/revenue/export-report` | White-label report export |

### Engagement & Retention

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/social/engagement/streak` | Posting streak system |
| `GET` | `/api/social/engagement/digest-preview` | Weekly flywheel digest |
| `GET` | `/api/social/engagement/templates` | Content templates (public) |
| `GET` | `/api/social/engagement/scorecard/[username]` | Public content scorecard |

### Collaboration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/social/collaboration/approval-portal` | Client approval portal |
| `POST` | `/api/social/collaboration/approval-action` | Approve/reject content |

### Lead Management (Bonus)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/social/leads/gig-scanner` | Gig lead scanner |
| `GET/POST` | `/api/social/leads/reply-templates` | Reply templates |
| `GET/POST/PATCH` | `/api/social/leads/manage` | Lead CRM (CRUD) |
| `GET` | `/api/social/leads/export` | Lead CSV export |
| `GET/POST` | `/api/social/brand-voice/fine-tune` | AI voice fine-tuner |

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

### Stubbed Platforms
Instagram, YouTube, TikTok, Reddit, Pinterest, Snapchat, and Discord have stubbed OAuth flows and API client methods. The connection infrastructure is in place — only the platform-specific OAuth configuration and API client implementations need to be added.

---

## 8. Token Security

### Encryption
OAuth tokens are encrypted before database storage using AES-256-GCM via `src/lib/social/crypto.ts`. The encryption key is stored as the `SOCIAL_ENCRYPTION_KEY` environment variable/secret.

Blog platform API keys and tokens (Medium integration tokens, WordPress app passwords, Ghost admin API keys, Substack session tokens) are encrypted using the same `encryptToken()` / `decryptToken()` functions from `src/lib/social/crypto.ts` before being stored in the `blog_connections.credentials_encrypted` column. This ensures all third-party credentials — both social and blog — use a single, consistent encryption mechanism.

### Token Refresh
`src/lib/social/token-refresh.ts` automatically refreshes expired access tokens when platform API calls are made. If a refresh fails (e.g., user revoked access), the account is marked as invalid (`is_valid = false`) with an error message.

### Validation
The `/api/social/accounts/validate` endpoint tests whether stored credentials can still make API calls. The Accounts page shows the last validation time and current validity status for each connected account.

---

## 9. Background Jobs (BullMQ)

PassivePost defines 4 job types processed via BullMQ with Upstash Redis as the queue backend.

| Job Type | Purpose | Retry Policy |
|----------|---------|--------------|
| `social-post` | Deliver scheduled posts to platform APIs | 3 retries, exponential backoff |
| `social-health-check` | Monitor platform API connectivity | Standard retry |
| `social-trend-monitor` | Track trending topics across platforms | Standard retry |
| `social-engagement-pull` | Fetch engagement metrics from APIs | Standard retry |

### Job Flow (Post Publishing)
1. User schedules a post → status becomes `scheduled`
2. Cron endpoint or BullMQ scheduler picks up due posts → status becomes `queued`
3. `social-post` job attempts delivery to the platform API → status becomes `posting`
4. On success → status becomes `posted`, `platform_post_id` and `posted_at` are set
5. On failure → retry with exponential backoff; after 3 failures → status becomes `failed` with `error_message`

### Plugin Pattern
Job definitions and processors follow the MuseKit plugin pattern — defined in `src/lib/social/queue-jobs.ts` and registered without hardcoding into core queue files. This keeps the extension boundary clean.

---

## 10. Tier Resolution

### Resolution Chain
1. Check MuseKit Product Registry (`getUserProductTier('passive-post')`)
2. If no registry match, check Stripe subscription for `muse_tier` metadata
3. Look up tier definitions (admin-configured or defaults)
4. Map the metadata value to a `TierDefinition`
5. Return the corresponding `TierLimits`
6. If nothing matches, default to `tier_1` (Starter)

### Tier Definitions Source
Tier definitions are loaded from:
1. **Admin-configured**: Stored in `organization_settings.settings.socialModule.tierDefinitions`
2. **Default fallback**: `DEFAULT_TIER_DEFINITIONS` in `src/lib/social/types.ts`

### Integration with Stripe
Each Stripe product's metadata includes a `muse_tier` key (e.g., `tier_1`, `tier_2`, `tier_3`). When a user subscribes, their tier is resolved by mapping this metadata to the corresponding tier definition.

---

## 11. AI Generation Pipeline

### Request Flow
1. `POST /api/social/generate-post` receives the request
2. User's brand preferences are loaded from the database
3. Niche guidance text is retrieved (if a niche is selected)
4. A system prompt is constructed combining brand voice, niche guidance, platform constraints, and any image context
5. The AI provider (xAI, OpenAI, or Anthropic — configurable) generates the content
6. The response is returned to the user for editing/scheduling

### AI Provider Configuration
The AI provider is configurable via the MuseKit admin dashboard. PassivePost uses whichever provider is configured at the platform level, ensuring consistency across the application.

---

## 12. Rate Limiting

### Tier-Based Limits
Usage is enforced per-user based on their subscription tier:
- Daily AI generations
- Daily posts
- Monthly posts
- Maximum connected platforms

Checks happen before every post creation and AI generation request. Exceeded limits return a `429` response with a message explaining the limit.

### API Rate Limiting
API endpoints are additionally protected by `src/lib/social/api-rate-limiter.ts`, which uses Upstash Redis sliding window rate limiting with an in-memory fallback when Redis is unavailable.

---

## 13. Email Notifications

PassivePost sends transactional emails via Resend for:

| Event | Notification |
|-------|-------------|
| Post publishing failure | Alert with error details and retry options |
| Trend alert detection | Notification with trend details and action links |
| Usage limit warning | Warning when approaching tier caps |

Email templates and sending logic are in `src/lib/social/email-notifications.ts`.

---

## 14. n8n Workflow Templates

Pre-built automation workflows in `src/lib/social/n8n-templates/`:

| File | Automation |
|------|-----------|
| `auto-post-rss.json` | Posts RSS feed items every 15 minutes |
| `ai-generate-and-schedule.json` | Daily AI content generation at 9am |
| `engagement-monitor.json` | Hourly engagement monitoring with alerts |
| `trend-monitor.json` | 6-hourly trend scanning on X/Twitter and Facebook |
| `alert-and-approve.json` | Email notifications for trends via Resend |

These templates can be imported directly into an n8n instance for no-code automation.

---

## 15. Cron Endpoints (Vercel)

Since Vercel is serverless and doesn't support persistent BullMQ workers, two cron endpoints provide equivalent functionality:

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/social/cron/process-scheduled` | Every few minutes | Finds posts with `scheduled_at` in the past and publishes them |
| `/api/social/cron/pull-engagement` | Configurable (default: 24h) | Pulls engagement metrics from connected platform APIs |

These are configured as Vercel cron jobs in `vercel.json`.

---

## 16. Testing

### E2E Tests
PassivePost includes Playwright E2E tests in `tests/passivepost.spec.ts`:
- Dashboard page loading and navigation
- Post creation and management
- Brand preferences configuration
- Tier display and enforcement
- Quick Generate functionality

### Debug Mode
Set `MUSE_DEBUG_MODE=true` to enable the `/api/social/debug` endpoint, which returns internal state for development troubleshooting.

### Demo Data
`src/lib/social/demo-data.ts` provides mock posts, accounts, and engagement metrics for development when real platform connections aren't available.

---

## 17. Scalability

### Database Scalability

**Row Level Security (RLS)** provides data isolation in a multi-tenant environment. Tables with RLS policies restrict access to the authenticated user's own rows. This means:
- Multiple users share the same database tables without seeing each other's data
- Supabase enforces RLS at the database level, below the application layer
- RLS policies should be applied to all user-facing tables; review `migrations/` to confirm coverage for new tables

**Indexes** on frequently queried columns (e.g., `user_id`, `status`, `scheduled_at`) help maintain performance as data grows. When adding new tables, consider adding composite indexes for common query patterns.

### Queue Scalability (BullMQ + Upstash Redis)

The BullMQ queue system with Upstash Redis as the backend supports high-volume operations:
- **Horizontal scaling**: Multiple workers can process jobs concurrently. Each job type (`social-post`, `social-engagement-pull`, etc.) can be scaled independently.
- **Retry with backoff**: Failed jobs are retried with exponential backoff (3 retries by default), preventing thundering herd problems during platform outages.
- **Rate limiting**: Tier-based rate limits prevent any single user from overwhelming the queue. Daily caps on posts and AI generations ensure fair resource distribution.
- **Serverless fallback**: For Vercel deployments without persistent workers, cron endpoints provide the same functionality as background jobs, scaled by Vercel's serverless infrastructure.

### API Rate Limiting

API endpoints are protected by Upstash Redis sliding window rate limiting with an in-memory fallback:
- Prevents abuse and ensures fair access across users
- Configurable per-endpoint limits
- Graceful degradation: if Redis is unavailable, the in-memory rate limiter takes over without service interruption

### High-Volume Use Cases

For agencies or power users managing content at scale:
- **Batch operations** (bulk import, batch repurpose) process multiple items in a single request, reducing API call overhead
- **Content recycling** and **calendar autopilot** run as background processes, not blocking the user's session
- **White-label report exports** are generated server-side to handle large datasets without browser memory constraints

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [OVERVIEW.md](./OVERVIEW.md) | Elevator pitch, target audience, pricing |
| [FEATURES.md](./FEATURES.md) | Deep dive into every feature |
| [SITEMAP.md](./SITEMAP.md) | Every page and URL |
| [USER_GUIDE.md](./USER_GUIDE.md) | How to use PassivePost |

---

*Last Updated: February 20, 2026*
