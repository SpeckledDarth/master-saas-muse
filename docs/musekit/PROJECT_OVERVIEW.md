# MuseKit.io - Project Overview

**A SaaS Starter Template for Rapid Product Launch**

---

## What is MuseKit?

MuseKit is a ready-to-use foundation for building software-as-a-service (SaaS) products. Think of it as a "starter kit" that handles all the common features every online business needs—user accounts, payments, team management, admin dashboards—so you can focus on building what makes your product unique.

Instead of spending months building login systems, payment processing, and admin tools from scratch, MuseKit gives you these out of the box. You clone it, customize it, and launch your product in days instead of months.

### MuseKit vs. PassivePost

MuseKit and PassivePost are **two distinct sides** of this project:

| | **MuseKit** (The Template) | **PassivePost** (The First Product) |
|---|---|---|
| **What it is** | A reusable SaaS starter template | An AI social media scheduling tool |
| **Who uses it** | Developers building new SaaS products | Solopreneurs and gig workers |
| **Purpose** | Provides auth, billing, admin, email, etc. | Manages social media posts with AI |
| **Code location** | Everything outside `/social/` directories | Everything inside `/social/` directories |
| **Database** | `migrations/core/` | `migrations/extensions/` |
| **Can be removed?** | No — it's the foundation | Yes — delete `/social/` dirs to remove |

PassivePost proves the MuseKit extension model works. For full PassivePost details, see `docs/passivepost/PRODUCT_GUIDE.md`.

---

## The Problem It Solves

### For Entrepreneurs and Developers

Building a SaaS product from scratch means solving the same problems everyone else has already solved:

- **User authentication** - How do people sign up and log in?
- **Subscription billing** - How do you charge customers monthly?
- **Team features** - How do organizations manage multiple users?
- **Admin controls** - How do you manage users and see analytics?
- **Email notifications** - How do you send welcome emails and updates?
- **SEO and marketing pages** - How do you get found on Google?

These features take 3-6 months to build properly. Most projects never get past this "infrastructure phase" to the actual product idea.

### The MuseKit Solution

MuseKit provides all of this pre-built, tested, and production-ready. You inherit months of development work on day one, letting you jump straight to building your unique value proposition.

---

## Who Is This For?

### Primary Users

1. **Solo Founders** - Technical or semi-technical entrepreneurs who want to validate ideas quickly without rebuilding infrastructure every time.

2. **Small Development Teams** - Teams who want a consistent, proven foundation for multiple SaaS projects.

3. **Agencies** - Development agencies who build SaaS products for clients and need a reliable starting point.

### Use Cases

- **Launch a new SaaS product** - Start with everything you need, add your unique features
- **Clone for multiple products** - Use the same template for different business ideas
- **Learn modern SaaS architecture** - See how authentication, billing, and multi-tenancy work together

---

## MuseKit Core Features

These features ship with every MuseKit clone. They are the foundation every SaaS product needs.

### User Management & Authentication
- Email/password signup with email verification
- 5 OAuth providers: Google, GitHub, Apple, Twitter/X, Magic Link
- Admin-controlled OAuth toggles (enable/disable from dashboard)
- User profiles with avatar upload and connected provider management
- Role-based access (admin, member, viewer)

### Subscription Billing (Stripe)
- Multiple pricing tiers
- Monthly/annual billing
- Customer portal for self-service
- Feature gating based on plan level
- Product Registry for multi-product tier resolution

### Team Collaboration
- Organizations with multiple members
- Team invitations via email
- Owner/admin/member roles
- Multi-tenancy (each organization sees only their data)

### Admin Dashboard
- User analytics and metrics
- User management with customer service tools
- Subscription status visibility and Stripe integration
- Feature toggles
- Audit logging with dedicated audit log viewer
- Admin notes system for customer service tracking
- User impersonation for debugging

### Metrics Dashboard
- 10 KPI cards: Total Users, New Users, Active Subscriptions, MRR, ARPU, LTV, Churn Rate, Conversion Rate, Feedback Count, Waitlist Count
- NPS Score card with color-coded Net Promoter Score
- User Growth and Revenue Growth line charts
- Configurable alert thresholds for churn rate and user growth
- Email Report and Check Alerts action buttons
- Scheduled weekly/monthly KPI summary emails

### Setup Dashboard
- Split into 11 focused sub-pages with sidebar navigation
- Branding customization (logo, colors, app name, hero styles, header/footer styling)
- Content management (homepage sections with ordering and per-section backgrounds)
- Pages configuration (about, contact, terms, privacy, custom pages)
- Pricing configuration (Stripe integration)
- Social links setup
- Features & integrations (auth toggles, AI, webhooks, security, compliance, support)
- API Keys & Integrations (centralized key management with collapsible groups, format validation)

