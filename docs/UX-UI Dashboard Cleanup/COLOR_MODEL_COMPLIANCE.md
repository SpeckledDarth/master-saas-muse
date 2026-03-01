# Color Model Compliance Audit

> **Created:** March 1, 2026
> **Status:** NOT STARTED
> **Scope:** Fix all named Tailwind color violations (39 files) and migrate all raw Card imports to DSCard (72 files) across the entire codebase
> **Estimated effort:** 10 build sprints + 1 verification sprint

---

## Why This Document Exists

The UX Overhaul Blueprint (15 sprints, all complete) and the Blueprint Errata (9 corrections, all fixed) addressed layout, component structure, and page-level UX issues. Neither plan caught the **systemic color model violations** baked into the codebase from the beginning.

A comprehensive audit on March 1, 2026 revealed:
- **39 files** using named Tailwind colors (`text-green-600`, `bg-red-500`, `text-blue-*`, etc.) that bypass the palette page's CSS variable system
- **72 files** importing raw `Card` from `@/components/ui/card` instead of `DSCard` from `@/components/ui/ds-card`

These violations mean those elements **do not respond** when the admin changes the color palette. They are hardcoded colors that break the single-source-of-truth design system.

This is the third document in the `UX-UI Dashboard Cleanup` folder. Together, the three documents tell the full story:

| Document | Purpose | Status |
|----------|---------|--------|
| `UX_OVERHAUL_BLUEPRINT.md` | Original 15-sprint UX plan | ALL 15 SPRINTS COMPLETE |
| `BLUEPRINT_ERRATA.md` | 9 corrections to the original plan | ALL 9 ISSUES FIXED |
| `COLOR_MODEL_COMPLIANCE.md` | Color violations + Card migrations | NOT STARTED |

---

## The Rules

### Color Replacement Mapping

Every named Tailwind color must be replaced with its palette-controlled equivalent:

| Violation (FORBIDDEN) | Replacement (CORRECT) | Semantic Meaning |
|----------------------|----------------------|------------------|
| `text-green-*` | `text-[hsl(var(--success))]` | Success, positive, complete |
| `bg-green-*` | `bg-[hsl(var(--success)/0.1)]` | Success background (10% opacity) |
| `border-green-*` | `border-[hsl(var(--success))]` | Success border |
| `text-red-*` | `text-[hsl(var(--danger))]` or `text-destructive` | Error, danger, negative |
| `bg-red-*` | `bg-[hsl(var(--danger)/0.1)]` or `bg-destructive/10` | Danger background |
| `border-red-*` | `border-[hsl(var(--danger))]` | Danger border |
| `text-blue-*` | `text-[hsl(var(--info))]` | Info, link, neutral-informational |
| `bg-blue-*` | `bg-[hsl(var(--info)/0.1)]` | Info background |
| `border-blue-*` | `border-[hsl(var(--info))]` | Info border |
| `text-amber-*` / `text-yellow-*` | `text-[hsl(var(--warning))]` | Warning, caution, pending |
| `bg-amber-*` / `bg-yellow-*` | `bg-[hsl(var(--warning)/0.1)]` | Warning background |
| `border-amber-*` / `border-yellow-*` | `border-[hsl(var(--warning))]` | Warning border |
| `text-gray-*` | `text-muted-foreground` | Subdued text, secondary info |
| `bg-gray-*` | `bg-muted` | Subdued background |
| `border-gray-*` | `border` or `border-border` | Standard border |
| `text-purple-*` | `text-accent-*` or `text-primary-*` | Accent/brand color |
| `bg-purple-*` | `bg-accent-*` or `bg-primary-*` | Accent background |
| `text-orange-*` | `text-[hsl(var(--warning))]` | Warning (same as amber) |
| `bg-orange-*` | `bg-[hsl(var(--warning)/0.1)]` | Warning background |

### Card Migration Rule

All `Card` imports from `@/components/ui/card` must be changed to `DSCard` (and related sub-components) from `@/components/ui/ds-card`. DSCard is the design-system wrapper that applies palette-controlled styling.

### What is CORRECT (do NOT "fix" these)

