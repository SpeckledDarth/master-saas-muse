# PassivePost -- Comprehensive Product Guide

**AI-Powered Social Media Scheduling for Solopreneurs and Gig Workers**

---

## 1. What is PassivePost

PassivePost is an AI-powered social media scheduling tool built on the MuseKit SaaS foundation. It enables solopreneurs, gig workers, and small business owners to maintain a consistent social media presence without the cost of hiring a social media manager.

PassivePost is built using the MuseKit **database extension pattern**, meaning it layers product-specific functionality on top of the core MuseKit infrastructure (authentication, billing, admin tools, email) without modifying any core code. This makes it both a fully functional product and a reference implementation for how to build products on MuseKit.

Key capabilities:

- AI-generated social media posts tailored to your business niche and brand voice
- Scheduling and queue management across 10 social platforms
- Engagement analytics and lead tracking
- Tier-based access control integrated with Stripe subscriptions
- Admin-configurable settings for platforms, tiers, and niche-specific AI prompts

---

## 2. Who It's For

PassivePost is designed for individuals and small businesses who need social media content but lack the time, budget, or expertise to manage it manually.

**Target users:**

- Solopreneurs running a one-person business
- Gig workers building a personal brand
- Small business owners in service-based industries

**Supported niches (with built-in AI prompt guidance):**

| Niche | Description |
|-------|-------------|
| Plumbing | Casual, local tone focused on common household problems |
| HVAC | Trusted technician voice referencing seasonal comfort concerns |
| Electrical | Safety-first messaging about home electrical reliability |
| Landscaping | Visual, seasonal content about curb appeal and outdoor living |
| Cleaning | Friendly tone about the relief of a clean home |
| Real Estate | Market-savvy but approachable local insights |
| Rideshare | Down-to-earth hustle and city life content |
| Freelance | Authentic independent work experiences and lessons |
| Photography | Visual storytelling and behind-the-scenes insights |
| Fitness | Motivating without being preachy, practical tips |
| Food / Restaurant | Warm, inviting content about flavors and community |
| Beauty | Confident, inclusive self-care and transformation content |
| Tutoring | Encouraging study tips and learning success stories |
| Pet Care | Warm, playful content about pets and practical care tips |

Each niche has an admin-editable prompt guidance entry that shapes how the AI generates content for that industry. A default brand voice fallback is used when no niche is selected.

---

## 3. Dashboard Pages

The PassivePost social dashboard lives at `/dashboard/social/` and uses a dedicated sidebar layout with 10 pages.

### Overview (`/dashboard/social/overview`)

The main landing page after login. Displays usage progress bars showing how close the user is to their tier limits, quick stats (posts created, accounts connected, AI generations used), and a Quick Generate button for instant AI content creation.

### Posts (`/dashboard/social/posts`)

Post management hub with filtering by platform, status, and date range. Supports bulk actions (delete, reschedule) and includes a post detail dialog for viewing full post content, platform targets, and scheduling details.

### Queue (`/dashboard/social/queue`)

Displays all scheduled posts waiting to be published, ordered by scheduled time. Users can reorder, edit, or cancel queued posts before they are delivered to platform APIs.

### Calendar (`/dashboard/social/calendar`)

A month-grid calendar view showing scheduled and published posts by date. Hovering over a date shows per-platform count tooltips so users can see their posting distribution at a glance.

### Engagement (`/dashboard/social/engagement`)

Analytics dashboard powered by Recharts charts. Displays engagement metrics (likes, shares, comments) pulled from connected platform APIs. Helps users understand which content performs best.

### Leads (`/dashboard/social/leads`)

Lead tracking from social engagement. Surfaces potential customers or contacts generated through social media interactions.

### Brand Voice (`/dashboard/social/brand`)

Brand preferences configuration page where users set their tone, niche, location, sample URLs, target audience, posting goals, preferred platforms, and post frequency (daily, weekly, etc.). These preferences shape AI-generated content.

### Accounts (`/dashboard/social/`)

Connected social account management. Users can connect, disconnect, and validate their social media accounts. Shows connection status and last validation time for each account.

### Settings (`/dashboard/social/settings`)

PassivePost-specific settings for the current user, including notification preferences and module-specific configuration.

### Onboarding (`/dashboard/social/onboarding`)

