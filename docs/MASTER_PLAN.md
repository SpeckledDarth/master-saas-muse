# Master SaaS Muse Template - Development Master Plan

**Version**: 2.1  
**Date**: February 4, 2026  
**Status**: Active Development  

---

## Executive Summary

This document is the single source of truth for the Master SaaS Muse Template development. We are migrating from Vite + Express (Replit) to **Next.js 14 + Vercel** to achieve proper SSR/SEO capabilities essential for organic traffic growth.

### Why the Migration?
- **SEO**: Next.js provides built-in SSR/ISR for search engine optimization
- **Passive Operation**: Vercel handles scaling, CDN, and infrastructure automatically
- **Clone Workflow**: Vercel templates + GitHub enable one-click duplication
- **Multi-Tenancy**: Next.js middleware.ts perfectly suits domain → app_id resolution
- **Long-term Maintenance**: Centralized updates, richer ecosystem

### Target Timeline
- **MVP Launch**: February 2026 (revised from January 24, 2026)
- **First Muse**: ExtrusionCalculator.com

---

## Technology Stack (Revised)

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | Next.js 14+ (App Router), React 18+, TypeScript |
| Styling            | Tailwind CSS + shadcn/ui + next-themes          |
| Backend / DB / Auth| Supabase (PostgreSQL + Auth + RLS + Storage)    |
| Hosting            | Vercel                                          |
| State Management   | TanStack Query (server state)                   |
| Payments (Fiat)    | Stripe                                          |
| Analytics          | Plausible                                       |
| Error Tracking     | Sentry                                          |
| Validation         | Zod                                             |

---

## Module Overview

| Module | Name                     | Status      | Priority |
|--------|--------------------------|-------------|----------|
| 1      | Foundation (Next.js)     | COMPLETE    | MVP      |
| 2      | Authentication           | COMPLETE    | MVP      |
| 3      | Admin Features           | COMPLETE    | MVP      |
| 4      | Plan System & Gating     | COMPLETE    | MVP      |
| 5      | Stripe Billing           | COMPLETE    | MVP      |
| 6      | Core Pages & Navigation  | COMPLETE    | MVP      |
| 7      | Security & RLS           | COMPLETE    | MVP      |
| 8      | Monitoring & Docs        | COMPLETE    | MVP      |
| 9      | **Team Collaboration**   | **COMPLETE**| **MVP**  |
| 10     | Analytics & Tracking     | NOT STARTED | v1.1     |
| 11     | Affiliate System         | NOT STARTED | v1.1     |
| 12     | n8n Automation           | NOT STARTED | v1.1     |
| 13     | Notifications            | NOT STARTED | v1.1     |
| 14     | Referral Program         | NOT STARTED | v1.1     |
| 15     | Feedback System          | NOT STARTED | v1.1     |
| 16     | AI Integration           | NOT STARTED | v1.1     |
| 17     | PWA Support              | NOT STARTED | v1.1     |
| 18     | Internationalization     | NOT STARTED | v1.1     |
| 19     | A/B Testing              | NOT STARTED | v1.1     |
| 20     | User Impersonation       | NOT STARTED | v1.1     |
| 21     | Social Media Management  | NOT STARTED | v1.1     |
| 22     | Launch Plan Tools        | NOT STARTED | v1.1     |
| 23     | Operations & Support     | NOT STARTED | v1.1     |
| 24     | Multi-Role Dashboards    | NOT STARTED | v1.1     |
| 25     | Branding Manager         | NOT STARTED | v1.1     |
| 26     | Email/SMS Campaigns      | NOT STARTED | v1.2     |
| 27     | Lead & CRM               | NOT STARTED | v1.2     |
| 28     | Product Catalog          | NOT STARTED | v1.2     |
| 29     | Usage-Based Billing      | NOT STARTED | v1.2     |
| 30     | White-Label              | NOT STARTED | v1.3     |
| 31     | Onboarding Checklist     | NOT STARTED | v1.3     |
| 32     | Data Export              | NOT STARTED | v1.3     |
| 33     | Health Monitor           | NOT STARTED | v1.3     |

---

## Detailed Module Specifications

### Module 1: Foundation (Next.js Migration)
**Estimated Time**: 3-4 days  
**Dependencies**: None  

**Deliverables**:
- [x] Next.js 14 project with App Router and TypeScript
- [x] Tailwind CSS configuration with dark mode
- [x] shadcn/ui component library setup
- [x] next-themes for theme switching
- [x] Vercel deployment configured
- [x] Environment variables structure
- [x] Project folder structure matching vision doc

**Key Files**:
```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/       # Header, Footer, ThemeToggle
│   │   └── landing/      # Hero, Features
│   └── lib/
│       └── utils.ts
├── middleware.ts
└── next.config.js
```

---

### Module 2: Authentication
**Estimated Time**: 3-4 days  
**Dependencies**: Module 1  

