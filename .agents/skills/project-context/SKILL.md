---
name: project-context
description: Essential project context for PassivePost and MuseKit. Use when planning features, making architectural decisions, creating new files or database tables, discussing project direction, or whenever you need to understand what this project is, why it exists, and how it's structured. Load this skill before any significant development work.
---

# Project Context — What You're Working On

## The Two Things In This Codebase

**MuseKit** is the user's PERSONAL reusable SaaS template. It is NOT a product for sale. It is internal infrastructure the user clones whenever they want to launch a new SaaS product. It provides auth, billing, admin dashboard, teams, email, AI, affiliate program, CRM, design system, webhooks, monitoring, and 60+ modules.

**PassivePost** is the FIRST product built on MuseKit. PassivePost IS the business — a closed-loop business intelligence platform for content creators, launching April 1, 2026. It has 217 planned features, three dashboards (Admin, Affiliate, User), and a self-reinforcing flywheel.

**MuseKit serves the USER (the founder/developer). PassivePost serves CUSTOMERS (content creators).** Never confuse these.

There will be MORE products built on MuseKit in the future. Each gets its own repo, database, Stripe account, and deployment.

## Why They're So Closely Related (Dogfooding)

PassivePost is the dogfooding product. It stress-tests and validates MuseKit's extension model. Every PassivePost feature exercises MuseKit's extensibility. If the affiliate system works for PassivePost, it works for any future clone.

- If a PassivePost feature requires modifying MuseKit core files, that's a signal MuseKit has a GAP — fix it at the core level, don't hack around it
- Future products will NOT be this intertwined — PassivePost establishes the pattern
- Quality bar is dual: "does it work for content creators" AND "does this prove the MuseKit template model works"

## Physical Boundary Rules

- **MuseKit code** = everything OUTSIDE `/social/` directories
- **PassivePost code** = everything INSIDE `/social/` directories
- **Core migrations** = `migrations/core/` — NEVER modified by product extensions
- **Extension migrations** = `migrations/extensions/` — product-specific only
- **Clean separation test:** deleting `/social/` directories removes PassivePost, leaving MuseKit intact

**One-question test:** "If I removed everything about content creators and social media, would this file still need to exist?" YES = MuseKit. NO = PassivePost.

**Rules:**
1. NEVER put PassivePost-specific logic in MuseKit core files
2. NEVER modify MuseKit core tables in product-specific migrations
3. State which side of the boundary a new feature belongs to BEFORE writing code
4. New product features go in new files and new tables
5. If unsure, ASK — do not guess

Past sessions have violated this boundary repeatedly, costing the user days of rework.

## The Closed-Loop Flywheel

PassivePost's core innovation: creators use the platform to do their actual work (scheduling posts, tracking earnings, analyzing growth). This generates data that powers AI coaching, which helps them create better content, which drives more affiliate revenue, which keeps them on the platform. Self-reinforcing cycle.

Five data layers that traditional platforms can't see:
1. **Content Calendar** — what creators publish, when, on which platforms
2. **Audience Growth** — followers, engagement rates, reach trends
3. **Affiliate Performance** — clicks, signups, conversions, commissions
4. **Connected Analytics** — YouTube views, Google Analytics, podcast downloads
5. **Financial Picture** — earnings, payouts, tax obligations, content ROI

## Three Dashboards — Data Flows Between Them

| Dashboard | User | Purpose |
|-----------|------|---------|
| **Admin** | Platform owner | CRM, revenue attribution, fraud detection, program health |
| **Affiliate** | Content creator | Content calendar, earnings, analytics, AI coaching |
| **User** | Customer (non-affiliate) | Billing, subscription, support — pathway to becoming affiliate |

Data flows continuously: admin creates contest → affiliate sees progress → AI coach adjusts recommendations → predictions factor it in. Every customer is a potential affiliate. Every affiliate is an active user.

## Integration-First Rules (NON-NEGOTIABLE)

1. Every new feature MUST connect to at least one existing system
2. Check `docs/FEATURE_INVENTORY.md` before building — extend existing features, never create parallel systems
3. New features should CONSUME existing data AND PRODUCE data for other features
4. AI features must use real user data — never generate advice in a vacuum
5. Consider how features surface across all three dashboards
6. The 217-feature vision is intentional — the feature richness IS the competitive moat. Never suggest cutting features.

## Feature Priority Tiers

- **Tier 1: Flywheel Accelerators** — close data loops, make AI smarter with every interaction
- **Tier 2: Retention Deepeners** — accumulate long-term value (financials, contracts, reports)
- **Tier 3: Delight Multipliers** — turn users into advocates (milestones, badges, leaderboards)

## Key Reference Documents

- `docs/PRODUCT_IDENTITY.md` — Full product vision and competitive positioning
- `docs/FEATURE_INVENTORY.md` — Complete map of every built feature (search before building)
- `docs/LESSONS_LEARNED.md` — Anti-patterns and technical gotchas
- `docs/ROADMAP.md` — What's done, what's next, session history
- `docs/DESIGN_SYSTEM_RULES.md` — Styling rules (see `design-system` skill)
- `docs/archive/` — Archived reference docs (read only if needed for deep dives)
