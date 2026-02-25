# PassivePost — Content Flywheel Strategy

PassivePost is a closed-loop business intelligence platform for content creators. It combines content scheduling across 8 social platforms and 2 blog platforms (WordPress, Ghost), a 3-dashboard affiliate marketing program, connected analytics, and AI coaching powered by xAI Grok.

The Content Flywheel is a 7-phase system of 42 features that transforms PassivePost from a content scheduling tool into a self-reinforcing content marketing engine. Each phase builds on the previous one: content creation feeds intelligence, intelligence informs automation, automation optimizes distribution, distribution data drives revenue tracking, revenue insights improve engagement, and collaboration extends the entire loop to teams and clients.

---

## Table of Contents

1. [How the Flywheel Works](#how-the-flywheel-works)
2. [Phase 1: Flywheel Foundation](#phase-1-flywheel-foundation)
3. [Phase 2: Content Intelligence](#phase-2-content-intelligence)
4. [Phase 3: Advanced Automation](#phase-3-advanced-automation)
5. [Phase 4: Distribution Intelligence](#phase-4-distribution-intelligence)
6. [Phase 5: Revenue & ROI](#phase-5-revenue--roi)
7. [Phase 6: Engagement & Retention](#phase-6-engagement--retention)
8. [Phase 7: Collaboration](#phase-7-collaboration)
9. [Bonus Features](#bonus-features)
10. [Implementation Summary](#implementation-summary)
11. [Navigation Structure](#navigation-structure)
12. [API Route Map](#api-route-map)

---

## How the Flywheel Works

The flywheel starts with content creation (blog posts published to WordPress or Ghost, and social posts scheduled to 8 platforms). Performance data from published content flows into the intelligence layer, where AI grades, predicts, and analyzes patterns. Intelligence insights feed automation rules that handle recycling, repurposing, and scheduling. Automation optimizes distribution across platforms and time zones. Distribution data powers ROI tracking so users understand which content is worth investing in. Engagement features (streaks, digests, templates) keep users active and consistent. Collaboration tools extend the flywheel to agencies and teams managing content for clients. The system gets smarter the more it is used.

```
    CONTENT CREATION (Blog + Social)
              |
    +---------v---------+
    |   INTELLIGENCE     |  Grade, predict, analyze
    +---------+---------+
              |
    +---------v---------+
    |   AUTOMATION       |  Recycle, repurpose, schedule
    +---------+---------+
              |
    +---------v---------+
    |   DISTRIBUTION     |  Timing, hashtags, personas
    +---------+---------+
              |
    +---------v---------+
    |   REVENUE          |  ROI, cost tracking, reports
    +---------+---------+
              |
    +---------v---------+
    |   ENGAGEMENT       |  Streaks, digest, templates
    +---------+---------+
              |
    +---------v---------+
    |   COLLABORATION    |  Approvals, team queues
    +---------+---------+
              |
              v
    (Back to CONTENT CREATION, now informed by data)
```

---

## Phase 1: Flywheel Foundation

**Goal**: Make the blog-to-social flywheel visible, measurable, and actionable.

### 1.1 Flywheel Metrics API
Backend endpoint (`/api/social/flywheel/metrics`) that calculates flywheel scores, counts, and velocity data. This powers all flywheel visualizations across the dashboard.

### 1.2 Blog Home Dashboard
Full dashboard with flywheel health metrics, connected blog platform management (WordPress and Ghost), and a content pipeline overview showing posts at each stage.

### 1.3 Flywheel Health Score on Overview
A prominent card on the main social overview dashboard showing flywheel velocity and overall health score at a glance.

### 1.4 Cross-Channel Linking
Bidirectional links between blog content and social posts. When a blog post is repurposed into social snippets, the relationship is tracked so users can see which social posts drive traffic to which blog articles and vice versa.

### 1.5 Auto-Snippet Scheduling
After repurposing a blog post into social snippets, one click spreads the snippets across the next 7-14 days for sustained blog promotion.

---

## Phase 2: Content Intelligence

**Goal**: Make PassivePost smarter than the user with proactive insights rather than reactive tools.

### 2.1 AI Content Grader
Scores draft posts on three dimensions: engagement potential, readability, and brand alignment. Users see a composite score (0-100) with specific improvement suggestions before publishing.

### 2.2 Best Performing Content DNA
Analyzes top-performing published posts to extract the patterns that drive engagement: tone, length, topic categories, posting times, and formatting. Results are presented as a "DNA profile."

### 2.3 Topic Fatigue Detection
Monitors posting topics and warns when themes are overused. Surfaces alerts when a topic exceeds a healthy threshold and recommends underused topics.

### 2.4 Content Mix Optimizer
Recommends the ideal balance of content types (educational, promotional, entertaining, engagement-driven) based on audience response patterns and historical performance.

### 2.5 Tone Drift Monitor
Compares recent posts against configured brand voice settings and alerts when writing style begins to drift, with specific guidance on realignment.

### 2.6 Content Cannibalization Detector
Identifies posts competing for the same audience attention by covering overlapping topics. Suggests differentiating or consolidating competing content.

### 2.7 Engagement Prediction
Predicts how a draft post will perform before publishing, estimating likely engagement metrics with a confidence score. Users can compare predicted performance across content variations.

### 2.8 Content Brief Generator
AI creates detailed content briefs based on strategy gaps and trending topics. Each brief includes suggested title, key talking points, target audience segment, recommended format, optimal posting time, and hashtags.

---

## Phase 3: Advanced Automation

**Goal**: Automate the repetitive parts of content marketing so users can focus on creating.

### 3.1 Calendar Autopilot
AI fills the content calendar based on optimal posting times, content mix recommendations, and available draft content. Users can accept the full plan, adjust individual slots, or override specific dates.

### 3.2 Batch Repurpose
Converts multiple posts into different formats simultaneously (e.g., 10 LinkedIn posts into Twitter threads and Instagram captions at once).

### 3.3 Content Recycling Queue
Identifies high-performing older content worth reposting. Analyzes engagement data, time since last posting, and continued relevance.

### 3.4 Evergreen Content Identifier
Flags posts that remain relevant regardless of when they were published, based on topic timelessness and sustained engagement.

### 3.5 Blog-to-Thread Converter
Transforms long-form blog posts into Twitter/X thread format with intelligent segmentation, thread numbering, and an engaging hook.

### 3.6 Cross-Post Timing Optimizer
Staggers posts across platforms to maximize total reach rather than posting everywhere simultaneously.

### 3.7 Repurpose Chains
Multi-step content transformation pipelines (e.g., "Blog Post -> LinkedIn Article -> Twitter Thread -> Instagram Carousel"). Chains can be saved as reusable templates.

### 3.8 Draft Expiration Warnings
Alerts when draft posts have been sitting unfinished for a configurable period, with options to publish, reschedule, or archive.

### 3.9 Content Decay Alerts
Monitors previously high-performing content and notifies when engagement declines significantly, with suggestions for refreshing or repurposing.

---

## Phase 4: Distribution Intelligence

**Goal**: Optimize how and where content is distributed for maximum impact.

### 4.1 Platform-Specific Timing Optimizer
Analyzes historical engagement data on each connected platform to determine the best posting times specific to the user's audience (not generic advice).

### 4.2 Hashtag Performance Tracker
Tracks hashtag usage and measures impact on engagement over time. Ranks hashtags by effectiveness and recommends new ones.

### 4.3 Audience Persona Builder
AI creates detailed audience personas based on actual engagement patterns, commenter profiles, and demographic data.

### 4.4 Competitor Content Gap Analysis
Identifies topics competitors cover that the user does not. Users input competitor profiles and receive ranked topic opportunities.

---

## Phase 5: Revenue & ROI

**Goal**: Help users prove the business value of their content marketing.

### 5.1 Content ROI Calculator
Calculates return on time and money invested in content creation, estimating value generated through engagement, reach, and conversions.

### 5.2 Cost Per Post Tracking
Tracks the true cost of each piece of content by factoring in time spent drafting, editing, scheduling, and managing.

### 5.3 Monthly Content Report Card
Automated monthly summary covering all content activity: posts published, engagement totals, audience growth, top content, and month-over-month comparisons.

### 5.4 White-Label Reports
Professionally branded reports for clients or stakeholders with customizable sections and PDF or web export.

---

## Phase 6: Engagement & Retention

**Goal**: Keep users coming back daily and feeling motivated.

### 6.1 Streak System
Tracks consecutive posting days with milestone celebrations (7-day, 30-day, 100-day streaks).

### 6.2 Weekly Flywheel Digest
Email-ready summary of weekly content performance including posts published, engagement totals, top content, and suggested next actions.

### 6.3 Next Best Action Prompts
AI analyzes the current content state and suggests the single most impactful action the user can take, with a one-click execution button.

### 6.4 Content Templates Library
Pre-built templates for common post types (announcements, tips, testimonials, polls, engagement hooks) browsable by category and platform.

### 6.5 Public Content Scorecard
Shareable public profile page showcasing content performance metrics.

### 6.6 Flywheel Leaderboard
Team rankings for collaborative environments, tracking posts published, engagement generated, and content quality scores.

---

## Phase 7: Collaboration

**Goal**: Make PassivePost work for agencies and teams managing content for clients.

### 7.1 Client Approval Portal
Public page where external clients review, approve, or reject pending content without needing a PassivePost account. Authenticated via unique token.

### 7.2 Approval Queue
Internal dashboard for managing all content pending approval across clients, with filtering and bulk actions.

---

## Bonus Features

### B.1 AI Hashtag Suggestions
Button in the post composer that generates relevant hashtags using AI analysis of post content, niche context, and platform best practices.

### B.2 Gig Lead Notifications
Keyword scanner that searches social platforms for posts matching the user's niche, surfacing potential clients with signal strength scoring and auto-generated reply templates.

### B.3 AI Voice Fine-Tuner
Users paste 3-15 writing samples and AI analyzes their unique voice patterns, creating a reusable voice profile for all future content generation.

### B.4 Lead CRM Mini
Tags, notes, status tracking, and CSV export for leads. CRM-like functionality with user-scoped data isolation.

---

## Implementation Summary

| Phase | Name | Features |
|-------|------|----------|
| 1 | Flywheel Foundation | 5 features |
| 2 | Content Intelligence | 8 features |
| 3 | Advanced Automation | 9 features |
| 4 | Distribution Intelligence | 4 features |
| 5 | Revenue & ROI | 4 features |
| 6 | Engagement & Retention | 6 features |
| 7 | Collaboration | 2 features |
| Bonus | Extra Features | 4 features |

**Total: 42 features across 7 phases + bonus**

---

## Navigation Structure

All flywheel features are accessible from the social scheduling dashboard sidebar at `/dashboard/social/`:

- **Dashboard**: Overview, Posts, Queue, Calendar
- **Blog**: Blog Home, Compose, Articles
- **Automation**: Autopilot (all Phase 3 features)
- **Insights**: Engagement, Intelligence, Distribution, Revenue & ROI, Retention, Leads
- **Collaborate**: Approvals
- **Setup**: Brand Voice, Accounts, Settings

---

## API Route Map

### Phase 1 - Flywheel Foundation
- `GET /api/social/flywheel/metrics`
- `POST /api/social/blog/schedule-snippets`
- `GET /api/social/blog/[id]/snippets`

### Phase 2 - Content Intelligence
- `POST /api/social/intelligence/grade`
- `GET /api/social/intelligence/content-dna`
- `GET /api/social/intelligence/content-mix`
- `POST /api/social/intelligence/brief`
- `GET /api/social/intelligence/topic-fatigue`
- `GET /api/social/intelligence/tone-drift`
- `GET /api/social/intelligence/cannibalization`
- `POST /api/social/intelligence/engagement-prediction`

### Phase 3 - Advanced Automation
- `POST /api/social/automation/calendar-autopilot`
- `POST /api/social/automation/batch-repurpose`
- `POST /api/social/automation/blog-to-thread`
- `POST /api/social/automation/repurpose-chains`
- `GET /api/social/automation/evergreen-scan`
- `GET /api/social/automation/draft-warnings`
- `GET /api/social/automation/content-decay`
- `GET /api/social/automation/crosspost-timing`
- `GET /api/social/automation/recycling-queue`

### Phase 4 - Distribution Intelligence
- `GET /api/social/distribution/platform-timing`
- `GET /api/social/distribution/hashtag-tracker`
- `POST /api/social/distribution/audience-personas`
- `POST /api/social/distribution/competitor-gap`

### Phase 5 - Revenue & ROI
- `GET/POST /api/social/revenue/roi-calculator`
- `GET /api/social/revenue/cost-per-post`
- `GET /api/social/revenue/report-card`
- `POST /api/social/revenue/export-report`

### Phase 6 - Engagement & Retention
- `GET /api/social/engagement/streak`
- `GET /api/social/engagement/digest-preview`
- `GET /api/social/engagement/templates`
- `GET /api/social/engagement/scorecard/[username]`

### Phase 7 - Collaboration
- `GET/POST /api/social/collaboration/approval-portal`
- `POST /api/social/collaboration/approval-action`

### Bonus Features
- `POST /api/social/automation/hashtag-suggest`
- `GET/POST /api/social/leads/gig-scanner`
- `GET/POST /api/social/leads/reply-templates`
- `GET/POST /api/social/brand-voice/fine-tune`
- `GET/POST/PATCH /api/social/leads/manage`
- `GET /api/social/leads/export`

---
