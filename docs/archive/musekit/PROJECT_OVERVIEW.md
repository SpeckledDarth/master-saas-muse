# MuseKit — Project Overview

**A Production-Ready SaaS Foundation for Rapid Product Launch**

---

## What is MuseKit?

MuseKit is a complete, production-ready foundation for building software-as-a-service (SaaS) products. It handles all the common infrastructure every online business needs — user accounts, subscription billing, team management, admin dashboards, affiliate programs, email systems, AI integration, and more — so you can focus on building what makes your product unique.

Instead of spending months building login systems, payment processing, and admin tools from scratch, MuseKit gives you all of this out of the box. You clone it, customize it, and launch your product in days instead of months.

### Tech Stack

- **Next.js 16+** (App Router) with **React 18** and **TypeScript**
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **Supabase** for database, auth, and storage (PostgreSQL with Row Level Security)
- **Stripe** for subscription billing
- **Vercel** for hosting
- **Resend** for transactional email
- **xAI/Grok** (default), OpenAI, and Anthropic for AI features
- **BullMQ** + **Upstash Redis** for background jobs and rate limiting
- **Sentry** for error tracking, **Plausible** for analytics

### MuseKit vs. PassivePost

MuseKit and PassivePost are two distinct sides of this project:

| | **MuseKit** (The Template) | **PassivePost** (The First Product) |
|---|---|---|
| **What it is** | A reusable SaaS starter template | An AI social media scheduling and affiliate marketing platform |
| **Who uses it** | Developers building new SaaS products | Content creators, solopreneurs, and gig workers |
| **Purpose** | Provides auth, billing, admin, email, affiliate program, CRM, etc. | Manages social media posts with AI + runs a full affiliate program |
| **Code location** | Everything outside `/social/` directories | Everything inside `/social/` directories + affiliate system |
| **Database** | `migrations/core/` | `migrations/extensions/` |
| **Can be removed?** | No — it's the foundation | Yes — delete `/social/` dirs to remove the product |

PassivePost is the reference implementation that proves the MuseKit extension model works. For full PassivePost details, see `docs/passivepost/PRODUCT_GUIDE.md`.

---

## The Problem It Solves

### For Entrepreneurs and Developers

Building a SaaS product from scratch means solving the same problems everyone else has already solved:

- **User authentication** — How do people sign up and log in?
- **Subscription billing** — How do you charge customers monthly?
- **Affiliate/referral programs** — How do you incentivize people to promote your product?
- **Team features** — How do organizations manage multiple users?
- **Admin controls** — How do you manage users and see analytics?
- **Email notifications** — How do you send welcome emails and updates?
- **CRM and support** — How do you track customer relationships and handle tickets?
- **SEO and marketing pages** — How do you get found on Google?

These features take 3-6 months to build properly. Most projects never get past this "infrastructure phase" to the actual product idea.

### The MuseKit Solution

MuseKit provides all of this pre-built, tested, and production-ready. You inherit months of development work on day one, letting you jump straight to building your unique value proposition.

---

## Who Is This For?

### Primary Users

1. **Solo Founders** — Technical or semi-technical entrepreneurs who want to validate ideas quickly without rebuilding infrastructure every time.

2. **Small Development Teams** — Teams who want a consistent, proven foundation for multiple SaaS projects.

3. **Agencies** — Development agencies who build SaaS products for clients and need a reliable starting point.

### Use Cases

- **Launch a new SaaS product** — Start with everything you need, add your unique features
- **Clone for multiple products** — Use the same template for different business ideas
- **Learn modern SaaS architecture** — See how authentication, billing, affiliate programs, and multi-tenancy work together

---

## MuseKit Core Features

These features ship with every MuseKit clone. They are the foundation every SaaS product needs.

### User Management & Authentication
- Email/password signup with email verification
- 5 OAuth providers: Google, GitHub, Apple, Twitter/X, Magic Link
- Admin-controlled OAuth toggles (enable/disable from dashboard)
- User profiles with avatar upload and connected provider management
- Role-based access (Owner, Admin, Manager, Member, Viewer, Affiliate)
- User impersonation for debugging (30-minute sessions, audit logged)
- SSO/SAML enterprise single sign-on with domain-based detection

### Subscription Billing (Stripe)
- Multiple pricing tiers with monthly/annual billing
- Stripe Checkout integration with hosted payment page
- Customer portal for self-service subscription management
- Feature gating based on plan level
- Webhook processing for real-time subscription updates
- Local invoice records mirrored from Stripe
- Branded payment receipt emails
- Product Registry for multi-product tier resolution
- Discount code system with Stripe coupon sync

