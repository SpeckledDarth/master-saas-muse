# PassivePost — Lessons Learned & Anti-Patterns

> **Last Updated:** February 25, 2026
> **Purpose:** Concrete rules from real bugs and wasted work. Read this before every session. Follow these rules to avoid repeating mistakes.

---

## Session Continuity Problems

### Problem: Sessions Start Blind
**What happened:** New sessions assumed they were the first. They didn't read existing docs, didn't understand the product vision, and built features that conflicted with the architecture.

**Rule:** Every session MUST follow the Session Start Protocol in `replit.md`:
1. Read `docs/PRODUCT_IDENTITY.md` — understand what we're building
2. Read `docs/FEATURE_INVENTORY.md` — understand what's already built
3. Read `docs/ROADMAP.md` — understand what's in progress
4. Check Pending Bug Fixes — fix those before new features
5. Plan with integration requirements

### Problem: Sessions Give Wrong Advice
**What happened:** Sessions treated PassivePost as a generic SaaS template and gave advice like "you don't need this many features" or "simplify the affiliate program." This directly contradicts the product strategy — the feature richness IS the moat.

**Rule:** Read `docs/PRODUCT_IDENTITY.md` first. This is a closed-loop business intelligence platform. The 217-feature vision is intentional, not scope creep. Never suggest cutting features or simplifying the affiliate program.

### Problem: Standalone Feature Development
**What happened:** New features were built as isolated modules that didn't reference existing systems. This created duplicate data views, parallel logic, and a fragmented user experience.

**Rule:** Every new feature must connect to at least one existing system. Before building, search `docs/FEATURE_INVENTORY.md`. Document integration points in the session plan.

---

## Technical Anti-Patterns

### Anti-Pattern: `.catch()` on Supabase Query Builders
**What happened:** Routes like `revenue-waterfall`, `scheduled-reports`, and `usage-insights` chained `.catch()` on Supabase query builders. Supabase query builders return `{ data, error }` — they don't throw. `.catch()` silently swallows nothing and the actual error in `error` goes unhandled.

**Rule:** Always use this pattern:
```typescript
// CORRECT
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;

// WRONG — NEVER DO THIS
const { data } = await supabase.from('table').select('*').catch(() => ({ data: null }));
```

### Anti-Pattern: Missing `systemPrompt` in AISettings
**What happened:** AI routes crashed because the `AISettings` type requires a `systemPrompt: string` field, but it was omitted.

**Rule:** Every call to `chatCompletion()` must include `systemPrompt` in the settings object:
```typescript
const result = await chatCompletion({
  systemPrompt: 'You are an affiliate marketing advisor...', // REQUIRED
  userPrompt: '...',
  model: 'grok-3-mini-fast',
});
```

### Anti-Pattern: `typeof Interface.prototype.property`
**What happened:** TypeScript build failed on Vercel because code used `typeof CustomRangeData.prototype.primary` — but interfaces don't have prototypes. They're compile-time only.

**Rule:** Extract shared shapes into named types:
```typescript
// CORRECT
interface PeriodData { start: string; end: string; }
interface RangeData {
  primary: PeriodData;
  comparison: PeriodData | null;
}

// WRONG — interfaces have no prototype
interface RangeData {
  primary: { start: string; end: string; };
  comparison: typeof RangeData.prototype.primary | null; // BUILD ERROR
}
```

### Anti-Pattern: Boolean Expression Errors in JSX
**What happened:** A component had a broken boolean expression that caused rendering issues. JSX boolean logic must be explicit.

**Rule:** Always use explicit ternary or `&&` with proper parentheses in JSX conditionals.

---

## Integration Anti-Patterns

### Anti-Pattern: Parallel Data Views
**What happened:** The financial overview panel calculated its own payout projections separately from the existing payout schedule widget, which already has that logic.

**Rule:** Before computing derived data, check if another component already computes it. Reuse existing API endpoints or extract shared logic into utility functions.

### Anti-Pattern: AI Without Context
**What happened:** Some AI coaching features generated generic advice instead of pulling the affiliate's actual contests, milestones, tier progress, and leaderboard position.

**Rule:** AI features must query the user's real data:
- Current tier and progress to next tier
- Active contests and their standing
- Upcoming milestones
- Leaderboard rank
- Recent commission trends
- Connected platform performance

### Anti-Pattern: Adding Features Without Cross-Dashboard Awareness
**What happened:** Features were added to one dashboard without considering how they should appear in others. Admin creates a contest → affiliate dashboard shows it → but AI coach doesn't mention it and predictions don't factor it in.

**Rule:** For every feature, ask:
1. Does the admin need to see/manage this?
2. Does the affiliate need to see/use this?
3. Does the AI need to know about this?
4. Does the prediction/intelligence system need this data?

---

## Deployment Anti-Patterns

### Anti-Pattern: Three-Environment Desync
**What happened:** Agent tests against Replit Postgres + local dev server. User tests against Supabase + Vercel. Schemas drifted, causing 500 errors that one side couldn't reproduce.

**Rule:** Follow the Pre-Push Sync Checklist in `replit.md`:
1. Schema alignment — confirm tables/columns exist
2. Code compiles clean — `npm run dev` with zero errors
3. API smoke test — curl every changed route
4. Migration inventory — list ALL migrations needed on Supabase
5. Environment variables — list any new ones needed
6. Git push reminder

### Anti-Pattern: Turbopack vs Production Build Differences
**What happened:** Dev server (Turbopack) compiled without errors but `next build` (production TypeScript check) found type errors. Vercel runs the production build.

**Rule:** If you're making type-level changes, be aware that Turbopack is more lenient than the production TypeScript compiler. When in doubt, run a stricter check.

---

## Specific Codebase Patterns

### Admin Auth Check Pattern
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

### AI Route Pattern
```typescript
import { chatCompletion } from '@/lib/ai/provider';

const result = await chatCompletion({
  systemPrompt: 'You are...', // REQUIRED
  userPrompt: `Based on this data: ${JSON.stringify(realData)}...`,
  model: 'grok-3-mini-fast',
});
```

### Affiliate Auth Check Pattern
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

---

## Known Integration Debt (To Fix in Future Sessions)

These are connections that should exist but don't yet. Fix them when working on related features:

1. **Contests → AI Coach:** AI coaching should reference active contests and the affiliate's standing
2. **Milestones → Predictions:** Predictive intelligence should mention upcoming milestone bonuses
3. **Leaderboard → AI Insights:** AI should reference current leaderboard rank
4. **Content Intelligence → Marketing Toolkit:** AI content recommendations should link to existing tools (Post Writer, Email Drafter, Deep Link Generator)
5. **Financial Overview → Payout Schedule:** Should reuse payout schedule logic instead of calculating separately
6. **Weekly Digest → Contest Standings:** Monday email should include contest positions
7. **Broadcasts → In-App Notifications:** Admin broadcasts should create in-app notifications, not just emails

---

*This document grows with every session. Add new lessons as they're discovered.*