### Marketing Pages & Landing Page Components
- Configurable hero section (full-width, split, video, pattern, floating mockup, photo collage styles)
- Logo marquee with scrolling partner/client logos
- Animated counters for key metrics
- Feature cards with icons and descriptions
- Testimonial carousel and customer stories
- Process steps (numbered how-it-works sequence)
- FAQ section with expandable answers
- Founder Letter section with portrait and signature
- Comparison Bars with animated entrance
- Product Screenshot Showcase with layered backgrounds
- Bottom Hero CTA (closing call-to-action mirroring hero weight)
- Image Collage Section (fan-style overlapping images with hover animation)
- Image + Text alternating blocks
- Feature Sub-Page System (`/features/[slug]`) for detailed feature pages
- All sections toggleable via admin Content settings
- Section ordering configurable from admin dashboard
- Per-section background colors

### 950-Scale Color Model
- Primary color palette as single source of truth
- All interactive states use `--primary-*` CSS variables (50/100/400/500/600/900/950)
- Automatic adaptation to any configured palette
- Card backgrounds: `bg-white/10` with `border-gray-500/50`
- Icon backgrounds: randomized from primary scale shades
- Avatar fallbacks: same randomized pattern

### Interactive State System
- `hover-elevate` utility class for hover feedback on clickable non-Button elements
- `active-elevate-2` utility class for press/click feedback
- `toggle-elevate` / `toggle-elevated` for toggle state elements
- All states use primary palette CSS variables for automatic theme adaptation
- Buttons and Badges handle their own states internally (no additional classes needed)

### Header & Footer Styling
- Configurable header: background color, text color, opacity, sticky/relative, transparent mode, border toggle
- Configurable footer: background color, text color, background image, layout mode (4-column, minimal, centered)
- Both default to branding primary color with auto-computed contrast text
- Admin UI with color pickers, opacity sliders, and layout selectors

### Content Management
- Blog/changelog system with markdown and live preview
- Public and draft posts
- Admin CRUD interface

### Marketing Tools
- Waitlist mode for pre-launch email collection with CSV export
- SEO-optimized pages with auto-generated sitemap and robots.txt
- Feedback collection widget with NPS rating (0-10)
- Announcement bar with admin controls
- Custom pages system

### Email System
- Customizable email templates with admin editor
- Template preview and test email sending
- Welcome emails, subscription confirmations, cancellation notifications
- Team invitation emails
- Scheduled KPI report emails
- Powered by Resend

### AI Integration
- Pluggable AI provider system (xAI Grok, OpenAI, Anthropic)
- Admin-configurable provider, model, temperature, max tokens, system prompt
- Chat completion API with streaming support
- Feature toggle to enable/disable AI features

### Help Widget (Support Chatbot)
- Floating AI-powered chat button for visitor support
- Configurable system prompt and fallback email
- NPS rating collection after AI responses
- Separate from feedback widget, independently toggleable

### In-App Notifications
- Bell icon in header with unread count badge
- Notification popover with type-specific icons
- Auto-polling for new notifications
- Mark all as read functionality
- Server-side notification creation utility

### Webhook Automation
- Event-driven webhook system for n8n, Zapier, Make, or any HTTP endpoint
- 8 events: feedback, waitlist, subscriptions, team, contact form
- HMAC-SHA256 payload signing for security
- Fire-and-forget delivery with retry logic
- Admin-configurable URL, secret, and per-event toggles
- Automated API token rotation

### Centralized API Keys & Integrations
- Admin setup page for managing all service API keys from the dashboard
- Collapsible groups (collapsed by default) with status indicators (green/red/gray dots)
- Required/Optional labels (Supabase, Stripe, Resend = required; others = optional)
- Format validation on save (Stripe sk_ prefix, Supabase URL pattern, OpenAI sk- prefix, Sentry DSN, HTTPS URLs)
- Summary cards showing total keys and required keys configured
- Inline edit/reveal/delete with source badges (Dashboard vs Env Var)
- DB-stored keys take priority over environment variables

### Enterprise Features
- SSO/SAML single sign-on with domain-based detection
- Admin-managed identity providers (Okta, Azure AD, Google Workspace)
- Background job processing with BullMQ and Upstash Redis (6 core job types: email, webhook-retry, report, metrics-report, metrics-alert, token-rotation)
- Production-grade rate limiting with Upstash Redis (in-memory fallback)
- Customer service tools (subscription tracking, invoices, admin notes)
- User impersonation with 30-minute sessions and audit logging
- Database backup configuration

