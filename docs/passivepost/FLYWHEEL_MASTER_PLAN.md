# PassivePost — Flywheel & World-Class Features Master Plan

> **Purpose**: This is the single source of truth for all planned PassivePost features. If agent memory resets between sessions, read this file first to resume work. Every feature, its phase, description, and status is documented here.

> **Last Updated**: February 20, 2026

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

### Blog Publishing (Just Completed)
- [x] Blog platform connections (Medium, WordPress, Ghost, LinkedIn Articles, Substack beta)
- [x] Blog composer with Markdown editor + SEO preview
- [x] Blog posts list with status filtering
- [x] Repurpose engine (AI generates 5-7 social snippets from blog post)
- [x] Calendar integration (blog posts appear alongside social posts)
- [x] Sidebar navigation for Blog section

### What's Missing
- [ ] Flywheel metrics and health scoring
- [ ] Cross-channel linking (blog ↔ social)
- [ ] Content intelligence features
- [ ] Advanced automation
- [ ] Revenue/ROI tracking
- [ ] Collaboration features
- [ ] All features listed in the phases below

---

## Phase 1: Flywheel Foundation
**Goal**: Make the blog-to-social flywheel visible, measurable, and actionable.
**Priority**: Highest — this is the core differentiator.

### 1.1 Flywheel Metrics API
- **What**: Backend endpoint (`/api/social/flywheel/metrics`) that calculates all flywheel scores, counts, and velocity data
- **Metrics to compute**:
  - Total blog articles (all time + this month)
  - Cross-posts published (how many platforms each article was sent to)
  - Social snippets generated from blogs (total + published vs drafted)
  - Content velocity (posts + blogs + snippets over last 30 days, as a trend)
  - Flywheel health score (0-100, weighted formula)
  - Flywheel momentum (accelerating / steady / decelerating — compare last 14 days vs prior 14 days)
- **Score formula**:
  - Writing blogs regularly? (25 points)
  - Cross-posting to multiple platforms? (25 points)
  - Repurposing into social snippets? (25 points)
  - Scheduling/publishing those snippets? (25 points)
- **Status**: [ ] Not started

### 1.2 Blog Home Dashboard Upgrade
- **What**: Replace the connections-only Blog Home page with a proper dashboard
- **Layout**:
  - Stats row: total articles, articles this month, cross-posts published, snippets generated
  - Per-article performance cards: title, platforms cross-posted to, snippet count, snippet publish status
  - Quick actions: Compose new, View all articles, Manage connections (moved to sub-section)
- **Status**: [ ] Not started

### 1.3 Flywheel Health Score on Overview
- **What**: Prominent card on the main social overview dashboard
- **Display**:
  - Large score number (0-100) with color coding (red/yellow/green)
  - Flywheel momentum arrow (↑ accelerating, → steady, ↓ decelerating)
  - Breakdown bars: Writing, Cross-posting, Repurposing, Scheduling
  - Content velocity sparkline (30-day trend)
  - "Next Best Action" prompt (e.g., "Repurpose your last 3 blog posts" or "Schedule 4 drafted snippets")
- **Status**: [ ] Not started

### 1.4 Cross-Channel Linking (Both Directions)
- **What**: Connect blog content and social posts visually and functionally
- **Blog → Social**:
  - When viewing a blog post, show all social snippets generated from it with their status
  - "Generate more snippets" button on each blog article
- **Social → Blog**:
  - When composing a social post, "Link to Blog" dropdown that auto-inserts the blog URL
  - On social post cards, show "From blog: [title]" tag for repurposed posts
  - Track `source_blog_id` on social posts to maintain the connection
- **Status**: [ ] Not started

### 1.5 Auto-Snippet Scheduling
- **What**: After repurposing a blog post into 5-7 snippets, one click spreads them across the next 7-14 days automatically
- **Logic**: Distribute snippets evenly, using the "Best Times to Post" data for each platform, avoiding weekends (configurable)
- **UI**: "Schedule All" button on the repurpose results, with a preview of the proposed schedule
- **Status**: [ ] Not started

---

## Phase 2: Content Intelligence
**Goal**: Make PassivePost smarter than the user — proactive insights, not just reactive tools.

### 2.1 AI Content Grader
- **What**: Pre-publish quality score for blog posts and social content
- **Grading criteria**:
  - Readability (sentence length, vocabulary complexity)
  - SEO strength (keyword usage, title/meta optimization)
  - Emotional engagement (power words, call-to-action strength)
  - Platform fit (length appropriate, hashtag usage, format)