### Affiliate Program
MuseKit includes a complete affiliate/partner program with:
- Public signup and application workflow at `/affiliate/join`
- Admin review and approval with automatic account provisioning
- Standalone affiliate dashboard with 11+ navigation tabs
- Cookie-based referral tracking (configurable window)
- Automatic commission calculation from Stripe payments
- Performance tiers (Bronze/Silver/Gold/Platinum) with escalating rates
- Rate lock-in (grandfathering) for affiliate terms
- Milestone bonuses, contests, leaderboards, and weekly challenges
- Badges and achievements system with public verification
- Deep link generator with UTM parameters and QR codes
- Co-branded landing pages at `/partner/[slug]`
- Discount codes with dual-attribution (cookie + code)
- Marketing toolkit with swipe files, email templates, and sharing cards
- Knowledge base, promotional calendar, and starter kits
- AI-powered tools: coach, post writer, email drafter, video scripts, objection handler
- Tax compliance (W-9/W-8BEN collection, 1099 export)
- Payout lifecycle management with batch processing
- In-app messaging between admin and affiliates
- Broadcasts, drip sequences, and surveys
- Public partner directory and case study library
- Fraud detection and automated scoring
- Affiliate API access and webhook notifications
- External network support (ShareASale, Impact, PartnerStack)

### CRM & Support
- Support ticket system with Open/In Progress/Resolved/Closed workflow
- CRM activity log (calls, notes, tasks, meetings)
- Marketing campaign tracking with UTM attribution
- Contracts and agreements with signing workflow
- Admin notes system for internal documentation
- Universal user profiles with complete activity history

### Team Collaboration
- Organizations with multiple members
- Team invitations via email with token validation
- Role hierarchy: Owner > Admin > Manager > Member > Viewer
- Multi-tenancy (each organization sees only their data)

### Admin Dashboard
- User analytics and metrics at a glance
- User management with customer service tools (subscription details, invoices, notes)
- Subscription status visibility and Stripe integration
- Feature toggles for all platform capabilities
- Audit logging with dedicated audit log viewer
- User impersonation for debugging
- Revenue attribution reports and revenue waterfall charts
- Onboarding funnel tracking

### Metrics Dashboard
- 10 KPI cards: Total Users, New Users, Active Subscriptions, MRR, ARPU, LTV, Churn Rate, Conversion Rate, Feedback Count, Waitlist Count
- NPS Score card with color-coded Net Promoter Score
- User Growth and Revenue Growth line charts
- Configurable alert thresholds for churn rate and user growth
- Email Report and Check Alerts action buttons
- Scheduled weekly/monthly KPI summary emails

### Setup Dashboard
- 15+ focused sub-pages with sidebar navigation
- Branding customization (logo, colors, app name, hero styles, header/footer styling)
- Content management (homepage sections with ordering and per-section backgrounds)
- Pages configuration (about, contact, terms, privacy, custom pages)
- Pricing configuration (Stripe integration)
- Social links setup
- Features & integrations (auth toggles, AI, webhooks, security, compliance, support)
- API Keys & Integrations (centralized key management with collapsible groups, format validation)
- Affiliate program configuration
- Discount code management
- Product registry management
- Testimonial management
- Palette customization
- Watermark settings
- Funnel configuration

### Marketing Pages & Landing Page Components
- Configurable hero section (full-width, split, video, pattern, floating mockup, photo collage styles)
- Logo marquee, animated counters, feature cards, testimonial carousel
- Customer stories, process steps, FAQ section
- Founder Letter section with portrait and signature
- Comparison Bars with animated entrance
- Product Screenshot Showcase
- Bottom Hero CTA, Image Collage, Image + Text blocks
- Social Proof Popup
- Feature Sub-Page System (`/features/[slug]`)
- All sections toggleable and reorderable from admin dashboard
- Per-section background colors

### Email & Notifications
- Customizable email templates with admin editor and preview
- Transactional emails powered by Resend
- Drip sequences (multi-step automated emails)
- Weekly performance emails for affiliates
- Monthly earnings statements
- Weekly affiliate digest with contest standings and tips
- Trial expiry alerts
- Scheduled KPI report emails
- In-app notification bell with unread count badge
- Email preferences center for users