- `text-primary-600 dark:text-primary-400` — these resolve to CSS variables via Tailwind config
- `bg-accent-100 dark:bg-accent-900` — same, palette-controlled
- The entire 950 scale (`primary-50` through `primary-950`, `accent-50` through `accent-950`) — these ARE the design system

### Exclusions (do NOT modify these files)

| File | Reason |
|------|--------|
| `src/components/ui/card.tsx` | Base shadcn component — DSCard wraps this |
| `src/components/ui/ds-card.tsx` | This IS the DSCard wrapper — it imports Card by design |
| `src/components/ui/toast.tsx` | shadcn primitive, destructive variant uses internal red by design |
| `tailwind.config.ts` | The `status` colors (online/away/busy/offline) are real-time presence indicators, separate concern |
| `src/app/admin/setup/palette/page.tsx` | The palette builder itself — uses Card for preview; DSCard would create circular dependency |
| `src/components/admin/color-palette-builder.tsx` | Palette builder component — same exception |
| `src/components/admin/palette/design-system-sections.tsx` | Palette section component — Card stays (but color violations still get fixed) |

---

## Progress Tracker

| Sprint | Area | Color Fixes | Card→DSCard | Status |
|--------|------|-------------|-------------|--------|
| T001 | Shared Components | 9 files | included | NOT STARTED |
| T002 | Auth Pages | 2 files | 4 files | NOT STARTED |
| T003 | Marketing & Public Pages | 5 files | 10 files | NOT STARTED |
| T004 | User Dashboard | 2 files | 4 files | NOT STARTED |
| T005 | Social Dashboard (Part 1) | 6 files | — | NOT STARTED |
| T006 | Social Dashboard (Part 2) | 6 files | — | NOT STARTED |
| T007 | Affiliate Pages | 9 files | — | NOT STARTED |
| T008 | Admin Setup (Part 1) | 1 file | 8 files | NOT STARTED |
| T009 | Admin Pages (Part 2) | — | 13 files | NOT STARTED |
| T010 | Component Card Migrations | — | 7 files | NOT STARTED |
| T011 | Verification + Build Check | audit | audit | BLOCKED (T001–T010) |

---

## Sprint Details

### T001: Shared Components — Color Fixes

Fix named color violations in shared components. These are used across the whole app, so fixing them has the highest impact.

| File | Violation | Fix |
|------|-----------|-----|
| `src/components/layout/header.tsx` | Badge colors: new=green, beta=blue, default=amber | Use semantic tokens (success, info, warning) |
| `src/components/landing/social-proof-popup.tsx` | `bg-gray` → `bg-card`, `border-gray` → `border` | Use card/border tokens |
| `src/components/impersonation-banner.tsx` | `bg-yellow` | `bg-[hsl(var(--warning)/0.1)]` |
| `src/components/notification-bell.tsx` | `text-yellow`, `text-green` | Warning and success tokens |
| `src/components/social/post-preview.tsx` | `text-yellow` | Warning token |
| `src/components/social/bulk-import.tsx` | `text-green` | Success token |
| `src/components/social/share-link.tsx` | `text-green` | Success token |
| `src/components/social/coaching-card.tsx` | Check for Card→DSCard | Migrate if found |
| `src/components/admin/palette/design-system-sections.tsx` | `text-green` | Success token (Card stays — palette component) |

**Acceptance:** Zero named color violations in `src/components/` (excluding toast.tsx)

---

