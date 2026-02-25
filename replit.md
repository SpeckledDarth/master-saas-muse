# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template designed to accelerate the launch of new SaaS products. It provides a comprehensive, high-quality starting point, significantly reducing development time. Each SaaS product deployed using MuseKit operates with its own independent deployment, repository, database, and Stripe account, ensuring clean P&L, independent scaling, and zero cross-pollination risk. The platform includes robust authentication, Stripe-powered billing with feature gating, team collaboration with role-based permissions, an administrative dashboard, pluggable AI integrations, webhook support, monitoring, analytics, E2E testing, and SEO optimization.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.
- **CRITICAL - Deployment**: This is a Next.js + Vercel project. The user NEVER uses the Replit preview/webview. All testing and viewing happens on the live Vercel deployment (triggered by git push to GitHub). Replit is used only as a code editor. Never suggest using the Replit preview panel.

### Three-Environment Sync Protocol (CRITICAL)

This project runs across THREE environments that MUST stay aligned. Most testing failures come from these being out of sync.

| Environment | Purpose | Database | Code Source |
|-------------|---------|----------|-------------|
| **Replit** | Code editor + local dev server | Replit Postgres (local) | Local filesystem |
| **GitHub** | Version control + Vercel trigger | N/A | Git repository |
| **Vercel + Supabase** | Production (where user tests) | Supabase Postgres | Deployed from GitHub |

**The Problem:** Agent tests against Replit Postgres + local dev server. User tests against Supabase + Vercel. If schemas or code differ, bugs appear only on one side and we waste hours debugging phantom issues.

**Pre-Push Sync Checklist (MANDATORY before telling user to push to GitHub):**

1. **Schema alignment** — Query Replit Postgres to confirm every table/column the code expects exists. If it exists here, list the migration SQL the user needs to run in Supabase. If a migration is needed, explicitly state: "Run this SQL in Supabase SQL Editor BEFORE testing on Vercel."
2. **Code compiles clean** — Run `npm run dev` and confirm zero build errors in logs.
3. **API smoke test** — curl every changed API route against the local dev server. Confirm no 500s.
4. **Migration inventory** — List ALL migration files that need to be run on Supabase, in order, with the exact file paths. Don't assume the user has run previous migrations.
5. **Environment variables** — If any new env vars are needed, list them for both Vercel AND Supabase dashboards.
6. **Git status check** — Remind user to push to GitHub. Vercel auto- deploys from the GitHub repo.

**Why This Matters:**
- Agent sees Replit Postgres. User's app reads Supabase.
- Agent tests on localhost:5000. User tests on Vercel deployment.
- Code changes only reach Vercel after git push → GitHub → Vercel auto-deploy.
- Missing a Supabase migration = user sees 500 errors that agent cannot reproduce locally.

### Pre-Delivery Testing Checklist (MANDATORY before handing work to user)
Every time code changes are made, the agent MUST complete these steps before telling the user the work is ready:
1. **Check the Replit database schema** — Query the Replit Postgres to confirm all tables and columns the code expects actually exist. The Replit DB should mirror what Supabase has. If a column is missing here, it's missing on Supabase too.
2. **Start the dev server** — Run `npm run dev` and confirm no build/compile errors in the logs.
3. **Test API endpoints** — Use curl or fetch against the local dev server to hit every API route that was changed. Confirm they return 200 (not 500). Check the response body makes sense.
4. **Check server logs** — Review the dev server console output for any errors, warnings, or stack traces while testing.
5. **Trace the full path** — For each fix, mentally trace: frontend fetch call -> API route -> database query -> response handling. Confirm every step works, not just the spot that looked broken.
6. **List required Supabase migrations** — If any fix depends on a table or column that might not exist in the user's Supabase instance, explicitly list the migration SQL the user needs to run BEFORE testing.

### Session Start Protocol
- **ALWAYS read `docs/ROADMAP.md` at the start of every session.** This file is the persistent project memory containing the multi-week development plan, decision log, open questions, and session history. If agent memory resets, this file restores full context.
- After reading the roadmap, check the **Pending Bug Fixes** section — fix those before starting new features.
- Check the **Phase Overview** table to see current phase and resume from there.
- If working on CRM/invoicing features (Phases 5-7), also read `docs/CRM_INVOICING_BRAINSTORM.md` for the full 217-feature vision and dogfooding architecture.
- If working on affiliate enhancements (Phase 3.6), also read `docs/musekit/AFFILIATE_ENHANCEMENTS.md` for detailed SQL schemas and API specs.
- Update the Session Log in ROADMAP.md at the end of every session with what was accomplished.
- Consult the **Key Documents** table below to know which docs to read for any given task.

### Key Documents

| Document | Path | Purpose | When to Read |
|----------|------|---------|-------------|
| **Development Roadmap** | `docs/ROADMAP.md` | Master execution tracker: phase status, sprint details, pending bugs, decision log, session history | **Every session** — read first, always |
| **CRM & Invoicing Brainstorm** | `docs/CRM_INVOICING_BRAINSTORM.md` | Strategic vision: 217 features across all 3 dashboards, dogfooding architecture, cross-Muse strategy, gap analysis | When working on Phases 5-7 (CRM, dashboards, AI) |
| **Affiliate Enhancements** | `docs/musekit/AFFILIATE_ENHANCEMENTS.md` | Implementation specs: SQL schemas, API endpoints, UI descriptions for 32 affiliate features | When working on Phase 3.6 (Sprints 1-4) |

