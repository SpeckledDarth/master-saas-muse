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

### Primary & Accent 950 Scale (CORRECT — Do Not Remove)

The project uses a full Tailwind 950 numeric color scale for `primary` and `accent`. These are defined in `tailwind.config.ts` and resolve to CSS variables (`--primary-50` through `--primary-950`, `--accent-50` through `--accent-950`) set in `globals.css`. The palette page regenerates these values when the admin changes the primary color.

**These classes are palette-controlled and CORRECT:**
- `text-primary-600`, `bg-primary-100`, `border-primary-400`, `text-primary-800`
- `text-accent-500`, `bg-accent-100`, `border-accent-600`
- Any `primary-{50-950}` or `accent-{50-950}` variant

**Standard light/dark shade pattern:**
```tsx
text-primary-600 dark:text-primary-400
bg-primary-100 dark:bg-primary-900
border-primary-600 dark:border-primary-400
```

**Do NOT "fix" these** by replacing them with `text-primary` or `text-[hsl(var(--primary))]`. The 950 scale gives precise shade control that the base `text-primary` class cannot provide.

### Semantic Colors

| Instead of... | Use... | CSS Variable |
|---|---|---|
| `text-green-600`, `bg-green-100` | `text-[hsl(var(--success))]`, `bg-[hsl(var(--success)/0.1)]` | `--success` |
| `text-amber-600`, `text-yellow-600` | `text-[hsl(var(--warning))]` | `--warning` |
| `text-red-600`, `bg-red-100` | `text-[hsl(var(--danger))]`, `bg-[hsl(var(--danger)/0.1)]` | `--danger` |
| `text-blue-600`, `bg-blue-50` | `text-[hsl(var(--info))]`, `bg-[hsl(var(--info)/0.1)]` | `--info` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` | `--muted-foreground` |

**Allowed Tailwind color classes** (these ARE CSS variables, not hardcoded):
`text-primary`, `text-primary-{50-950}`, `text-accent-{50-950}`, `text-destructive`, `text-muted-foreground`, `text-foreground`, `bg-card`, `bg-background`, `bg-muted`, `bg-primary`, `bg-primary-{50-950}`, `bg-accent-{50-950}`, `border-border`, `border-input`, `border-primary-{50-950}`, `border-accent-{50-950}`

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

## NEVER DO

1. Hardcode Tailwind color classes: `text-green-600`, `bg-amber-100`, `text-red-500`, `text-blue-*`, `bg-green-*`
2. Hardcode spacing on cards: `p-4`, `p-6`, `px-8`
3. Hardcode border radius: `rounded-lg`, `rounded-xl`, `rounded-md`
4. Hardcode shadows: `shadow-sm`, `shadow-md`, `shadow-lg`
5. Hardcode grid gaps: `gap-3`, `gap-4`, `gap-6`
6. Hardcode section spacing: `space-y-6`, `space-y-8`, `py-8`, `py-12`
7. Hardcode chart colors: `fill="#22c55e"`, `stroke="hsl(142 71% 45%)"`
8. Use `hsl(var(--primary))` directly in charts — use `chartConfig.colors[n]` instead

## ALWAYS DO

1. Use CSS variable classes: `p-[var(--card-padding)]`, `gap-[var(--content-density-gap)]`
2. Use semantic color tokens: `text-[hsl(var(--success))]`, `text-[hsl(var(--warning))]`
3. Use `useChartConfig()` hook for ALL chart styling
4. Use DS wrapper components (`DSCard`, `DSSection`, `DSGrid`) when possible
5. Use palette-aware Tailwind classes: `text-primary`, `text-destructive`, `text-muted-foreground`

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
