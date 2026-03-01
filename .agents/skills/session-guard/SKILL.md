---
name: session-guard
description: Mandatory session startup guardrails. Load this skill FIRST at the start of EVERY session, before reading any other file or writing any code. Contains the current sprint, off-limits list, mandatory reads, and scope lock rules. Updated at the end of every session.
---

# Session Guard — Read This Before Doing Anything

This skill exists because previous sessions lost focus, touched off-limits files, made assumptions instead of reading docs, and drifted from the approved sprint. These rules are mandatory. Breaking them wastes the user's time and money.

## CURRENT SPRINT

**ALL 15 SPRINTS COMPLETE — UX Overhaul Blueprint is FINISHED**
- Sprints 7/8/9 were restructured into 7 sub-sprints: 7A, 7B, 8A, 8B, 9A, 9B, 9C
- All 9 errata issues in `docs/BLUEPRINT_ERRATA.md` have been FIXED and applied to the blueprint
- Blueprint location: `docs/UX_OVERHAUL_BLUEPRINT.md`
- **No remaining sprints.** The UX Overhaul Blueprint is fully complete.
- **Next work:** User determines next priorities (Supabase migrations, launch prep, etc.)

If the user asks you to do something unrelated to this sprint, do exactly what they ask — but do NOT expand the scope or touch anything else.

## PROJECT LAWS (non-negotiable — applies to ALL work in ALL sessions)

These are LAWS, not suggestions. They are permanent. They apply to every sprint, every task, every file. Violating them has cost the user weeks of rework and significant money. Multiple sessions have broken these rules by skimming, guessing, or assuming. Do not be another one.

### LAW 1: Stack Identity

This project runs across three environments:

| Environment | Role | What happens here |
|-------------|------|-------------------|
| **Replit** | Code editor ONLY | You write code here. The local dev server runs here for build verification. The user NEVER tests here. |
| **GitHub** | Version control | Code goes from Replit → GitHub via git push. This triggers Vercel deployment. |
| **Vercel + Supabase** | Production | This is where the user tests. This is where end users access the product. Supabase provides the production PostgreSQL database, auth, RLS, and storage. |

**The stack is: Vercel + Next.js (App Router) + Supabase Postgres.**
**The stack is NOT: Replit + Vite.**

Violations of this law:
- Suggesting the user use the Replit preview panel — VIOLATION
- Using `import.meta.env` (Vite pattern) instead of `process.env` (Next.js pattern) — VIOLATION
- Suggesting `npm run dev` as a way for the user to see their app — VIOLATION (they see it on Vercel)
- Treating Replit Postgres as the production database — VIOLATION (production is Supabase)

Reference: `docs/LESSONS_LEARNED.md`

### LAW 2: Color Model — Single Source of Truth

The Color Palette page (`/admin/setup/palette`) is the **single source of truth** for ALL visual styling across the entire site — every dashboard, every public page, every component, every session.

**How the color pipeline works (understand this before touching ANY styling):**

1. The admin picks a primary brand color on `/admin/setup/palette`
2. The palette page generates a full 50–950 HSL color scale from that single color (lighter shades at 50, darker shades at 950)
3. These values are stored as CSS variables: `--primary-50`, `--primary-100`, `--primary-200`, ... through `--primary-950` (same for `--accent-*`)
4. In `tailwind.config.ts` (lines 29–43), every step of this scale is mapped to a Tailwind utility class: `primary-50` resolves to `hsl(var(--primary-50))`, `primary-100` resolves to `hsl(var(--primary-100))`, and so on
5. Default HSL values are defined in `src/app/globals.css` (lines 17–27 for primary, lines 34–44 for accent)
6. When a component uses `text-primary-600` or `bg-primary-100`, Tailwind resolves it through the CSS variable, which the palette controls

**This means:** When the admin changes their brand color on the palette page, EVERY component using the 950 scale updates automatically. Nothing is hardcoded. This is the entire point of the system.

