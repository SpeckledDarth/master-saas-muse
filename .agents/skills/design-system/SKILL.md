---
name: design-system
description: Enforces the PassivePost/MuseKit design system when building or modifying any UI component, page, dashboard, or visual element. Use when writing JSX, creating components, adding pages, styling elements, working with Tailwind classes, building charts, or modifying any file that renders UI. Contains CSS variable mapping, wrapper components, and strict Never/Always rules.
---

# Design System — Mandatory Styling Rules

The admin-configurable Color Palette page (`/admin/setup/palette`) generates CSS variables that control ALL visual styling. Every component MUST consume these variables. Hardcoding Tailwind classes for spacing, colors, radius, or shadows is FORBIDDEN.

This design system took days to build. Sessions that ignore it and hardcode values cost the user days of rework. Do not be that session.

## CSS Variable Mapping

### Spacing & Layout

| Instead of... | Use... | CSS Variable |
|---|---|---|
| `p-4`, `p-6` on cards | `p-[var(--card-padding)]` | `--card-padding` |
| `gap-3`, `gap-4` in grids | `gap-[var(--content-density-gap)]` | `--content-density-gap` |
| `space-y-6`, `py-8` between sections | `space-y-[var(--section-spacing)]` | `--section-spacing` |
| Fixed max-width values | `max-w-[var(--container-max-width)]` | `--container-max-width` |
| Fixed sidebar widths | `w-[var(--sidebar-width)]` | `--sidebar-width` |

### Border Radius

| Instead of... | Use... | CSS Variable |
|---|---|---|
| `rounded-lg`, `rounded-md` on cards | `rounded-[var(--card-radius)]` | `--card-radius` |
| `rounded-full`, `rounded-md` on buttons | `rounded-[var(--btn-radius)]` | `--btn-radius` |
| `rounded-full`, `rounded-sm` on badges | `rounded-[var(--badge-radius)]` | `--badge-radius` |
| `rounded-md` on inputs | `rounded-[var(--input-radius)]` | `--input-radius` |

### Shadows & Borders

| Instead of... | Use... | CSS Variable |
|---|---|---|
| `shadow-sm`, `shadow-md` on cards | `shadow-[var(--card-shadow)]` | `--card-shadow` |
| `border`, `border-2` on cards | `border-[length:var(--card-border-width)]` | `--card-border-width` |
| `border-solid`, `border-dashed` | `border-[var(--card-border-style)]` | `--card-border-style` |

### Primary & Accent 950 Scale — MANDATORY (Do Not Remove, Do Not "Fix")

This project uses a full Tailwind 950 numeric color scale for `primary` and `accent`. This is a foundational architectural decision, not a suggestion. Removing or replacing 950 scale usage is a VIOLATION of the design system.

**How it works (the architecture):**
1. `tailwind.config.ts` (lines 29–43) defines `primary-50` through `primary-950`, each resolving to `hsl(var(--primary-50))`, `hsl(var(--primary-100))`, etc.
2. `src/app/globals.css` (lines 17–27) defines default HSL values for each step of the scale
3. The palette page (`/admin/setup/palette`) regenerates the full 50–950 scale whenever the admin changes the primary color
4. Components use Tailwind classes like `text-primary-600` which Tailwind resolves to the CSS variable, which the palette controls
5. Result: changing one color on the palette page automatically updates every component site-wide

**These classes are palette-controlled and CORRECT — do NOT alter them:**
- `text-primary-600`, `bg-primary-100`, `border-primary-400`, `text-primary-800`
- `text-accent-500`, `bg-accent-100`, `border-accent-600`
- Any `primary-{50-950}` or `accent-{50-950}` variant

**Standard light/dark shade pattern (this IS the correct approach):**
```tsx
text-primary-600 dark:text-primary-400
bg-primary-100 dark:bg-primary-900
border-primary-600 dark:border-primary-400
```

**VIOLATIONS (do NOT do these):**
- Replacing `text-primary-600 dark:text-primary-400` with `text-primary` — this REMOVES shade control. The 950 scale exists to provide precise light/dark variation that `text-primary` alone cannot.
- Replacing `text-primary-600` with `text-[hsl(var(--primary))]` — the 950 scale is the correct pattern. Do not bypass it.
- Flagging 950 scale usage as "hardcoded" — it is NOT hardcoded. It resolves to CSS variables controlled by the palette.