A guided setup wizard for new users that walks them through connecting their first social account, setting up brand preferences, and generating their first AI post.

---

## 4. Sidebar Navigation

The social dashboard sidebar is implemented in `src/components/social/social-sidebar.tsx` and organizes navigation into three groups:

**Dashboard**
- Overview
- Posts
- Queue
- Calendar

**Insights**
- Engagement
- Leads

**Setup**
- Brand Voice
- Accounts
- Settings

**Footer section:**
- Back to Dashboard link (returns to the main MuseKit dashboard)
- User menu with avatar, display name, and tier badge (Starter, Basic, or Premium)
- Dropdown with links to Profile, Billing, Main Site, and Log Out

The sidebar is responsive and collapses on mobile devices, with a toggle trigger in the header.

---

## 5. Tier System

PassivePost uses a 3-tier subscription system. Tiers are admin-configurable and resolved via Stripe subscription metadata using the MuseKit Product Registry.

### Default Tier Definitions

| Tier | ID | Daily AI Generations | Daily Posts | Monthly Posts | Max Platforms |
|------|----|---------------------|-------------|---------------|---------------|
| Starter | `tier_1` | 5 | 1 | 15 | 2 |
| Basic | `tier_2` | 10 | 2 | 30 | 3 |
| Premium | `tier_3` | 100 | 10,000 | 999,999 | 10 |

### How Tier Resolution Works

1. The user's Stripe subscription is checked for a `muse_tier` metadata key
2. The metadata value is matched against the tier definitions registered in the MuseKit Product Registry
3. The corresponding `TierLimits` object is returned, containing the user's allowed usage
4. If no subscription is found, the user defaults to the first tier (Starter)

Tier resolution is handled by `src/lib/social/user-tier.ts`, which wraps the core MuseKit `getUserProductTier` function from `src/lib/products/`.

### Upgrade Banner

When a user reaches 80% or more of any tier limit, an upgrade banner appears across all social dashboard pages (implemented in `src/components/social-upgrade-banner.tsx`).

---

## 6. Supported Platforms

PassivePost supports 10 social media platforms:

| Platform | OAuth Support | API Status |
|----------|--------------|------------|
| Twitter/X | Full (PKCE) | Implemented |
| LinkedIn | Full (PKCE) | Implemented |
| Facebook | Full (Page) | Implemented |
| Instagram | -- | Stubbed |
| YouTube | -- | Stubbed |
| TikTok | -- | Stubbed |
| Reddit | -- | Stubbed |
| Pinterest | -- | Stubbed |
| Snapchat | -- | Stubbed |
| Discord | -- | Stubbed |

Twitter/X, LinkedIn, and Facebook have full OAuth connection flows. The remaining 7 platforms have stubbed API client methods ready for real integration. All 10 platforms can be enabled or disabled by an admin.

Platform-specific icons with color coding are provided by `src/components/social/platform-icon.tsx`.

---

## 7. AI Post Generation

PassivePost uses AI to generate social media content customized to the user's brand voice and business niche.

### How It Works

1. The user's brand preferences (tone, niche, location, audience) are loaded
2. If a niche is selected, the corresponding niche guidance prompt is included in the AI request
3. If no niche is selected, a default brand voice fallback is used
4. The AI generates platform-appropriate content
5. The user can edit, schedule, or post immediately

### Quick Generate FAB

A floating action button (FAB) labeled Quick Generate is available on all social dashboard pages. It opens a dialog where users can generate AI content on demand, preview it, and copy it to clipboard or schedule it directly.

Implemented in `src/components/social/quick-generate-fab.tsx`.

### Niche Guidance

There are 15 admin-editable niche-specific prompt guidance entries stored in the module settings. Each entry consists of a key, label, and guidance text. Admins can add, edit, or remove entries from `/admin/setup/passivepost`.

### Multimodal Support

AI post generation supports multimodal image input, allowing users to include images that the AI can reference when generating captions and content.

---

## 8. Brand Preferences System

Users configure their brand identity through the Brand Voice page (`/dashboard/social/brand`). These preferences are stored in the `brand_preferences` database table and used to shape AI-generated content.

### Configurable Fields

