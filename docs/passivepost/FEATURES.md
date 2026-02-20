# PassivePost — Feature Guide

A detailed breakdown of every feature in PassivePost, how it works, and what users can do with it.

---

## Table of Contents

1. [AI Content Generation](#1-ai-content-generation)
2. [Multi-Platform Social Media Support](#2-multi-platform-social-media-support)
3. [Post Management](#3-post-management)
4. [Queue System](#4-queue-system)
5. [Content Calendar](#5-content-calendar)
6. [Engagement Analytics](#6-engagement-analytics)
7. [Lead Tracking](#7-lead-tracking)
8. [Brand Voice System](#8-brand-voice-system)
9. [Trend Alerts](#9-trend-alerts)
10. [Coaching Tips](#10-coaching-tips)
11. [Bulk Import](#11-bulk-import)
12. [Tier System & Usage Limits](#12-tier-system--usage-limits)
13. [n8n Automation Templates](#13-n8n-automation-templates)
14. [Blog Publishing (Coming Soon)](#14-blog-publishing-coming-soon)
15. [Onboarding Wizard](#15-onboarding-wizard)
16. [Notifications & Alerts](#16-notifications--alerts)
17. [Dark Mode](#17-dark-mode)

---

## 1. AI Content Generation

### What It Does
Creates social media posts automatically using AI, tailored to the user's business niche, brand voice, target audience, and preferred platforms.

### How It Works
1. The user's brand preferences are loaded (tone, niche, location, audience, goals)
2. If a niche is selected (e.g., "Plumbing"), the corresponding niche guidance prompt is injected into the AI request — shaping vocabulary, tone, and topic focus
3. If no niche is selected, a default brand voice fallback is used
4. The AI generates platform-appropriate content (e.g., shorter for Twitter, more professional for LinkedIn)
5. The user can edit the generated content, schedule it, or post immediately

### Quick Generate FAB
A floating action button labeled "Quick Generate" appears on every social dashboard page. One click opens a dialog where users can:
- Generate AI content instantly
- Preview the result
- Copy to clipboard
- Schedule directly from the dialog

### Multimodal Support
Users can include images when generating content. The AI references the image to create relevant captions and descriptions.

### Niche Guidance System
There are 14 built-in niche categories, each with admin-editable prompt guidance. The guidance text tells the AI how to write for that industry — what tone to use, what topics to reference, what vocabulary fits.

Example guidance for "Plumbing":
> "Keep it casual and local. Talk like a neighbor who happens to fix pipes. Mention common household problems people relate to."

Admins can add new niches, edit existing guidance, or remove niches entirely from the admin dashboard.

---

## 2. Multi-Platform Social Media Support

### Supported Platforms

PassivePost supports 10 social media platforms:

| Platform | Icon Color | OAuth Status | API Posting |
|----------|-----------|-------------|-------------|
| Twitter/X | Black (white in dark mode) | Full OAuth 2.0 with PKCE | Implemented |
| LinkedIn | #0A66C2 (blue) | Full OAuth 2.0 with PKCE | Implemented |
| Facebook | #1877F2 (blue) | Full OAuth 2.0 (Page) | Implemented |
| Instagram | #E4405F (pink) | Planned | Stubbed |
| YouTube | #FF0000 (red) | Planned | Stubbed |
| TikTok | Black (white in dark mode) | Planned | Stubbed |
| Reddit | #FF4500 (orange) | Planned | Stubbed |
| Pinterest | #E60023 (red) | Planned | Stubbed |
| Snapchat | #FFFC00 (gold) | Planned | Stubbed |
| Discord | #5865F2 (purple) | Planned | Stubbed |

### Platform Icons
Each platform has a dedicated icon component with its official brand color. These appear throughout the dashboard — in the sidebar, post lists, calendar, and analytics charts.

### Platform Management
- Connect and disconnect accounts from the Accounts page
- Validate that credentials are still valid
- See connection status and last validation time
- Admins can enable/disable individual platforms globally

---

## 3. Post Management

### Creating Posts
Users create posts from the Posts page or via the Quick Generate FAB. Each post includes:
- **Content**: The text of the post
- **Platform**: Which social account(s) to publish to
- **Status**: Draft, scheduled, queued, approved, posting, posted, failed, or ignored
- **Media**: Optional image/media attachments (URLs)
- **Scheduling**: Optional date/time for future publishing
- **AI metadata**: Whether the post was AI-generated, which brand voice was used, trend source, niche

### Post Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Created but not yet scheduled |
| `scheduled` | Set to publish at a specific date/time |
| `queued` | Waiting in the BullMQ queue for processing |
| `approved` | User approved an AI-generated suggestion |
| `posting` | Currently being sent to the platform API |
| `posted` | Successfully published |
| `failed` | Publishing attempt failed (error message stored) |
| `ignored` | User rejected an AI suggestion |

### Post Actions
- **Edit**: Modify content, platform, or schedule
- **Delete**: Remove a post permanently
- **Reschedule**: Change the publish date/time
- **Bulk actions**: Select multiple posts for delete or reschedule

### Post Detail Dialog
Clicking any post opens a detail dialog showing:
- Full post content
- Platform targets
- Scheduling details
- Engagement metrics (if published)
- AI generation metadata

---

## 4. Queue System

### What It Does
The Queue page shows all posts waiting to be published, ordered by scheduled time. Users can manage what goes out and when.

### Queue Features
- View all scheduled posts in chronological order
- Reorder posts in the queue
- Edit queued posts before they publish
- Cancel queued posts
- See estimated publish times

### Background Processing
Posts in the queue are processed by BullMQ background jobs. When a post's scheduled time arrives, the `social-post` job delivers it to the appropriate platform API with retry logic (3 retries with exponential backoff).

---

## 5. Content Calendar

### What It Does
A visual month-grid calendar showing all scheduled and published posts by date. Helps users see their posting distribution and plan content ahead.

### Calendar Features
- Month-view grid with posts plotted by date
- Hover tooltips showing per-platform counts for each day
- Click a date to see all posts scheduled for that day
- Visual indicators for post status (scheduled, posted, failed)
- Navigate between months

---

## 6. Engagement Analytics

### What It Does
Displays performance metrics for published posts — likes, shares, comments, impressions, and reach — pulled from connected platform APIs.

### Analytics Features
- Interactive charts powered by Recharts
- Engagement trends over time
- Per-platform breakdowns
- Per-post performance comparisons
- Best-performing content identification
- Best times to post analysis

### Data Collection
Engagement data is pulled from platform APIs via the `social-engagement-pull` background job. The pull frequency and lookback window are admin-configurable (default: every 24 hours, looking back 24 hours).

### Data Storage
For the current version, engagement data is stored as JSONB in the `social_posts.engagement_data` column. A normalized `engagement_metrics` table is planned for future advanced analytics.

---

## 7. Lead Tracking

### What It Does
The Leads page surfaces potential customers or business contacts generated through social media interactions. When someone engages with your posts in a way that suggests interest (comments asking about services, direct messages, profile visits), PassivePost tracks and displays them.

### Lead Features
- Lead list with contact information and source platform
- Engagement history per lead
- Lead status tracking
- Filtering by platform and date

---

## 8. Brand Voice System

### What It Does
The Brand Voice page is where users define their business identity. These settings shape every piece of AI-generated content.

### Configurable Settings

| Setting | What It Controls |
|---------|-----------------|
| **Tone** | The voice style of generated content (professional, casual, friendly, humorous, etc.) |
| **Niche** | Business category — selects the corresponding niche guidance prompt |
| **Location** | Geographic area for local-focused content ("Denver, CO" or "North London") |
| **Sample URLs** | Website or content examples the AI can reference for style matching |
| **Target Audience** | Description of ideal customer or follower |
| **Posting Goals** | What the user wants to achieve (brand awareness, leads, engagement, sales) |
| **Preferred Platforms** | Which platforms to prioritize when generating content |
| **Post Frequency** | How often to post (daily, 3x/week, weekly, etc.) |

### How Brand Voice Affects AI Generation
When a user generates a post, the AI receives:
1. The brand voice settings as system context
2. The niche-specific guidance text (if a niche is selected)
3. Any sample URLs for style reference
4. The target platform's content constraints (character limits, hashtag norms, etc.)

This produces content that sounds like the user's business — not like a generic AI.

---

## 9. Trend Alerts

### What It Does
Monitors trending topics across connected platforms and suggests timely content opportunities. When a trend matches the user's niche or interests, PassivePost surfaces it as an alert.

### How It Works
1. The `social-trend-monitor` background job scans platforms periodically (default: every 24 hours)
2. Trends matching the user's niche or keywords are logged as alerts
3. Users can view alerts on their dashboard
4. From an alert, users can generate an AI post based on the trending topic
5. Alert history is stored in the `alert_logs` table

### n8n Integration
The trend monitoring system includes pre-built n8n workflow templates:
- **Trend Monitor & AI Post Generator**: Scans X/Twitter and Facebook every 6 hours
- **Alert & Approve via Email**: Sends email notifications when trends are detected

---

## 10. Coaching Tips

### What It Does
A motivational coaching card on the Overview dashboard that displays rotating tips, strategy advice, and encouragement. Helps users stay consistent and improve their social media game.

### Coaching Categories

| Category | Purpose |
|----------|---------|
| **Quick Tip** | Practical, actionable advice (e.g., "Posts with questions get 2x more comments") |
| **Keep Going** | Motivational messages for consistency (e.g., "Consistency beats perfection") |
| **Strategy** | Tactical guidance (e.g., "Respond to comments within the first hour") |

### How It Works
- Displays one message per day, rotating through 15 messages based on the day of the year
- Users can click "Next" to cycle through additional messages
- The card can be dismissed for the session
- Messages cover engagement tactics, content strategy, and mindset

---

## 11. Bulk Import

### What It Does
Allows users to import multiple posts at once for batch scheduling. Useful for planning a week or month of content in one sitting.

### How It Works
1. User opens the Bulk Import dialog
2. Provides structured post data (content, platform, schedule)
3. PassivePost validates and creates all posts
4. Posts appear in the Queue and Calendar ready for publishing

---

## 12. Tier System & Usage Limits

### Tier Definitions

| Limit | Starter | Basic | Premium |
|-------|---------|-------|---------|
| Daily AI Generations | 5 | 10 | 100 |
| Daily Posts | 1 | 2 | 10,000 |
| Monthly Posts | 15 | 30 | 999,999 |
| Connected Platforms | 2 | 3 | 10 |

### How Tier Resolution Works
1. User's Stripe subscription is checked for a `muse_tier` metadata key
2. The metadata value is matched against tier definitions in the MuseKit Product Registry
3. The matching `TierLimits` object determines the user's allowed usage
4. If no active subscription exists, the user defaults to Starter

### Usage Enforcement
- Limits are checked before every post creation and AI generation
- When a user reaches 80%+ of any limit, an upgrade banner appears across all dashboard pages
- The Overview page shows usage progress bars for each limit

### Admin Customization
Admins can:
- Rename tiers
- Adjust limit values
- Add or remove tier levels
- Set the default tier for new users

All changes take effect immediately — no deployment needed.

---

## 13. n8n Automation Templates

### What They Are
Pre-built workflow templates for the n8n automation platform, allowing users to set up advanced automations without coding.

### Available Templates

| Template | What It Does |
|----------|-------------|
| **Auto-Post RSS Feed** | Posts new RSS feed items to social media every 15 minutes |
| **AI Generate & Schedule** | Generates posts daily at 9am using brand preferences, then schedules them |
| **Engagement Monitor** | Monitors engagement hourly, sends Slack/email alerts for low-performing posts |
| **Trend Monitor & AI Generator** | Scans X/Twitter and Facebook every 6 hours for niche-relevant trends |
| **Alert & Approve via Email** | Sends Resend email notifications for trend detections with approve/edit links |

---

## 14. Blog Publishing (Coming Soon)

### Overview
A blog cross-posting system that lets users write once and publish to multiple blogging platforms, then automatically generate social media snippets to drive traffic.

### Supported Blog Platforms
- **Medium** — Full integration via API
- **WordPress** — Full integration via OAuth + app passwords
- **LinkedIn Articles** — Extends existing LinkedIn connection
- **Ghost** — Full integration via Admin API
- **Substack** — Beta support (unofficial API, user consent required)

### Key Capabilities
- **Cross-Linking Flywheel**: Blog posts auto-generate 5–7 social snippets with links back to the article. Social drives blog traffic, blog drives social engagement.
- **SEO Preview**: See how your post will appear in search results before publishing
- **Repurpose Engine**: Automatically converts long-form blog content into platform-appropriate social posts
- **Content Series**: Group related posts into series for sequential publishing
- **Unified Calendar**: Blog posts appear alongside social posts in the content calendar
- **Draft Sharing**: Share blog drafts for review before publishing
- **Analytics Rollup**: See blog and social metrics together

For full details, see [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md).

---

## 15. Onboarding Wizard

### What It Does
A guided setup experience for new users that walks them through the essential first steps.

### Onboarding Steps
1. **Welcome** — Introduction to PassivePost
2. **Connect Account** — Connect the first social media account via OAuth
3. **Set Brand Voice** — Configure business niche, tone, and audience
4. **Generate First Post** — Create the first AI-generated post
5. **Done** — Dashboard tour and next steps

---

## 16. Notifications & Alerts

### Email Notifications
PassivePost sends email notifications via Resend for:
- Post publishing failures
- Trend alert detections
- Usage limit warnings (approaching tier caps)

### In-Dashboard Alerts
- Upgrade banners when usage reaches 80%+ of any tier limit
- Post failure indicators on the Posts and Queue pages
- Trend alert badges

---

## 17. Dark Mode

### How It Works
A theme toggle in the dashboard header switches between light and dark modes. The preference is persisted in the browser.

### Platform Icon Adaptation
Platform icons with dark brand colors (Twitter/X, TikTok) automatically switch to white in dark mode for visibility. All other platform icons retain their brand colors.

### Chart Theming
All Recharts analytics components use themed tooltips that adapt to the current color mode.

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [OVERVIEW.md](./OVERVIEW.md) | Elevator pitch, target audience, pricing, differentiators |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical blueprint: database, APIs, OAuth, queue system |
| [SITEMAP.md](./SITEMAP.md) | Every page and URL in the application |
| [USER_GUIDE.md](./USER_GUIDE.md) | Step-by-step guide for using PassivePost |

---

*Last Updated: February 20, 2026*