### T002: Auth Pages — Color Fixes + Card Migration

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/(auth)/login/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(auth)/signup/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(auth)/reset-password/page.tsx` | `bg-green`/`bg-red` success/error states, raw Card | Semantic tokens + Card→DSCard |
| `src/app/(auth)/update-password/page.tsx` | `bg-green`/`bg-red`, raw Card | Semantic tokens + Card→DSCard |

**Acceptance:** Zero violations in auth pages

---

### T003: Marketing & Public Pages — Color Fixes + Card Migration

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/(marketing)/pricing/page.tsx` | `text-green` check icons, raw Card | Success token + Card→DSCard |
| `src/app/(marketing)/contact/page.tsx` | `text-green` check, raw Card | Success token + Card→DSCard |
| `src/app/(marketing)/features/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(marketing)/docs/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(marketing)/about/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(marketing)/faq/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(marketing)/p/[slug]/page.tsx` | Raw Card | Card→DSCard |
| `src/app/checkout/success/page.tsx` | `text-green`, raw Card | Success token + Card→DSCard |
| `src/app/testimonials/page.tsx` | `text-yellow` star, `text-gray` star | Warning/muted tokens |
| `src/app/blog/page.tsx` | Raw Card | Card→DSCard |
| `src/app/changelog/page.tsx` | Raw Card | Card→DSCard |
| `src/app/partners/page.tsx` | Tier badges: bronze=amber, silver=gray, gold=yellow, platinum=gray, diamond=blue | Accent scale or semantic tokens |
| `src/app/invite/[token]/page.tsx` | `text-green` | Success token |
| `src/app/not-found.tsx` | Check for violations | Fix if found |
| `src/app/oauth/error/page.tsx` | Amber/blue banners | Warning/info semantic tokens |

**Acceptance:** Zero violations in marketing/public pages

---

### T004: User Dashboard Pages — Color Fixes + Card Migration

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/(dashboard)/billing/page.tsx` | `text-green`/`text-red` trends, `bg-gray`/`bg-blue`/`bg-purple` plan colors, raw Card | Semantic tokens + Card→DSCard |
| `src/app/(dashboard)/profile/page.tsx` | `bg-gray`/`bg-blue`/`bg-purple` plan indicators, raw Card | Primary scale + Card→DSCard |
| `src/app/(dashboard)/support/page.tsx` | Raw Card | Card→DSCard |
| `src/app/(dashboard)/security/page.tsx` | Raw Card | Card→DSCard |

**Acceptance:** Zero violations in user dashboard

---

### T005: Social Dashboard Pages — Color Fixes (Part 1)

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/dashboard/social/page.tsx` | Green success banner, red error banner | Semantic tokens |
| `src/app/dashboard/social/overview/page.tsx` | Flywheel health score: green/yellow/red | Semantic tokens |
| `src/app/dashboard/social/engagement/page.tsx` | `text-red` heart, `text-blue` comment, `text-purple` eye, `text-green` share | Primary scale or info token |
| `src/app/dashboard/social/blog/page.tsx` | SEO score green/yellow/red, amber warning boxes | Semantic tokens |
| `src/app/dashboard/social/blog/compose/page.tsx` | `text-green`, `text-blue`, `bg-gray` | Semantic tokens |
| `src/app/dashboard/social/blog/posts/page.tsx` | `text-green` published, `text-blue` scheduled, `text-amber` publishing | Semantic tokens |

**Acceptance:** Zero violations in social dashboard part 1

---

### T006: Social Dashboard Pages — Color Fixes (Part 2)

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/dashboard/social/intelligence/page.tsx` | Grade colors: A=green, B=blue, C=yellow, D=red; content type colors | Semantic tokens or chart colors |
| `src/app/dashboard/social/distribution/page.tsx` | Trend up=green, down=red; difficulty colors | Semantic tokens |
| `src/app/dashboard/social/revenue/page.tsx` | Grade colors, content type backgrounds | Semantic tokens or chart colors |
| `src/app/dashboard/social/retention/page.tsx` | `text-orange` flame | Warning token |
| `src/app/dashboard/social/calendar/page.tsx` | Check for violations | Fix if found |
| `src/app/dashboard/social/onboarding/page.tsx` | Check for violations | Fix if found |

**Acceptance:** Zero violations in social dashboard part 2

---

### T007: Affiliate Pages — Color Fixes

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/affiliate/join/page.tsx` | `bg-green` success, `text-green` check | Semantic tokens |
| `src/app/affiliate/login/page.tsx` | `text-red`, `bg-red` error | Danger token |
| `src/app/affiliate/page.tsx` | `text-green` check | Success token |
| `src/app/affiliate/set-password/page.tsx` | `bg-orange` lock, `bg-green`/`bg-red` status | Warning/success/danger tokens |
| `src/app/affiliate/forgot-password/page.tsx` | `bg-green`/`bg-red` status | Semantic tokens |
| `src/app/affiliate/test-links/page.tsx` | Yellow warning box | Warning token |
| `src/app/affiliate/dashboard/page.tsx` | Check for violations | Fix if found |
| `src/app/partner/verify/[code]/page.tsx` | `text-green`, `bg-green` | Success token |
| `src/app/approve/[token]/page.tsx` | `bg-green` approved, `bg-red` rejected, `bg-yellow` changes, `text-blue` platform | Semantic tokens |

