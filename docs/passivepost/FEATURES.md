# PassivePost — Feature Guide

PassivePost is a closed-loop business intelligence platform for content creators. It combines content scheduling (8 social + 2 blog platforms), affiliate marketing (3 dashboards), connected analytics, and AI coaching into one platform. This document is a detailed breakdown of every feature, organized by system.

---

## Table of Contents

1. [Content Scheduling](#1-content-scheduling)
2. [Multi-Platform Support](#2-multi-platform-support)
3. [AI Content Generation](#3-ai-content-generation)
4. [Blog Publishing](#4-blog-publishing)
5. [Content Flywheel (7 Phases)](#5-content-flywheel-7-phases)
6. [Affiliate Program](#6-affiliate-program)
7. [AI-Powered Affiliate Tools](#7-ai-powered-affiliate-tools)
8. [Analytics & Intelligence](#8-analytics--intelligence)
9. [Gamification & Engagement](#9-gamification--engagement)
10. [Marketing Toolkit](#10-marketing-toolkit)
11. [Financial Tools](#11-financial-tools)
12. [CRM & Support](#12-crm--support)
13. [Admin Dashboard](#13-admin-dashboard)
14. [User Dashboard](#14-user-dashboard)
15. [Communication](#15-communication)
16. [Email & Notifications](#16-email--notifications)

---

## 1. Content Scheduling

### Post Management
Users create, edit, schedule, and publish social media posts from a central dashboard. Each post includes content, target platform, status, optional media attachments, and scheduling details. Posts move through a clear lifecycle: draft, scheduled, queued, posting, posted, or failed.

### Queue System
The Queue page shows all posts waiting to be published, ordered by scheduled time. Users can reorder, edit, or cancel queued posts. Background processing via BullMQ delivers posts to platform APIs with retry logic (3 retries with exponential backoff).

### Content Calendar
A month-grid calendar view showing all scheduled and published posts by date. Hover tooltips show per-platform counts for each day. Blog posts appear alongside social posts in the unified calendar view.

### Bulk Import
Import multiple posts at once for batch scheduling. Useful for planning a week or month of content in a single operation.

### Brand Voice System
Users configure their brand identity through settings for tone, niche, location, sample URLs, target audience, posting goals, preferred platforms, and post frequency. These preferences shape every piece of AI-generated content.

There are 14 built-in niche categories, each with admin-editable prompt guidance that tells the AI how to write for that industry:

| Niche | AI Voice Style |
|-------|---------------|
| Plumbing | Casual, local, common household problems |
| HVAC | Trusted technician, seasonal comfort |
| Electrical | Safety-first, home reliability |
| Landscaping | Visual, seasonal, curb appeal |
| Cleaning | Friendly, relatable, busy schedules |
| Real Estate | Market-savvy, approachable, local insights |
| Rideshare | Down-to-earth, hustle and city life |
| Freelance | Authentic, independent work experiences |
| Photography | Visual storytelling, behind-the-scenes |
| Fitness | Motivating without preaching, practical tips |
| Food & Restaurant | Warm, inviting, flavors and community |
| Beauty | Confident, inclusive, self-care |
| Tutoring | Encouraging, study tips, success stories |
| Pet Care | Warm, playful, practical care tips |

### Tier System & Usage Limits

| Limit | Starter | Basic | Premium |
|-------|---------|-------|---------|
| Daily AI Generations | 5 | 10 | 100 |
| Daily Posts | 1 | 2 | Unlimited |
| Monthly Posts | 15 | 30 | Unlimited |
| Connected Platforms | 2 | 3 | 8 |

Limits are enforced automatically. An upgrade banner appears when usage reaches 80% of any limit.

---

## 2. Multi-Platform Support

PassivePost connects to 8 social media platforms and 2 blog platforms:

### Social Platforms (8)
| Platform | Connection Type |
|----------|----------------|
| Twitter/X | OAuth 2.0 with PKCE |
| LinkedIn | OAuth 2.0 with PKCE |
| Facebook | OAuth 2.0 (Page access) |
| Instagram | OAuth integration |
| Reddit | OAuth integration |
| Discord | OAuth integration |
| YouTube | OAuth integration |
| Pinterest | OAuth integration |

### Blog Platforms (2)
| Platform | Connection Type |
|----------|----------------|
| WordPress | REST API + App Passwords |
| Ghost | Admin API Key |

Each platform has a dedicated icon component with its official brand color, used throughout the dashboard for visual identification.

---

## 3. AI Content Generation

### How It Works
1. The user's brand preferences are loaded (tone, niche, location, audience, goals)
2. If a niche is selected, the corresponding niche guidance prompt is injected
3. The xAI Grok model generates platform-appropriate content
4. The user can edit, schedule, or post immediately

### Quick Generate FAB
A floating action button on every social dashboard page provides one-click AI content generation. Users can generate, preview, copy to clipboard, or schedule directly from the dialog.

### Multimodal Support
Users can include images when generating content. The AI references the image to create relevant captions and descriptions.

### AI Voice Fine-Tuner
Users paste 3-15 writing samples and the AI analyzes their unique voice patterns (tone, vocabulary, sentence style, CTA patterns), creating a reusable voice profile for all future content generation.

---

## 4. Blog Publishing

### Supported Blog Platforms
| Platform | Integration Type |
|----------|-----------------|
| WordPress | REST API + App Passwords |
| Ghost | Admin API Key |

### Key Capabilities
- **Markdown Editor**: Write blog posts with live preview and formatting toolbar
- **SEO Preview**: See how your post will appear in Google search results before publishing
- **Repurpose Engine**: AI generates 5-7 platform-appropriate social media snippets from each blog post, with links back to the article
- **Calendar Integration**: Blog posts appear alongside social posts in the unified content calendar
- **Content Series**: Group related posts into series for sequential publishing
- **Cross-Channel Linking**: Blog posts and social snippets are linked bidirectionally, enabling traffic tracking between blog and social

For full details, see [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md).

---

## 5. Content Flywheel (7 Phases)

The Content Flywheel is a 7-phase system that creates a self-reinforcing loop where content creation, intelligence, automation, distribution, revenue tracking, engagement, and collaboration all feed into each other.

### Phase 1: Flywheel Foundation
- **Flywheel Metrics API**: Calculates flywheel health scores, counts, and velocity data
- **Blog Home Dashboard**: Dashboard with flywheel metrics, connections, and content pipeline overview
- **Flywheel Health Score**: Prominent health card on the main overview dashboard
- **Cross-Channel Linking**: Bidirectional links between blog content and social posts
- **Auto-Snippet Scheduling**: One-click scheduling of repurposed snippets across 7-14 days

### Phase 2: Content Intelligence
- **AI Content Grader**: Scores draft posts on engagement potential, readability, and brand alignment (0-100)
- **Best Performing Content DNA**: Extracts patterns from top-performing posts (tone, length, topic, timing)
- **Topic Fatigue Detection**: Warns when topics are overused, suggests underused themes
- **Content Mix Optimizer**: Recommends ideal balance of content types (educational, promotional, entertaining)
- **Tone Drift Monitor**: Compares recent posts against brand voice settings, alerts on drift
- **Content Cannibalization Detector**: Identifies posts competing for the same audience attention
- **Engagement Prediction**: Predicts engagement metrics for draft posts before publishing
- **Content Brief Generator**: Creates detailed content briefs based on strategy gaps and trending topics

### Phase 3: Advanced Automation
- **Calendar Autopilot**: AI fills content calendar based on optimal timing and content mix
- **Batch Repurpose**: Convert multiple posts into different formats simultaneously
- **Content Recycling Queue**: Identifies high-performing old content worth reposting
- **Evergreen Content Identifier**: Flags content that remains relevant regardless of age
- **Blog-to-Thread Converter**: Transforms blog posts into Twitter/X thread format
- **Cross-Post Timing Optimizer**: Staggers posts across platforms for maximum reach
- **Repurpose Chains**: Multi-step content transformation pipelines
- **Draft Expiration Warnings**: Alerts when drafts sit unfinished too long
- **Content Decay Alerts**: Notifies when previously high-performing content declines

### Phase 4: Distribution Intelligence
- **Platform-Specific Timing Optimizer**: Learns best posting times from your actual audience behavior
- **Hashtag Performance Tracker**: Tracks hashtag impact on engagement, ranks by effectiveness
- **Audience Persona Builder**: AI creates detailed audience personas from engagement data
- **Competitor Content Gap Analysis**: Identifies topics competitors cover that you don't

### Phase 5: Revenue & ROI
- **Content ROI Calculator**: Calculates return on content creation time and costs
- **Cost Per Post Tracking**: Tracks true cost of each piece of content
- **Monthly Content Report Card**: Automated monthly performance summary
- **White-Label Reports**: Branded PDF or web reports for clients and stakeholders

### Phase 6: Engagement & Retention
- **Streak System**: Gamified consistency tracking for consecutive posting days
- **Weekly Flywheel Digest**: Email-ready summary of weekly content performance
- **Next Best Action Prompts**: AI suggests the single most impactful action to take next
- **Content Templates Library**: Pre-built templates for common post types
- **Public Content Scorecard**: Shareable public profile of content performance
- **Flywheel Leaderboard**: Team rankings for collaborative content environments

### Phase 7: Collaboration
- **Client Approval Portal**: Public page where clients review and approve content without logging in
- **Approval Queue**: Internal dashboard for managing all pending approvals across clients

### Bonus Features
- **AI Hashtag Suggestions**: Contextual hashtag generation based on post content and niche
- **Gig Lead Notifications**: Keyword scanner finding potential clients on social platforms
- **AI Voice Fine-Tuner**: Voice profile creation from writing samples
- **Lead CRM Mini**: Tags, notes, status tracking, and CSV export for social leads

---

## 6. Affiliate Program

The affiliate program is PassivePost's growth engine. Content creators sign up as affiliates, promote the product using tracked links, and earn commissions on every sale they generate.

### Core Affiliate Features
| Feature | Description |
|---------|-------------|
| Public Signup | Anyone can apply at `/affiliate/join` without an existing account |
| Admin Review | Applications are reviewed and approved/rejected with notes |
| Standalone Dashboard | Dedicated 11-tab dashboard separate from the main product |
| Referral Link Generation | Unique `?ref=CODE` links pointing to any page |
| Cookie-Based Attribution | 30-day default attribution window (configurable) |
| Commission Tracking | Automatic commission calculation on referred customer payments |
| Rate Lock-In | Commission rates are permanently locked when affiliate activates |
| Fraud Detection | Automated scoring for suspicious patterns |
| External Network Support | Infrastructure for ShareASale, Impact, and PartnerStack |

### Performance Tiers
Affiliates progress through Bronze, Silver, Gold, and Platinum tiers based on referral count. Higher tiers earn higher commission rates and unlock perks.

### Contests & Challenges
Time-bound competitions with prizes and leaderboards drive bursts of promotional activity. Weekly micro-challenges with progress bars and badge rewards build daily habits.

---

## 7. AI-Powered Affiliate Tools

Every AI feature pulls real data from the affiliate's actual performance, connected platforms, and program context. All AI features use the xAI Grok model.

| Tool | What It Does |
|------|-------------|
| **AI Post Writer** | Generates platform-specific social posts (7 platforms, 5 tones) with referral links embedded |
| **AI Email Drafter** | Creates professional email sequences for audience promotion |
| **AI Blog Outline Generator** | Structured blog post outlines with SEO-friendly headings |
| **AI Video Script Generator** | Video talking points for YouTube, TikTok, Instagram Reels |
| **AI Objection Handler** | Responses to common sales objections |
| **AI Coach** | Personalized tips based on actual commissions, tiers, contests, and platform metrics |
| **AI Ad Copy Generator** | Promotional ad text for paid campaigns |
| **AI Pitch Customizer** | Tailored pitches for different audience types |
| **AI Audience Content** | Content ideas matched to audience demographics |
| **AI Promo Ideas** | Creative promotion suggestions based on trends and seasons |
| **AI Onboarding Advisor** | First-steps guidance for new affiliates |
| **AI Conversion Optimizer** | Funnel analysis with specific improvement suggestions |
| **AI Analytics Intelligence** | Six insight types: conversion, content, channel, audience, seasonal, competitive |
| **AI Posting Strategy** | Best posting times based on engagement patterns |
| **Promotion Strategy Quiz** | 6-question quiz generating a personalized 30-day playbook |
| **Audience Analyzer** | AI-powered audience persona from click and engagement data |

---

## 8. Analytics & Intelligence

### Connected Analytics
Merges data from connected platforms (YouTube, social media) with affiliate performance and financial data in a unified dashboard. This is the core value — see how content performance directly correlates with affiliate earnings.

### Analytics Features
| Feature | Description |
|---------|-------------|
| Churn Intelligence | Churn rate, reasons, timing patterns, at-risk referrals |
| Cohort Analysis | Groups referrals by signup month, tracks retention |
| Revenue Analytics | Revenue by source, cumulative earnings, conversion funnel |
| Traffic Insights | Geographic breakdown, device types, repeat visitors |
| Predictive Intelligence | Tier trajectory, churn predictions, seasonal patterns |
| Custom Range Reports | Any date range with period-over-period comparison |
| Earnings Heatmap | GitHub-style 52-week activity visualization |
| Percentile Benchmarks | Ranking compared to all other affiliates |
| Content Intelligence | Promotion frequency and content type performance by platform |
| Financial Overview | Earnings vs costs, ROI calculations, break-even analysis |

---

## 9. Gamification & Engagement

| Feature | Description |
|---------|-------------|
| Performance Tiers | Bronze, Silver, Gold, Platinum progression |
| Milestone Bonuses | Cash bonuses at referral thresholds |
| Contests | Time-bound competitions with prizes and leaderboards |
| Badges & Achievements | Visual badges for accomplishments |
| Earnings Goals | Self-set monthly targets with progress tracking |
| "Fastest to $X" | Speed-based awards for reaching earnings milestones |
| Weekly Challenges | Micro-challenges with progress bars and badge rewards |
| Leaderboards | Ranked lists by referrals, earnings, or conversion rate |
| Posting Streaks | Consecutive posting day tracking |

---

## 10. Marketing Toolkit

Tools that give affiliates everything they need to promote effectively:

| Tool | Description |
|------|-------------|
| Deep Link Generator | Tracked links to any specific page with UTM parameters |
| QR Code Generator | Branded QR codes containing referral links |
| Link Shortener | Clean, memorable short links |
| Media Kit Page | Professional partner page with stats and materials |
| Copy-Paste Captions | Pre-written social posts with referral links inserted |
| Sharing Cards | Pre-designed social images with referral codes |
| Co-Branded Landing Pages | Customizable partner pages at `/partner/[slug]` |
| Discount Codes | Branded coupons synced with Stripe (6 discount types) |
| Email Templates | Pre-written sequences with merge tags |
| Swipe Files | Promotional emails with auto-filled affiliate info |
| Starter Kit | Curated bundle of essentials for new affiliates |
| Knowledge Base | Searchable help articles with view tracking |
| Promotional Calendar | Upcoming campaigns with countdown timers and linked assets |
| Asset Usage Analytics | Tracks downloads, copies, and views per marketing asset |

---

## 11. Financial Tools

| Feature | Description |
|---------|-------------|
| Payout Lifecycle | Clear workflow: Pending, Approved, Paid |
| Batch Processing | Process multiple payouts at once with receipt emails |
| Payout Schedule Widget | Next payout date, threshold progress, pending balance |
| Tax Info Collection | W-9 (US) and W-8BEN (international) form submission |
| Tax Summary | Annual summary with estimated withholding and monthly breakdown |
| Admin 1099 Export | Year-end CSV for 1099-NEC preparation |
| Earnings Statements | Downloadable statements with period selection |
| Commission Lifecycle Tracker | 7-step visual journey: Click, Signup, Trial, Paid, Commission, Approved, Paid Out |
| Second-Tier Commissions | Earn from recruited affiliates' sales |
| Commission Renewals | Extended commission windows on customer renewals |
| Earnings Forecast | Projected earnings based on 14-day rolling average |
| Earnings Projections | Multi-month forward projections (3, 6, 12 months) |
| Commission Split Estimator | Calculator for earnings across tiers and products |

---

## 12. CRM & Support

| Feature | Description |
|---------|-------------|
| Universal User Profiles | Unified profile for every user with contact info and activity history |
| Support Tickets | Full ticket system with Open, In Progress, Resolved, Closed workflow |
| CRM Activity Log | Records calls, notes, tasks, and meetings per user |
| Marketing Campaigns | Campaign tracking with UTM attribution and performance counters |
| Contracts & Agreements | Contract creation with signing workflow and version history |
| Admin CRM Card | 360-degree affiliate view with earnings, payouts, tickets, and notes |
| Affiliate Health Scores | Auto-calculated green/yellow/red indicators |

---

## 13. Admin Dashboard

| Feature | Description |
|---------|-------------|
| Setup Wizard | Task-based onboarding for initial configuration |
| User Management | View, assign roles, search, filter, manage accounts |
| Revenue Attribution | Revenue from affiliate vs direct signups |
| Revenue Waterfall | Visual flow from gross to net after commissions and fees |
| Scheduled Reports | Automated weekly revenue and activity digests |
| Metrics Alerts | Configurable alerts when KPIs cross thresholds |
| Audit Logging | Records every admin action with timestamps |
| Onboarding Funnel | Tracks user drop-off at each setup step |
| Queue Management | View and manage background job queues |
| Product Registry | Multi-product support from a single admin interface |
| Email Template Editor | Customize all email templates with category tagging |
| SSO/SAML Configuration | Enterprise single sign-on setup |

---

## 14. User Dashboard

| Feature | Description |
|---------|-------------|
| Invoice History | All invoices with status filters, detail view, and PDF download |
| Subscription Management | Current plan, billing cycle, and Stripe customer portal |
| Support Tickets | Submit and track support requests |
| Account Security | Password change and security settings |
| Usage Insights | Activity metrics with trends |
| Affiliate Invitation | Card linking to affiliate application for earning commissions |
| Email Preferences | Control which notification emails to receive |

---

## 15. Communication

| Feature | Description |
|---------|-------------|
| Broadcasts | Email announcements to all or segmented affiliates |
| In-App Messaging | Two-way threads between admin and individual affiliates |
| Drip Sequences | Automated 3-email onboarding series |
| Announcements | Admin-created news on the affiliate dashboard |
| Affiliate Spotlight | Monthly featured affiliate recognition |
| What's New Digest | Feature update notifications |
| Surveys | Satisfaction surveys with star ratings and open feedback |
| Testimonials | Success story submissions displayed on landing page |

---

## 16. Email & Notifications

| Type | Description |
|------|-------------|
| Transactional Emails | Confirmations, password resets, system notifications |
| Branded Payment Receipts | Customized receipt emails after payments |
| Editable Templates | Admin-customizable email templates |
| Drip Campaigns | Multi-step automated sequences |
| Weekly Performance Emails | Affiliate activity summaries |
| Monthly Earnings Statements | Formatted earnings reports |
| Weekly Affiliate Digest | Contest standings, milestones, program updates |
| Trial Expiry Alerts | Warnings before trial end |
| In-App Notification Bell | Real-time notifications with unread badges |
| Email Preferences Center | User-controlled email categories |

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [OVERVIEW.md](./OVERVIEW.md) | Product overview and positioning |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical blueprint: database, APIs, OAuth |
| [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md) | Blog cross-posting details |

---