- **Output**: A/B/C/D grade with 2-3 specific improvement tips
- **Where**: Integrated into the blog composer and social post creator
- **Status**: [ ] Not started

### 2.2 Best Performing Content DNA
- **What**: Analyze top 10% of posts and extract the winning pattern
- **Analysis dimensions**:
  - Topics that perform best
  - Optimal tone/voice
  - Best content length
  - Best posting day/time
  - AI-generated vs manual performance comparison
- **Output**: "Your Content DNA" card on the engagement page with actionable insights
- **Status**: [ ] Not started

### 2.3 Topic Fatigue Detection
- **What**: Alert users when they're over-posting about the same topic with declining engagement
- **Logic**: Track topic keywords across posts, measure engagement trend per topic cluster. When engagement drops >30% on a topic that's been posted 5+ times in 30 days, trigger an alert.
- **Output**: Alert card with 3 alternative angle suggestions (AI-generated)
- **Status**: [ ] Not started

### 2.4 Content Mix Optimizer
- **What**: Analyze the ratio of promotional vs educational vs entertaining content
- **Benchmark**: Compare against industry best practices (typically 40% educational, 40% entertaining, 20% promotional)
- **Output**: Pie chart showing current mix + recommendation card with specific shift advice
- **Status**: [ ] Not started

### 2.5 Tone Drift Monitor
- **What**: Track whether content voice is staying consistent with brand settings
- **Logic**: AI periodically reviews last 10-20 posts and compares against the brand voice configuration. Flags drift if detected.
- **Output**: Notification/alert: "Your last 10 posts have been more formal than your 'casual' brand voice — intentional?"
- **Status**: [ ] Not started

### 2.6 Content Cannibalization Detector
- **What**: Scan blog library for articles competing for the same keywords/topics
- **Logic**: AI compares titles, content, and tags across all blog posts. Flags pairs with >60% topic overlap.
- **Output**: Alert with suggestion to merge, differentiate, or archive the weaker piece
- **Status**: [ ] Not started

### 2.7 Engagement Prediction
- **What**: Before posting, show predicted engagement score based on historical performance
- **Logic**: Compare content characteristics (topic, length, platform, time, tone) against past post performance
- **Output**: "Predicted engagement: Above average (↑ 40%)" badge in the post composer
- **Status**: [ ] Not started

### 2.8 Content Brief Generator
- **What**: AI creates a detailed content brief from a single topic input
- **Output**: Suggested title, outline (H2/H3 structure), keywords to target, competitor examples, ideal length, target platforms, estimated read time
- **Where**: New button in blog composer: "Generate Brief" → fills in structure before writing
- **Status**: [ ] Not started

---

## Phase 3: Advanced Flywheel & Automation
**Goal**: Automate the repetitive parts of content marketing so users can focus on creating.

### 3.1 Content Calendar Autopilot
- **What**: User sets a posting goal ("3x/week per platform"). AI fills the calendar with a balanced mix.
- **Content sources**: Original AI-generated, repurposed blog snippets, recycled evergreen posts
- **UI**: "Fill My Calendar" button on calendar page → preview → approve/edit → schedule all
- **Status**: [ ] Not started

### 3.2 Batch Repurpose
- **What**: Select multiple blog posts and repurpose all of them at once
- **UI**: Checkbox selection on blog posts list → "Repurpose Selected" button → generates snippets for all, organized by source article
- **Status**: [ ] Not started

### 3.3 Content Recycling Queue
- **What**: Automatically re-queue top-performing evergreen posts on a rotation (every 60/90 days, configurable)
- **Logic**: Identify posts marked as "evergreen" or auto-detected by the Evergreen Content Identifier. Re-create with fresh caption variations.
- **UI**: Settings toggle + recycling queue view showing upcoming recycled posts
- **Status**: [ ] Not started

### 3.4 Evergreen Content Identifier
- **What**: AI scans blog library and flags articles that are still relevant (not time-sensitive)
- **Logic**: Analyze content for date references, seasonal language, trending topic mentions. Score each article on "evergreen-ness" (0-100).
- **Output**: Badge on blog articles ("Evergreen" / "Seasonal" / "Dated") + suggestion to re-share evergreen content
- **Status**: [ ] Not started