### Legal & Compliance
- 9 legal pages with dynamic variable replacement: Terms, Privacy, Cookie Policy, Acceptable Use, Accessibility, Data Handling, DMCA, AI Data Usage, Security Policy
- Configurable cookie consent banner
- MFA and password requirement settings

### Dark / Light Mode
- Full dark and light mode support across all pages
- Theme toggle available in headers
- Semantic color tokens that adapt automatically
- Six-layer depth system for dark mode

### Monitoring & Testing
- Sentry error tracking (server + browser errors)
- Plausible privacy-friendly analytics
- 92 Playwright E2E tests across 7 test files
- Structured logging utility

---

## PassivePost (First Product Extension)

PassivePost is an AI-powered social media scheduling tool built on MuseKit. It demonstrates the database extension pattern and serves as the reference implementation for building products on the template.

Key highlights:
- 10-page social dashboard with dedicated sidebar
- 3-tier subscription system (Starter/Basic/Premium) with Stripe integration
- AI post generation with 15 niche-specific prompt templates
- 10 platform support (Twitter/X, LinkedIn, Instagram, YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord)
- OAuth flows for social platform connections
- Brand preference system for personalized content
- Engagement analytics, calendar view, and post queue management
- 4 BullMQ background job types for social operations

For complete details, see `docs/passivepost/PRODUCT_GUIDE.md`.

---

## How It Works (Simplified)

### Technology Stack

| Layer | Technologies | Purpose |
|-------|--------------|---------|
| **Frontend** | Vercel + Next.js 16+ + shadcn/ui + Tailwind CSS | Modern React framework with server-side rendering, beautiful UI components, and utility-first styling |
| **Backend/API** | Next.js API Routes + OAuth SDKs | Serverless API endpoints with authentication provider integrations |
| **Database/Storage** | Supabase (PostgreSQL + Storage + Auth) | Managed database, file storage, and built-in authentication with Row Level Security |
| **Authentication** | Supabase Auth + 5 OAuth Providers | Email/password, Google, GitHub, Apple, Twitter/X OAuth, and Magic Link passwordless |
| **AI & Automation** | xAI Grok API + n8n | AI capabilities and workflow automation |
| **Operations** | Resend (Emails) + Sentry (Monitoring) + Plausible (Analytics) + Upstash/BullMQ (Queues) | Transactional emails, error tracking, privacy-friendly metrics, and background job processing |
| **Queue & Rate Limiting** | Upstash Redis + BullMQ | Background job processing (6 core + 4 social job types) and API rate limiting |
| **Monetization** | Stripe | Subscription billing, payment processing, and customer portal |

### Authentication & OAuth

MuseKit supports multiple authentication methods:

| Method | Status | Default | Description |
|--------|--------|---------|-------------|
| Email/Password | Included | Enabled | Traditional signup with email verification |
| Google OAuth | Included | Enabled | One-click sign-in with Google accounts |
| GitHub OAuth | Included | Disabled | One-click sign-in with GitHub accounts |
| Apple OAuth | Included | Disabled | One-click sign-in with Apple accounts |
| Twitter/X OAuth | Included | Disabled | One-click sign-in with X accounts |
| Magic Links | Included | Enabled | Passwordless email authentication |
| SSO/SAML | Included | Disabled | Enterprise single sign-on via Supabase SAML |

**Admin Controls:** All OAuth providers can be enabled/disabled via the Setup Dashboard (Features tab). Changes take effect immediately on login/signup pages - no code changes required.

### The Workflow

1. **Clone the template** - Copy MuseKit to your own repository
2. **Connect services** - Link your Supabase, Stripe, and Resend accounts
3. **Customize branding** - Set your app name, colors, and logo
4. **Configure pricing** - Define your subscription tiers
5. **Build your features** - Add what makes your product unique
6. **Deploy** - Push to Vercel and go live

### Multi-Tenancy

MuseKit supports multiple organizations using the same codebase. Each organization:
- Has its own members and data
- Can have custom branding
- Is isolated from other organizations

This means you can run multiple SaaS products from one template, or allow customers to create their own "workspaces" within your product.

### Database Extension Pattern

MuseKit supports a clean extension model for building products on top of the template:
- **Core tables** live in `migrations/core/` and are never modified by extensions
- **Extension tables** live in `migrations/extensions/` and add product-specific schemas
- This ensures clean template cloning — extensions can be included or excluded per product
- PassivePost is the first product built using this pattern, proving the model works
- See `docs/musekit/ADDING_A_PRODUCT.md` for how to build your own product on MuseKit

