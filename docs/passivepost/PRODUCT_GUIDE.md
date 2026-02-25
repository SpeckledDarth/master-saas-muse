# PassivePost — Product Guide

PassivePost is a closed-loop business intelligence platform for content creators. It brings together content scheduling across 8 social platforms and 2 blog platforms, a full affiliate marketing program spanning 3 dashboards, connected analytics that merge content performance with revenue data, and AI coaching powered by xAI Grok. This guide is a complete reference for understanding what PassivePost is, how it works, and how all its systems connect.

---

## 1. What PassivePost Does

PassivePost connects the dots between what you publish, how your audience responds, what revenue it generates, and what you should do next. Unlike single-purpose tools, PassivePost ties content creation directly to business outcomes.

**Core capabilities:**
- **Content Scheduling**: Create, schedule, and publish across 8 social platforms (Twitter/X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, Pinterest) and 2 blog platforms (WordPress, Ghost)
- **Affiliate Marketing**: A 32-feature affiliate program with referral tracking, commissions, performance tiers, and payouts managed across 3 separate dashboards (Admin, Affiliate, User)
- **Connected Analytics**: Merge content performance data with affiliate earnings and platform engagement metrics in unified views
- **AI Coaching**: 14+ AI tools using xAI Grok (`grok-3-mini-fast`) that pull real user data to deliver personalized, actionable advice
- **Content Flywheel**: A 42-feature system across 7 phases that creates a self-reinforcing loop of content creation, intelligence, automation, distribution, revenue tracking, engagement, and collaboration

---

## 2. The Three Dashboards

PassivePost is organized into three separate dashboard experiences, each designed for a different user role.

### Admin Dashboard (`/admin/`)
The control center for platform owners and administrators.
- User management with role assignment (user, affiliate, admin)
- Affiliate program configuration with 15+ setup tabs (commission rates, tiers, contests, payout rules)
- Revenue attribution and waterfall reports
- Audit logging, metrics alerts, and KPI monitoring
- Email template management and queue monitoring
- SSO/SAML configuration for enterprise customers

### Affiliate Dashboard (`/affiliate/dashboard`)
A standalone dashboard for content creators who promote PassivePost as affiliates.
- 11 navigation tabs: Overview, Links, Analytics, Marketing, Resources, Earnings, Contests, Settings, Messages, Support, What's New
- Performance analytics with charts, sparklines, and heatmaps
- 14+ AI-powered business tools (AI Coach, Post Writer, Analytics, Conversion Optimizer, and more)
- Marketing toolkit: deep links, QR codes, media kit, sharing cards, co-branded landing pages, discount codes
- Financial tools: payouts, tax preparation (W-9/W-8BEN), earnings forecasts, commission tracking
- Gamification: contests, challenges, leaderboards, badges, milestone bonuses, earnings goals
- Knowledge base and promotional calendar

### User Dashboard (`/dashboard/`)
The customer hub for subscribers using the product.
- Invoice history and Stripe subscription management
- Support tickets with comment threads
- Account security settings
- Usage insights and email preferences
- Social scheduling access at `/dashboard/social/`

---

## 3. Connected Platforms

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

---

## 4. Social Scheduling Dashboard

The social scheduling dashboard lives at `/dashboard/social/` and uses a dedicated sidebar layout with the following navigation structure:

**Dashboard**
- Overview: Usage progress bars, quick stats, AI coaching card, flywheel health score, Quick Generate button
- Posts: Post management with filtering by platform/status/date, bulk actions, and detail dialogs
- Queue: Scheduled posts ordered by time with reorder and cancel options
- Calendar: Month-grid view of all scheduled and published content with per-platform count tooltips

**Blog**
- Blog Home: Flywheel metrics, connected blog platform management (WordPress, Ghost), content pipeline overview
- Compose: Markdown editor with SEO preview and one-click publish
- Articles: Blog post list with status filtering and search

**Automation**
- Autopilot: Calendar autopilot, batch repurpose, content recycling, evergreen content finder, blog-to-thread converter, cross-post timing optimizer, repurpose chains, draft warnings, content decay alerts