**Deliverables**:
- [x] Supabase client configuration (server + client)
- [x] Email/password signup with confirmation
- [x] Email/password login
- [x] Google OAuth integration
- [x] Password reset flow
- [x] Protected route middleware
- [x] Session persistence
- [x] Profile page with avatar upload
- [x] Logout functionality

**Key Files**:
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   └── (dashboard)/
│       └── profile/page.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
└── components/
    └── auth/
        ├── LoginForm.tsx
        ├── SignupForm.tsx
        └── AuthProvider.tsx
```

---

### Module 3: Admin Features
**Estimated Time**: 3-4 days  
**Dependencies**: Module 2  

**Deliverables**:
- [ ] Admin dashboard with metrics
- [ ] User management (view, roles, search)
- [ ] Role-based access control (admin/member)
- [ ] Organization settings management
- [ ] Audit logging for admin actions
- [ ] Bootstrap admin for new installations
- [ ] Last admin protection

**Database Tables**:
- `user_roles` (user_id, role, app_id, created_at)
- `organization_settings` (id, app_id, settings JSON)
- `audit_logs` (id, user_id, action, details, created_at)

---

### Module 4: Plan System & Freemium Gating
**Estimated Time**: 3-4 days  
**Dependencies**: Module 3  

**Deliverables**:
- [ ] Plans table (Free/Pro/Team definitions)
- [ ] User subscriptions table
- [ ] Plan gating React hooks
- [ ] Server-side plan verification middleware
- [ ] Pricing page UI
- [ ] Upgrade CTAs throughout app
- [ ] Feature visibility based on plan
- [ ] Usage limits per plan

**Database Tables**:
- `plans` (id, name, price, features JSON, limits JSON)
- `user_subscriptions` (user_id, plan_id, status, stripe_subscription_id)

---

### Module 5: Stripe Billing
**Estimated Time**: 4-5 days  
**Dependencies**: Module 4  

**Deliverables**:
- [ ] Stripe SDK integration
- [ ] Checkout session creation
- [ ] Customer portal integration
- [ ] Webhook handler with signature verification
- [ ] Subscription lifecycle management
- [ ] Transaction logging
- [ ] Payment failure handling
- [ ] Invoice/receipt access

**Database Tables**:
- `transactions` (id, user_id, amount, type, stripe_id, status, created_at)
- `stripe_customers` (user_id, stripe_customer_id)

---

### Module 6: Core Pages & Navigation
**Estimated Time**: 2-3 days  
**Dependencies**: Modules 4-5  

**Deliverables**:
- [ ] Landing page with waitlist
- [ ] Dashboard with plan-specific widgets
- [ ] Settings page (account, billing, preferences)
- [ ] Help/FAQ page
- [ ] Global navigation (role-aware)
- [ ] Responsive sidebar/header

---

### Module 7: Security & RLS
**Estimated Time**: 2-3 days  
**Dependencies**: Module 6  

**Deliverables**:
- [ ] Supabase Row Level Security policies
- [ ] Domain → app_id middleware resolution
- [ ] Webhook signature verification
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Secret rotation guidelines

---

### Module 8: Monitoring & Documentation
**Estimated Time**: 2-3 days  
**Dependencies**: Module 7  

**Deliverables**:
- [x] Sentry error tracking (DEFERRED - awaiting Next.js 16 support)
- [x] Plausible analytics integration
- [x] Structured logging
- [ ] E2E smoke tests (deferred to v1.1)
- [ ] GitHub template repository setup (deferred to v1.1)
- [x] Updated MUSE_CHECKLIST for cloning
- [x] Deployment documentation

---

### Module 9: Team Collaboration
**Estimated Time**: 3-4 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Organizations table with multi-tenant support
- [x] Organization members with role-based access
- [x] Role hierarchy: Owner > Manager > Member > Viewer
- [x] Email-based invitation system with token validation
- [x] Invitation acceptance flow (signup/login → accept)
- [x] Team management UI in admin dashboard
- [x] Cancel/resend invitation functionality
- [x] Confirmation dialogs for destructive actions
- [x] Auto-add app admin as organization owner
- [x] RLS policies for team tables (via admin client)

**Database Tables**:
- `organizations` (id, name, created_at)
- `organization_members` (id, organization_id, user_id, role, joined_at)
- `invitations` (id, organization_id, email, role, token, invited_by, expires_at, accepted_at, created_at)

**Role Permissions** (from `src/lib/team-permissions.ts`):
| Role    | Manage Team | Manage Users | Edit Settings | Invite Members | Billing | View Analytics | View Team List |
|---------|-------------|--------------|---------------|----------------|---------|----------------|----------------|
| Owner   | Yes         | Yes          | Yes           | Yes            | Yes     | Yes            | Yes            |
| Manager | No          | Yes          | No            | Yes            | No      | Yes            | Yes            |
| Member  | No          | No           | No            | No             | No      | Yes            | Yes            |
| Viewer  | No          | No           | No            | No             | No      | No             | No             |

**Key Files**:
```
src/
├── app/
│   ├── admin/team/page.tsx          # Team management UI
│   ├── invite/[token]/page.tsx      # Invitation acceptance page
│   └── api/
│       ├── admin/team/route.ts      # Team CRUD operations
│       ├── admin/invitations/route.ts
│       ├── invite/[token]/route.ts  # Validate invitation
│       ├── invite/[token]/accept/route.ts
│       └── user/membership/route.ts # Check user's org membership
├── lib/
│   └── team-permissions.ts          # Permission checking utilities
└── components/
    └── admin/TeamManagement.tsx