**Acceptance:** Zero violations in affiliate pages

---

### T008: Admin Pages — Color Fixes + Card Migration (Part 1)

| File | Violation | Fix |
|------|-----------|-----|
| `src/app/admin/setup/affiliate/page.tsx` | `text-green`/`text-red` trend, raw Card | Semantic tokens + Card→DSCard |
| `src/app/admin/setup/content/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/features/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/pages/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/social/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/integrations/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/products/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/passivepost/page.tsx` | Raw Card | Card→DSCard |
| `src/app/admin/setup/palette/page.tsx` | Card stays | NO CHANGE — palette builder exception |

**Acceptance:** Zero violations in admin setup (except palette page)

---

### T009: Admin Pages — Card Migration (Part 2)

| File | Fix |
|------|-----|
| `src/app/admin/setup/testimonials/page.tsx` | Card→DSCard |
| `src/app/admin/setup/watermark/page.tsx` | Card→DSCard |
| `src/app/admin/setup/funnel/page.tsx` | Card→DSCard |
| `src/app/admin/setup/discount-codes/page.tsx` | Card→DSCard |
| `src/app/admin/users/page.tsx` | Card→DSCard |
| `src/app/admin/team/page.tsx` | Card→DSCard |
| `src/app/admin/onboarding/page.tsx` | Card→DSCard |
| `src/app/admin/analytics/page.tsx` | Card→DSCard |
| `src/app/admin/feedback/[id]/page.tsx` | Card→DSCard |
| `src/app/admin/email-templates/page.tsx` | Card→DSCard |
| `src/app/admin/blog/page.tsx` | Card→DSCard |
| `src/app/admin/queue/page.tsx` | Card→DSCard |
| `src/app/admin/sso/page.tsx` | Card→DSCard |

**Acceptance:** Zero raw Card imports in admin pages (except palette)

---

### T010: Component Card Migrations

| File | Fix |
|------|-----|
| `src/components/subscription/UpgradeBanner.tsx` | Card→DSCard |
| `src/components/admin/font-picker.tsx` | Card→DSCard |
| `src/components/admin/color-palette-builder.tsx` | Card stays — palette builder exception |
| `src/components/admin/palette/design-system-sections.tsx` | Card stays — palette section exception |
| `src/components/social/post-preview.tsx` | Card→DSCard |
| `src/components/social/post-detail-dialog.tsx` | Card→DSCard |
| `src/components/social/coaching-card.tsx` | Card→DSCard |
| `src/components/social/share-link.tsx` | Card→DSCard |
| `src/components/social/lead-crm.tsx` | Card→DSCard |

**Acceptance:** Zero raw Card imports in components (except palette-related components)

---

### T011: Verification + Build Check

**Blocked by:** T001–T010 (all must be complete)

| Step | Action |
|------|--------|
| 1 | Run full grep audit confirming zero named color violations remain (excluding toast.tsx, tailwind.config.ts) |
| 2 | Run full grep confirming zero raw Card imports remain (excluding card.tsx, ds-card.tsx, palette components) |
| 3 | Start dev server and confirm zero compile errors |
| 4 | Update `docs/LESSONS_LEARNED.md` with this audit as a lesson |

**Acceptance:** Clean audit, clean build, lesson documented

---

## Instructions for Future Sessions

1. **Load this document** at the start of any session working on color/Card compliance
2. **Pick the next NOT STARTED sprint** from the progress tracker
3. **Fix every file** listed in that sprint's detail section
4. **Update the progress tracker** — change status to COMPLETE and note the date
5. **Do NOT skip files** — every file in the sprint must be addressed
6. **Do NOT "fix" the 950 scale** — `text-primary-600`, `bg-accent-100`, etc. are CORRECT
7. **Do NOT modify excluded files** — see the exclusions table above
8. **Run the dev server** after each sprint to confirm no compile errors
9. **When all 10 build sprints are done**, execute T011 for final verification
