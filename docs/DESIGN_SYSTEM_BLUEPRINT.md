# MuseKit Design System Configuration — Complete Blueprint

> **Created:** February 26, 2026
> **Status:** In Progress — Sprint 1 complete, Sprint 2 complete, Sprint 3 partial (3 of 5 tasks done)
> **Goal:** Transform the Color Palette into a comprehensive, configurable Design System that serves as the single source of truth for ALL visual styling across every MuseKit-cloned SaaS app.

---

## Executive Summary

The MuseKit Color Palette currently controls primary/accent colors, heading/body fonts, and button radius. This blueprint expands it into a full Design System Configuration covering typography, component styling, layout, interactive states, dark mode, data visualization, tables, forms, accessibility, and more — all configurable from the admin dashboard with no code changes required.

The affiliate dashboard's spacious, airy visual style becomes the default baseline for all presets.

Everything is a CSS variable or component prop — no new database tables, no structural code changes.

---

## Full Configuration Map

| Section | Settings | Admin UI |
|---------|----------|----------|
| **Colors** | Primary, accent, semantic (success/warning/danger), dark mode accent brightness — all on 950 scale | Color pickers, shade preview |
| **Typography** | H1/H2/H3 font size, weight, letter spacing, text transform. Heading color mode (primary/foreground/gradient). Body size, line height | Sliders, dropdowns, live heading preview |
| **Component Style** | Card padding/radius/shadow/border width/border style. Button radius/size scale/font weight/text transform. Input style matching. Badge shape (pill/rounded/square) | Preset selectors, toggles, live card+button preview |
| **Layout** | Content density (compact/default/spacious), section spacing, sidebar width, container max width, page header style. Logo position. Sticky header | Toggle groups, visual spacing preview |
| **Interactive States** | Hover effect (lift/glow/scale/none), animation speed (fast/normal/slow/none), focus ring style. Button/card click feedback. Page transition fade | Effect picker with live demo |
| **Dark Mode** | Mode control (user-choice/force-light/force-dark), user preference persistence (localStorage + account-level), card depth contrast, accent brightness | Radio buttons, sliders, dark preview panel |
| **Data Visualization** | Bar thickness/corner radius, line width/curve type, dot visibility, grid lines, trend lines, area fill, color strategy (mono/complementary/multi), tooltip style | Controls with live mini chart preview |
| **Tables** | Striped/clean rows, row borders, header style (bold/subtle) | Toggles with live mini table preview |
| **Scroll & Page** | Smooth scroll toggle, scroll-to-top button (show/hide, auto-colored), sticky header toggle | Toggles |
| **Loading & States** | Skeleton animation (pulse/shimmer/static), empty state style (illustration/icon-only) | Picker with live skeleton preview |
| **Notifications** | Toast position (top-right/top-center/bottom-right/bottom-center), toast style (auto-matches card) | Position diagram |
| **Forms** | Label position (above/floating), required field indicator (asterisk/text/border), error message style (inline/tooltip) | Toggles with live form preview |
| **Accessibility** | WCAG AA contrast enforcement, reduced motion respect | Toggles (default: both ON) |
| **Print** | Print-friendly stylesheet for invoices, reports, earnings | Toggle (default: ON) |
| **Dividers** | Style (line/gradient/none) | Picker with live preview |
| **Presets & Reset** | 4 presets, reset to defaults, export/import JSON | Preset buttons, file upload/download |

---

## The 4 Built-In Presets

| Preset | Target Use Case | Key Characteristics |
|--------|----------------|---------------------|
| **Clean & Airy** (DEFAULT) | General SaaS, content platforms | Spacious padding, medium radius, subtle shadow, normal transitions, smooth chart lines, pulse skeletons |
| **Compact & Dense** | Data-heavy SaaS, analytics tools | Tight padding, small radius, minimal shadow, fast transitions, thin chart lines |
| **Bold & Modern** | Marketing-forward SaaS, creative tools | Large headings, uppercase transforms, strong shadows, lift hover effects, thick chart lines, shimmer skeletons |
| **Minimal** | Developer tools, productivity apps | No shadows, no borders, hairline dividers, flat cards, hidden chart grid lines, static skeletons |

Presets change structural/style settings only — they never override the admin's color choices.

---

## FOUC (Flash of Unstyled Content) Prevention

