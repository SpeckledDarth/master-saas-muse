# Master SaaS Muse Template

## CRITICAL: Stack Reminder
**This project uses Vercel + Next.js 16+ (App Router). NOT Vite.**
- Deployment: Vercel only
- Framework: Next.js 16+ with App Router
- Do NOT use Vite patterns, imports, or configurations

## Overview
This project is a full-stack SaaS starter template built with Next.js 16+ (App Router), React 18+, and TypeScript. It provides a robust foundation for new SaaS products, featuring SEO-optimized pages, Supabase authentication, multi-tenancy support, and Stripe billing. The template enables rapid cloning and customization, aiming for a pure Next.js architecture deployed to Vercel for optimal performance and development efficiency. Key capabilities include a comprehensive admin dashboard, multi-user organization system, a markdown-based blog/changelog, and a waitlist mode. The vision is to offer a scalable and production-ready solution for various SaaS ventures.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project uses Next.js 14+ (App Router) with React 18+ and TypeScript. Styling is managed with Tailwind CSS, shadcn/ui, and next-themes, while TanStack Query handles server state. Supabase provides PostgreSQL, authentication, Row Level Security (RLS), and storage, supporting multi-tenancy via domain-based middleware and `app_id` context. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
- Dark/light mode toggle.
- Admin dashboard for metrics, user management, and settings.
- Setup Dashboard with Branding, Pricing, Social, and Features tabs.
- Dynamic branding components and configurable navigation.
- Customizable hero sections with various styles (full-width background, split layout, video background, pattern/texture, floating mockup).
- Enhanced visual components like Logo Marquee, Animated Counters, Gradient Text, Process Steps, and Testimonial Carousels.

**Technical Implementations & Feature Specifications:**
- **Authentication**: Email/password, Google OAuth, protected routes, session persistence, profile management, multi-tenancy middleware.
- **Admin Features**: Dashboard with user analytics, user management with role editing, feature toggles, role-based access control, audit logging, auto-registration.
- **Stripe Integration**: Checkout for subscriptions, webhook handling, customer portal API, products/prices API, pricing page UI, feature gating.
- **Subscription Management**: Profile and billing pages, pricing page for plan upgrades, `feature-gate.ts` for tier limits.
- **Email System**: Resend integration for transactional emails (welcome, subscription confirmations, team invitations), with an admin-editable template editor.
- **Security & RLS**: Supabase RLS on key tables, Zod validation for API inputs, rate limiting, and security headers.
- **Setup Dashboard**: Admin interface for branding (app name, tagline, logo, colors), pricing, social links, and feature toggles, stored in `organization_settings`.
- **Monitoring**: Plausible analytics for page view tracking, structured logging, and planned Sentry error tracking.
- **Team/Organization System**: Multi-user accounts with owner/admin/member roles, invitations, and role management.
- **Onboarding Wizard**: Guided 4-step setup for new administrators.
- **Blog/Changelog System**: Markdown-based content with public pages and admin CRUD interface.
- **Waitlist Mode**: Pre-launch email collection with CSV export.
- **Feedback Widget**: In-app feedback submission for logged-in and anonymous users.
- **Sitemap & SEO**: Auto-generated sitemap and `robots.txt`, comprehensive metadata.
- **Theme Flash Prevention**: Inline script for immediate dark/light mode application and loading skeletons.

**System Design Choices:**
- Unified frontend and backend using Next.js.
- Modular component-based development.
- RLS and application-level logic for access control.
- Clear separation of concerns for Stripe and Supabase services.
- `NEXT_PUBLIC_` prefix for environment variables.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: (Planned) Error tracking.