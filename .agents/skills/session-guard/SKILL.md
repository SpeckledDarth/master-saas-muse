---
name: session-guard
description: Mandatory session startup guardrails. Load this skill FIRST at the start of EVERY session, before reading any other file or writing any code. Contains the current sprint, off-limits list, mandatory reads, and scope lock rules. Updated at the end of every session.
---

# Session Guard — Read This Before Doing Anything

This skill exists because previous sessions lost focus, touched off-limits files, made assumptions instead of reading docs, and drifted from the approved sprint. These rules are mandatory. Breaking them wastes the user's time and money.

## CURRENT SPRINT

**Sprint 4B: Dashboard Shell Polish + Quick Fixes**
- Blueprint location: `docs/UX_OVERHAUL_BLUEPRINT.md` → Sprint 4B section
- Previous sprint (4A) completed: vertical sidebar, badge counts, layout swap, affiliate redirect
- Sprint 4B tasks: keyboard shortcuts (Cmd+K, Cmd+/, Escape), CRM tab persistence via URL params, standardize money display ("$0.00" not em-dash)

If the user asks you to do something unrelated to this sprint, do exactly what they ask — but do NOT expand the scope or touch anything else.

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
