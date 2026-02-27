---
name: build-checklist
description: Pre-delivery testing, plan completion, and session handoff checklist. Use when completing a task, finishing a build plan, delivering work to the user, or ending a session. Also use when creating build plans to ensure proper sprint structure. Contains the mandatory testing steps, environment sync protocol, and accountability rules.
---

# Build Checklist — Deliver Complete, Tested Work

Previous sessions have delivered partial, untested work and claimed it was done. The user discovered gaps during testing, costing days of rework. These rules exist to prevent that. They are mandatory, not suggestions.

## Rule #1: Complete the Entire Plan

When the user approves a build plan, build ALL of it. Not 1/8. Not "the parts that fit in this session."

- If a plan has 10 tasks, deliver 10 tasks
- If you cannot complete the full plan, say so UPFRONT before starting — not after the user discovers half is missing
- Never say "done" when it isn't done
- If running long, warn the user immediately — do not wait until the session ends

## Rule #2: Pre-Delivery Testing (ALL 7 steps, EVERY time)

Before telling the user work is ready, complete ALL of these:

1. **Check database schema** — Query Replit Postgres to confirm all tables and columns the code expects exist
2. **Start dev server** — Run `npm run dev` and confirm zero build/compile errors
3. **Test API endpoints** — curl/fetch every changed API route. Confirm 200 responses AND correct response bodies (not just status codes)
4. **Check server logs** — Review console output for errors, warnings, or stack traces
5. **Trace the full path** — For each change: frontend → API route → database query → response. Confirm every step works
6. **List Supabase migrations** — If any change depends on tables/columns that might not exist in Supabase, list the exact SQL the user needs to run BEFORE testing on Vercel
7. **Fix all errors** — Do NOT hand partially-working code to the user. If an API returns 500, debug and fix it. The user should never be the first to discover a bug.

## Rule #3: Three-Environment Sync

This project runs across three environments that MUST stay aligned:

| Environment | Purpose | Database |
|-------------|---------|----------|
| **Replit** | Code editor + local dev | Replit Postgres |
| **GitHub** | Version control | N/A |
| **Vercel + Supabase** | Production (where user tests) | Supabase Postgres |

The user tests on Vercel, NOT Replit. If schemas are out of sync, bugs appear only on one side.

**Pre-Push Sync Checklist:**
1. Schema alignment — confirm tables/columns exist in Replit Postgres, list migration SQL for Supabase
2. Code compiles clean — `npm run dev` with zero errors
3. API smoke test — curl every changed route, confirm no 500s
4. Migration inventory — list ALL Supabase migrations needed, in order, with exact file paths
5. Environment variables — list any new env vars for both Vercel AND Supabase
6. Git status check — remind user to push to GitHub

## Rule #4: Sprint Planning

Plans with more than 3-4 tasks MUST be broken into sprints:

- Each sprint: 3-5 tasks, completable in one session
- Each sprint produces a working, testable result
- Sprint boundaries, completion tests, and handoff notes are required
- If a sprint is running long, tell the user immediately

## Rule #5: Session Handoff

At the end of EVERY session, update `docs/ROADMAP.md` with:
- Which sprint/tasks completed
- What was accomplished (specific, not vague)
- What the next session should start with
- Any blockers or known issues

## Rule #6: Design System Compliance

Every UI component built must use CSS variables from the design system. See the `design-system` skill for the complete mapping. Hardcoded Tailwind spacing, colors, radius, or shadows are forbidden.

## Rule #7: Don't Create New Documents

The user has been burned by 27+ docs that sessions created as "solutions" that were never read. The 5 active docs in `docs/` are sufficient. Critical information goes in `replit.md`. Do NOT create new documentation files unless the user explicitly asks.

## Deployment Note

This is a Next.js + Vercel project. The user NEVER uses Replit preview/webview. All testing happens on Vercel (triggered by git push to GitHub). Replit is used only as a code editor. Never suggest using the Replit preview panel.
