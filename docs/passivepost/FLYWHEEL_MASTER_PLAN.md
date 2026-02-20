# PassivePost — Flywheel & World-Class Features Master Plan

> **Purpose**: This is the single source of truth for all planned PassivePost features. If agent memory resets between sessions, read this file first to resume work. Every feature, its phase, description, and status is documented here.

> **Last Updated**: February 20, 2026 (All 38 flywheel features + 4 bonus features = 42 total, complete across 7 phases)

---

## Current State (What's Already Built)

Before diving into the plan, here's what exists today:

### Core Social Media Management
- [x] AI content generation with niche guidance system (14 niches)
- [x] Multi-platform support (10 platforms, 3 with full API: Twitter/X, LinkedIn, Facebook)
- [x] Post management (create, edit, schedule, queue, publish)
- [x] Content calendar (month-view grid with blog integration)
- [x] Engagement analytics page with Recharts charts
- [x] Lead tracking page
- [x] Brand voice system (tone, niche, audience, goals)
- [x] Trend alerts (overview dashboard)
- [x] Coaching tips (rotating card on overview)
- [x] Bulk import
- [x] Tier system with usage limits (Starter/Basic/Premium)
- [x] Quick Generate FAB on all dashboard pages
- [x] Onboarding wizard
- [x] Dark mode with 950-scale color system

### Blog Publishing
- [x] Blog platform connections (Medium, WordPress, Ghost, LinkedIn Articles, Substack beta)
- [x] Blog composer with Markdown editor + SEO preview
- [x] Blog posts list with status filtering
- [x] Repurpose engine (AI generates 5-7 social snippets from blog post)
- [x] Calendar integration (blog posts appear alongside social posts)
- [x] Sidebar navigation for Blog section

### Flywheel System (All Phases Complete)
- [x] Flywheel metrics and health scoring (Phase 1)
- [x] Cross-channel linking (blog ↔ social) (Phase 1)
- [x] Content Intelligence (Phase 2 — 8 features)
- [x] Advanced Automation (Phase 3 — 9 features)
- [x] Distribution Intelligence (Phase 4 — 4 features)
- [x] Revenue & ROI (Phase 5 — 4 features)
- [x] Engagement & Retention (Phase 6 — 6 features)
- [x] Collaboration (Phase 7 — 2 features)

---

## Phase 1: Flywheel Foundation ✅
**Goal**: Make the blog-to-social flywheel visible, measurable, and actionable.
**Status**: Complete (Feb 2026)

### 1.1 Flywheel Metrics API
- **What**: Backend endpoint (`/api/social/flywheel/metrics`) that calculates all flywheel scores, counts, and velocity data
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/flywheel/metrics/route.ts`

### 1.2 Blog Home Dashboard Upgrade
- **What**: Replace the connections-only Blog Home page with a proper dashboard
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/dashboard/social/blog/page.tsx`

### 1.3 Flywheel Health Score on Overview
- **What**: Prominent card on the main social overview dashboard
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/dashboard/social/overview/page.tsx`

### 1.4 Cross-Channel Linking (Both Directions)
- **What**: Connect blog content and social posts visually and functionally
- **Status**: [x] Complete (Feb 2026)
- **Files**: `migrations/extensions/004_blog_cross_linking.sql`, `src/app/api/social/blog/repurpose/route.ts`, `src/app/api/social/blog/[id]/snippets/route.ts`

### 1.5 Auto-Snippet Scheduling
- **What**: After repurposing, one click spreads snippets across the next 7-14 days
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/blog/schedule-snippets/route.ts`

---

## Phase 2: Content Intelligence ✅
**Goal**: Make PassivePost smarter than the user — proactive insights, not just reactive tools.
**Status**: Complete (Feb 2026)

### 2.1 AI Content Grader
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/grade/route.ts`

### 2.2 Best Performing Content DNA
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/content-dna/route.ts`

### 2.3 Topic Fatigue Detection
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/topic-fatigue/route.ts`

### 2.4 Content Mix Optimizer
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/content-mix/route.ts`

### 2.5 Tone Drift Monitor
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/tone-drift/route.ts`

### 2.6 Content Cannibalization Detector
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/cannibalization/route.ts`

### 2.7 Engagement Prediction
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/engagement-prediction/route.ts`

### 2.8 Content Brief Generator
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/intelligence/brief/route.ts`

### Intelligence Dashboard
- **Files**: `src/app/dashboard/social/intelligence/page.tsx`