**CORRECT — these are palette-controlled (DO NOT REMOVE OR "FIX" THESE):**
- `text-primary-600 dark:text-primary-400` — shade variation for light/dark mode
- `bg-primary-100 dark:bg-primary-900` — light tint in light mode, dark shade in dark mode
- `border-primary-600 dark:border-primary-400` — border shade variation
- `text-accent-500`, `bg-accent-100`, `border-accent-600` — accent color scale
- `text-primary`, `bg-primary`, `text-destructive`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border-border` — base semantic classes
- `text-[hsl(var(--success))]`, `bg-[hsl(var(--warning)/0.1)]`, `text-[hsl(var(--danger))]`, `text-[hsl(var(--info))]` — semantic feedback tokens

**FORBIDDEN — these bypass the palette entirely (VIOLATION to use these):**
- `text-green-600`, `bg-green-100` — VIOLATION (use `text-[hsl(var(--success))]` instead)
- `text-red-500`, `bg-red-100` — VIOLATION (use `text-[hsl(var(--danger))]` or `text-destructive` instead)
- `text-blue-600`, `bg-blue-50` — VIOLATION (use `text-[hsl(var(--info))]` instead)
- `text-amber-500`, `bg-yellow-100` — VIOLATION (use `text-[hsl(var(--warning))]` instead)
- `text-purple-*`, `text-orange-*`, `text-gray-*` — VIOLATION (use `text-muted-foreground` for gray)
- Hardcoded hex values in className or style props: `color: '#6366f1'` — VIOLATION
- ANY named Tailwind color palette (green, red, blue, amber, yellow, purple, orange, etc.) — VIOLATION

**Mistakes that have cost the user WEEKS of rework (do not repeat these):**
- Replacing `text-primary-600 dark:text-primary-400` with `text-primary` — this REMOVES shade control and is WRONG. The 950 scale exists to give precise light/dark shade variation. `text-primary` alone cannot do this.
- Using `text-[hsl(var(--primary))]` instead of the 950 scale — the 950 scale is the correct pattern for shade variation.
- Introducing `text-green-600` for success states instead of `text-[hsl(var(--success))]` — named colors bypass the palette.
- Using raw `Card` component instead of `DSCard` — raw Card bypasses palette-controlled padding, radius, shadow, and border variables. Always use `DSCard` from `@/components/ui/ds-card`.

**If you are unsure whether a color class is palette-controlled:** Open `tailwind.config.ts` and check if it resolves to a CSS variable via `hsl(var(--...))`. If it does, it's safe. If it doesn't, it's a VIOLATION.

Reference: `docs/DESIGN_SYSTEM_RULES.md`

### LAW 3: When In Doubt — ASK, Do Not Guess

If you are confused about the stack, the color model, any design system pattern, or how something should work — STOP and ask the user for clarification BEFORE writing code. Do not guess. Do not assume. Do not "figure it out" on your own. Do not proceed with work you are unsure about.

This law exists because multiple sessions have guessed wrong, delivered work that looked correct on the surface, and the user spent days undoing the damage. A 30-second clarifying question prevents days of rework. There is no scenario where guessing is acceptable.

## DO NOT TOUCH

These files and topics are OFF-LIMITS unless the user explicitly asks:

1. `docs/FUTURE PLAN - CONNECTED_DATA_VISION.md` — do not read, modify, reference, or suggest changes
2. Do NOT suggest cutting features or simplifying the affiliate program — the 217-feature vision is intentional
3. Do NOT suggest using Replit preview/webview — the user tests on Vercel only
4. Do NOT create new documentation files — the 5 docs in `docs/` are sufficient
5. Do NOT modify files unrelated to the current task — if you think something else needs fixing, mention it and wait for approval

## MANDATORY READS (before writing any code)

Read these three files IN ORDER before planning or coding:

1. `docs/ROADMAP.md` — Read the LAST session log entry to understand where things left off
2. `docs/UX_OVERHAUL_BLUEPRINT.md` — Read the CURRENT SPRINT section (identified above) to understand what needs to be built
3. `docs/LESSONS_LEARNED.md` — Know the anti-patterns so you don't repeat them

If doing UI work, also load the `design-system` skill.
If the blueprint references a visual pattern or UI benchmark, LOOK AT the reference images before coding. Do not interpret text descriptions alone — the images are the source of truth.

## NO GUESSING — ASK FIRST

- If you are unsure what something should look like, how it should behave, or what the user intended — ASK. Do not guess, assume, or interpret loosely.
- Always check `attached_assets/` for reference images before building any UI. The blueprint's Visual Reference table catalogs what each image shows. Look at the actual images.
- If the blueprint or docs don't answer your question, ask the user before writing code. A 30-second question saves hours of rework.
- If your plan differs from what the blueprint describes, STOP and ask. Do not build your own version.

## SCOPE LOCK

- Do exactly what the user asked. Nothing more.
- Do NOT make "bonus improvements" to unrelated files
- Do NOT refactor code that isn't part of the current task
- Do NOT touch files outside the sprint scope unless the user explicitly asks
- If you think something else should change, SAY SO and wait for approval — do not just do it
- When the user gives you a specific, small task (rename a file reference, fix a typo), do ONLY that task

## SESSION END PROTOCOL

Before ending any session, you MUST:

1. Update THIS SKILL's **CURRENT SPRINT** section to point to the next sprint
2. Update THIS SKILL's **DO NOT TOUCH** section if anything changed
3. Update `docs/ROADMAP.md` with the session log
4. Update `docs/UX_OVERHAUL_BLUEPRINT.md` progress tracker if a sprint was completed
5. If reference images were shared during this session, catalog them in the relevant doc (blueprint, design system, etc.) with filename + description. Orphaned images are invisible to future sessions.
