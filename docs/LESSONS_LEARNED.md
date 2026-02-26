# Technical Reference & Development Guidelines

> **Purpose:** Essential patterns, anti-patterns, and architectural rules for working with this codebase. Read this before making any changes. These guidelines prevent real bugs that have occurred in production.

---

## 1. Tech Stack Overview

This is a full-stack SaaS application built with the following technologies:

| Layer | Technology | Role |
|-------|-----------|------|
| **Framework** | Next.js 16+ (App Router) | Server-side rendering, API routes, file-based routing |
| **UI** | React 18 + TypeScript | Component library with strict typing |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Database** | Supabase (PostgreSQL) | Primary data store with Row Level Security (RLS) |
| **Auth** | Supabase Auth | User authentication, session management, OAuth |
| **Payments** | Stripe | Subscriptions, checkout, billing portal |
| **Hosting** | Vercel | Production deployment (auto-deploys from GitHub) |
| **Email** | Resend | Transactional and marketing emails |
| **AI** | xAI / Grok | AI-powered features (coaching, analytics, content generation) |
| **Cache/Rate Limiting** | Upstash Redis | Rate limiting, caching, queues |

**Key architectural concept:** This is a closed-loop business intelligence platform with a rich affiliate program. The extensive feature set (200+ features) is intentional — it is the product's competitive moat. Do not suggest cutting features or simplifying the affiliate program.

---

## 2. Database Patterns

### Supabase Query Error Handling

Supabase query builders do **not** throw JavaScript exceptions. They return a `{ data, error }` object. If you chain `.catch()` on a query builder, it will silently do nothing — the actual error in the `error` field goes completely unhandled, and your route will appear to succeed while returning `null` data.

```typescript
// CORRECT — always destructure and check the error field
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;

// WRONG — .catch() does nothing because Supabase queries don't throw
const { data } = await supabase.from('table').select('*').catch(() => ({ data: null }));
// The `error` field is never checked. If the query fails, `data` is null
// and you have no idea why.
```

**Why this matters:** Routes that use `.catch()` will return empty/null data to the frontend with a 200 status code. The user sees a blank page or missing data, and there is no error in the logs to debug. Always destructure `{ data, error }` and handle the `error` explicitly.

### Handling Missing Tables Gracefully