---

## Phase 3: Advanced Flywheel & Automation ✅
**Goal**: Automate the repetitive parts of content marketing so users can focus on creating.
**Status**: Complete (Feb 2026)

### 3.1 Content Calendar Autopilot
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/calendar-autopilot/route.ts`

### 3.2 Batch Repurpose
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/batch-repurpose/route.ts`

### 3.3 Content Recycling Queue
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/recycling-queue/route.ts`

### 3.4 Evergreen Content Identifier
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/evergreen-scan/route.ts`

### 3.5 Blog-to-Thread Converter
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/blog-to-thread/route.ts`

### 3.6 Cross-Post Timing Optimizer
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/crosspost-timing/route.ts`

### 3.7 Repurpose Chains
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/repurpose-chains/route.ts`

### 3.8 Draft Expiration Warnings
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/draft-warnings/route.ts`

### 3.9 Content Decay Alerts
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/content-decay/route.ts`

### Automation Dashboard
- **Files**: `src/app/dashboard/social/automation/page.tsx`

---

## Phase 4: Distribution Intelligence ✅
**Goal**: Optimize how and where content is distributed for maximum impact.
**Status**: Complete (Feb 2026)

### 4.1 Platform-Specific Timing Optimizer
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/distribution/platform-timing/route.ts`

### 4.2 Hashtag Performance Tracker
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/distribution/hashtag-tracker/route.ts`

### 4.3 Audience Persona Builder
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/distribution/audience-personas/route.ts`

### 4.4 Competitor Content Gap Analysis
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/distribution/competitor-gap/route.ts`

### Distribution Dashboard
- **Files**: `src/app/dashboard/social/distribution/page.tsx`

---

## Phase 5: Revenue, Reporting & ROI ✅
**Goal**: Help users prove the business value of their content marketing.
**Status**: Complete (Feb 2026)

### 5.1 Content ROI Calculator
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/revenue/roi-calculator/route.ts`

### 5.2 Cost Per Post Tracking
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/revenue/cost-per-post/route.ts`

### 5.3 Monthly Content Report Card
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/revenue/report-card/route.ts`

### 5.4 White-Label Reports (Export)
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/revenue/export-report/route.ts`

### Revenue Dashboard
- **Files**: `src/app/dashboard/social/revenue/page.tsx`

---

## Phase 6: Engagement & Retention ✅
**Goal**: Keep users coming back daily and feeling motivated.
**Status**: Complete (Feb 2026)

### 6.1 Streak System
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/engagement/streak/route.ts`

### 6.2 Weekly Flywheel Digest (Preview)
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/engagement/digest-preview/route.ts`

### 6.3 Next Best Action Prompts
- **Status**: [x] Complete (Feb 2026) — Integrated into flywheel metrics and overview
- **Files**: `src/app/api/social/flywheel/metrics/route.ts`, `src/app/dashboard/social/overview/page.tsx`

### 6.4 Content Templates Library
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/engagement/templates/route.ts`

### 6.5 Public Content Scorecard
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/engagement/scorecard/[username]/route.ts`

### 6.6 Flywheel Leaderboard (Teams)
- **Status**: [x] Complete (Feb 2026) — Integrated into retention dashboard
- **Files**: `src/app/dashboard/social/retention/page.tsx`

### Retention Dashboard
- **Files**: `src/app/dashboard/social/retention/page.tsx`

---

## Phase 7: Collaboration & Client Features ✅
**Goal**: Make PassivePost work for agencies and teams managing content for others.
**Status**: Complete (Feb 2026)

### 7.1 Client Approval Portal
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/collaboration/approval-portal/route.ts`, `src/app/approve/[token]/page.tsx`

### 7.2 Approval Queue UI
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/collaboration/approval-action/route.ts`, `src/app/dashboard/social/collaboration/page.tsx`

---

## Bonus Features (Beyond the 38-Feature Flywheel) ✅
**Goal**: Additional high-value features that complement the flywheel system.
**Status**: Complete (Feb 2026)

### B.1 AI Hashtag Suggestions
- **What**: Button in the post composer that generates relevant hashtags using AI analysis of post content, niche context, and platform best practices
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/automation/hashtag-suggest/route.ts`, `src/app/dashboard/social/posts/page.tsx`