Two known FOUC issues will be fixed:
1. **Color flash** (purple/blue defaults then configured colors): Inject admin colors server-side in root layout before client hydration
2. **Data flash** (hardcoded "20%" then real "17.9%"): Fetch real values server-side or use skeleton placeholders instead of wrong numbers
3. **Font flash**: Preload configured Google Fonts via `<link rel="preload">`
4. **General**: 150ms opacity fade-in on body masks any remaining micro-flashes

---

## Dark Mode Control

| Setting | Behavior |
|---------|----------|
| **User Choice** (default) | Toggle visible in header. Logged-out: localStorage remembers. Logged-in: preference saved to account, syncs across devices |
| **Force Light** | No toggle shown. Site always light mode. Overrides all user preferences |
| **Force Dark** | No toggle shown. Site always dark mode. Overrides all user preferences |

---

## Sprint Breakdown

This blueprint is organized into 5 sprints. Each sprint is designed to be completable in a single session and produces a working, testable result. If a session runs long, the sprint boundary tells you exactly where to stop and resume.

---

### Sprint 1: Foundation (Types + CSS Variables + Theme Injection)

**Goal:** All new CSS variables exist and are injectable. No visual changes yet — just the infrastructure.

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **T001** | Extend `BrandingSettings` in settings types with ALL new properties (typography, components, layout, interactive, dark mode, charts, tables, forms, accessibility, etc.) | `src/types/settings.ts` | — |
| **T002** | Extend `useThemeFromSettings` hook to inject all new CSS variables + dark mode control logic + user preference persistence | `src/hooks/use-settings.ts` | T001 |
| **T003** | Update `globals.css` with default values for all new variables, base CSS rules (typography, hover, transitions, skeletons, print, reduced-motion, form styles, badge shapes, dividers) | `src/app/globals.css` | T002 |
| **T012** | Create `design-presets.ts` with 4 preset configurations + export/import utilities | `src/lib/design-presets.ts` | T001 |

**T001 Full Property List:**

Typography:
- `h1FontSize`, `h1FontWeight`, `h1LetterSpacing`, `h1TextTransform`
- `h2FontSize`, `h2FontWeight`, `h2LetterSpacing`, `h2TextTransform`
- `h3FontSize`, `h3FontWeight`, `h3LetterSpacing`, `h3TextTransform`
- `headingColorMode` (primary/foreground/gradient)
- `bodyFontSize`, `bodyLineHeight`

Component Styling:
- `cardPadding` (compact/default/spacious), `cardBorderRadius` (none/sm/md/lg/xl), `cardShadow` (none/sm/md/lg), `cardBorderWidth` (0/1/2), `cardBorderStyle` (solid/dashed/none)
- `inputStyleMatch` (boolean)
- `buttonSize` (compact/default/large), `buttonFontWeight` (medium/semibold/bold), `buttonTextTransform` (none/uppercase)
- `badgeShape` (pill/rounded/square)

Layout:
- `contentDensity` (compact/default/spacious), `sectionSpacing` (compact/default/spacious)
- `sidebarWidth` (narrow/default/wide), `containerMaxWidth` (string)
- `pageHeaderStyle` (large/compact), `logoPosition` (left/center/left-nav-center), `stickyHeader` (boolean)

Interactive States:
- `hoverEffect` (lift/glow/scale/none), `animationSpeed` (fast/normal/slow/none), `focusRingWidth` (1/2/3)
- `buttonClickFeedback` (boolean), `cardClickFeedback` (boolean), `pageTransitionFade` (boolean)

Dark Mode:
- `darkModeOption` (user-choice/force-light/force-dark)
- `darkCardDepth` (subtle/default/deep), `darkAccentBrightness` (muted/default/vivid)

Data Visualization:
- `chartBarThickness` (thin/default/thick), `chartBarRadius` (none/sm/md)
- `chartLineWidth` (1/2/3), `chartLineCurve` (monotone/linear/step), `chartDots` (boolean)
- `chartGridLines` (visible/hidden), `chartGridStyle` (solid/dashed)
- `chartTrendLine` (boolean), `chartAreaFill` (boolean), `chartAreaOpacity` (number 0-1)
- `chartColorStrategy` (monochromatic/complementary/multi), `chartTooltipMatchCard` (boolean)

Tables:
- `tableStyle` (striped/clean), `tableRowBorders` (boolean), `tableHeaderStyle` (bold/subtle)

