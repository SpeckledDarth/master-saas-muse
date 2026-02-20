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
The UI emphasizes dynamic branding, configurable navigation, customizable sections (hero, logo marquee, animated counters, testimonial carousels), dark/light mode, and a comprehensive admin dashboard. The admin dashboard features a full-width layout, task-based setup navigation, and a dedicated branding page for color palette management, background overrides, font selection, and logo variants. Dark mode employs a distinct six-layer depth system. All marketing and public pages are fully responsive.

**Technical Implementations:**
- **Authentication**: Supports email/password, multiple OAuth providers, SSO/SAML, protected routes, and profile management.
- **Admin Features**: Includes a dashboard with analytics, user management, role-based access control, organization settings, audit logging, and an onboarding wizard. Enhanced setup UX with sub-pages for configuration, customer service tools, and legal/compliance.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, and feature gating.
- **Email System**: Resend integration for transactional emails with editable templates.
- **Team/Organization System**: Multi-user organizations with role hierarchies and invitations.
- **AI Integration**: Pluggable system for xAI, OpenAI, and Anthropic, configurable via an API endpoint.
- **Webhook Integration**: Event-driven system with HMAC-SHA256 signing, retry logic, and admin UI.
- **Content Management**: Markdown-based blog/changelog with public display and admin CRUD.
- **Marketing Tools**: Waitlist mode, in-app feedback widget, and customizable marketing pages.
- **Security**: Supabase RLS, Zod validation, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking and Plausible for analytics.
- **Queue Infrastructure**: BullMQ with Upstash Redis for core job types (email, webhook-retry, report, metrics-report, metrics-alert, token-rotation), managed via an admin dashboard. Product-specific jobs use a plugin pattern for extensibility (e.g., social job types and processors).
- **Rate Limiting**: Upstash Redis sliding window with in-memory fallback.
- **In-App Notifications**: Bell icon with unread badges and popover list.
- **User Impersonation**: Admin capability with cookie-based sessions, warning banners, and audit logging.
- **Metrics & Reporting**: Admin dashboard for KPIs, scheduled reports, and alerts.
- **Database Backup Configuration**: Admin UI for setting backup notification preferences.
- **API Token Rotation**: Automated webhook secret rotation via BullMQ.
- **Product Registry**: Supports multiple SaaS products via `muse_products` and `muse_product_subscriptions` tables. Each product registers with its own Stripe product ID, metadata, and tier definitions, enabling product-scoped checkout, webhook routing, and feature gating.

- **Blog Publishing**: Cross-platform blog posting system with SEO preview, Markdown editor, repurpose engine (AI blog-to-social snippets), and calendar integration. Supports Medium, WordPress, Ghost, LinkedIn Articles, and Substack (beta). Database tables in `migrations/extensions/003_blog_publishing_tables.sql`. API routes at `src/app/api/social/blog/`. UI pages at `src/app/dashboard/social/blog/`. Full docs in `docs/passivepost/BLOG_PUBLISHING.md`.
- **Flywheel System (ALL 38 FEATURES COMPLETE)**: Full content flywheel across 7 phases. **READ `docs/passivepost/FLYWHEEL_MASTER_PLAN.md` AT SESSION START** for full API route map and feature details. Phases: (1) Flywheel Foundation, (2) Content Intelligence, (3) Advanced Automation, (4) Distribution Intelligence, (5) Revenue & ROI, (6) Engagement & Retention, (7) Collaboration. Dashboard pages: automation, intelligence, distribution, revenue, retention, collaboration. Public pages: `/approve/[token]` for client approvals.
- **Bonus Features (Beyond Flywheel)**: AI Hashtag Suggestions (button in post composer, `/api/social/automation/hashtag-suggest`), Gig Lead Notifications (keyword scanner with alerts at `/api/social/leads/gig-scanner`, reply templates at `/api/social/leads/reply-templates`), AI Voice Fine-Tuner (sample analysis at `/api/social/brand-voice/fine-tune`, UI on Brand Voice page), Lead CRM Mini (tags/notes/CSV export at `/api/social/leads/manage` and `/api/social/leads/export`, component at `src/components/social/lead-crm.tsx`, integrated as tab on Leads page).
- **Testimonial Management (Phase 1)**: Admin CRUD for testimonials with status (pending/approved/rejected), featured flag, star ratings, and display ordering. Migration at `migrations/core/003_testimonials.sql`. Admin page at `src/app/admin/setup/testimonials/page.tsx`. Public API at `src/app/api/public/testimonials/route.ts`.
- **Wall of Love Page**: Public page at `/testimonials` displaying approved/featured testimonials with aggregate stats (users, posts, connected accounts). Stats API at `src/app/api/public/stats/route.ts`.
- **Social Proof Popups**: Toast-style activity notifications on the landing page. Component at `src/components/landing/social-proof-popup.tsx`. Togglable via `socialProofEnabled` in ContentSettings.