---

## Current Status

### MuseKit Core (Complete)

| Feature | Status |
|---------|--------|
| User Authentication (Email + 5 OAuth) | Complete |
| Stripe Billing & Feature Gating | Complete |
| Admin Dashboard & User Management | Complete |
| Metrics Dashboard (10 KPIs + NPS + Alerts) | Complete |
| Team/Organization System | Complete |
| Blog/Changelog System | Complete |
| Email Template Editor | Complete |
| Waitlist Mode | Complete |
| Feedback Widget + NPS Rating | Complete |
| Help Widget (AI Support Chatbot) | Complete |
| In-App Notifications | Complete |
| User Impersonation | Complete |
| Audit Log Viewer | Complete |
| SEO/Sitemap | Complete |
| Setup Dashboard (11 Sub-Pages) | Complete |
| Onboarding Wizard | Complete |
| AI Integration (xAI/OpenAI/Anthropic) | Complete |
| Webhook/n8n Automation | Complete |
| Sentry Error Tracking | Complete |
| Plausible Analytics | Complete |
| E2E Testing (92 Playwright tests, 7 files) | Complete |
| Dark/Light Mode | Complete |
| OAuth Admin Controls | Complete |
| SSO/SAML Enterprise Auth | Complete |
| Queue Infrastructure (BullMQ, 6 Core Job Types) | Complete |
| Rate Limiting (Upstash Redis) | Complete |
| Admin Setup UX (11 Sub-Pages) | Complete |
| Customer Service Tools | Complete |
| Admin Documentation Guide | Complete |
| Legal & Compliance Pages (9 pages + cookie consent) | Complete |
| Scheduled Metrics Reports | Complete |
| Metrics Alerts (Churn + Growth) | Complete |
| Database Backup Configuration | Complete |
| API Token Rotation | Complete |
| Centralized API Keys & Integrations | Complete |
| Landing Page Components (14 reusable sections) | Complete |
| 950-Scale Color Model | Complete |
| Header & Footer Styling (admin-configurable) | Complete |
| Interactive State System (hover-elevate, active-elevate-2) | Complete |
| Section Ordering & Per-Section Backgrounds | Complete |
| Feature Sub-Page System (/features/[slug]) | Complete |
| Product Registry (multi-product tier resolution) | Complete |

### PassivePost Extension (Complete)

| Feature | Status |
|---------|--------|
| 10-Page Social Dashboard | Complete |
| 3-Tier Subscription System (Starter/Basic/Premium) | Complete |
| AI Post Generation (15 niche prompts) | Complete |
| OAuth Social Platform Connections | Complete |
| Brand Preferences System | Complete |
| Engagement Analytics | Complete |
| Calendar View | Complete |
| Post Queue Management | Complete |
| Quick Generate FAB | Complete |
| Upgrade Banner (80%+ usage) | Complete |
| Dark/Light Mode Toggle in Dashboard | Complete |
| 4 BullMQ Social Job Types | Complete |
| Admin PassivePost Config Page | Complete |
| 8 Playwright E2E Tests | Complete |

### Planned (Post-MVP / Roadmap)

**MuseKit Core:**
- Affiliate/referral system
- Push notifications
- Internationalization (multiple languages)
- A/B testing
- White-label support

**PassivePost:**
- Dynamic tiers from admin dashboard
- Real platform API integration for 7 newer platforms (YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord have stubbed methods)
- Approval queue UI for reviewing AI-generated posts

---

## Gap Analysis: Tech Stack vs. Current Implementation

This section compares the planned technology stack against what is currently implemented in the MVP.

### Implementation Status by Layer