Semantic Colors:
- `successColor`, `warningColor`, `dangerColor` (hex, optional — defaults to green/amber/red)

Scroll & Page:
- `smoothScroll` (boolean), `scrollToTopButton` (boolean)

Loading States:
- `skeletonStyle` (pulse/shimmer/static), `emptyStateStyle` (illustration/icon-only)

Notifications:
- `toastPosition` (top-right/top-center/bottom-right/bottom-center)

Forms:
- `labelPosition` (above/floating), `requiredFieldIndicator` (asterisk/text/border), `errorMessageStyle` (inline/tooltip)

Accessibility:
- `contrastEnforcement` (boolean, default true), `respectReducedMotion` (boolean, default true)

Print:
- `printStyles` (boolean, default true)

Divider:
- `dividerStyle` (line/gradient/none)

**T002 CSS Variables Injected:**

Typography: `--h1-size`, `--h1-weight`, `--h1-spacing`, `--h1-transform`, same for h2/h3, `--body-size`, `--body-line-height`

Component: `--card-padding`, `--card-radius`, `--card-shadow`, `--card-border-width`, `--card-border-style`, `--btn-radius`, `--btn-padding`, `--btn-font-weight`, `--btn-text-transform`, `--input-radius`, `--badge-radius`

Layout: `--content-density-gap`, `--section-spacing`, `--sidebar-width`, `--container-max-width`, `--page-header-size`

Interactive: `--hover-transform`, `--hover-shadow`, `--transition-speed`, `--focus-ring-width`, `--click-scale`

Dark mode: `--dark-depth-offset`, `--dark-accent-saturation`

Data viz: `--chart-bar-size`, `--chart-bar-radius`, `--chart-line-width`, `--chart-line-curve`, `--chart-area-opacity`

Semantic: `--success`, `--warning`, `--danger` (HSL values)

Charts: `--chart-1` through `--chart-8`

Tables: `--table-stripe-opacity`, `--table-border-opacity`

Divider: `--divider-style`, `--divider-opacity`

**Completion test:** Dev server starts with zero errors. No visual regression. New CSS variables visible in browser inspector on `:root`. Preset JSON objects export/import correctly.

**Sprint 1 handoff note:** At the end of Sprint 1, the session must document in ROADMAP.md: "Sprint 1 complete. Sprint 2 ready to begin."

---

### Sprint 2: Admin UI (Palette Page Expansion)

**Goal:** Admin can see and change every setting through the palette page.

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **T006** | Build the expanded admin palette page with all configuration sections (Colors, Typography, Component Style, Layout, Interactive States, Dark Mode, Data Viz, Tables, Loading, Notifications, Forms, Scroll, Accessibility, Dividers, Presets & Reset). Split into sub-components. | `src/app/admin/setup/palette/page.tsx`, `src/components/admin/palette/*.tsx` | T001, T002, T003 |

**Palette Page Sections (collapsible accordions):**
1. **Colors** (existing, at top — primary, accent, theme overrides, semantic colors)
2. **Typography** — H1/H2/H3 size sliders, weight dropdowns, letter spacing, text transform, heading color mode, body size/line-height. Live heading preview.
3. **Component Style** — Card: padding/radius/shadow/border width/border style. Button: radius/size/weight/text-transform/click feedback. Input: match card toggle. Badge: shape. Live card + button preview.
4. **Layout** — Content density toggle, section spacing, sidebar width, container max width, page header style, logo position, sticky header. Visual spacing preview.
5. **Interactive States** — Hover effect picker (with live demo), animation speed slider, focus ring width, page transition fade toggle.
6. **Dark Mode** — Mode control (user-choice/force-light/force-dark radio), card depth slider, accent brightness slider. Dark mode preview panel.
7. **Data Visualization** — Bar: thickness/radius. Line: width/curve/dots. Grid: visible/style. Trend lines toggle. Area fill toggle/opacity. Color strategy picker. Live mini chart preview.
8. **Tables** — Striped/clean toggle, row borders, header style. Live mini table preview.
9. **Loading & States** — Skeleton style picker, empty state style. Live skeleton preview.
10. **Notifications** — Toast position picker with visual position diagram.
11. **Forms** — Label position, required indicator, error style. Live form preview.
12. **Scroll & Page** — Smooth scroll, scroll-to-top button.
13. **Accessibility** — Contrast enforcement toggle, reduced motion respect toggle.
14. **Dividers** — Style picker with live preview.
15. **Presets & Reset** — 4 preset buttons, reset to defaults, export/import JSON.