**Insights**
- Engagement: Analytics with Recharts charts, per-platform breakdowns, best-performing content
- Intelligence: AI content grader, DNA analyzer, topic fatigue, content mix, tone drift, cannibalization detector, engagement prediction, content briefs
- Distribution: Platform timing optimizer, hashtag tracker, audience personas, competitor gap analysis
- Revenue & ROI: ROI calculator, cost per post, monthly report card, white-label report exports
- Retention: Posting streaks, weekly digest preview, content templates, leaderboard
- Leads: Lead tracking, gig scanner, reply templates, mini CRM, CSV export

**Collaborate**
- Approvals: Client approval queue and shared content workflows with token-based external review

**Setup**
- Brand Voice: Tone, niche, location, audience, goals, platforms, posting frequency, voice fine-tuner
- Accounts: Connect and disconnect social and blog accounts, validate credentials
- Settings: Notification preferences and module settings

---

## 5. AI Architecture

All AI features use the **xAI Grok model** (`grok-3-mini-fast`) and follow a critical design principle: every AI feature pulls real user data rather than generating generic advice.

### Content AI
- Post generation uses brand voice settings, niche guidance, and platform-specific constraints
- Voice fine-tuner analyzes 3-15 writing samples to create a reusable voice profile
- Content grader scores drafts on engagement potential, readability, and brand alignment

### Affiliate AI (14+ tools)
| Tool | Data Sources |
|------|-------------|
| AI Coach | Commissions, tiers, contests, milestones, leaderboard, connected platforms |
| AI Post Writer | Brand voice, referral links, platform conventions |
| AI Analytics | Conversion rates, revenue attribution, traffic patterns |
| AI Conversion Optimizer | Funnel data, referral performance, platform correlations |
| Promotion Quiz | 6-question assessment saved for future AI context |
| Audience Analyzer | Click data, device types, geography, traffic sources |

Additional AI tools include email draft generator, blog outline creator, video script writer, objection handler, ad copy generator, pitch customizer, audience content advisor, promo idea generator, onboarding advisor, posting strategy optimizer, and conversion insights analyzer.

---

## 6. Affiliate Program

The affiliate program is PassivePost's growth engine with 32 features across the 3 dashboards.

### Application & Onboarding
- Public application at `/affiliate/join` (no existing account required)
- Admin review with approve/reject workflow and notes
- Automated 3-email drip sequence for new affiliates (Welcome, Tips at 24h, Strategy at 72h)
- AI onboarding advisor for personalized getting-started guidance

### Referral Tracking
- Unique referral codes with `?ref=CODE` format
- Cookie-based attribution (30-day default, configurable)
- Automatic commission calculation on referred customer payments
- Rate lock-in: commission terms are permanently locked at activation time

### Performance Tiers
Bronze, Silver, Gold, and Platinum progression based on referral count. Higher tiers earn higher commission rates and unlock exclusive perks.

### Gamification
- Milestone bonuses at referral thresholds
- Time-bound contests with prizes and leaderboards
- Weekly challenges with progress bars and badge rewards
- Badges for achievements ("First Sale", "Top 10%", etc.)
- Self-set earnings goals with visual progress tracking

### Marketing Tools
Deep links, QR codes, link shortener, media kit, co-branded landing pages, discount codes (6 types, Stripe-synced), swipe files, sharing cards, email templates, promotional calendar, and asset usage analytics.

### Financial Tools
Payout lifecycle (Pending -> Approved -> Paid), batch processing, tax info collection (W-9/W-8BEN), annual tax summaries, downloadable earnings statements, commission lifecycle tracker, second-tier commissions, renewals, forecasts, and projections.

---

## 7. Content Flywheel

The 7-phase flywheel system creates a self-reinforcing loop where each phase feeds data and insights into the next:

| Phase | Name | Features | Purpose |
|-------|------|----------|---------|
| 1 | Flywheel Foundation | 5 | Blog-to-social pipeline, metrics, cross-linking |
| 2 | Content Intelligence | 8 | AI-powered content analysis and optimization |
| 3 | Advanced Automation | 9 | Content workflows, recycling, transformation |
| 4 | Distribution Intelligence | 4 | Platform timing, hashtags, audience personas |
| 5 | Revenue & ROI | 4 | ROI calculation, cost tracking, reporting |
| 6 | Engagement & Retention | 6 | Streaks, digests, templates, gamification |
| 7 | Collaboration | 2 | Client approval portals, team queues |
| Bonus | Extra Features | 4 | Hashtags, gig leads, voice tuner, lead CRM |