**Decision tree — choosing the right color pattern:**
1. Need a color for success/warning/danger/info feedback? → Use semantic tokens: `text-[hsl(var(--success))]`, `bg-[hsl(var(--warning)/0.1)]`
2. Need a brand-colored element with shade variation? → Use the 950 scale: `text-primary-600 dark:text-primary-400`, `bg-accent-100`
3. Need a base brand color without shade variation? → Use `text-primary`, `bg-primary`
4. Considering a named Tailwind color like `text-green-600` or `bg-blue-50`? → VIOLATION. These bypass the palette. Use semantic tokens or the 950 scale instead.

### Semantic Colors

| Instead of... | Use... | CSS Variable |
|---|---|---|
| `text-green-600`, `bg-green-100` | `text-[hsl(var(--success))]`, `bg-[hsl(var(--success)/0.1)]` | `--success` |
| `text-amber-600`, `text-yellow-600` | `text-[hsl(var(--warning))]` | `--warning` |
| `text-red-600`, `bg-red-100` | `text-[hsl(var(--danger))]`, `bg-[hsl(var(--danger)/0.1)]` | `--danger` |
| `text-blue-600`, `bg-blue-50` | `text-[hsl(var(--info))]`, `bg-[hsl(var(--info)/0.1)]` | `--info` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` | `--muted-foreground` |

**Allowed Tailwind color classes** (these ARE CSS variables, not hardcoded):
`text-primary`, `text-primary-{50-950}`, `text-accent-{50-950}`, `text-destructive`, `text-muted-foreground`, `text-foreground`, `bg-[var(--card-bg)]`, `bg-background`, `bg-muted`, `bg-primary`, `bg-primary-{50-950}`, `bg-accent-{50-950}`, `border-border`, `border-input`, `border-primary-{50-950}`, `border-accent-{50-950}`

**⚠ `bg-card` is NOT allowed for card elements.** Use `bg-[var(--card-bg)]` or DSCard instead. `bg-card` resolves to solid `hsl(var(--card))` which doesn't match the transparent card background `--card-bg: rgba(255, 255, 255, 0.09)`.

### Typography

CSS variables: `--h1-size`, `--h1-weight`, `--h1-spacing`, `--h1-transform`, `--h2-*`, `--h3-*`, `--body-size`, `--body-line-height`, `--font-heading`, `--font-body`

### Buttons

CSS variables: `--btn-radius`, `--btn-padding`, `--btn-font-weight`, `--btn-text-transform`

### Interactive States

CSS variables: `--hover-transform`, `--hover-shadow`, `--transition-speed`, `--focus-ring-width`, `--click-scale`

### Charts — ALWAYS use `useChartConfig()` hook

```tsx
import { useChartConfig } from '@/hooks/use-chart-config'
const chartConfig = useChartConfig()