**Completion test:** Admin can open the palette page, expand each accordion section, change settings, and save. Live previews work within each section. Presets apply. Reset works. Export/import works.

**Sprint 2 handoff note:** "Sprint 2 complete. Admin palette page fully functional. Sprint 3 ready."

---

### Sprint 3: Component Integration + Dark Mode + FOUC

**Goal:** Shared UI components consume the new variables. Dark mode control works. Page load is clean.

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **T004** | Eliminate FOUC — server-side color injection, replace hardcoded fallback values, body fade-in, font preload | `src/app/layout.tsx`, `src/app/affiliate/page.tsx`, `src/app/globals.css` | T002 |
| **T005** | Update ThemeToggle + header for dark mode control, user preference persistence API, logo position, sticky header | `src/components/theme-toggle.tsx`, `src/components/layout/header.tsx`, `src/app/dashboard/social/layout.tsx`, new API route | T002 |
| **T007** | Create shared chart configuration hook (`useChartConfig`) with color strategies, trend lines, Recharts-compatible props | `src/hooks/use-chart-config.ts` | T002 |
| **T008** | Create scroll-to-top component, smooth scroll, page transition wrapper | `src/components/scroll-to-top.tsx`, `src/app/layout.tsx` | T003 |
| **T011** | Update shared UI components (Card, Button, Badge, Input, Toast, Table) to consume new CSS variables | `src/components/ui/card.tsx`, `button.tsx`, `badge.tsx`, `input.tsx`, toast, table | T003 |

**Completion test:** Changing settings in admin palette page updates Card, Button, Badge, Input globally. Dark mode toggle appears/hides based on setting. No FOUC on page load. Scroll-to-top button works. Charts have a config hook ready.

**Sprint 3 handoff note:** "Sprint 3 complete. UI components wired. Sprint 4 ready."

---

### Sprint 4: Color Audit (Affiliate Dashboard + Components)

**Goal:** Every hardcoded color in the affiliate dashboard is replaced with palette-aware equivalents.

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **T009** | Audit and fix hardcoded colors in affiliate dashboard `page.tsx` (~50 instances). Replace with semantic tokens and palette classes. Wire charts to `useChartConfig`. | `src/app/affiliate/dashboard/page.tsx` | T003, T007 |
| **T010** | Audit and fix hardcoded colors in all 8 affiliate component files. Wire charts to `useChartConfig`. Replace status colors with semantic tokens. | `src/components/affiliate/*.tsx` (8 files) | T003, T007 |

**Files to audit:**
- `analytics-expanded.tsx` (285 lines) — chart hex colors, Tailwind colors
- `flywheel-analytics.tsx` (635 lines) — heavy hex usage for charts, multiple color arrays
- `flywheel-reports.tsx` (614 lines) — financial status colors
- `delight-features.tsx` (653 lines) — badge and challenge colors
- `resource-center.tsx` (435 lines) — category label colors
- `retention-tools.tsx` (645 lines) — status indicators
- `partner-experience.tsx` (244 lines) — dispute status colors
- `marketing-toolkit.tsx` (311 lines) — asset type colors

**Completion test:** Change primary color in admin palette and every element in affiliate dashboard updates (including charts). Zero hardcoded Tailwind color classes remain. Zero hardcoded hex values remain.

**Sprint 4 handoff note:** "Sprint 4 complete. Color audit done. Sprint 5 ready."

---

### Sprint 5: Integration Testing + Documentation

**Goal:** End-to-end verification of the complete design system. Documentation updated.

| Task | Description | Files | Depends On |
|------|-------------|-------|------------|
| **T013** | Full integration testing: FOUC, presets, reset, export/import, dark mode, colors, typography, components, charts, interactive states, scroll, toast, accessibility, print, light+dark modes | Various | T004-T012 |
| **T014** | Update all documentation: FEATURE_INVENTORY, LESSONS_LEARNED, ROADMAP, replit.md | `docs/*.md`, `replit.md` | T013 |