| Field | Description |
|-------|-------------|
| Tone | The voice and style of generated content (e.g., professional, casual, friendly) |
| Niche | Business category from the supported niche list |
| Location | Geographic area for local-focused content |
| Sample URLs | Example content or website URLs for reference |
| Target Audience | Description of the ideal customer or follower |
| Posting Goals | What the user wants to achieve (brand awareness, leads, engagement) |
| Preferred Platforms | Which platforms to prioritize |
| Post Frequency | How often to post (daily, weekly, etc.) |

### API Endpoints

- `GET /api/social/brand-preferences` -- Retrieve current brand preferences
- `PUT /api/social/brand-preferences` -- Update brand preferences
- `GET /api/social/posting-preferences` -- Retrieve posting schedule preferences
- `PUT /api/social/posting-preferences` -- Update posting schedule preferences

---

## 9. OAuth and Account Connection

PassivePost supports OAuth flows for connecting social media accounts.

### Supported OAuth Flows

- **Facebook Page** -- OAuth 2.0 for page-level access
- **LinkedIn** -- OAuth 2.0 with PKCE
- **Twitter/X** -- OAuth 2.0 with PKCE

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social/connect` | POST | Initiate an OAuth connection flow for a platform |
| `/api/social/callback/[platform]` | GET | Handle the OAuth callback after user authorization |
| `/api/social/accounts/validate` | POST | Validate that connected account credentials are still valid |
| `/api/social/accounts` | GET | List all connected social accounts |
| `/api/social/accounts/[id]` | DELETE | Disconnect a social account |

### Token Management

OAuth tokens are encrypted before storage using utilities in `src/lib/social/crypto.ts`. Token refresh logic is handled by `src/lib/social/token-refresh.ts`, which automatically refreshes expired tokens when platform API calls are made.

---

## 10. Admin Configuration

Admins configure PassivePost from `/admin/setup/passivepost`. This page provides full control over the module without requiring code changes.

### Configuration Options

| Setting | Description |
|---------|-------------|
| Module Toggle | Enable or disable the entire PassivePost module |
| Default Tier | Select which tier new users start on |
| Platform Toggles | Enable or disable individual social platforms |
| Platform API Credentials | Configure API keys and secrets for each platform |
| Niche Guidance | Add, edit, or remove niche-specific AI prompt entries (key/label/guidance triplets) |
| Engagement Pull Interval | How often to fetch engagement metrics (1-168 hours) |
| Engagement Lookback Window | How far back to look when pulling engagement data (1-168 hours) |
| API Health Checker | Enable/disable, alert on repeated failures, set failure threshold |
| Tier Definitions | Add, remove, or edit tier names and their associated limits |

---

## 11. Background Jobs (BullMQ)

PassivePost uses 4 social-specific job types processed via BullMQ with Upstash Redis as the queue backend.

### Job Types

| Job Type | Purpose | Retry Policy |
|----------|---------|--------------|
| `social-post` | Deliver scheduled posts to platform APIs | 3 retries, exponential backoff |
| `social-health-check` | Monitor platform API connectivity and uptime | Standard retry |
| `social-trend-monitor` | Track trending topics across connected platforms | Standard retry |
| `social-engagement-pull` | Fetch likes, shares, and comments from platform APIs | Standard retry |

Job definitions and processors are in `src/lib/social/queue-jobs.ts`.

### Cron Endpoints (Vercel Deployment)

For serverless deployments where persistent workers are not available, two cron endpoints provide the same functionality:

| Endpoint | Purpose |
|----------|---------|
| `/api/social/cron/process-scheduled` | Process scheduled posts that are due for publishing |
| `/api/social/cron/pull-engagement` | Pull engagement metrics from connected platform APIs |

---

## 12. API Routes

All PassivePost API routes are under `/api/social/`.

### Post Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/posts` | List posts with optional filters |
| POST | `/api/social/posts` | Create a new post |
| GET | `/api/social/posts/[id]` | Get a single post by ID |
| PUT | `/api/social/posts/[id]` | Update a post |
| DELETE | `/api/social/posts/[id]` | Delete a post |
| POST | `/api/social/bulk-import` | Bulk import multiple posts |

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/accounts` | List connected social accounts |
| DELETE | `/api/social/accounts/[id]` | Disconnect a social account |
| POST | `/api/social/accounts/validate` | Validate account credentials |
| POST | `/api/social/connect` | Initiate OAuth connection flow |
| GET | `/api/social/callback/[platform]` | OAuth callback handler |

### AI and Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social/generate-post` | Generate AI-powered post content |

