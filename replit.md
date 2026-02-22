# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template built with Next.js, React, and TypeScript. Its core purpose is to accelerate the launch of new SaaS products by providing a comprehensive, high-quality starting point, significantly reducing development time. It is optimized for deployment on Vercel and designed for each new SaaS product to have its own independent deployment, repo, database, and Stripe account, allowing for clean P&L, independent scaling, and zero cross-pollination risk. The platform features robust authentication, Stripe-powered billing with feature gating, team collaboration with role-based permissions, an administrative dashboard, pluggable AI, webhook support, monitoring, analytics, E2E testing, and SEO optimization.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.
- **CRITICAL - Deployment**: This is a Next.js + Vercel project. The user NEVER uses the Replit preview/webview. All testing and viewing happens on the live Vercel deployment (triggered by git push to GitHub). Replit is used only as a code editor. Never suggest using the Replit preview panel.

### Session Start Protocol
- **ALWAYS read `docs/ROADMAP.md` at the start of every session.** This file is the persistent project memory containing the multi-week development plan, decision log, open questions, and session history. If agent memory resets, this file restores full context.
- After reading the roadmap, check which phase/task is next and resume work from there.
- Update the Session Log in ROADMAP.md at the end of every session with what was accomplished.

## System Architecture
The project is built with Next.js 16+ (App Router), React 18+, and TypeScript. Styling is handled with Tailwind CSS, shadcn/ui, and next-themes, while TanStack Query manages server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The UI emphasizes dynamic branding, configurable navigation, customizable sections (hero, logo marquee, animated counters, testimonial carousels), dark/light mode, and a comprehensive admin dashboard. The admin dashboard features a full-width layout, task-based setup navigation, and a dedicated branding page for color palette management, background overrides, font selection, and logo variants. Dark mode employs a distinct six-layer depth system. All marketing and public pages are fully responsive. Header and footer styling are highly configurable through the admin UI, supporting various layouts, background options, and automatic contrast adjustments. Landing page components are modular and toggleable, including a Founder Letter, Comparison Bars, Product Showcase, Bottom Hero CTA, Photo Collage Hero, and Image Collage Section. Color models for cards use a 950-scale for consistency across light and dark modes.

**Technical Implementations:**
- **Authentication**: Supports email/password, multiple OAuth providers, SSO/SAML, protected routes, and profile management. Includes a pre-flight system for OAuth validation.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, audit logging, onboarding wizard, and enhanced setup UX. Includes user impersonation capabilities.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, and feature gating.
- **Email System**: Resend integration for transactional emails with editable templates.
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
- **Affiliate System**: Complete affiliate marketing infrastructure with tracked referral links, commission tracking on Stripe events, fraud detection, performance tiers, marketing assets, and payout management. Includes open affiliate program with public signup (`/affiliate`), application form (`/affiliate/join`), separate login (`/affiliate/login`), and standalone dashboard (`/affiliate/dashboard`). Affiliates are 100% separate from product users — different login, dashboard, and purpose. Admin manages applications, networks (ShareASale, Impact, PartnerStack), and all affiliate settings from `/admin/setup/affiliate`.
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