**Total: 42 features across all phases**

See [FLYWHEEL_MASTER_PLAN.md](./FLYWHEEL_MASTER_PLAN.md) for the complete specification of each feature.

---

## 8. Subscription Tiers

### Content Scheduling Tiers

| Limit | Starter | Basic | Premium |
|-------|---------|-------|---------|
| Daily AI Generations | 5 | 10 | 100 |
| Daily Posts | 1 | 2 | Unlimited |
| Monthly Posts | 15 | 30 | Unlimited |
| Connected Platforms | 2 | 3 | 8 |

Tiers are resolved via Stripe subscription metadata. Admins can customize tier names, limits, and pricing through the admin setup wizard.

### Affiliate Performance Tiers
Bronze, Silver, Gold, and Platinum based on referral count. Each tier unlocks higher commission rates and exclusive perks.

---

## 9. Analytics & Intelligence

### Connected Analytics
Merges data from connected social and blog platforms with affiliate performance data:
- Content performance correlated with affiliate earnings
- Platform-by-platform revenue attribution
- Cross-platform engagement comparison

### Analytics Features
- Churn intelligence with at-risk referral identification
- Cohort analysis grouping referrals by signup month
- Revenue breakdown by source (direct vs affiliate)
- Geographic and device type traffic insights
- Predictive intelligence for tier trajectory and seasonal patterns
- Custom range reports with period-over-period comparison
- Earnings heatmap
- Percentile benchmarks across the affiliate program

---

## 10. Communication & Engagement

### Admin-to-Affiliate Communication
- Broadcast emails to all or segmented affiliates
- In-app messaging threads with unread indicators
- Announcements on the affiliate dashboard
- Monthly affiliate spotlight recognition

### Automated Communication
- 3-email drip sequence for new affiliates
- Weekly performance emails
- Monthly earnings statements
- Weekly affiliate digest with contest standings and tips
- Trial expiry alerts
- What's New feature update notifications

### Feedback Loop
- Satisfaction surveys with star ratings
- Testimonial submissions for social proof
- Knowledge base with searchable help articles

---

## 11. CRM & Support

| Feature | Description |
|---------|-------------|
| Universal User Profiles | Unified view of every user with contact info and activity history |
| Support Tickets | Full workflow: Open -> In Progress -> Resolved -> Closed |
| CRM Activity Log | Calls, notes, tasks, meetings per user account |
| Marketing Campaigns | UTM attribution and performance tracking |
| Contracts | Creation, signing workflow, version history |
| Admin CRM Card | 360-degree affiliate view in a single drawer |
| Health Scores | Auto-calculated green/yellow/red based on activity and conversion |

---

## 12. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) with TypeScript |
| Frontend | React, Tailwind CSS, shadcn/ui, Recharts |
| Database | PostgreSQL via Supabase with Row Level Security |
| Auth | Supabase Auth (email, OAuth, SSO/SAML) |
| Payments | Stripe (subscriptions, webhooks, customer portal) |
| Email | Resend (transactional, drip, digests) |
| AI | xAI Grok (`grok-3-mini-fast`) |
| Queue | BullMQ with Upstash Redis |
| Rate Limiting | Upstash Redis sliding window + in-memory fallback |

---

## 13. Security

### Token Encryption
All OAuth tokens and API keys are encrypted with AES-256-GCM before database storage. The encryption key is stored as an environment variable.

### Row Level Security
All user-facing database tables have RLS enabled. Users can only access their own data, enforced at the database level by Supabase.

### Fraud Detection
Automated scoring for affiliate referrals, checking for suspicious patterns like same email domains, high-volume IP addresses, and self-referrals.

### Rate Limiting
- Tier-based usage limits on posts and AI generations
- API endpoint rate limiting with Redis sliding window
- In-memory fallback when Redis is unavailable

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [FLYWHEEL_MASTER_PLAN.md](./FLYWHEEL_MASTER_PLAN.md) | Content flywheel strategy and all 42 features |
| [SITEMAP.md](./SITEMAP.md) | Every page and URL in the application |
| [USER_GUIDE.md](./USER_GUIDE.md) | Step-by-step guide for end users |

---