chartConfig.colors[0]  // hsl(var(--chart-1))
chartConfig.colors[1]  // hsl(var(--chart-2))
chartConfig.barSize     // from palette setting
chartConfig.barRadius   // from palette setting
chartConfig.lineWidth   // from palette setting
chartConfig.lineCurve   // monotone/linear/step
chartConfig.showDots    // from palette setting
chartConfig.showGrid    // from palette setting
```

Never hardcode chart colors, bar sizes, or line widths.

## Wrapper Components

Use these instead of raw shadcn components:

| Component | Import | What it does |
|---|---|---|
| `<DSCard>` | `@/components/ui/ds-card` | Card with auto padding, radius, shadow, border from palette |
| `<DSSection>` | `@/components/ui/ds-section` | Section with auto vertical spacing from palette |
| `<DSGrid>` | `@/components/ui/ds-grid` | Grid with auto gap from content density setting |

## NEVER DO (VIOLATIONS)

1. Use named Tailwind color classes: `text-green-600`, `bg-amber-100`, `text-red-500`, `text-blue-*`, `bg-green-*` — these bypass the palette
2. Replace `text-primary-600 dark:text-primary-400` with `text-primary` — this removes shade control and is WRONG
3. Replace 950 scale usage with `text-[hsl(var(--primary))]` — the 950 scale is the correct pattern
4. Flag 950 scale classes as "hardcoded" — they resolve to CSS variables and are palette-controlled
5. Hardcode spacing on cards: `p-4`, `p-6`, `px-8` — use `p-[var(--card-padding)]`
6. Hardcode border radius: `rounded-lg`, `rounded-xl`, `rounded-md` — use `rounded-[var(--card-radius)]`
7. Hardcode shadows: `shadow-sm`, `shadow-md`, `shadow-lg` — use `shadow-[var(--card-shadow)]`
8. Hardcode grid gaps: `gap-3`, `gap-4`, `gap-6` — use `gap-[var(--content-density-gap)]`
9. Hardcode section spacing: `space-y-6`, `space-y-8`, `py-8`, `py-12` — use `space-y-[var(--section-spacing)]`
10. Hardcode chart colors: `fill="#22c55e"`, `stroke="hsl(142 71% 45%)"` — use `chartConfig.colors[n]`
11. Use `hsl(var(--primary))` directly in charts — use `chartConfig.colors[n]` instead
12. Use raw `Card` component instead of `DSCard` — raw Card bypasses palette padding, radius, shadow, and border

## ALWAYS DO (MANDATORY)

1. Use CSS variable classes for spacing: `p-[var(--card-padding)]`, `gap-[var(--content-density-gap)]`
2. Use the 950 scale for brand color shade variation: `text-primary-600 dark:text-primary-400`, `bg-primary-100 dark:bg-primary-900`
3. Use semantic color tokens for feedback: `text-[hsl(var(--success))]`, `text-[hsl(var(--warning))]`, `text-[hsl(var(--danger))]`, `text-[hsl(var(--info))]`
4. Use `useChartConfig()` hook for ALL chart styling
5. Use DS wrapper components (`DSCard`, `DSSection`, `DSGrid`) — never raw `Card`
6. Use palette-aware Tailwind classes: `text-primary`, `text-primary-{50-950}`, `text-accent-{50-950}`, `text-destructive`, `text-muted-foreground`, `bg-card`, `bg-muted`
7. When unsure if a color class is palette-controlled, check `tailwind.config.ts` — if it resolves to `hsl(var(--...))`, it's safe

## Exceptions (allowed hardcoded values)

- `text-xs`, `text-sm`, `text-lg`, `text-2xl` — font sizes not covered by palette
- `font-bold`, `font-medium`, `font-semibold` — font weights in body text
- `min-h-[400px]`, `h-[300px]` — chart container heights
- `w-4`, `h-4`, `w-8`, `h-8` — icon sizes
- `mb-2`, `mt-1`, `ml-1` — micro-spacing (≤0.75rem) between inline elements within a component
- `animate-pulse`, `animate-spin` — animations
- `truncate`, `tabular-nums`, `whitespace-nowrap` — text utilities

## UX Standards — Admin Data Pages

All admin pages showing data lists MUST use these shared components. No exceptions.

### Mandatory Components

| Component | Import | Use For |
|---|---|---|
| `<AdminDataTable>` | `@/components/admin/data-table` | All data tables (sorting, pagination, clickable rows, selectable checkboxes, loading skeleton, coaching-language empty states) |
| `<TableToolbar>` | `@/components/admin/table-toolbar` | Search + filter bar above every table (X clear button, filter dropdowns, "Clear All", built-in CSV export) |
| `<ConfirmDialog>` | `@/components/admin/confirm-dialog` | All destructive confirmations. NEVER use `window.confirm()` or `confirm()`. |

### Patterns

- **List pages:** TableToolbar at top → AdminDataTable below. Entire rows are clickable. Sortable columns show arrow indicators. Pagination at bottom.
- **Detail pages:** Breadcrumbs → summary header → collapsible accordion sections with cross-linked related data.
- **Confirmations:** `<ConfirmDialog variant="destructive">` for all delete/remove/reject actions.
- **Money:** Always `$X.XX` format. Never em-dash for zero. Use `tabular-nums` class.
- **Status dots:** Small colored dots + text using `--success`, `--danger`, `--warning`. Not large badges.
- **Empty states:** Coaching-language text guiding the admin toward the next action.

### CSV Export

Built into `<TableToolbar>` via the `csvExport` prop:

```tsx
<TableToolbar
  csvExport={{
    filename: 'users-export',
    headers: ['Name', 'Email', 'Role'],
    getRows: () => data.map(u => [u.name, u.email, u.role]),
  }}
/>
```

## Key Files

- `docs/DESIGN_SYSTEM_RULES.md` — Full reference (read if you need more detail)
- `src/hooks/use-settings.ts` — CSS variable injection pipeline
- `src/hooks/use-chart-config.ts` — Chart configuration hook
- `src/components/ui/ds-card.tsx` — DSCard wrapper
- `src/components/ui/ds-grid.tsx` — DSGrid wrapper
- `src/components/ui/ds-section.tsx` — DSSection wrapper
- `src/components/admin/data-table.tsx` — AdminDataTable (shared data table)
- `src/components/admin/table-toolbar.tsx` — TableToolbar (shared search/filter bar)
- `src/components/admin/confirm-dialog.tsx` — ConfirmDialog (shared confirmation dialog)
- `src/lib/csv-export.ts` — CSV export utility
- `src/app/globals.css` — CSS variable defaults