### User Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/tier` | Get the current user's tier info and limits |
| GET | `/api/social/brand-preferences` | Retrieve brand preferences |
| PUT | `/api/social/brand-preferences` | Update brand preferences |
| GET | `/api/social/posting-preferences` | Retrieve posting preferences |
| PUT | `/api/social/posting-preferences` | Update posting preferences |

### Monitoring and Debug

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/health` | Platform API health status |
| GET | `/api/social/debug` | Debug mode data (beta only, requires `MUSE_DEBUG_MODE=true`) |

### Trend Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/trend-alerts` | List trend alerts |
| POST | `/api/social/trend-alerts` | Create or manage trend alerts |
| POST | `/api/social/trend-alerts/generate` | Generate a post based on a trending topic |

### Cron Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/cron/process-scheduled` | Process scheduled posts |
| GET | `/api/social/cron/pull-engagement` | Pull engagement metrics |

---

## 13. Database Tables (Extension Pattern)

PassivePost follows the MuseKit database extension pattern. Core tables live in `migrations/core/` and are shared infrastructure. Extension tables live in `migrations/extensions/` and are specific to PassivePost.

### Core Tables (`migrations/core/`)

| Table | File | Description |
|-------|------|-------------|
| `social_accounts` | `001_social_tables.sql` | Connected social media accounts with encrypted tokens |
| `social_posts` | `001_social_tables.sql` | Social media posts with content, platform, status, and scheduling |

### Extension Tables (`migrations/extensions/`)

| Table / Change | File | Description |
|----------------|------|-------------|
| `social_posts` extensions | `001_passivepost_tables.sql` | Added `trend_source` and `niche_triggered` columns to the core `social_posts` table |
| `brand_preferences` | `001_passivepost_tables.sql` | User brand configuration (tone, niche, location, audience, goals, frequency) |
| `alert_logs` | `001_passivepost_tables.sql` | Trend alert history and notification logs |

This separation means PassivePost can be included or excluded from a MuseKit clone by simply including or removing the extension migration files.

---

## 14. Components

### Social Dashboard Components (`src/components/social/`)

| Component | File | Description |
|-----------|------|-------------|
| Social Sidebar | `social-sidebar.tsx` | Dashboard sidebar with navigation groups, user menu, and tier badge |
| Post Detail Dialog | `post-detail-dialog.tsx` | Full-content post detail view in a dialog overlay |
| Post Preview | `post-preview.tsx` | Compact post content preview for lists and cards |
| Quick Generate FAB | `quick-generate-fab.tsx` | Floating action button for on-demand AI post generation |
| Platform Icon | `platform-icon.tsx` | Platform-specific icons with color coding for all 10 platforms |
| Bulk Import | `bulk-import.tsx` | UI for importing multiple posts at once |

### Other Components

| Component | File | Description |
|-----------|------|-------------|
| Upgrade Banner | `src/components/social-upgrade-banner.tsx` | Banner shown across all dashboard pages when usage reaches 80% or more of any tier limit |

---

## 15. Library Code

All PassivePost business logic lives in `src/lib/social/`.

| File | Description |
|------|-------------|
| `types.ts` | All TypeScript types including `SocialPlatform`, `TierLimits`, `TierDefinition`, `NicheGuidanceEntry`, `SocialModuleSettings`, and default tier/settings definitions |
| `client.ts` | Social platform API clients for all 10 platforms (3 implemented, 7 stubbed) |
| `user-tier.ts` | Tier resolution wrapper that calls the MuseKit Product Registry's `getUserProductTier` |
| `rate-limits.ts` | Tier-based rate limiting logic that enforces daily and monthly usage caps |
| `api-rate-limiter.ts` | API-level rate limiting for social endpoints |
| `token-refresh.ts` | OAuth token refresh logic for maintaining valid platform connections |
| `queue-jobs.ts` | BullMQ job type definitions and processor functions for all 4 social job types |
| `trend-alerts.ts` | Trend monitoring and alert logic for tracking platform trends |
| `email-notifications.ts` | Social-specific email notifications (post failures, trend alerts, usage warnings) |
| `crypto.ts` | Encryption utilities for securely storing social account OAuth tokens |
| `debug.ts` | Beta debug mode support, gated by `MUSE_DEBUG_MODE` environment variable |
| `demo-data.ts` | Demo and mock data for development and testing |
| `n8n-templates/index.ts` | n8n workflow templates: `auto-post-rss`, `ai-generate-and-schedule`, `engagement-monitor` |