| Layer | Technology | Status | Notes |
|-------|------------|--------|-------|
| **Frontend** | Vercel | Implemented | Production deployment configured |
| | Next.js 16+ | Implemented | App Router with TypeScript |
| | shadcn/ui | Implemented | Full component library installed (70+ components) |
| | Tailwind CSS | Implemented | With dark mode support and 950-scale color model |
| **Backend/API** | Next.js API Routes | Implemented | 40+ API routes functional |
| | OAuth SDKs | Implemented | All 5 providers via Supabase Auth + PassivePost platform OAuth |
| **Database** | Supabase PostgreSQL | Implemented | 15+ tables in production (core + extensions) |
| | Supabase Storage | Implemented | Used for avatars + branding images |
| | Supabase Auth | Implemented | Email + all 5 OAuth providers |
| | Row Level Security | Implemented | Policies on key tables |
| **Authentication** | Email/Password | Implemented | Full flow with verification |
| | Google OAuth | Implemented | One-click sign-in working |
| | GitHub OAuth | Implemented | UI ready, enable in Supabase Dashboard |
| | Apple OAuth | Implemented | UI ready, enable in Supabase Dashboard |
| | Twitter/X OAuth | Implemented | UI ready, enable in Supabase Dashboard |
| | Magic Links | Implemented | Passwordless login via Supabase OTP |
| | SSO/SAML | Implemented | Enterprise auth via Supabase SAML |
| **AI & Automation** | xAI Grok API | Implemented | Pluggable provider with streaming chat API |
| | OpenAI | Implemented | Configurable via admin dashboard |
| | Anthropic | Implemented | Configurable via admin dashboard |
| | n8n/Webhook System | Implemented | 8 events, HMAC signing, fire-and-forget |
| **Social Media** | PassivePost Extension | Implemented | 10 platforms, 3 tiers, 10-page dashboard, AI post generation |
| **Operations** | Resend (Emails) | Implemented | Templates + test sending + admin editor + scheduled reports |
| | Sentry (Monitoring) | Implemented | Server + browser errors via tunnel route |
| | Plausible (Analytics) | Implemented | Script integrated |
| | Upstash/BullMQ (Queues) | Implemented | 10 job types (6 core + 4 social), admin dashboard |
| | Upstash Redis Rate Limiting | Implemented | Sliding window with in-memory fallback |
| **Testing** | Playwright E2E | Implemented | 92 tests across 7 files |
| **Monetization** | Stripe Billing | Implemented | Subscriptions + portal + Product Registry tier resolution |

### Summary

| Category | Implemented | Partial | Not Started |
|----------|-------------|---------|-------------|
| Frontend | 4/4 | 0 | 0 |
| Backend/API | 2/2 | 0 | 0 |
| Database/Storage | 4/4 | 0 | 0 |
| Authentication | 7/7 | 0 | 0 |
| AI & Automation | 4/4 | 0 | 0 |
| Social Media | 1/1 | 0 | 0 |
| Operations | 5/5 | 0 | 0 |
| Testing | 1/1 | 0 | 0 |
| Monetization | 1/1 | 0 | 0 |

### Completed - No Remaining Gaps

All technology stack components are fully implemented. Future enhancements are feature additions rather than infrastructure gaps.

---

## Why MuseKit Was Built

### The Vision

Every SaaS idea deserves a fair chance. But too many good ideas die in the "infrastructure swamp" -- the months spent building login pages and payment forms before you can even test if anyone wants your product.

MuseKit exists to eliminate that barrier. With a production-ready foundation, founders can:

- **Validate faster** - Get to market in days, not months
- **Iterate quickly** - Spend time on features, not infrastructure
- **Scale confidently** - Built on proven, battle-tested architecture

### Design Principles

1. **Production-ready** - Not a tutorial or demo; real code you can ship
2. **Modern stack** - Uses current best practices and popular tools
3. **Flexible** - Customize everything; no vendor lock-in
4. **Well-documented** - Clear guides for setup and customization
5. **Maintainable** - Clean architecture that grows with your product
6. **Extensible** - Database extension pattern for building products on top

---

## Documentation Guide

| Document | Purpose |
|----------|---------|
| `docs/musekit/PROJECT_OVERVIEW.md` | This file — high-level overview of the entire project |
| `docs/passivepost/PRODUCT_GUIDE.md` | Dedicated guide for the PassivePost social media product |
| `docs/musekit/SETUP_GUIDE.md` | Step-by-step setup instructions for new clones |
| `docs/musekit/MUSE_CHECKLIST.md` | Launch readiness checklist |
| `docs/musekit/ADMIN_GUIDE.md` | Day-to-day admin dashboard guide |
| `docs/musekit/MASTER_PLAN.md` | Detailed technical specifications and module breakdown |
| `docs/musekit/ARCHITECTURE.md` | Deployment model, merge rules, and separation boundaries |
| `docs/musekit/ADDING_A_PRODUCT.md` | How to build a new product on MuseKit |

---

## Questions?

This is an actively developed project. The core MVP features are complete and production-ready. Post-MVP features are being added based on real-world usage and feedback. PassivePost is the first product built on the template, proving the extension model works.

For the latest status and roadmap, refer to the Master Plan document.

---

*Last Updated: February 19, 2026*
