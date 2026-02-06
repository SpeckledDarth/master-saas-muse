# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template built with Next.js 16+ (App Router), React 18+, and TypeScript. It provides a comprehensive foundation for launching new SaaS products rapidly, featuring robust authentication with multiple OAuth providers, Stripe-powered billing with feature gating, team collaboration with role-based permissions, and an administrative dashboard.

Key capabilities include comprehensive SaaS features, pluggable AI integration (xAI Grok, OpenAI, Anthropic), webhook support for automation, integrated monitoring and analytics (Sentry, Plausible), extensive E2E testing, and SEO optimization. Designed for rapid deployment on Vercel, the project aims to significantly reduce development time for new SaaS ventures by providing a complete, high-quality starting point.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project uses Next.js 16+ (App Router), React 18+, and TypeScript. Tailwind CSS, shadcn/ui, and next-themes manage styling, while TanStack Query handles server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The UI features dynamic branding, configurable navigation, customizable hero sections, and enhanced visual components like Logo Marquee, Animated Counters, and Testimonial Carousels. It includes dark/light mode and an admin dashboard for metrics, user management, and settings, complemented by a Setup Dashboard for detailed configuration.

**Technical Implementations:**
- **Authentication**: Supports email/password and multiple OAuth providers (Google, GitHub, Apple, Twitter/X, Magic Link) with admin toggles, protected routes, and profile management.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, and audit logging, including an onboarding wizard.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, webhooks, and feature gating.
- **Email System**: Resend integration for transactional emails with admin-editable templates.
- **Team/Organization System**: Multi-user organizations with role hierarchies (Owner, Manager, Member, Viewer), email invitations, and permission-based access.
- **AI Integration**: Pluggable system for xAI (Grok), OpenAI, and Anthropic, with admin-configurable models and prompts via a `/api/ai/chat` endpoint.
- **Webhook Integration**: Event-driven system with HMAC-SHA256 signing, retry logic, and 8 predefined event types for automation platforms. Admin UI for configuration.
- **Content Management**: Markdown-based blog/changelog with public display and admin CRUD.
- **Marketing Tools**: Waitlist mode, in-app feedback widget, and customizable marketing pages.
- **Security**: Supabase RLS, Zod validation, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking and Plausible for analytics.
- **SSO/SAML Enterprise Authentication**: Full CRUD for Supabase SAML SSO providers, admin dashboard for management, and domain-based SSO detection on the login page.
- **Queue Infrastructure**: BullMQ with Upstash Redis for job queues (email, webhook-retry, report), managed via an admin queue dashboard.
- **Rate Limiting**: Upstash Redis sliding window, with an in-memory fallback.
- **Admin Setup UX Overhaul**: Consolidated setup into focused sub-pages for branding, content, pages, pricing, social, and features, improving maintainability.
- **Customer Service Tools**: Enhanced user management with detailed user info (profile, Stripe subscription, invoices), admin notes, and quick actions like "Manage in Stripe" and "Send Email."
- **Legal & Compliance System**: Configuration for compliance (Acceptable Use, Cookie Policy, etc.), support (chatbot widget), and security (MFA, password requirements) settings. Includes 7 new public legal page routes with dynamic variable replacement and a cookie consent banner.
- **Floating Support Chatbot Widget**: Configurable chatbot with AI-powered responses and rate limiting.
- **Admin Metrics Dashboard**: API endpoint and dashboard for aggregating user counts, subscriptions, MRR, feedback, and waitlist stats with KPI cards and line charts.
- **In-App Notifications**: Bell icon with unread badge, popover notification list, type-specific icons, auto-polling, mark all read, server-side notification creation utility.
- **User Impersonation**: Admin can impersonate users for debugging. Cookie-based session with 30-min expiry, yellow warning banner, audit logging, and "Stop Impersonation" button.
- **Audit Log Viewer**: Admin page with paginated, filterable audit log table showing user actions, timestamps, and details.

**System Design Choices:**
The architecture uses a unified frontend and backend with Next.js API routes, modular component-based development, RLS and application-level logic for access control, and clear separation of concerns for third-party services. It employs a fire-and-forget webhook delivery pattern and pluggable abstraction layers for AI providers.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.