Supabase returns two different error codes when a table doesn't exist:
- `42P01` — PostgreSQL "relation does not exist" (table was never created)
- `PGRST205` — PostgREST schema cache miss (table was just created but PostgREST hasn't refreshed its cache yet)

Both must be caught and handled gracefully. If you only handle one, the other will cause a 500 error in production. Return an empty result set instead of crashing.

### Reusing Computed Data

Before computing derived data (e.g., payout projections, earnings summaries), check if another component or API endpoint already computes it. Duplicate calculations lead to inconsistent numbers across different parts of the UI, confusing users and creating maintenance burden. Reuse existing API endpoints or extract shared logic into utility functions.

---

## 3. API Route Patterns

### TypeScript Strictness: Interfaces vs. Values

TypeScript interfaces exist only at compile time — they have no runtime representation. If you write `typeof SomeInterface.prototype.property`, the build will fail because interfaces don't have prototypes.

```typescript
// CORRECT — extract shared shapes into named types
interface PeriodData { start: string; end: string; }
interface RangeData {
  primary: PeriodData;
  comparison: PeriodData | null;
}

// WRONG — interfaces have no prototype; this compiles in dev but fails in production build
interface RangeData {
  primary: { start: string; end: string; };
  comparison: typeof RangeData.prototype.primary | null; // BUILD ERROR on Vercel
}
```

**Why this matters:** The dev server (Turbopack) is more lenient than `next build` (the production TypeScript checker). Code that compiles locally may fail on Vercel. Always verify TypeScript correctness — interfaces can't be used as values, all types must be properly imported, and generic constraints must be satisfied.

### JSX Boolean Expressions

Boolean logic in JSX must be explicit. Broken boolean expressions cause rendering issues that are hard to debug because the component may partially render or render unexpected content.

**Rule:** Always use explicit ternary operators or `&&` with proper parentheses in JSX conditionals.

### Self-Contained UI Components

Large dashboard files (thousands of lines) are fragile. New feature panels should be fully self-contained — they fetch their own data, handle their own loading/error states, and render independently. Dashboard integration should be minimal (import + render). This keeps the dashboard stable while adding new features.

---

## 4. AI Integration Patterns

### Required Fields for AI Calls

The `chatCompletion()` function requires a `systemPrompt` field. If you omit it, the AI route will crash at runtime.

```typescript
import { chatCompletion } from '@/lib/ai/provider';

const result = await chatCompletion({
  systemPrompt: 'You are an affiliate marketing advisor...', // REQUIRED — omitting this crashes the route
  userPrompt: `Based on this data: ${JSON.stringify(realData)}...`,
  model: 'grok-3-mini-fast',
});
```

### AI Must Use Real User Data

AI features must query the user's actual data before generating responses. Generic advice is useless and undermines the product's value proposition. Every AI feature should pull:

- Current tier and progress to next tier
- Active contests and the user's standing
- Upcoming milestones
- Leaderboard rank
- Recent commission trends
- Connected platform performance

**Why this matters:** The product is a closed-loop intelligence platform. AI features that don't reference real data feel like generic chatbots. The AI's value comes from personalized, data-driven insights.

### Cross-Dashboard Awareness for New Features

Every new feature should be evaluated against all parts of the system. Ask:

1. Does the admin need to see/manage this?
2. Does the affiliate need to see/use this?
3. Does the AI need to know about this? (e.g., AI coach should mention active contests)
4. Does the prediction/intelligence system need this data?

Failing to do this creates "integration debt" where features exist in isolation. For example, if an admin creates a contest but the AI coach doesn't mention it and predictions don't factor it in, the user experience feels disconnected.

---

## 5. Authentication Patterns

### Admin Auth Check

Admin routes use a two-tier authorization check. First, check the `user_roles` table. If the user isn't found there, fall back to `organization_members` with owner/manager roles. If neither check passes, return 401.

```typescript
// Check user_roles table first, fall back to organization_members
const { data: role } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();

if (role?.role !== 'admin') {
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['owner', 'manager'])
    .single();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Why this matters:** The application supports both direct admin roles and organization-based roles. Checking only one table would lock out legitimate admins who are authorized through the other system.

### Affiliate Auth Check

Affiliate routes require both authentication (is the user logged in?) and authorization (is the user an affiliate?). Always check both.

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const { data: profile } = await supabase
  .from('affiliate_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
if (!profile) return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 });
```

**Why this matters:** A logged-in user is not necessarily an affiliate. Skipping the profile check would expose affiliate-only data and features to regular users.

---

## 6. Deployment Patterns

### The Three-Environment Architecture

This project uses three distinct environments. Understanding their roles is critical:

| Environment | Role | Database | URL |
|-------------|------|----------|-----|
| **Replit** | Code editor and development server | Replit Postgres (local dev only) | Not used for testing |
| **GitHub** | Version control, triggers deployments | N/A | Repository URL |
| **Vercel + Supabase** | Production hosting + production database | Supabase PostgreSQL | Production URL |

**The critical rule:** Replit is a code editor, not the production environment. The Replit preview/webview should never be used for testing. Users test on Vercel. If something works in Replit but breaks on Vercel, the Vercel behavior is the source of truth.

### Why This Architecture Causes Bugs

The most common source of production bugs is **environment desync**:

1. **Schema drift:** A migration runs on Replit Postgres but not on Supabase. The code references a column that exists locally but not in production, causing 500 errors on Vercel that cannot be reproduced in Replit.

2. **Build differences:** The dev server (Turbopack) is more lenient than `next build` (which Vercel runs). Type errors, missing imports, and interface misuse may compile locally but fail in production.

3. **Environment variable gaps:** A new env var is added to `.env` locally but not configured in Vercel's environment settings.

### Pre-Deployment Checklist

Before declaring work complete:

1. **Schema alignment** — Confirm all tables/columns exist in both Replit Postgres AND Supabase. List the exact SQL migrations needed on Supabase.
2. **Clean compilation** — Run `npm run dev` with zero errors.
3. **API smoke test** — Test every changed route. Check response bodies, not just status codes. A 200 with `{ data: null }` is still a bug.
4. **Migration inventory** — List ALL migrations needed on Supabase, in order, with exact SQL.
5. **Environment variables** — List any new variables needed in both Vercel and Supabase.
6. **Git push** — Code must be committed and pushed to GitHub. Vercel auto-deploys from GitHub.

### Turbopack vs. Production Build

The development server uses Turbopack, which is faster but more permissive than the production TypeScript compiler. Vercel runs `next build`, which performs strict type checking.

Common issues that pass in dev but fail in production:
- Using interfaces as runtime values (`typeof Interface.prototype.x`)
- Missing type imports
- Implicit `any` types
- Unused variables (depending on tsconfig strictness)

**Rule:** When making type-level changes or adding new interfaces, mentally verify TypeScript correctness. If in doubt, the production build is the authority.

---

## 7. Common Mistakes

| Mistake | What Breaks | How to Avoid |
|---------|-------------|--------------|
| Chaining `.catch()` on Supabase queries | Errors are silently swallowed; routes return null data with 200 status | Always destructure `{ data, error }` and check `error` explicitly |
| Omitting `systemPrompt` in `chatCompletion()` | AI route crashes at runtime | Always include `systemPrompt` in the settings object |
| Using `typeof Interface.prototype.x` | Build fails on Vercel (interfaces have no runtime representation) | Extract shared shapes into named type aliases |
| Testing only in Replit | Bugs appear on Vercel that can't be reproduced locally | Follow the pre-deployment checklist; treat Vercel as source of truth |
| Running migrations only on Replit Postgres | Schema drift causes 500 errors in production | Always provide exact SQL for Supabase migrations |
| Building features in isolation | Disconnected UX; AI coach doesn't know about new features | Evaluate every feature against admin, affiliate, AI, and prediction systems |
| Handling only one Supabase error code for missing tables | Intermittent 500 errors after table creation | Handle both `42P01` and `PGRST205` error codes |
| Computing derived data that another component already computes | Inconsistent numbers across the UI | Search existing endpoints before creating new calculations |
| Ignoring Vercel-reported errors because "it works in Replit" | Production stays broken | Vercel is the source of truth; investigate environment differences |
| Placing early returns (loading/auth guards) BEFORE all hooks in a component | React Error #310 "Rendered more hooks than during the previous render" — hooks count changes between renders | ALL hooks (useState, useEffect, useCallback, useMemo, useRef) MUST be called before ANY conditional return. Move loading/auth guards to AFTER all hooks. This is a fundamental React rule. |
| Having 200+ hooks in a single component | Hard to audit hook ordering, easy to accidentally place early returns before hooks | Refactor large components into smaller sub-components that handle their own state |

---

*This document captures architectural patterns and anti-patterns for this codebase. Update it when new patterns are discovered or existing ones change.*