### 3.5 Blog-to-Thread Converter
- **What**: Convert a blog post into a Twitter/X thread format (8-12 tweets)
- **Structure**: Hook tweet → body tweets (key points) → CTA tweet with blog link
- **UI**: "Convert to Thread" button on blog post view → preview → schedule or post
- **Status**: [ ] Not started

### 3.6 Cross-Post Timing Optimizer
- **What**: When cross-posting a blog to multiple platforms, stagger them intelligently
- **Logic**: Post to own blog first (SEO canonical), Medium 24h later, LinkedIn Articles 48h later. Configurable delays.
- **UI**: Timing preview when selecting multiple platforms in the blog composer
- **Status**: [ ] Not started

### 3.7 Repurpose Chains
- **What**: Blog → social snippets → email newsletter blurb → tweet thread. One blog post, five output formats.
- **Formats**: Social snippets (existing), tweet thread, email newsletter paragraph, LinkedIn article summary, Instagram caption
- **UI**: "Full Repurpose" button → generates all formats → user picks which to use
- **Status**: [ ] Not started

### 3.8 Draft Expiration Warnings
- **What**: Alert users about stale drafts older than 30 days
- **Logic**: Check for draft posts/articles older than 30 days. Show notification on overview.
- **Output**: "You have 3 drafts older than 30 days — publish, schedule, or archive them?"
- **Status**: [ ] Not started

### 3.9 Content Decay Alerts
- **What**: Track when a published post's engagement starts dropping and suggest a refresh
- **Logic**: Monitor engagement data trends per post. When a previously high-performing post drops >50% from peak, trigger alert.
- **Output**: "Your spring HVAC tips post peaked 3 weeks ago — repurpose it with a new angle?"
- **Status**: [ ] Not started

---

## Phase 4: Distribution Intelligence
**Goal**: Optimize how and where content is distributed for maximum impact.

### 4.1 Platform-Specific Content Rewriting
- **What**: Automatically rewrite social snippets for each platform's culture and format
- **Rules**: LinkedIn gets professional framing, Twitter gets punchy hooks, Facebook gets conversational storytelling, Instagram gets visual-first captions
- **Implementation**: Enhance the repurpose engine to generate platform-native versions instead of generic snippets
- **Status**: [ ] Not started

### 4.2 Hashtag Performance Tracker
- **What**: Track which hashtags actually drive engagement vs dead weight
- **Data**: Parse hashtags from published posts, correlate with engagement metrics
- **Output**: Hashtag leaderboard: "Top performers: #DIYTips (+23% engagement), Drop: #HomeImprovement (0% boost)"
- **Where**: New section on engagement analytics page
- **Status**: [ ] Not started

### 4.3 Audience Persona Builder
- **What**: Auto-generate 2-3 audience personas based on engagement data
- **Logic**: Analyze which content types, topics, and platforms get the most engagement. Cluster patterns into persona profiles.
- **Output**: Persona cards: "Budget-conscious homeowner, 35-50, engages most with money-saving tips." Selectable when generating content.
- **Status**: [ ] Not started

### 4.4 Competitor Content Gap Analysis
- **What**: User inputs 2-3 competitor blog/social URLs. AI analyzes and identifies content gaps.
- **Output**: "Your competitors haven't covered tankless water heater maintenance — you should." + auto-generate content brief for the gap.
- **Status**: [ ] Not started

---

## Phase 5: Revenue, Reporting & ROI
**Goal**: Help users prove the business value of their content marketing.

### 5.1 Content ROI Calculator
- **What**: Assign dollar values to engagement actions and show estimated revenue from content
- **Setup**: User inputs values (e.g., "a LinkedIn lead is worth $50, a website visit is worth $2")
- **Output**: "Estimated content ROI this month: $2,340" on overview dashboard
- **Status**: [ ] Not started

### 5.2 Cost Per Post Tracking
- **What**: Track time spent creating content and calculate cost-per-post
- **Implementation**: Optional timer in the blog composer + hourly rate setting in user preferences
- **Output**: "Average blog post: $45 in time. AI-assisted: $12. You're saving 73%."
- **Status**: [ ] Not started

### 5.3 Monthly Content Report Card
- **What**: Auto-generated end-of-month summary with grade (A through F)
- **Contents**: Total content produced, engagement trends, flywheel score change, top post, worst post, content mix analysis, recommendations for next month
- **Format**: In-app page + exportable as PDF
- **Status**: [ ] Not started

