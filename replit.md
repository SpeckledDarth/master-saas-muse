# Master SaaS Muse Template

## Overview

This is a full-stack SaaS starter template designed for building production-ready SaaS applications ("muses") with SEO-optimized pages, authentication via Supabase, multi-tenancy support, and Stripe billing. The template enables rapid cloning and customization for new SaaS products.

**IMPORTANT**: We are migrating from Vite + Express to **Next.js 14 + Vercel** for proper SSR/SEO capabilities. See `docs/MASTER_PLAN.md` for the complete development roadmap.

## User Preferences

Preferred communication style: Simple, everyday language.

## Session Context (Updated Dec 31, 2025)

### Development Workflow
- **Local Environment**: Windows with PowerShell
- **Git Experience**: Beginner - step-by-step guidance needed
- **Workflow**: Replit for code development → Git push → Vercel auto-deploys
- **Styling**: User prefers original gradient font styling (deferred until after functional modules)

### Supabase Project
- **URL**: https://ghlrvygpbexawddahixa.supabase.co
- **Redirect URLs**: Configured for both localhost:3000 and Vercel domain

### Required Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ghlrvygpbexawddahixa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from Supabase dashboard → Settings → API → anon public)
SUPABASE_SERVICE_ROLE_KEY=(from Supabase dashboard → Settings → API → service_role - KEEP SECRET)
```

### Vercel Environment Variables
Same three variables above, added via Vercel Project → Settings → Environment Variables

## Strategic Decision (Dec 29, 2025)

**Migration to Next.js + Vercel**
- **Reason**: SEO is critical for organic traffic to each muse
- **Benefits**: Built-in SSR/ISR, automatic CDN, easy domain mapping, one-click deployments
- **Timeline**: Extended to February 2026 to allow proper migration
- **Master Plan**: See `docs/MASTER_PLAN.md` for complete 32-module roadmap

## Target Architecture (Next.js + Vercel)

### Frontend & Backend (Unified)
- **Framework**: Next.js 14+ (App Router), React 18+, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + next-themes
- **State Management**: TanStack Query for server state

### Database & Auth
- **Provider**: Supabase (PostgreSQL + Auth + RLS + Storage)
- **Multi-Tenancy**: Domain-based middleware → app_id context → RLS policies

### Hosting & Deployment
- **Platform**: Vercel
- **Features**: Preview deploys, custom domains, edge functions

## Development Progress

### Module 1: Foundation (Complete)
- Landing page with Hero section
- Dark/light mode toggle
- Header with navigation
- Footer component

### Module 2: Authentication (Complete)
- Email/password signup with confirmation
- Email/password login
- Google OAuth integration
- Protected routes with redirect
- Session persistence
- Profile page with avatar upload
- Supabase Storage configured with RLS policies
- Webhook endpoint stub at `/api/webhooks/user.created`
- Multi-tenancy middleware (hostname logging)

### Module 3: Admin Features (Complete - Tested Dec 31, 2025)
- Admin dashboard with metrics (/admin)
  - Total users, admins, members counts
  - Recent signups tracking
  - Quick access cards to admin sections
- User management with role editing (/admin/users)
  - View all users with roles
  - Change user roles (admin/member)
  - Protection against demoting last admin
  - "Currently logged in as" display showing admin's email
  - Disabled role dropdown for current user (prevents self-demotion)
- Settings page with feature toggles (/admin/settings)
  - Organization name and support email
  - Allow New Signups toggle
  - Maintenance Mode toggle
  - Require Email Verification toggle
  - Enable Google Sign-In toggle
- Role-based access control (admin/member)
- Bootstrap admin functionality for new installations
- Audit logging for admin actions
- Auto-registration: New users automatically get member role on first login
- Database schema: user_roles, organization_settings, audit_logs

### Bug Fixes (Dec 31, 2025)
- Fixed UserNav loading state: Now properly resolves in all code paths
- Fixed sign-out: Session clears correctly and navigation works
- Fixed auth state change handlers: Properly clear user state on SIGNED_OUT

### Module 4: Stripe Integration (Complete - Tested Dec 31, 2025)
- Stripe Checkout for subscription payments (Pro $29/mo, Team $99/mo)
- Webhook endpoint at `/api/stripe/webhook` receiving `checkout.session.completed`
- Customer portal API route for subscription management
- Products/prices API routes
- Pricing page UI with plan selection
- Seed script for products (`scripts/seed-products.ts`)
- Database migration for stripe_customer_id and stripe_subscription_id fields
- Environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

## Current Module: Module 5 - Subscription Management

### Goals
- Display subscription status on user profile
- Feature gating based on subscription tier (Free/Pro/Team)
- Usage tracking and limits
- Subscription upgrade/downgrade flows

### Architecture Notes
- Check subscription status server-side for security
- Cache subscription data to reduce Stripe API calls
- Use middleware for feature gating on protected routes

## Configuration Files
- `.env.template` - Template for all secrets and environment variables
- `config/muse.config.json` - Project-specific settings (name, branding, features)
- `docs/MUSE_CHECKLIST.md` - Quick-start checklist for cloning template

## Key NPM Packages
- `@supabase/supabase-js` - Supabase client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `next-themes` - Theme management
- `framer-motion` - Animations
- Full shadcn/ui component set via Radix UI primitives

## User's GitHub
https://github.com/SpeckledDarth/master-saas-muse

## Vercel Domain
master-saas-muse-u7ga.vercel.app