### Two-Document System (CRITICAL)

The project uses two primary planning documents that serve different purposes. **Never merge them.**

| Document | Role | Contains | Updates |
|----------|------|----------|---------|
| `docs/ROADMAP.md` | **Execution state** | Phase status, sprint tables, pending bugs, decision log, session history, file references | Every session — tracks what's done, what's next |
| `docs/CRM_INVOICING_BRAINSTORM.md` | **Strategic vision** | 217-feature brainstorm, dogfooding architecture, cross-Muse strategy, gap analysis, build priority tiers | When planning new phases — the ideas pipeline |

A third document, `docs/musekit/AFFILIATE_ENHANCEMENTS.md`, serves as **implementation specs** specifically for Phase 3.6's 32 affiliate features (SQL schemas, API endpoints, UI descriptions). It cross-references both the roadmap (for status tracking) and the brainstorm doc (for feature overlap mapping).

## System Architecture
The project is built with Next.js 16+ (App Router), React 18+, and TypeScript. Styling is handled with Tailwind CSS, shadcn/ui, and next-themes, while TanStack Query manages server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The UI emphasizes dynamic branding, configurable navigation, customizable sections (hero, logo marquee, animated counters, testimonial carousels), dark/light mode, and a comprehensive admin dashboard. The admin dashboard features a full-width layout, task-based setup navigation, and a dedicated branding page for color palette management, background overrides, font selection, and logo variants. Dark mode employs a distinct six-layer depth system. All marketing and public pages are fully responsive. Header and footer styling are highly configurable through the admin UI, supporting various layouts, background options, and automatic contrast adjustments. Landing page components are modular and toggleable, including a Founder Letter, Comparison Bars, Product Showcase, Bottom Hero CTA, Photo Collage Hero, and Image Collage Section. Color models for cards use a 950-scale for consistency across light and dark modes.

**Technical Implementations:**
- **Authentication**: Supports email/password, multiple OAuth providers, SSO/SAML, protected routes, and profile management.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, audit logging, onboarding wizard, and enhanced setup UX, including user impersonation.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, and feature gating.
- **Email System**: Resend integration for transactional emails with editable templates and category tagging.
- **Team/Organization System**: Multi-user organizations with role hierarchies and invitations.
- **AI Integration**: Pluggable system for xAI, OpenAI, and Anthropic.
- **Webhook Integration**: Event-driven system with HMAC-SHA256 signing, retry logic, and admin UI.
- **Content Management**: Markdown-based blog/changelog with public display and admin CRUD.
- **Marketing Tools**: Waitlist mode, in-app feedback widget, and customizable marketing pages.
- **Security**: Supabase RLS, Zod validation, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking and Plausible for analytics.
- **Queue Infrastructure**: BullMQ with Upstash Redis for core and product-specific job types.
- **Rate Limiting**: Upstash Redis sliding window with in-memory fallback.
- **In-App Notifications**: Bell icon with unread badges and popover list.
- **Metrics & Reporting**: Admin dashboard for KPIs, scheduled reports, and alerts.
- **Database Backup Configuration**: Admin UI for setting backup notification preferences.
- **API Token Rotation**: Automated webhook secret rotation.
- **Product Registry**: Supports multiple SaaS products via dedicated database tables for product-scoped features.
- **Blog Publishing**: Cross-platform system with SEO preview, Markdown editor, AI repurpose engine, and calendar integration (Medium, WordPress, Ghost, LinkedIn, Substack).
- **Flywheel System**: Comprehensive content flywheel across 7 phases, including content intelligence, advanced automation, distribution, revenue, engagement, and collaboration features.
- **Bonus Features**: AI Hashtag Suggestions, Gig Lead Notifications (keyword scanner, reply templates), AI Voice Fine-Tuner, and a Lead CRM Mini.
- **Testimonial Management**: Admin CRUD for testimonials with public display on a "Wall of Love" page and social proof popups on the landing page.
- **Affiliate System**: Complete affiliate marketing infrastructure with tracked referral links, commission tracking on Stripe events, fraud detection, performance tiers, marketing assets, and payout management. Includes public signup, application, separate login, and standalone dashboard for affiliates. Admin manages applications, networks, and all affiliate settings.
- **CRM & Invoicing Foundation**: Universal user profiles (all user types), local invoice/payment records synced from Stripe webhooks, affiliate payout item tracking, support ticket system (open → in_progress → resolved → closed), CRM activity log (calls, notes, tasks, meetings), marketing campaign tracking with UTM attribution, and contract/agreement management with signing flow and version history.
- **Product Extension Design Rules**: Emphasizes adding new files and tables for product-specific features (`migrations/extensions/`, `/dashboard/social/`, `src/lib/<product>/`), using plugin patterns for queue jobs, and minimizing core file modifications.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.