**Design Rules for Product Extensions (Merge-Friendly Architecture):**
- Product-specific files should be added, not modify core files.
- Product database tables reside in `migrations/extensions/`.
- Product pages and types should be clearly scoped (e.g., `/dashboard/social/`, `src/lib/<product>/`).
- Product queue jobs use a plugin pattern, defined in `src/lib/<product>/` and registered without hardcoding into core files.
- Minimal, isolated, and well-commented changes are allowed in core files when unavoidable.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.

## Landing Page Components (February 2026)
Reusable marketing page building blocks in `src/components/landing/`, all toggleable via `ContentSettings` in `src/types/settings.ts`:

- **Founder Letter** (`founder-letter.tsx`): Long-form narrative section with portrait/avatar, optional signature image, and background banner photo. Configurable via `founderLetterEnabled` + `founderLetter` settings.
- **Comparison Bars** (`comparison-bars.tsx`): Animated horizontal bars with IntersectionObserver entrance animation. Highlighted items use `bg-primary`. Configurable via `comparisonBarsEnabled` + `comparisonBars` settings.
- **Product Screenshot Showcase** (`product-showcase.tsx`): App screenshot with shadow/border, layered over optional background image or gradient. Configurable via `productShowcaseEnabled` + `productShowcase` settings.
- **Bottom Hero CTA** (`bottom-hero-cta.tsx`): Closing hero section mirroring top hero visual weight. Supports background image with gradient wash or gradient-only. Configurable via `bottomHeroCtaEnabled` + `bottomHeroCta` settings.
- **Photo Collage Hero**: New `heroStyle: 'collage'` option in page.tsx. Left-aligned text with 3-5 overlapping images on the right (desktop), 2x2 grid (mobile). Uses `heroCollageImages` array in content settings.
- **Feature Sub-Page System**: Dynamic route at `/features/[slug]` renders feature detail pages from `featureSubPages` array in content settings. Each page has hero (with optional background image + screenshot), alternating image/text blocks via `ImageTextSection`, and a closing `BottomHeroCta`. Designed for Wone-style feature navigation (e.g., /features/sourcing, /features/evaluation).

All components use palette-derived semantic colors (primary, muted-foreground, background/accent gradients) and support both light and dark modes automatically.
- **Image Collage Section** (`image-collage-section.tsx`): Fan-style overlapping portrait images (up to 5) with CSS rotation, hover-to-straighten animation, and scale effects. Configurable via `imageCollageEnabled`, `imageCollageImages`, `imageCollageHeadline`, `imageCollageSubheadline` in ContentSettings.

## 950-Scale Card Color Model (February 2026)
Standard color formulas for all card-like components across palette previews and landing pages:
- **Card background**: `bg-white/10` (10% opacity white, barely visible) in both light and dark modes, with `border-gray-500/50`
- **Card text**: H1/titles use `text-black dark:text-white`, body text uses `opacity-70`
- **Icon color**: `text-primary-800 dark:text-primary-200` (deep/rich shade for contrast against light/dark icon backgrounds)
- **Icon backgrounds**: Randomized from `bg-primary-100/200/300` (light) and `bg-primary-700/800/900` (dark) — each icon in a group gets a different shade from the set, cycling via index % 3
- **Avatar fallbacks**: Same pattern as icon backgrounds — randomized bg shade with contrasting text color (800 light, 200 dark)

## Header & Footer Styling (February 2026)
- **Header Styling**: Configurable via `NavigationSettings.headerStyle` (`HeaderStyle` interface in `src/types/settings.ts`). Controls: background color, text color, background opacity, sticky/relative positioning, transparent mode, and bottom border toggle. Applied in `src/components/layout/header.tsx`. Custom colors use `color-mix` for opacity blending and adapt on scroll.
- **Footer Styling**: Configurable via `NavigationSettings.footerStyle` (`FooterStyle` interface in `src/types/settings.ts`). Controls: background color, text color, background image (with auto dark gradient overlay), and layout mode (default 4-column grid, minimal single-row, or centered stacked). Applied in `src/components/layout/footer.tsx`.
- **Branding Color Defaults**: Header and footer default to `branding.primaryColor` when no explicit color override is set, with auto-computed contrast text color. Override colors take precedence.
- **Admin UI**: Both are managed on the Branding setup page (`src/app/admin/setup/branding/page.tsx`) with color pickers, opacity sliders, toggles, layout selectors, and footer background image upload.
- **Per-Section Background Colors**: Each homepage section can have a custom background color via `ContentSettings.sectionColors` object. Configured in the admin Content page.
- **Section Ordering**: Homepage section render order is configurable via `ContentSettings.sectionOrder` array. Admin Content page provides arrow buttons to reorder sections. New sections are automatically appended if not in stored order.
- **Image Collage Section** (`image-collage-section.tsx`): Fan-style overlapping portrait images (up to 5) with CSS rotation, hover-to-straighten animation, and scale effects. Configurable via `imageCollageEnabled`, `imageCollageImages`, `imageCollageHeadline`, `imageCollageSubheadline` in ContentSettings.