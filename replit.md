# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template designed to accelerate the launch of new SaaS products. It aims to be a closed-loop business intelligence system for content creators, featuring robust authentication, Stripe-powered billing with feature gating, team collaboration, an administrative dashboard, pluggable AI integrations, webhook support, monitoring, analytics, E2E testing, and SEO optimization. Each SaaS product deployed using MuseKit operates with its own independent deployment, repository, database, and Stripe account, ensuring clean P&L, independent scaling, and zero cross-pollination risk. The platform's vision includes a rich set of 217 features to create a competitive moat.

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

### Pre-Delivery Testing Checklist (MANDATORY before handing work to user)
Every time code changes are made, the agent MUST complete ALL of these steps before telling the user the work is ready. The user tests on Vercel, not Replit. If the agent skips these steps, the user will see errors the agent cannot reproduce, and days will be wasted.

1. **Check the Replit database schema** — Query the Replit Postgres to confirm all tables and columns the code expects actually exist. The Replit DB should mirror what Supabase has. If a column is missing here, it's missing on Supabase too.
2. **Start the dev server** — Run `npm run dev` and confirm no build/compile errors in the logs.
3. **Test API endpoints** — Use curl or fetch against the local dev server to hit every API route that was changed. Confirm they return 200 (not 500). Check the response body makes sense (not just the status code).
4. **Check server logs** — Review the dev server console output for any errors, warnings, or stack traces while testing.
5. **Trace the full path** — For each fix, mentally trace: frontend fetch call -> API route -> database query -> response handling. Confirm every step works, not just the spot that looked broken.
6. **List required Supabase migrations** — If any fix depends on a table or column that might not exist in the user's Supabase instance, explicitly list the migration SQL the user needs to run BEFORE testing.
7. **Fix all errors before handoff** — Do NOT hand partially-working code to the user. If an API returns a 500, debug and fix it. The user should never be the first person to discover a bug.

### Session Start Protocol (MANDATORY — DO NOT SKIP)

Every session MUST follow these steps IN ORDER before writing any code:

1. **Read `docs/PRODUCT_IDENTITY.md`** — Understand what PassivePost actually is. This is a closed-loop business intelligence platform for content creators, NOT a generic SaaS template. The 217-feature vision is intentional. Never suggest cutting features or simplifying the affiliate program. The feature richness IS the moat.
2. **Read `docs/DESIGN_SYSTEM_RULES.md`** — MANDATORY before any component or UI work. Contains the complete mapping of Tailwind patterns to CSS variables, DS wrapper components (`DSCard`, `DSGrid`, `DSSection`), and Never/Always rules. Every spacing, radius, shadow, and color class must use CSS variables from the design system.
3. **Read `docs/FEATURE_INVENTORY.md`** — Know what's already built. Search for keywords related to what you're about to build. If something similar exists, EXTEND it — don't create a parallel system.
4. **Read `docs/LESSONS_LEARNED.md`** — Know the anti-patterns and technical gotchas. Follow the rules to avoid repeating past mistakes.
5. **Read `docs/ROADMAP.md`** — Know what's in progress and what's next. Check the Phase Overview table. Check the Pending Bug Fixes section — fix those before new features.
6. **Plan with integration requirements** — For every feature you plan to build, list which existing systems it connects to. If you can't name at least one integration point, rethink the feature.
7. **Update Session Log** in ROADMAP.md at end of every session with what was accomplished.

### Integration-First Development Rules (NON-NEGOTIABLE)

These rules apply to EVERY session, EVERY feature, no exceptions:

1. **No Standalone Features** — Every new feature MUST connect to at least one existing system. If your feature doesn't reference existing database tables, API routes, or UI components, you're building it wrong.
2. **Check Before You Build** — Search `docs/FEATURE_INVENTORY.md` for related features. If something similar exists, extend it. Never create parallel logic.
3. **Data Must Flow** — New features should both CONSUME existing data AND PRODUCE data that other features can use. A feature that only displays its own data is an island, not part of the flywheel.
4. **AI Must Use Real Context** — Every AI feature must pull real data (commissions, referrals, tiers, contests, milestones, leaderboard position, content calendar, connected analytics). Never generate advice in a vacuum.
5. **Cross-Dashboard Awareness** — If a feature affects one dashboard, consider how it surfaces in the others. Admin creates contest → Affiliate sees it → AI coach references it → Predictions factor it in.
6. **Document Connections** — In your session plan, explicitly list which existing features each new feature connects to. This is how we verify integration-first development.
7. **Design System Compliance** — Every component MUST use CSS variables from the design system for spacing, radius, shadows, and colors. Never hardcode `p-6`, `gap-4`, `rounded-lg`, or `shadow-sm`. Use `p-[var(--card-padding)]`, `gap-[var(--content-density-gap)]`, etc. See `docs/DESIGN_SYSTEM_RULES.md`.

