# PassivePost — Blog Publishing

Blog Publishing extends PassivePost from a social media scheduling tool into a full content marketing platform. Users write blog articles, cross-post to multiple blogging platforms, and generate social media snippets from their blog content — creating a content flywheel that drives traffic between blogs and social profiles.

PassivePost is a closed-loop business intelligence platform for content creators, built with Next.js 16+, Supabase, Stripe, and deployed on Vercel.

---

## Supported Platforms

| Platform | API Type | Notes |
|----------|----------|-------|
| WordPress | REST API + App Passwords | Self-hosted and WordPress.com |
| Ghost | Admin API Key | Self-hosted Ghost instances |

Both platforms use encrypted credential storage. Credentials are encrypted with AES-256-GCM (the same encryption used for social OAuth tokens) before being stored in the `blog_connections` table.

---

## Architecture

### Database Tables

- **blog_connections** — Stores platform credentials (encrypted) and connection status per user
- **blog_posts** — Stores article content, metadata, SEO fields, publication status, and cross-post URLs

### API Routes

All routes live under `/api/social/blog/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/social/blog/connections` | GET | List user's blog connections |
| `/api/social/blog/connections` | POST | Connect a new blog platform |
| `/api/social/blog/connections/validate` | POST | Validate blog platform credentials |
| `/api/social/blog/connections/[id]` | DELETE | Disconnect a platform |
| `/api/social/blog/posts` | GET | List blog posts (filterable by status, series) |
| `/api/social/blog/posts` | POST | Create a new blog post |
| `/api/social/blog/posts/[id]` | GET | Get a single blog post |
| `/api/social/blog/posts/[id]` | PATCH | Update a blog post |
| `/api/social/blog/posts/[id]` | DELETE | Delete a blog post |
| `/api/social/blog/posts/publish` | POST | Publish a blog post to connected platforms |
| `/api/social/blog/repurpose` | POST | AI-generate social snippets from a blog post |
| `/api/social/blog/schedule-snippets` | POST | Schedule repurposed social snippets across 7-14 days |
| `/api/social/blog/[id]/snippets` | GET | Get social snippets linked to a blog post |

### Cross-Channel Linking

Blog posts and social posts are linked bidirectionally. When a blog post is repurposed into social snippets, the relationship is tracked so users can see which social posts drive traffic to which blog articles, and vice versa. This powers the flywheel metrics on the Blog Home dashboard.

### Dashboard Pages

| URL | Purpose |
|-----|---------|
| `/dashboard/social/blog` | Blog home dashboard with flywheel metrics, connected platform management, and content pipeline overview |
| `/dashboard/social/blog/compose` | Article editor with Markdown support, SEO preview, and one-click publish |
| `/dashboard/social/blog/posts` | Blog post list with status filtering and search |

---

## Key Features

### 1. Platform Connections
- Each platform uses encrypted credential storage via `encryptToken()`
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
- Each snippet targets a different platform (Twitter/X, LinkedIn, Facebook, etc.)
- Each snippet highlights a different angle or takeaway from the article
- All snippets include `[BLOG_LINK]` placeholder (replaced with actual URL when available)
- Includes relevant hashtags
- Powered by the xAI Grok model

### 4. Calendar Integration
Blog posts with scheduled or published dates appear in the unified social calendar alongside regular social posts, giving users a complete view of all scheduled content across both blog and social channels.

### 5. Content Series
Group related blog posts into series for sequential publishing across platforms. Series are tracked via the `series_name` field in the `blog_posts` table.

---

## Content Flywheel Strategy

The recommended workflow for maximum content leverage:

1. Write a long-form blog article in the composer
2. Cross-post to connected blog platforms (WordPress, Ghost)
3. Use the Repurpose Engine to generate 5-7 social snippets
4. Each snippet links back to the blog post, driving traffic
5. Schedule snippets across different days for sustained engagement
6. Engagement data from social posts feeds back into the intelligence system, informing future blog topics

This creates a virtuous cycle where each piece of content amplifies the others.

---

## Blog Publishing Clients

Platform-specific publishing logic lives in `src/lib/social/blog-clients.ts`:

- **WordPress Client**: Uses REST API with authentication via app passwords. Supports creating posts, setting categories/tags, and publishing status.
- **Ghost Client**: Uses the Admin API with JWT authentication from the admin API key. Supports creating posts in Mobiledoc format with metadata.

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [FEATURES.md](./FEATURES.md) | Full feature list including blog publishing |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture including blog tables |
| [OVERVIEW.md](./OVERVIEW.md) | Product overview and positioning |

---
