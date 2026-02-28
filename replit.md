# PassivePost — Built on MuseKit

## Overview
This project comprises two distinct but related components: MuseKit and PassivePost.

**MuseKit** is a reusable SaaS template developed as internal infrastructure for the user, providing a comprehensive foundation with features like authentication, billing, admin dashboards, teams, email, AI integration, affiliate programs, CRM, a design system, webhooks, and monitoring. Its purpose is to accelerate the development of new SaaS products by providing pre-built plumbing.

**PassivePost** is the first commercial product built on MuseKit. It is a closed-loop business intelligence platform designed for content creators, launching on April 1, 2026. PassivePost aims to offer a rich set of 217 features, including three dashboards (Admin, Affiliate, User), creating a self-reinforcing flywheel around content scheduling, affiliate tracking, analytics, and AI coaching. Its extensive feature set is intended to serve as a competitive advantage. PassivePost also serves as a "dogfooding" product, stress-testing and refining MuseKit's capabilities and extension model.

Future products built on MuseKit will operate independently with separate repositories, databases, Stripe accounts, and Vercel deployments. The core distinction is that MuseKit serves the founder/developer, while PassivePost serves content creators.

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

**Pre-Push Sync Checklist (MANDATORY before telling user to push to GitHub):**

1. **Schema alignment** — Query Replit Postgres to confirm every table/column the code expects exists. List migration SQL for Supabase if needed.
2. **Code compiles clean** — Run `npm run dev` and confirm zero build errors in logs.
3. **API smoke test** — curl every changed API route against the local dev server. Confirm no 500s.
4. **Migration inventory** — List ALL migration files that need to be run on Supabase, in order.
5. **Environment variables** — If any new env vars are needed, list them for both Vercel AND Supabase dashboards.
6. **Git status check** — Remind user to push to GitHub.

### Pre-Delivery Testing Checklist (MANDATORY before handing work to user)
Every time code changes are made, the agent MUST complete ALL of these steps before telling the user the work is ready.

1. Check the Replit database schema for expected tables/columns.
2. Start the dev server and confirm no build/compile errors.
3. Test API endpoints using curl/fetch. Confirm 200 responses and correct data.
4. Review dev server console for errors/warnings.
5. Trace the full path: frontend -> API -> DB -> response.
6. List any required Supabase migration SQL.
7. Fix all errors before handoff. The user should never be the first person to discover a bug.

### Session Start Protocol (MANDATORY — DO NOT SKIP)

Every session MUST follow these steps IN ORDER before writing any code:

1. **Load `business-philosophy` skill** — Understand the core principles: affiliates are partners, coaching-first UX, dual-attribution, grandfathering is sacred, labor hierarchy, flywheel conversion play. These are non-negotiable.
2. **Read `docs/PRODUCT_IDENTITY.md`** — Understand what PassivePost actually is. The 217-feature vision is intentional. Never suggest cutting features or simplifying the affiliate program.
3. **Read `docs/DESIGN_SYSTEM_RULES.md`** — MANDATORY before any component or UI work. Contains CSS variable mapping, DS wrapper components (`DSCard`, `DSGrid`, `DSSection`), and Never/Always rules.
4. **Read `docs/FEATURE_INVENTORY.md`** — Know what's already built. Search for keywords related to what you're about to build. If something similar exists, EXTEND it.
5. **Read `docs/LESSONS_LEARNED.md`** — Know the anti-patterns and technical gotchas.
6. **Read `docs/ROADMAP.md`** — Know what's in progress and what's next.
7. **Plan with integration requirements** — For every feature, list which existing systems it connects to.
8. **Update Session Log** in ROADMAP.md at end of every session.

### Document System

The `docs/` folder contains exactly 5 active documents. **Never merge them. Never create new ones.** Additional reference docs are archived in `docs/archive/` — read them only if the user asks or if you need deep reference on a specific subsystem.

| Document | Role | Updates |
|----------|------|---------|
| `PRODUCT_IDENTITY.md` | **Product soul** — what we're building and why | Rarely — only when vision evolves |
| `DESIGN_SYSTEM_RULES.md` | **Styling law** — CSS variable mapping, wrapper components, Never/Always rules | When design system variables change |
| `FEATURE_INVENTORY.md` | **What exists** — complete map of built features | Every session — add new features |
| `LESSONS_LEARNED.md` | **What we've learned** — anti-patterns and rules | Every session — add new lessons |
| `ROADMAP.md` | **Execution state** — what's done, what's next | Every session — update progress |

## System Architecture
The project is built on Next.js 16+ (App Router), React 18+, and TypeScript, utilizing Tailwind CSS, shadcn/ui, and next-themes for styling. TanStack Query manages server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:** The UI features dynamic branding, configurable navigation, customizable marketing sections, and comprehensive dark/light mode support with a six-layer depth system. The admin dashboard offers a full-width layout, task-based setup navigation, and a dedicated branding page for managing visual aspects. All marketing and public pages are fully responsive. A configurable design system, managed from the admin palette page, dictates typography, component styling, layout, interactive states, dark mode, data visualization, tables, and forms, using CSS variables for consistency.

**Technical Implementations:** Core platform features include a robust authentication system, a feature-rich Admin Dashboard (analytics, user/role management, audit logging, onboarding, user impersonation), Stripe Billing integration, a Resend Email System, a comprehensive Team/Organization System, Pluggable AI Integration, Webhook Integration, a Markdown-based Blog/Changelog, various Marketing Tools, and strong Security measures (Supabase RLS, Zod, rate limiting). The system incorporates Monitoring (Sentry, Plausible), Queue Infrastructure (BullMQ with Upstash Redis), Rate Limiting (Upstash Redis sliding window), In-App Notifications, Metrics & Reporting, Database Backup Configuration, and API Token Rotation. Multi-product support is achieved via a product registry.

PassivePost specifically integrates a content and affiliate flywheel, enabling cross-platform blog publishing, SEO optimization, AI content repurposing, content calendar integration, tracked referral links, commission tracking, fraud detection, performance tiers, marketing asset management, and payout management. A foundational CRM & Invoicing system provides universal user profiles, local invoice/payment records, affiliate payout tracking, a support ticket system, CRM activity logs, marketing campaign tracking, and contract/agreement management capabilities. Product extension rules mandate adding new files and tables for product-specific features, using plugin patterns for queue jobs, and minimizing modifications to core MuseKit files. The codebase maintains a strict boundary: MuseKit code resides outside `/social/` directories, and PassivePost code resides inside `/social/`.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.