### AI Integration
- Pluggable AI provider system (xAI Grok as default, OpenAI, Anthropic)
- Admin-configurable provider, model, temperature, max tokens, system prompt
- Chat completion API with streaming support
- AI-powered support chatbot (Help Widget)
- AI tools for affiliates: post writer, email drafter, blog outlines, video scripts, coaching, objection handler, ad copy, pitch customizer, promotion ideas, conversion optimizer

### Content Management
- Blog/changelog system with Markdown and live preview
- Public and draft posts with admin CRUD interface

### Legal & Compliance
- 9 legal pages with dynamic variable replacement: Terms, Privacy, Cookie Policy, Acceptable Use, Accessibility, Data Handling, DMCA, AI Data Usage, Security Policy
- Configurable cookie consent banner
- MFA and password requirement settings

### Enterprise Features
- SSO/SAML single sign-on with domain-based detection
- Background job processing with BullMQ and Upstash Redis
- Production-grade rate limiting with Upstash Redis (in-memory fallback)
- Database backup configuration
- API token rotation
- Queue management dashboard

### Monitoring & Testing
- Sentry error tracking (server + browser errors via tunnel route)
- Plausible privacy-friendly analytics
- Playwright E2E tests
- Structured logging utility

### Dark / Light Mode
- Full dark and light mode support across all pages
- Theme toggle available in headers
- Semantic color tokens that adapt automatically
- 950-scale color model with automatic palette adaptation

---

## PassivePost (First Product Extension)

PassivePost is an AI-powered social media scheduling and content management tool built on MuseKit. It demonstrates the database extension pattern and serves as the reference implementation for building products on the template.

Key highlights:
- Multi-page social dashboard with dedicated sidebar (15+ pages)
- 3-tier subscription system (Starter/Basic/Premium) with Stripe integration
- AI post generation with niche-specific prompt templates
- 10 platform support (Twitter/X, LinkedIn, Instagram, YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord)
- 7-phase content flywheel: Ideate, Create, Schedule, Publish, Engage, Analyze, Optimize
- OAuth flows for social platform connections
- Blog-to-social repurposing across multiple blog platforms
- Brand preference system for personalized content
- Engagement analytics, calendar view, and post queue management
- Content intelligence, topic fatigue detection, and content DNA analysis
- Client approval portal for agencies
- Lead generation and revenue tracking
- Content distribution and automation workflows
- Background job types for social operations

For complete details, see `docs/passivepost/PRODUCT_GUIDE.md`.

---

## How It Works

### The Workflow

1. **Clone the template** — Copy MuseKit to your own repository
2. **Connect services** — Link your Supabase, Stripe, and Resend accounts
3. **Customize branding** — Set your app name, colors, and logo via the admin dashboard
4. **Configure pricing** — Define your subscription tiers in Stripe
5. **Set up affiliate program** — Configure commission rates, tiers, and marketing assets
6. **Build your features** — Add what makes your product unique
7. **Deploy** — Push to Vercel and go live

### Multi-Tenancy

MuseKit supports multiple organizations using the same codebase. Each organization:
- Has its own members and data
- Can have custom branding
- Is isolated from other organizations via Row Level Security

### Database Extension Pattern

MuseKit supports a clean extension model for building products on top of the template:
- **Core tables** live in `migrations/core/` and are never modified by extensions
- **Extension tables** live in `migrations/extensions/` and add product-specific schemas
- This ensures clean template cloning — extensions can be included or excluded per product
- See `docs/musekit/ADDING_A_PRODUCT.md` for how to build your own product on MuseKit

---

## Documentation Guide

| Document | Purpose |
|----------|---------|
| `docs/musekit/PROJECT_OVERVIEW.md` | This file — high-level overview of the entire project |
| `docs/musekit/SETUP_GUIDE.md` | Step-by-step setup instructions for new clones |
| `docs/musekit/ADMIN_GUIDE.md` | Day-to-day admin dashboard guide |
| `docs/musekit/ARCHITECTURE.md` | Deployment model, merge rules, and separation boundaries |
| `docs/musekit/ADDING_A_PRODUCT.md` | How to build a new product on MuseKit |
| `docs/musekit/MUSE_CHECKLIST.md` | Launch readiness checklist |
| `docs/musekit/MASTER_PLAN.md` | Technical specifications and module breakdown |
| `docs/musekit/AFFILIATE.md` | Complete affiliate system guide |
| `docs/musekit/AFFILIATE_ENHANCEMENTS.md` | Detailed affiliate feature specifications |
| `docs/passivepost/PRODUCT_GUIDE.md` | Dedicated guide for the PassivePost product |
