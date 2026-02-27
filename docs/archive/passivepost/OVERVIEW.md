# PassivePost — Product Overview

**PassivePost is a closed-loop business intelligence platform for content creators.**

It brings content scheduling, affiliate marketing, connected analytics, and AI coaching together into a single system where every piece feeds the others.

---

## What PassivePost Does

PassivePost is built for content creators, affiliates, agencies, and small businesses who want to grow their audience, track revenue, and improve their content strategy from one place.

Unlike tools that only handle scheduling or only handle affiliate tracking, PassivePost connects the dots between what you publish, how your audience responds, what revenue it generates, and what you should do next. The AI coaching layer uses your real data to give specific, personalized advice rather than generic tips.

---

## Who It's For

### Content Creators & Affiliates
Bloggers, YouTubers, podcasters, and social media influencers who promote products and want a professional dashboard to track performance, earnings, and audience growth.

### Solopreneurs & Small Businesses
One-person operations and small teams who need social media management, content scheduling, and lead tracking without enterprise complexity or pricing.

### Agencies & Freelancers
Teams managing content for clients who need approval workflows, white-label reporting, and multi-account management.

### Program Administrators
SaaS founders and marketing teams running affiliate programs who need application management, commission processing, fraud detection, and program analytics.

---

## The Problem

Content creators and small business owners face a fragmented tooling landscape:

- **Scheduling tools** don't know anything about revenue
- **Affiliate platforms** don't connect to content performance
- **Analytics tools** show data but don't tell you what to do next
- **AI assistants** give generic advice because they don't have your real data

The result is context-switching between 4-5 different tools, manual data correlation, and gut-feel decisions about content strategy.

---

## The Solution

PassivePost creates a closed loop:

1. **Content Scheduling** — Create, schedule, and publish across 8 social platforms and 2 blog platforms from a single calendar
2. **Affiliate Marketing** — Full-featured affiliate program with referral tracking, commission management, tiered rewards, contests, and payouts
3. **Connected Analytics** — Merge data from connected platforms (YouTube, social media) with affiliate performance and financial data in a unified view
4. **AI Coaching** — Every AI feature pulls real user data to give personalized, actionable advice using the xAI Grok model
5. **Content Flywheel** — A 7-phase system that makes content creation, intelligence, automation, distribution, revenue tracking, engagement, and collaboration feed into each other

Each system feeds the others. Content performance informs AI coaching. AI coaching improves content quality. Better content drives more affiliate revenue. Revenue data feeds back into analytics. The loop gets smarter the more you use it.

---

## The Three Dashboards

PassivePost is organized into three separate dashboards, each designed for a different role:

### Admin Dashboard — Program Management
The control center for platform owners. Admins configure the affiliate program, manage users, set up billing tiers, review applications, process payouts, monitor program health, and run the business side of the operation. Covers branding, compliance, revenue attribution, and audit logging.

### Affiliate Dashboard — Business Command Center
A standalone dashboard for content creators who promote PassivePost. Affiliates get referral link generation, commission tracking, performance analytics, AI coaching, marketing toolkits, discount code management, contest participation, and financial tools including tax preparation and earnings forecasting. The affiliate dashboard has 11 navigation tabs and is completely separate from the main product interface.

### User Dashboard — Customer Self-Service & Billing
For customers who subscribe to the product. Invoice history, subscription management via Stripe, support tickets, account security, usage insights, and email preferences. The user dashboard also includes a gateway to become an affiliate.

---

## Connected Platforms

PassivePost connects to 8 social media platforms and 2 blog publishing platforms:

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

## Key Features at a Glance

| Feature | Description |
|---------|-------------|
| AI Content Generation | One-click post creation using your brand voice, niche, and the xAI Grok model |
| 8-Platform Scheduling | Twitter/X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, Pinterest |
| Blog Cross-Posting | Publish to WordPress and Ghost, then auto-generate social snippets |
| Full Affiliate Program | Referral tracking, commission management, tiered rewards, contests, and payouts |
| 14+ AI Tools | Post writer, email drafter, blog outliner, video scripts, objection handler, coach, and more |
| Connected Analytics | Merge content performance with affiliate earnings and platform data |
| Content Flywheel | 7-phase system for continuous content improvement |
| Revenue & ROI Tracking | Cost per post, ROI calculator, monthly report cards, white-label exports |
| Lead CRM | Tag, note, and export leads discovered through social engagement |
| Client Approval Portal | External clients review and approve content without needing an account |
| Gamification | Tiers, badges, contests, leaderboards, milestones, streaks, and challenges |
| Financial Tools | Earnings forecasts, tax preparation, commission tracking, payout management |
| Marketing Toolkit | Deep links, QR codes, link shortener, media kit, sharing cards, discount codes |

---

## AI Architecture

All AI features use the **xAI Grok model** (`grok-3-mini-fast`) and follow a critical design principle: **every AI feature pulls real user data**.

This means:
- The **AI Coach** knows your actual commission history, tier progress, active contests, and connected platform metrics before giving advice
- The **AI Post Writer** uses your brand voice settings, niche guidance, and audience data to generate content
- The **AI Analytics** features analyze your real engagement patterns, conversion rates, and revenue attribution
- The **Promotion Strategy Quiz** saves results to your profile so future AI interactions have richer context

The AI is not a generic chatbot — it is a personalized business intelligence copilot.

---

## Pricing & Tier System

PassivePost uses a tiered subscription model integrated with Stripe:

| | Starter | Basic | Premium |
|---|---------|-------|---------|
| Daily AI Generations | 5 | 10 | 100 |
| Daily Posts | 1 | 2 | Unlimited |
| Monthly Posts | 15 | 30 | Unlimited |
| Connected Platforms | 2 | 3 | 8 |

Tier limits are enforced automatically. When a user reaches 80% of any limit, an upgrade banner appears across the dashboard. Admins can customize tier names, limits, and pricing from the admin dashboard.

Affiliates progress through performance tiers (Bronze, Silver, Gold, Platinum) based on referral count, earning higher commission rates and unlocking perks at each level.

---

## The Content Flywheel

The Content Flywheel is the core differentiator. It is a 7-phase system that creates a self-reinforcing loop:

```
    CONTENT CREATION
         |
    INTELLIGENCE (grade, predict, analyze)
         |
    AUTOMATION (recycle, repurpose, schedule)
         |
    DISTRIBUTION (timing, hashtags, personas)
         |
    REVENUE TRACKING (ROI, cost per post, reports)
         |
    ENGAGEMENT (streaks, digest, templates)
         |
    COLLABORATION (approval portal, team queues)
         |
    (Back to CONTENT CREATION, now informed by data)
```

Each cycle produces better content, more engagement, and more revenue. The system gets smarter the more it is used.

---

## Technology

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) with TypeScript |
| Frontend | React, Tailwind CSS, shadcn/ui, Recharts |
| Database | PostgreSQL via Supabase with Row Level Security |
| Authentication | Supabase Auth (email, OAuth, SSO/SAML) |
| Payments | Stripe (subscriptions, webhooks, customer portal) |
| Email | Resend (transactional, drip sequences, digests) |
| AI | xAI Grok (`grok-3-mini-fast`) |
| Queue | BullMQ with Upstash Redis |
| Rate Limiting | Upstash Redis sliding window + in-memory fallback |
| Deployment | Vercel |

---

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [FEATURES.md](./FEATURES.md) | Detailed breakdown of every feature |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical blueprint: database, APIs, OAuth, queue system |
| [BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md) | Blog cross-posting feature details |

---
