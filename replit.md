# PassivePost — Built on MuseKit

## Overview
This project comprises two distinct but related components: **MuseKit** and **PassivePost**.

**MuseKit** is a reusable SaaS template providing foundational infrastructure like authentication, billing, admin dashboards, teams, email, AI, affiliate programs, CRM, design systems, webhooks, and monitoring. It serves as an internal tool for the user (founder/developer) to rapidly launch new SaaS products.

**PassivePost** is the first product built on MuseKit, launching April 1, 2026. It is a closed-loop business intelligence platform specifically designed for content creators. PassivePost aims to offer a rich suite of 217 features across three dashboards (Admin, Affiliate, User), creating a self-reinforcing flywheel for content scheduling, affiliate tracking, analytics, and AI coaching. Its extensive feature set is a core competitive differentiator.

Future products will also be built on MuseKit, each operating as an independent business with its own repository, database, Stripe account, and Vercel deployment. The clear distinction is: MuseKit serves the user, while PassivePost serves customers.

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
This project runs across THREE environments that MUST stay aligned: Replit (local dev), GitHub (version control), and Vercel + Supabase (production/testing). The agent must ensure alignment by performing a pre-push sync checklist:
1. Schema alignment: Query Replit Postgres to confirm expected tables/columns exist. List migration SQL for Supabase if needed.
2. Code compiles clean: Run `npm run dev` with zero build errors.
3. API smoke test: `curl` changed API routes against local dev server, confirm no 500s.
4. Migration inventory: List all required Supabase migration files in order.
5. Environment variables: List any new env vars for Vercel and Supabase.
6. Git status check: Remind user to push to GitHub.

### Pre-Delivery Testing Checklist (MANDATORY before handing work to user)
Before handing off work, the agent MUST:
1. Check Replit database schema for expected tables/columns.
2. Start dev server (`npm run dev`) and confirm no build errors.
3. Test API endpoints using curl/fetch against local dev server, confirming 200 responses and correct data.
4. Review dev server console for errors/warnings.
5. Trace the full path of changes: frontend -> API -> DB -> response.
6. List any required Supabase migration SQL.
7. Fix all errors before handoff; do not hand over partially-working code.

### Session Start Protocol (MANDATORY — DO NOT SKIP)
Every session MUST follow these steps IN ORDER before writing any code:
1. Read `docs/PRODUCT_IDENTITY.md` to understand PassivePost's vision and integration rules.
2. Read `docs/DESIGN_SYSTEM_RULES.md` before any component/UI work to follow styling guidelines.
3. Read `docs/FEATURE_INVENTORY.md` to check existing features and extend them where possible.
4. Read `docs/LESSONS_LEARNED.md` to avoid repeating past mistakes.
5. Read `docs/ROADMAP.md` to know project status, pending bugs, and next steps.
6. Plan with integration requirements, identifying connections to existing systems for every new feature.
7. Update Session Log in `ROADMAP.md` at the end of every session.

### Integration-First Development Rules (NON-NEGOTIABLE)
- Every new feature MUST connect to at least one existing system (database tables, API routes, UI components).
- Check `docs/FEATURE_INVENTORY.md` before building to extend existing functionality rather than creating parallel logic.
- New features should consume existing data and produce data for other features.
- AI features must use real context data, not generate advice in a vacuum.
- Consider how features affect all dashboards (Admin, Affiliate, User).
- Explicitly list feature connections in session plans.
- All components MUST use CSS variables from the design system for spacing, radius, shadows, and colors (e.g., `p-[var(--card-padding)]`).

## System Architecture
The project is built on Next.js 16+ (App Router), React 18+, and TypeScript, utilizing Tailwind CSS, shadcn/ui, and next-themes for styling. TanStack Query manages server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The user interface features dynamic branding, configurable navigation, customizable marketing sections (hero, logo marquee, animated counters, testimonial carousels), and comprehensive dark/light mode support. The admin dashboard offers a full-width layout, task-based setup navigation, and a dedicated branding page for managing color palettes, background overrides, font selections, and logo variants. Dark mode employs a six-layer depth system with three configurable options. All marketing and public pages are fully responsive. A configurable design system, managed from the admin palette page, dictates typography, component styling, layout, interactive states, dark mode, data visualization, tables, and forms, using CSS variables for consistency.

**Technical Implementations:**
Core platform features include a robust authentication system, a feature-rich Admin Dashboard (analytics, user/role management, audit logging, onboarding, user impersonation), Stripe Billing integration, a Resend Email System, a comprehensive Team/Organization System, Pluggable AI Integration, Webhook Integration, a Markdown-based Blog/Changelog, various Marketing Tools, and strong Security measures (Supabase RLS, Zod, rate limiting). The system incorporates Monitoring (Sentry, Plausible), Queue Infrastructure (BullMQ with Upstash Redis), Rate Limiting (Upstash Redis sliding window), In-App Notifications, Metrics & Reporting, Database Backup Configuration, and API Token Rotation. Multi-product support is achieved via a product registry.

PassivePost specifically integrates a content and affiliate flywheel, enabling cross-platform blog publishing, SEO optimization, AI content repurposing, content calendar integration, tracked referral links, commission tracking, fraud detection, performance tiers, marketing asset management, and payout management. A foundational CRM & Invoicing system provides universal user profiles, local invoice/payment records, affiliate payout tracking, a support ticket system, CRM activity logs, marketing campaign tracking, and contract/agreement management capabilities. Product extension rules mandate adding new files and tables for product-specific features, using plugin patterns for queue jobs, and minimizing modifications to core MuseKit files.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.