```

---

## MVP Feature Checklist (from 33-Feature List)

| # | Feature                          | Module | Status      |
|---|----------------------------------|--------|-------------|
| 1 | User Auth & Onboarding           | 2      | COMPLETE    |
| 2 | Plan System & Freemium Gating    | 4      | COMPLETE    |
| 3 | Billing & Payments (Stripe)      | 5      | COMPLETE    |
| 4 | Global Navigation & UI Kit       | 1, 6   | COMPLETE    |
| 5 | Core User Pages                  | 6      | COMPLETE    |
| 6 | Admin Backend Dashboard          | 3      | COMPLETE    |
| 7 | Security & Privacy Rules         | 7      | COMPLETE    |
| 8 | Error Logging & Monitoring       | 8      | COMPLETE    |
| 9 | **Team Collaboration & Roles**   | 9      | **COMPLETE**|
| 16| Dark/Light Mode Toggle           | 1      | COMPLETE    |

---

## Clone & Customize Workflow

When creating a new muse from this template:

### Step 1: Clone Repository (2 min)
```bash
# Use GitHub template or Vercel deploy button
# Rename project to new muse name
```

### Step 2: Update Configuration (5 min)
- Edit `config/muse.config.json`:
  - project.name, project.tagline
  - branding.companyName, supportEmail
  - features flags

### Step 3: Setup Supabase (10 min)
- Create new Supabase project
- Copy Project URL and anon key
- Run database migrations
- Configure storage bucket

### Step 4: Setup Stripe (10 min)
- Create Stripe products for plans
- Copy API keys
- Configure webhook endpoint

### Step 5: Deploy to Vercel (5 min)
- Connect to Vercel
- Add environment variables
- Configure custom domain

### Step 6: Bootstrap Admin (2 min)
- Sign up with admin email
- Run bootstrap admin endpoint

---

## Progress Tracking

### Current Phase: MVP COMPLETE + Team Collaboration
**Start Date**: December 29, 2025  
**MVP Completion**: January 25, 2026  
**Team Collaboration Added**: February 4, 2026

### Completed Work (Next.js + Vercel):
- [x] Module 1: Foundation - Landing page, dark/light mode, header/footer, Vercel deployment
- [x] Module 2: Authentication - Supabase email/password, Google OAuth, password reset, protected routes, profile page with avatar
- [x] Module 3: Admin Features - Dashboard, user management, settings, audit logging
- [x] Module 4: Plan System & Gating - Feature gating, tier limits, upgrade flows
- [x] Module 5: Stripe Billing - Checkout, webhooks, customer portal, subscription management
- [x] Module 6: Core Pages & Navigation - Profile, billing, pricing pages
- [x] Module 7: Security & RLS - Supabase RLS policies, Zod validation, rate limiting, security headers
- [x] Module 8: Monitoring & Docs - Sentry error tracking, Plausible analytics, structured logging, updated documentation
- [x] Module 9: Team Collaboration - Organizations, team members, invitations, role-based permissions (Owner/Manager/Member/Viewer)

### Next Steps:
- [ ] Clone template for first production muse (ExtrusionCalculator.com)
- [ ] Add RLS policies for organization_members table in Supabase (currently bypassed via admin client)
- [ ] v1.1 features as needed

---

## Environment Variables Required

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Analytics & Monitoring
- `SENTRY_DSN`
- `PLAUSIBLE_DOMAIN`

### Application
- `NEXT_PUBLIC_APP_URL`

---

## Decision Log

| Date       | Decision                                    | Rationale                                      |
|------------|---------------------------------------------|------------------------------------------------|
| 2025-12-29 | Migrate from Vite+Express to Next.js+Vercel | SEO critical; SSR required for organic traffic |
| 2025-12-29 | Extend timeline to February 2026            | Allow proper migration without rushing         |

---

## Next Steps

1. **Immediate**: Clone template for ExtrusionCalculator.com
2. **Post-Launch**: Add v1.1 features based on user feedback
3. **Pre-Production**: Upgrade rate limiting to Upstash Redis before live customer data

---

*Last Updated: February 4, 2026*