**Test matrix:**
- FOUC test: Hard-refresh pages — no color flash, no wrong data flash, no font flash
- Preset test: Apply all 4 presets, verify site-wide changes
- Reset test: Verify reset returns to Clean & Airy defaults
- Export/import test: Export config, change settings, import — verify restoration
- Dark mode test: user-choice shows toggle + persists preference; force-light/force-dark hide toggle and lock mode
- Color test: Change primary color — ALL colors update everywhere including charts
- Typography test: Change heading sizes — headings update across all dashboards
- Component test: Change card/button/badge settings — all pages update
- Chart test: Change bar/line/grid settings — all Recharts instances update
- Interactive test: Change hover effect, animation speed — feel changes
- Scroll test: Toggle smooth scroll, scroll-to-top
- Toast test: Change position — toasts appear in new position
- Accessibility test: Contrast enforcement adjusts low-contrast colors; reduced motion disables animations
- Print test: Print preview a report/invoice — clean output
- Light AND dark mode: Every test above in both modes

**Completion test:** Every configurable setting works end-to-end. Site is visually consistent across all dashboards and marketing pages. Documentation is complete.

**Sprint 5 handoff note:** "Sprint 5 complete. Design System Configuration fully operational."

---

## Key Files Reference

| File | Role |
|------|------|
| `src/types/settings.ts` | TypeScript types for all settings (BrandingSettings interface) |
| `src/hooks/use-settings.ts` | Theme injection hook — reads settings, pushes CSS variables to `:root` |
| `src/app/globals.css` | CSS variable defaults, base rules, print styles, accessibility |
| `src/app/admin/setup/palette/page.tsx` | Admin palette configuration page |
| `src/components/admin/palette/*.tsx` | Sub-components for palette page sections (NEW) |
| `src/hooks/use-chart-config.ts` | Shared chart configuration hook for Recharts (NEW) |
| `src/lib/design-presets.ts` | 4 preset theme definitions + export/import (NEW) |
| `src/components/theme-toggle.tsx` | Light/dark mode toggle (modified for darkModeOption) |
| `src/components/layout/header.tsx` | Header (modified for logo position, sticky, toggle visibility) |
| `src/components/scroll-to-top.tsx` | Scroll-to-top floating button (NEW) |
| `src/components/ui/card.tsx` | Card component (modified to consume CSS vars) |
| `src/components/ui/button.tsx` | Button component (modified to consume CSS vars) |
| `src/components/ui/badge.tsx` | Badge component (modified to consume CSS vars) |
| `src/components/ui/input.tsx` | Input component (modified for inputStyleMatch) |
| `src/app/layout.tsx` | Root layout (modified for FOUC fix, scroll-to-top, transitions) |
| `src/app/affiliate/dashboard/page.tsx` | Affiliate dashboard (color audit target) |
| `src/components/affiliate/*.tsx` | 8 affiliate component files (color audit targets) |

---

## Rules for Future Development

After this blueprint is implemented, these rules are permanent:

1. **Never hardcode colors.** Use palette CSS variables (`bg-primary-*`, `text-primary-*`) or semantic tokens (`--success`, `--warning`, `--danger`). No `text-red-600`, no `bg-blue-500`, no `#3b82f6`.
2. **Always use `useChartConfig()` for charts.** Never pass raw hex colors or hardcoded props to Recharts components.
3. **Respect `darkModeOption`.** Never render a theme toggle without checking this setting.
4. **Never use hardcoded fallback values.** Use skeleton/shimmer placeholders while data loads. Never show "20%" when the real value is "17.9%".
5. **Test both light and dark modes.** Every visual change must look correct in both.
6. **New settings go through the pipeline.** Type in settings.ts then hook injection then CSS default then admin UI then documentation. No shortcuts.

---

## Session Continuity Protocol

To prevent partial completion surprises:

1. **Each session starts by reading this document** and checking ROADMAP.md for which sprint is current.
2. **Each session works on exactly one sprint** (or finishes a partially-completed sprint from last session).
3. **At the end of every session**, the agent updates ROADMAP.md with: which sprint completed, which tasks within it completed, and what the next session should start with.
4. **If a sprint cannot be completed in the current session**, the agent must tell the user before the session ends: "Sprint X is partially done. Tasks T00Y and T00Z are complete. Task T00W is not started. The next session should resume with T00W."
5. **The user should never discover partial completion after the fact.** Transparency is mandatory.
