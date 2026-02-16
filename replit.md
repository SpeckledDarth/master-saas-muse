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

## Header & Footer Styling (February 2026)
- **Header Styling**: Configurable via `NavigationSettings.headerStyle` (`HeaderStyle` interface in `src/types/settings.ts`). Controls: background color, text color, background opacity, sticky/relative positioning, transparent mode, and bottom border toggle. Applied in `src/components/layout/header.tsx`. Custom colors use `color-mix` for opacity blending and adapt on scroll.
- **Footer Styling**: Configurable via `NavigationSettings.footerStyle` (`FooterStyle` interface in `src/types/settings.ts`). Controls: background color, text color, and layout mode (default 4-column grid, minimal single-row, or centered stacked). Applied in `src/components/layout/footer.tsx`.
- **Admin UI**: Both are managed on the Branding setup page (`src/app/admin/setup/branding/page.tsx`) with color pickers, opacity sliders, toggles, and layout selectors.