---

## 16. UI Features

### Dark/Light Mode

A theme toggle in the dashboard header allows users to switch between dark and light modes. The toggle persists the user's preference.

### Upgrade Banner

When any tier limit reaches 80% or more usage (daily AI generations, daily posts, monthly posts, or connected platforms), an upgrade banner appears at the top of every social dashboard page encouraging the user to upgrade their plan.

### Quick Generate FAB

A floating action button is present on all social dashboard pages, providing one-click access to AI post generation without navigating away from the current page.

### Responsive Sidebar

The sidebar collapses on mobile devices and can be toggled via a hamburger button in the header. On desktop, it remains expanded.

### Post Detail Dialog

Clicking on any post opens a dialog with the full post content, platform targets, scheduling details, and engagement metrics (if published).

### Bulk Import

Users can import multiple posts at once using the bulk import feature, which accepts structured post data and creates entries for scheduling.

### Platform Icons

Each of the 10 supported platforms has a dedicated icon component with platform-specific color coding for easy visual identification throughout the dashboard.

---

## 17. How PassivePost Demonstrates the MuseKit Extension Pattern

PassivePost serves as the reference implementation for building products on top of MuseKit. It demonstrates several key architectural principles:

### Scoped Directories

All PassivePost code lives in clearly scoped directories:

- Dashboard pages: `src/app/dashboard/social/`
- API routes: `src/app/api/social/`
- Components: `src/components/social/`
- Library code: `src/lib/social/`
- Admin config: `src/app/admin/setup/passivepost/`
- Extension migrations: `migrations/extensions/`

### One-Way Dependency

PassivePost imports from MuseKit core modules (`@/lib/products`, `@/lib/supabase`, `@/lib/stripe`, `@/lib/queue`), but core MuseKit never imports from PassivePost code. This ensures the core remains product-agnostic.

### Clean Removal

To clone MuseKit without PassivePost, delete the `/social/` directories and the extension migration files. No core files need to be modified. The result is a clean MuseKit instance ready for a different product.

### Product-Scoped Types

All PassivePost TypeScript types are defined in `src/lib/social/types.ts`, not in core type files like `src/types/settings.ts`. This prevents type pollution and keeps the product boundary clean.

### Extension Migrations

Database changes specific to PassivePost are in `migrations/extensions/`, separate from core MuseKit tables in `migrations/core/`. Extension migrations can add new tables or extend existing core tables with additional columns.

---

## 18. Development and Testing

### Beta Debug Mode

Set the environment variable `MUSE_DEBUG_MODE=true` to enable debug mode. This exposes the `/api/social/debug` endpoint, which returns internal state information useful during development.

### Demo Data

The file `src/lib/social/demo-data.ts` provides mock data for development and testing, including sample posts, accounts, and engagement metrics. This data is used when real platform connections are not available.

### End-to-End Tests

PassivePost includes 8 Playwright E2E tests in `tests/passivepost.spec.ts`. These tests cover:

- Dashboard page loading and navigation
- Post creation and management
- Brand preferences configuration
- Tier display and enforcement
- Quick Generate functionality

Run tests with:

```bash
npx playwright test tests/passivepost.spec.ts
```

---

## 19. Roadmap / Future

The following features are planned for future development:

### Dynamic Tiers from Admin Dashboard

Currently, PassivePost ships with 3 default tiers (Starter, Basic, Premium). A future update will allow admins to create unlimited custom tiers with arbitrary limit definitions directly from the admin dashboard.

### Real Platform API Integration

Of the 10 supported platforms, 3 have full API integration (Twitter/X, LinkedIn, Facebook). The remaining 7 platforms (YouTube, TikTok, Reddit, Pinterest, Snapchat, Discord, Instagram) have stubbed API client methods that are ready for real implementation as platform APIs are integrated.

### Approval Queue UI

The data model already supports post approval workflows. A future UI will allow team leads or account owners to review and approve AI-generated posts before they are scheduled for publishing.

---

*Last Updated: February 19, 2026*