### Key Documents

| Document | Path | Purpose | When to Read |
|----------|------|---------|-------------|
| **Product Identity** | `docs/PRODUCT_IDENTITY.md` | What we're building and why. The closed-loop vision. Integration rules. | **Every session** — read FIRST, before anything else |
| **Design System Rules** | `docs/DESIGN_SYSTEM_RULES.md` | CSS variable mapping, DS wrapper components, Never/Always rules for styling | **Every session** — read BEFORE any component/UI work |
| **Feature Inventory** | `docs/FEATURE_INVENTORY.md` | Complete inventory of everything built, organized by system, with files/tables/APIs | **Every session** — read BEFORE planning any features |
| **Lessons Learned** | `docs/LESSONS_LEARNED.md` | Technical anti-patterns, integration anti-patterns, deployment gotchas | **Every session** — read to avoid repeating mistakes |
| **Development Roadmap** | `docs/ROADMAP.md` | Master execution tracker: phase status, sprint details, pending bugs, session history | **Every session** — read after identity/inventory/lessons |

### Document System

The project uses multiple planning documents that serve different purposes. **Never merge them.**

| Document | Role | Updates |
|----------|------|---------|
| `PRODUCT_IDENTITY.md` | **Product soul** — what we're building and why | Rarely — only when vision evolves |
| `DESIGN_SYSTEM_RULES.md` | **Styling law** — CSS variable mapping, wrapper components, Never/Always rules | When design system variables change |
| `FEATURE_INVENTORY.md` | **What exists** — complete map of built features | Every session — add new features |
| `LESSONS_LEARNED.md` | **What we've learned** — anti-patterns and rules | Every session — add new lessons |
| `ROADMAP.md` | **Execution state** — what's done, what's next | Every session — update progress |

## System Architecture
The project utilizes Next.js 16+ (App Router), React 18+, and TypeScript. Styling is managed with Tailwind CSS, shadcn/ui, and next-themes, while TanStack Query handles server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The UI features dynamic branding, configurable navigation, customizable sections (hero, logo marquee, animated counters, testimonial carousels), dark/light mode, and a comprehensive admin dashboard. The admin dashboard offers a full-width layout, task-based setup navigation, and a dedicated branding page for color palette management, background overrides, font selection, and logo variants. Dark mode uses a six-layer depth system with three admin-configurable options. All marketing and public pages are fully responsive. Landing page components are modular and toggleable. The design system is configurable from the admin palette page (`/admin/setup/palette`), covering typography, component styling, layout, interactive states, dark mode control, data visualization, tables, and forms.

**Technical Implementations:**
Core platform features include authentication, an Admin Dashboard (analytics, user/role management, audit logging, onboarding, user impersonation), Stripe Billing, Resend Email System, Team/Organization System, Pluggable AI Integration, Webhook Integration, Markdown-based Blog/Changelog, Marketing Tools, Security (Supabase RLS, Zod, rate limiting), Monitoring (Sentry, Plausible), Queue Infrastructure (BullMQ with Upstash Redis), Rate Limiting (Upstash Redis sliding window), In-App Notifications, Metrics & Reporting, Database Backup Configuration, and API Token Rotation. The system supports multiple SaaS products via a product registry. It also incorporates a content and affiliate flywheel with cross-platform blog publishing, SEO, AI repurposing, content calendar integration, tracked referral links, commission tracking, fraud detection, performance tiers, marketing assets, and payout management. A CRM & Invoicing foundation provides universal user profiles, local invoice/payment records, affiliate payout tracking, a support ticket system, CRM activity log, marketing campaign tracking, and contract/agreement management. Product extension design rules emphasize adding new files and tables for product-specific features, using plugin patterns for queue jobs, and minimizing core file modifications.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.