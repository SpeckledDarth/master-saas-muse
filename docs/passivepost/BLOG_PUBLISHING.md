# Blog Publishing Feature

## Overview
Blog Publishing extends PassivePost from a social media management tool into a full content marketing platform. Users can write blog articles, cross-post to multiple blogging platforms, and generate social media snippets from their blog content — creating a "content flywheel" that drives traffic between blogs and social profiles.

## Supported Platforms
| Platform | API Type | Status | Notes |
|----------|----------|--------|-------|
| Medium | REST API (Integration Token) | Stable | Full create/publish support |
| WordPress | REST API + App Passwords | Stable | Self-hosted and WordPress.com |
| LinkedIn Articles | Extends existing social connection | Stable | Uses connected LinkedIn OAuth |
| Ghost | Admin API Key | Stable | Self-hosted Ghost instances |
| Substack | Unofficial API | Beta | May break without notice |

## Architecture

### Database Tables
Located in `migrations/extensions/003_blog_publishing_tables.sql`:

- **blog_connections** — Stores platform credentials (encrypted) and connection status per user
- **blog_posts** — Stores article content, metadata, SEO fields, publication status, and cross-post URLs

### API Routes
All routes live under `src/app/api/social/blog/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/social/blog/connections` | GET | List user's blog connections |
| `/api/social/blog/connections` | POST | Connect a new blog platform |
| `/api/social/blog/connections/[id]` | DELETE | Disconnect a platform |
| `/api/social/blog/posts` | GET | List blog posts (filterable by status, series) |
| `/api/social/blog/posts` | POST | Create a new blog post |
| `/api/social/blog/posts/[id]` | GET | Get a single blog post |
| `/api/social/blog/posts/[id]` | PATCH | Update a blog post |
| `/api/social/blog/posts/[id]` | DELETE | Delete a blog post |
| `/api/social/blog/repurpose` | POST | AI-generate social snippets from a blog post |
| `/api/social/blog/schedule-snippets` | POST | Schedule repurposed social snippets across 7-14 days |
| `/api/social/blog/[id]/snippets` | GET | Get social snippets linked to a blog post |

### Cross-Channel Linking
Located in `migrations/extensions/004_blog_cross_linking.sql`:
Blog posts and social posts are linked bidirectionally. When a blog post is repurposed into social snippets, the relationship is tracked so users can see which social posts drive traffic to which blog articles, and vice versa. This powers the flywheel metrics on the Blog Home dashboard.

### Dashboard Pages
| URL | File | Purpose |
|-----|------|---------|
| `/dashboard/social/blog` | `src/app/dashboard/social/blog/page.tsx` | Blog home dashboard with flywheel metrics and connections |
| `/dashboard/social/blog/compose` | `src/app/dashboard/social/blog/compose/page.tsx` | Article editor with SEO preview |
| `/dashboard/social/blog/posts` | `src/app/dashboard/social/blog/posts/page.tsx` | Blog post list with filtering |

### Type Definitions
Added to `src/lib/social/types.ts`:
- `BlogPlatform` — Union type of supported platforms
- `BlogPostStatus` — Draft, scheduled, publishing, published, failed
- `BlogConnection` — Interface for platform connections
- `BlogPost` — Interface for blog articles
- `BLOG_PLATFORM_CONFIG` — Platform metadata (name, color, API type, beta flag)

## Key Features

### 1. Platform Connections
- Each platform uses encrypted credential storage via `encryptToken()`
- LinkedIn Articles automatically links to existing LinkedIn social account
- Connection validation and error tracking
- One connection per platform per user (upsert on reconnect)

### 2. Blog Composer
- Markdown-supported text editor
- Real-time word count and estimated read time
- SEO preview panel showing Google search result simulation
- Title/description character counters (60/160 recommended limits)
- Platform selector (only shows connected platforms)
- Tags, series name, cover image URL
- Schedule for later option
- Edit mode via `?edit=[postId]` query parameter

### 3. Repurpose Engine (Content Flywheel)
The repurpose engine converts a blog post into 5-7 social media snippets:
- Each snippet targets a different platform (Twitter, LinkedIn, Facebook)
- Each snippet highlights a different angle/takeaway from the article
- All snippets include `[BLOG_LINK]` placeholder (replaced with actual URL when available)
- Includes relevant hashtags
- Powered by the configured AI provider (xAI, OpenAI, or Anthropic)

### 4. Calendar Integration
Blog posts with scheduled/published dates appear in the unified social calendar alongside regular social posts, using a distinct "Blog Article" platform type with `chart-4` color coding.

### 5. Sidebar Navigation
Blog section added to the social sidebar with three items:
- Blog Home (connections)
- Compose (write new article)
- Articles (view all posts)

## Content Flywheel Strategy
The recommended workflow for maximum content leverage:
1. Write a long-form blog article in the composer
2. Cross-post to 2-3 blog platforms (Medium, WordPress, LinkedIn Articles)
3. Use the Repurpose Engine to generate 5-7 social snippets
4. Each snippet links back to the blog post, driving traffic
5. Schedule snippets across different days for sustained engagement

## Pricing Tie-In

Blog publishing features are available across all tiers, but with tier-based limits on the repurpose engine:

| Tier | Blog Posts | Repurpose Snippets per Post | Schedule Snippets |
|------|-----------|---------------------------|-------------------|
| Starter | Unlimited drafts, 5 published/month | 3 snippets | Manual only |
| Basic | Unlimited drafts, 15 published/month | 5 snippets | Manual + auto-spread |
| Premium | Unlimited | 7 snippets | Full auto-schedule across 7-14 days |

These limits are enforced by the existing tier resolution system (`getUserSocialTier`). Blog post creation counts toward the user's monthly post limit. Repurposed snippets count toward daily AI generation limits.

## Future Enhancements

- **AI Article Generation from Outlines**: Users provide a topic and bullet-point outline, and AI generates a full blog article draft. This would integrate with the existing AI generation pipeline and brand voice system, producing long-form content that matches the user's writing style. Currently under consideration for a future release.
- **Auto-Suggest Blog Topics**: Based on content intelligence data (top-performing social topics, audience personas, competitor gaps), suggest blog article ideas that are likely to perform well.
- **SEO Keyword Integration**: Connect to keyword research APIs to suggest high-value keywords during blog composition.

## Extension Pattern Compliance
This feature follows MuseKit's merge-friendly extension pattern:
- All new files are in `/blog/` subdirectories (no core file modifications except sidebar)
- Database migration is in `migrations/extensions/` with its own numbered file
- Types are appended to the existing `src/lib/social/types.ts` (additive only)
- Sidebar modification is minimal (6 lines added to NAV_ITEMS array)
- Calendar integration uses Promise.all to fetch blog posts alongside social posts