### B.2 Gig Lead Notifications
- **What**: Keyword scanner that searches social platforms for posts matching the user's niche, surfacing potential clients with signal strength scoring and auto-generated reply templates
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/leads/gig-scanner/route.ts`, `src/app/api/social/leads/reply-templates/route.ts`, `src/app/dashboard/social/leads/page.tsx`

### B.3 AI Voice Fine-Tuner
- **What**: Users paste 3-15 writing samples and AI analyzes their unique voice patterns (tone, vocabulary, sentence style, emoji usage, CTA patterns), creating a reusable voice profile for all future content generation
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/brand-voice/fine-tune/route.ts`, `src/app/dashboard/social/brand/page.tsx`

### B.4 Lead CRM Mini
- **What**: Tags, notes, status tracking, and CSV export for leads. Adds CRM-like functionality to the Leads page with user-scoped data isolation
- **Status**: [x] Complete (Feb 2026)
- **Files**: `src/app/api/social/leads/manage/route.ts`, `src/app/api/social/leads/export/route.ts`, `src/components/social/lead-crm.tsx`, `src/app/dashboard/social/leads/page.tsx`

---

## Implementation Summary

| Phase | Name | Features | Status |
|-------|------|----------|--------|
| 1 | Flywheel Foundation | 5 features | ✅ Complete |
| 2 | Content Intelligence | 8 features | ✅ Complete |
| 3 | Advanced Flywheel & Automation | 9 features | ✅ Complete |
| 4 | Distribution Intelligence | 4 features | ✅ Complete |
| 5 | Revenue, Reporting & ROI | 4 features | ✅ Complete |
| 6 | Engagement & Retention | 6 features | ✅ Complete |
| 7 | Collaboration & Client | 2 features | ✅ Complete |
| Bonus | Extra Features | 4 features | ✅ Complete |

**Total: 38 flywheel features + 4 bonus features across 7 phases — ALL COMPLETE**

---

## Navigation Structure

All features are accessible from the social dashboard sidebar:
- **Dashboard**: Overview, Posts, Queue, Calendar
- **Blog**: Blog Home, Compose, Articles
- **Automation**: Autopilot (Phase 3)
- **Insights**: Engagement, Intelligence (Phase 2), Distribution (Phase 4), Revenue & ROI (Phase 5), Retention (Phase 6), Leads
- **Collaborate**: Approvals (Phase 7)
- **Setup**: Brand Voice, Accounts, Settings

---

## API Route Map

### Phase 1 — Flywheel Foundation
- `GET /api/social/flywheel/metrics`
- `POST /api/social/blog/schedule-snippets`
- `GET /api/social/blog/[id]/snippets`

### Phase 2 — Content Intelligence
- `POST /api/social/intelligence/grade`
- `GET /api/social/intelligence/content-dna`
- `GET /api/social/intelligence/content-mix`
- `POST /api/social/intelligence/brief`
- `GET /api/social/intelligence/topic-fatigue`
- `GET /api/social/intelligence/tone-drift`
- `GET /api/social/intelligence/cannibalization`
- `POST /api/social/intelligence/engagement-prediction`

### Phase 3 — Advanced Automation
- `POST /api/social/automation/calendar-autopilot`
- `POST /api/social/automation/batch-repurpose`
- `POST /api/social/automation/blog-to-thread`
- `POST /api/social/automation/repurpose-chains`
- `GET /api/social/automation/evergreen-scan`
- `GET /api/social/automation/draft-warnings`
- `GET /api/social/automation/content-decay`
- `GET /api/social/automation/crosspost-timing`
- `GET /api/social/automation/recycling-queue`

### Phase 4 — Distribution Intelligence
- `GET /api/social/distribution/platform-timing`
- `GET /api/social/distribution/hashtag-tracker`
- `POST /api/social/distribution/audience-personas`
- `POST /api/social/distribution/competitor-gap`

### Phase 5 — Revenue & ROI
- `GET/POST /api/social/revenue/roi-calculator`
- `GET /api/social/revenue/cost-per-post`
- `GET /api/social/revenue/report-card`
- `POST /api/social/revenue/export-report`

### Phase 6 — Engagement & Retention
- `GET /api/social/engagement/streak`
- `GET /api/social/engagement/digest-preview`
- `GET /api/social/engagement/templates`
- `GET /api/social/engagement/scorecard/[username]`

### Phase 7 — Collaboration
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

*This document was created on February 20, 2026. All 38 flywheel features + 4 bonus features completed on February 20, 2026.*
