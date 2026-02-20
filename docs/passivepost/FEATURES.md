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
14. [Blog Publishing](#14-blog-publishing)
15. [Onboarding Wizard](#15-onboarding-wizard)
16. [Notifications & Alerts](#16-notifications--alerts)
17. [Dark Mode](#17-dark-mode)
18. [Content Flywheel System](#18-content-flywheel-system)
19. [Content Intelligence (Phase 2)](#19-content-intelligence-phase-2)
20. [Advanced Automation (Phase 3)](#20-advanced-automation-phase-3)
21. [Distribution Intelligence (Phase 4)](#21-distribution-intelligence-phase-4)
22. [Revenue & ROI (Phase 5)](#22-revenue--roi-phase-5)
23. [Engagement & Retention (Phase 6)](#23-engagement--retention-phase-6)
24. [Collaboration (Phase 7)](#24-collaboration-phase-7)
25. [Bonus Features](#25-bonus-features)

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

## 14. Blog Publishing

### Overview
A full blog cross-posting system that lets users write long-form content once and publish to multiple blogging platforms simultaneously. The system then automatically generates social media snippets to drive traffic back to the blog, creating a self-reinforcing content flywheel where blog drives social and social drives blog.

### Supported Blog Platforms

| Platform | Integration Type | Status |
|----------|-----------------|--------|
| **Medium** | Full API integration | Complete |
| **WordPress** | OAuth + app passwords | Complete |
| **Ghost** | Admin API | Complete |
| **LinkedIn Articles** | Extends existing LinkedIn OAuth connection | Complete |
| **Substack** | Unofficial API (user consent required) | Beta |

### Key Capabilities
- **Markdown Editor**: Write blog posts in a rich Markdown editor with live preview and formatting toolbar. Supports headings, lists, code blocks, images, and embedded media.
- **SEO Preview**: See exactly how your post will appear in Google search results before publishing. Preview includes title, meta description, and URL slug — all editable in real time.
- **Repurpose Engine**: When a blog post is published, AI automatically generates 5-7 platform-appropriate social media snippets with links back to the article. Each snippet is tailored for its target platform (concise for Twitter/X, professional for LinkedIn, visual for Instagram).
- **Calendar Integration**: Blog posts appear alongside social posts in the unified content calendar, giving users a complete view of all scheduled content across both blog and social channels.
- **Content Flywheel**: Blog posts generate social snippets that drive traffic to the blog. Engagement data from social posts feeds back into the intelligence system, informing future blog topics and social strategy. This creates a virtuous cycle where each piece of content amplifies the others.
- **Content Series**: Group related posts into series for sequential publishing across platforms.
- **Draft Sharing**: Share blog drafts for review before publishing to external platforms.
- **Analytics Rollup**: See blog and social metrics together in a unified dashboard view.

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

## 18. Content Flywheel System

### Overview
The Content Flywheel is a 7-phase system comprising 38 features that transforms PassivePost from a social media scheduling tool into a complete content marketing platform. Each phase builds on the previous one, creating a self-reinforcing loop where content creation, intelligence, automation, distribution, revenue tracking, engagement, and collaboration all feed into each other to continuously improve results.

### The 7 Phases

| Phase | Name | Features | Purpose |
|-------|------|----------|---------|
| 1 | Blog Publishing | 5 | Cross-platform blog publishing with social repurposing |
| 2 | Content Intelligence | 8 | AI-powered content analysis, scoring, and optimization |
| 3 | Advanced Automation | 9 | Automated content workflows, recycling, and transformation |
| 4 | Distribution Intelligence | 4 | Platform-specific timing, hashtag tracking, and audience analysis |
| 5 | Revenue & ROI | 4 | Content ROI calculation, cost tracking, and reporting |
| 6 | Engagement & Retention | 6 | Streaks, digests, templates, and gamification |
| 7 | Collaboration | 2 | Client approval portals and team approval queues |

### How It Works
The flywheel begins with content creation (blog and social posts) and feeds performance data into the intelligence layer. Intelligence insights inform automation rules, which optimize distribution. Distribution data feeds into ROI tracking, which helps users understand what content is worth investing in. Engagement features keep users active and consistent, while collaboration tools extend the flywheel to teams and clients. Each phase amplifies the others, meaning the system gets smarter and more effective the more it is used.

For the complete technical specification, implementation details, and phase-by-phase breakdown, see [FLYWHEEL_MASTER_PLAN.md](./FLYWHEEL_MASTER_PLAN.md).

---

## 19. Content Intelligence (Phase 2)

Phase 2 of the Content Flywheel provides AI-powered analysis tools that help users understand what makes their content succeed and how to improve it. All intelligence features are accessible from the Intelligence dashboard page.

### AI Content Grader
Scores draft posts on three dimensions: engagement potential, readability, and brand alignment. Users see a composite score (0-100) before publishing, along with specific suggestions for improvement. The grader analyzes factors like post length, question usage, call-to-action presence, and emotional tone to predict how well the content will perform.

### Best Performing Content DNA
Analyzes your top-performing published posts to extract the patterns that drive engagement. The system identifies common elements across your best content — such as tone, length, topic categories, posting times, and formatting choices — and presents them as a "DNA profile" that users can reference when creating new content.

### Topic Fatigue Detection
Monitors the topics you post about and warns when you are overusing the same themes. The system tracks topic frequency over configurable time windows and surfaces alerts when a topic exceeds a healthy posting threshold. Users see recommendations for underused topics to keep their content mix fresh and their audience engaged.

### Content Mix Optimizer
Recommends the ideal balance of content types (educational, promotional, entertaining, engagement-driven) based on your audience's response patterns. The optimizer compares your current content distribution against industry benchmarks and your own historical performance data, then suggests adjustments to maximize overall engagement.

### Tone Drift Monitor
Continuously compares your recent posts against your configured brand voice settings and alerts you when your writing style begins to drift. The monitor tracks metrics like formality level, vocabulary complexity, and emotional tone across your recent content. When drift is detected, users receive specific guidance on how to realign with their brand voice.

### Content Cannibalization Detector
Identifies posts that are competing for the same audience attention by covering overlapping topics or targeting the same keywords. The detector scans your content library for semantic similarity and flags potential cannibalization issues. Users receive suggestions for differentiating or consolidating competing content.

### Engagement Prediction
Uses machine learning trained on your historical posting data to predict how a draft post will perform before you publish it. The prediction engine estimates likely engagement metrics (likes, comments, shares, reach) and provides a confidence score. Users can compare predicted performance across different content variations to choose the strongest option.

### Content Brief Generator
AI creates detailed content briefs based on identified gaps in your content strategy and current trending topics in your niche. Each brief includes a suggested title, key talking points, target audience segment, recommended format, optimal posting time, and relevant hashtags. Users can generate briefs on demand or receive them as automated weekly suggestions.

---

## 20. Advanced Automation (Phase 3)

Phase 3 of the Content Flywheel introduces intelligent automation features that reduce manual content management work. These tools handle repetitive tasks like content recycling, format conversion, and calendar management, accessible from the Automation dashboard page.

### Calendar Autopilot
AI automatically fills your content calendar based on optimal posting times, content mix recommendations, and available draft content. Users configure their preferred posting frequency and content goals, then Autopilot suggests a complete weekly or monthly calendar. Users can accept the full plan, adjust individual slots, or override specific dates before the schedule goes live.

### Batch Repurpose
Converts multiple posts into different formats simultaneously. Users select a set of posts and choose target formats (e.g., convert 10 LinkedIn posts into Twitter threads and Instagram captions at once). The AI adapts each piece of content to the target platform's conventions, character limits, and hashtag norms, saving hours of manual reformatting.

### Content Recycling Queue
Automatically identifies high-performing older content that is worth reposting. The system analyzes historical engagement data, considers time since last posting, and evaluates continued relevance to build a queue of recyclable content. Users can review the queue, approve or skip suggestions, and set minimum time gaps between reposts to avoid audience fatigue.

### Evergreen Content Identifier
Scans your content library and flags posts that remain relevant regardless of when they were originally published. The identifier evaluates factors like topic timelessness, lack of date-specific references, and sustained engagement over time. Flagged content is automatically added to the recycling queue for periodic reposting.

### Blog-to-Thread Converter
Transforms long-form blog posts into Twitter/X thread format with a single click. The converter intelligently splits blog content into tweet-sized segments, preserves logical flow between tweets, adds thread numbering, and creates an engaging hook for the first tweet. Users can edit individual tweets in the thread before scheduling.

### Cross-Post Timing Optimizer
Staggers posts across multiple platforms to maximize total reach rather than posting everywhere simultaneously. The optimizer uses platform-specific engagement data to determine the best posting window for each platform, then spaces out cross-posts accordingly. Users see a visual timeline of planned cross-posts with estimated reach projections.

### Repurpose Chains
Multi-step content transformation pipelines that automate complex repurposing workflows. Users define chains like "Blog Post to LinkedIn Article to Twitter Thread to Instagram Carousel" and the system executes each transformation step automatically. Chains can be saved as templates and applied to new content with one click.

### Draft Expiration Warnings
Sends alerts when draft posts have been sitting unfinished for a configurable period. The system tracks draft age and notifies users via in-dashboard alerts and optional email reminders. Users can set custom expiration windows per content type and choose to publish, reschedule, or archive expired drafts.

### Content Decay Alerts
Monitors previously high-performing published content and notifies users when engagement metrics begin to decline significantly. The system compares recent engagement rates against historical averages for each post and triggers alerts when decay exceeds a configurable threshold. Users receive suggestions for refreshing or repurposing decaying content.

---

## 21. Distribution Intelligence (Phase 4)

Phase 4 of the Content Flywheel focuses on optimizing how and where content reaches its audience. These features use engagement data to provide platform-specific recommendations, accessible from the Distribution dashboard page.

### Platform-Specific Timing Optimizer
Analyzes your historical engagement data on each connected platform to determine the best posting times specific to your audience. Unlike generic "best times to post" advice, this optimizer learns from your actual followers' behavior patterns. Users see a heatmap of optimal posting windows per platform and can apply recommended times directly to scheduled posts.

### Hashtag Performance Tracker
Tracks which hashtags you use and measures their impact on engagement over time. The tracker records impressions, reach, and engagement rates for each hashtag across platforms, then ranks them by effectiveness. Users can identify their top-performing hashtags, discover declining hashtags to retire, and see recommendations for new hashtags to try.

### Audience Persona Builder
AI creates detailed audience personas based on who actually engages with your content. The builder analyzes engagement patterns, commenter profiles, sharing behavior, and demographic data (where available) to construct persona profiles. Each persona includes estimated demographics, interests, preferred content types, and active hours — helping users tailor content to their real audience.

### Competitor Content Gap Analysis
Identifies topics and content themes that your competitors cover but you do not. Users input competitor profiles or URLs, and the system analyzes their content strategy to find gaps in your coverage. The analysis surfaces specific topic opportunities ranked by estimated audience interest and competitive difficulty.

---

## 22. Revenue & ROI (Phase 5)

Phase 5 of the Content Flywheel connects content performance to business outcomes. These features help users understand the financial value of their content efforts, accessible from the Revenue dashboard page.

### Content ROI Calculator
Calculates the return on time and money invested in content creation. Users input their time spent creating content and any associated costs (tools, freelancers, ads), and the calculator estimates the value generated through engagement, reach, lead generation, and conversions. Results are presented as a clear ROI percentage with trends over time.

### Cost Per Post Tracking
Tracks the true cost of creating and publishing each piece of content by factoring in time spent drafting, editing, scheduling, and managing responses. Users can log time manually or let the system estimate based on activity patterns. The tracker breaks down costs by platform, content type, and whether the post was AI-generated or manually created.

### Monthly Content Report Card
Generates an automated monthly performance summary covering all content activity across platforms. The report card includes total posts published, engagement metrics, audience growth, top-performing content, content mix analysis, and month-over-month comparisons. Users receive the report card via email and can view it in the dashboard.

### White-Label Reports
Export professionally branded reports for clients or stakeholders with your own logo and branding. Reports include customizable sections for engagement metrics, content calendar summaries, ROI analysis, and strategic recommendations. Users can generate PDF or interactive web reports and schedule automated recurring report delivery.

---

## 23. Engagement & Retention (Phase 6)

Phase 6 of the Content Flywheel focuses on keeping users actively engaged with the platform through gamification, actionable insights, and community features. These features are accessible from the Engagement and Retention dashboard pages.

### Streak System
Rewards consistent posting with streak tracking that counts consecutive days (or weeks) of publishing content. Users see their current streak prominently displayed on the dashboard along with their longest streak record. The system sends encouraging notifications to maintain streaks and celebratory messages for milestone achievements (7-day, 30-day, 100-day streaks).

### Weekly Flywheel Digest
An email-ready summary of your content performance from the past week, including posts published, total engagement, top-performing content, and suggested actions for the coming week. Users can preview the digest in the dashboard before it sends. The digest also highlights flywheel metrics showing how blog and social content reinforced each other.

### Next Best Action Prompts
AI analyzes your current content state — drafts waiting, scheduled posts, engagement trends, gaps in your calendar — and suggests the single most impactful action you should take next. Suggestions appear as a prominent card on the dashboard and might include "Publish your 3-day-old draft about X" or "Your LinkedIn engagement is down — try posting a question post today." Each prompt includes a one-click action button to execute the suggestion.

### Content Templates Library
A collection of pre-built content templates for common post types like product announcements, tips and tricks, testimonials, behind-the-scenes, polls, and engagement hooks. Users can browse templates by category and platform, customize them with their own brand voice, and save custom templates for reuse. Templates include placeholder text, suggested formatting, and hashtag recommendations.

### Public Content Scorecard
A shareable public profile page that showcases your content performance metrics. The scorecard displays posting consistency, engagement rates, platform reach, and content volume in a visually appealing format. Users can share their scorecard URL on social media or include it in portfolios to demonstrate their content marketing capabilities.

### Flywheel Leaderboard
Team rankings for collaborative environments where multiple users contribute to a shared content strategy. The leaderboard tracks metrics like posts published, engagement generated, streaks maintained, and content quality scores. Teams can compete on weekly or monthly cycles, and individual contributors see how their efforts compare to teammates.

---

## 24. Collaboration (Phase 7)

Phase 7 of the Content Flywheel adds team and client collaboration features that extend PassivePost into agency and team workflows. These features are accessible from the Collaboration dashboard page.

### Client Approval Portal
A public-facing page where clients can review and approve pending content without needing a PassivePost account. Each client receives a unique, secure approval link that shows their queued content with full previews. Clients can approve, request changes (with inline comments), or reject posts directly from the portal. All client actions sync back to the creator's dashboard in real time.

### Approval Queue
An internal dashboard for managing all content pending approval across clients and team members. The queue displays posts grouped by client or project with status indicators (pending, approved, changes requested, rejected). Users can filter by client, platform, or date range, and take bulk actions to approve or reschedule multiple posts at once.

---

## 25. Bonus Features

Additional standalone features that enhance the core PassivePost experience.

### AI Hashtag Suggestions
A dedicated button in the post composer that generates contextually relevant hashtags based on your post content, target platform, and niche. The AI analyzes your post text and suggests 5-15 hashtags ranked by estimated reach and relevance. Users can add individual hashtags with a single click or insert all suggestions at once. The system learns from your hashtag performance history to improve recommendations over time.

### Gig Lead Notifications
A keyword scanner that monitors social platforms for posts matching configurable keywords related to your services. When someone posts looking for help in your niche (e.g., "looking for a plumber in Denver"), the system captures it as a potential lead and sends a notification. Users configure scan keywords, target platforms, and geographic filters to focus on the most relevant opportunities.

### AI Voice Fine-Tuner
Paste samples of your existing writing (blog posts, emails, social posts) and the AI analyzes your unique voice patterns — including sentence structure, vocabulary preferences, formality level, humor usage, and emotional tone. The analysis results are stored as a voice profile that enhances all future AI content generation, making generated posts sound authentically like you rather than generic AI output. Users can update their voice profile at any time by adding new writing samples.

### Lead CRM Mini
A lightweight lead management system built into PassivePost for tracking potential clients discovered through social engagement and gig lead notifications. Users can tag leads by status (new, contacted, qualified, converted), add notes to each lead record, and export lead lists as CSV for use in external CRM tools. The CRM tracks lead source, engagement history, and communication timeline in a streamlined interface designed for solopreneurs and small teams.

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [OVERVIEW.md](./OVERVIEW.md) | Elevator pitch, target audience, pricing, differentiators |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical blueprint: database, APIs, OAuth, queue system |
| [SITEMAP.md](./SITEMAP.md) | Every page and URL in the application |
| [USER_GUIDE.md](./USER_GUIDE.md) | Step-by-step guide for using PassivePost |
| [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md) | Full blog cross-posting system documentation |
| [FLYWHEEL_MASTER_PLAN.md](./FLYWHEEL_MASTER_PLAN.md) | Complete 7-phase Content Flywheel specification |

---

*Last Updated: February 20, 2026*