### 5.4 White-Label Reports
- **What**: Export engagement reports with user's branding (logo, colors) instead of PassivePost's
- **Use case**: Agencies send these to clients as proof of work
- **Tier**: Premium feature
- **Status**: [ ] Not started

---

## Phase 6: Engagement & Retention
**Goal**: Keep users coming back daily and feeling motivated.

### 6.1 Streak System
- **What**: Track consecutive days of content activity (posting, scheduling, or creating)
- **Display**: Streak counter on overview dashboard with fire emoji animation
- **Mechanics**: Daily activity = streak continues. Miss a day = streak resets. Show longest streak record.
- **Status**: [ ] Not started

### 6.2 Weekly Flywheel Digest Email
- **What**: Automated email every Monday morning
- **Contents**: Flywheel score, what worked last week, what to do this week, suggested blog topic based on niche trends, streak status
- **Implementation**: BullMQ scheduled job + Resend email template
- **Status**: [ ] Not started

### 6.3 Next Best Action Prompts
- **What**: Context-aware suggestions throughout the dashboard
- **Examples**:
  - "You haven't repurposed your last 3 blog posts — generate snippets now?"
  - "You have 4 drafted snippets — schedule them to boost your flywheel score"
  - "Your last post on Twitter was 5 days ago — your audience might forget you"
  - "Your content mix is 80% promotional — try an educational post"
- **Where**: Overview dashboard, blog home, post composer
- **Status**: [ ] Not started

### 6.4 Content Templates Library
- **What**: Pre-built blog and social post templates organized by industry
- **Examples**: "Plumber's seasonal checklist," "Real estate open house announcement," "Restaurant weekly special"
- **UI**: Template browser in the composer with preview and one-click use
- **Future**: Community-contributed templates
- **Status**: [ ] Not started

### 6.5 Public Content Scorecard
- **What**: Shareable page showing user's content marketing achievements
- **Contents**: Posts published, blogs written, engagement total, flywheel score, streak
- **URL**: `/scorecard/[username]` — public, no login required
- **Value**: Users share on social media → free marketing for PassivePost
- **Status**: [ ] Not started

### 6.6 Flywheel Leaderboard (Teams)
- **What**: For team accounts, show who's producing the most and who has the best flywheel score
- **Display**: Leaderboard card on team dashboard with rankings
- **Metrics**: Content produced, engagement earned, flywheel score
- **Status**: [ ] Not started

---

## Phase 7: Collaboration & Client Features
**Goal**: Make PassivePost work for agencies and teams managing content for others.

### 7.1 Client Approval Portal
- **What**: Shareable link where clients can review and approve scheduled content without logging in
- **Implementation**: Token-based approval page, no account required
- **Actions**: Approve, request changes (with comment), reject
- **Notifications**: User gets notified when client approves/rejects
- **Status**: [ ] Not started

### 7.2 Approval Queue UI
- **What**: Internal team approval workflow before content goes live
- **Implementation**: Posts go to "pending approval" status → team lead reviews → approves/rejects
- **Note**: Data model already supports this (post status includes 'approved')
- **Status**: [ ] Not started

---

## Implementation Priority Summary

| Phase | Name | Features | Priority | Estimated Effort |
|-------|------|----------|----------|-----------------|
| 1 | Flywheel Foundation | 5 features | Highest | Medium |
| 2 | Content Intelligence | 8 features | High | Large |
| 3 | Advanced Flywheel & Automation | 9 features | High | Large |
| 4 | Distribution Intelligence | 4 features | Medium | Medium |
| 5 | Revenue, Reporting & ROI | 4 features | Medium | Medium |
| 6 | Engagement & Retention | 6 features | Medium | Medium |
| 7 | Collaboration & Client | 2 features | Lower | Small |

**Total: 38 features across 7 phases**

---

## How To Use This Document

1. **Starting a new session?** Read this file first. It tells you everything that's planned and what's been done.
2. **About to build?** Check the status boxes. Pick the next `[ ] Not started` item in the current phase.
3. **Finished a feature?** Change `[ ] Not started` to `[x] Complete` and add the completion date.
4. **Need context on what's already built?** See the "Current State" section at the top.
5. **Architecture patterns?** Follow the extension pattern: new files in `/blog/` or `/social/` subdirectories, migrations in `migrations/extensions/`, minimal core file changes.

---

*This document was created on February 20, 2026 to ensure continuity across sessions. It represents a comprehensive agreement between user and agent on the full PassivePost feature roadmap.*
