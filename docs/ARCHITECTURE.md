# MuseKit Architecture: Option B (Separate Deployments)

**Decision Date**: February 2026

## Deployment Model

Each SaaS product built on MuseKit gets its own **independent deployment**:

| Component | Per-Product Instance |
|-----------|---------------------|
| Repository | Own repo (forked from MuseKit) |
| Database | Own Supabase project |
| Payments | Own Stripe account |
| Hosting | Own Vercel deployment |
| Domain | Own custom domain |
| Metrics | Own P&L, own analytics |

### Why Separate Deployments?

- **Clean P&L**: Each product's revenue and costs are naturally separated. No allocation formulas needed.
- **Independent scaling**: One product's traffic spike doesn't affect another.
- **Zero cross-pollination**: No risk of data or subscription leakage between products.
- **Sellable**: Any product can be sold or shut down independently.
- **Simple metrics**: Each deployment's Stripe dashboard IS that product's revenue report.

### Cost Per SaaS

Starting: **$0-1/mo** on free tiers (Supabase Free, Vercel Hobby, Stripe pay-per-transaction).

At scale: **~$50-75/mo** (Supabase Pro $25, Vercel Pro $20, Resend $20, Upstash ~$10).

Negligible compared to even modest SaaS revenue.

---

## MuseKit as a Shared Template

MuseKit is the **reusable template**, not a deployed product itself.

### Workflow

1. **MuseKit repo** contains the clean, product-agnostic SaaS template
2. To build a new SaaS, **fork/clone MuseKit** into a new repo
3. Build product-specific features on top (like SocioScheduler)
4. Deploy independently with its own Supabase, Stripe, domain
5. When MuseKit core gets improvements, **pull updates via git merge**

### Future: MuseKit HQ (Franchise Dashboard)

A lightweight app that connects to each deployed SaaS via their APIs (Stripe, Supabase, Vercel) and shows:
- Combined revenue across all products
- Per-product P&L side by side
- User growth trends per product
- Infrastructure health and costs

Build this when managing 3+ products. Not urgent before then.

---

## Merge-Friendly Architecture Rules

These rules minimize git merge conflicts when pulling MuseKit core updates into product repos. **Every future session must follow these rules.**

### Rule 1: Add, Don't Modify Core Files

When building product features, create new files instead of editing existing core files.

```
GOOD: Create src/lib/social/types.ts for social types
BAD:  Add social types to src/types/settings.ts
```

### Rule 2: Product Database Tables in `migrations/extensions/`

Core MuseKit schema lives in `migrations/core/`. Product-specific tables go in `migrations/extensions/`.

```
GOOD: migrations/extensions/social_accounts.sql
BAD:  migrations/core/003_social_accounts.sql
```

### Rule 3: Product Pages in Scoped Directories

Product-specific pages and API routes go in clearly named directories.

```
GOOD: src/app/dashboard/social/overview/page.tsx
GOOD: src/app/api/social/connect/route.ts
BAD:  src/app/dashboard/page.tsx (modifying core dashboard)
```

### Rule 4: Product Types in `src/lib/<product>/`

Product-specific TypeScript types, interfaces, and constants go in the product's own lib directory.

```
GOOD: src/lib/social/types.ts
BAD:  Adding social interfaces to src/types/settings.ts
```

### Rule 5: Product Queue Jobs via Plugin Pattern

Product-specific BullMQ job types should be defined in `src/lib/<product>/` and registered dynamically, not hardcoded into core queue files.

```
GOOD: src/lib/social/queue-jobs.ts (defines social job types and processors)
      src/lib/queue/index.ts imports a generic plugin registry
BAD:  Adding social job types directly to src/lib/queue/types.ts
```

### Rule 6: When You Must Touch a Core File

Sometimes you genuinely need to modify a core file (e.g., adding a nav item). In that case:
- Keep changes **minimal and isolated**
- Add a comment: `// PRODUCT: SocioScheduler`
- Document the change in this file under "Known Core File Modifications"

---

## Boundary Rules

### One-Way Dependency

```
Product code → imports from → MuseKit core
MuseKit core → NEVER imports from → Product code
```

This means:
- `src/lib/social/user-tier.ts` CAN import from `@/lib/products/tier-resolver.ts`
- `src/lib/queue/index.ts` should NOT import from `@/lib/social/client.ts`

### What is "Core"?

Core MuseKit files are everything that is NOT product-specific:

- `src/lib/supabase/` - Database client
- `src/lib/stripe/` - Payment integration
- `src/lib/products/` - Product registry (generic, not product-specific)
- `src/lib/queue/` - Queue infrastructure (generic job types only)
- `src/types/settings.ts` - Core SaaS settings
- `src/app/admin/` - Admin dashboard (generic)
- `src/app/api/stripe/` - Stripe endpoints
- `src/app/api/admin/` - Admin API
- `migrations/core/` - Core database schema

### What is "Product"?

Product-specific files live in isolated directories:

- `src/lib/social/` - SocioScheduler business logic
- `src/app/dashboard/social/` - SocioScheduler UI pages
- `src/app/api/social/` - SocioScheduler API routes
- `src/app/admin/setup/socioscheduler/` - SocioScheduler admin config
- `migrations/extensions/` - SocioScheduler database tables

---

## Known Separation Issues

These work fine in the current combined repo but should be cleaned up before creating a truly clean MuseKit template for others:

### 1. Queue Types (src/lib/queue/types.ts)

**Issue**: Social job types (`social-post`, `social-health-check`, `social-trend-monitor`, `social-engagement-pull`) and their interfaces are defined directly in the core queue types file.

**Fix**: Move social job type definitions to `src/lib/social/queue-jobs.ts`. Refactor `src/lib/queue/types.ts` to use a plugin/registry pattern where products register their own job types.

### 2. Queue Processors (src/lib/queue/index.ts)

**Issue**: Core queue processor imports from `@/lib/social/client` and `@/lib/social/types`. This violates the one-way dependency rule.

**Fix**: Implement a job processor registry where products register their own processors. Core queue dispatches to registered handlers without knowing about product internals.

### 3. Admin Setup Nav (src/app/admin/setup/layout.tsx)

**Status**: The "Social" tab (line 15) refers to the generic social links configuration page (Twitter/LinkedIn/GitHub URLs for the company footer), NOT SocioScheduler. This is core MuseKit functionality. No issue here.

---

## Git Merge Strategy

When pulling MuseKit core updates into a product repo:

1. `git remote add musekit <musekit-repo-url>` (one-time setup)
2. `git fetch musekit main`
3. `git merge musekit/main` (or create a branch first for review)
4. Resolve any conflicts (should be minimal if rules are followed)

### Conflict-Prone Areas to Watch

| File | Risk | Reason |
|------|------|--------|
| `src/lib/queue/types.ts` | HIGH | Social jobs mixed with core (known issue) |
| `src/lib/queue/index.ts` | HIGH | Social imports in core (known issue) |
| `src/app/admin/setup/layout.tsx` | LOW | Only if nav tabs change |
| `package.json` | LOW | Only if dependencies diverge |
| `src/types/settings.ts` | LOW | Only generic social links, no product code |

### Pre-Fork Checklist

Before creating the clean MuseKit template:
- [ ] Refactor queue types to plugin pattern
- [ ] Remove social imports from core queue processor
- [ ] Verify no other core files import from product directories
- [ ] Remove SocioScheduler-specific pages/routes
- [ ] Remove `migrations/extensions/` social tables
- [ ] Remove `src/lib/social/` directory
- [ ] Test that MuseKit runs clean without any product code
