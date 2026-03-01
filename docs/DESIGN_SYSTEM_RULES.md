# Design System Rules — Mandatory Reference

> **Every component, every page, every session.** No exceptions.

This document is the single source of truth for how to style components in PassivePost. The Color Palette page (`/admin/setup/palette`) generates CSS variables that control spacing, colors, typography, borders, shadows, and more. **All components must consume these variables instead of using hardcoded Tailwind classes.**

---

## Quick Reference: CSS Variable Mapping

### Spacing & Layout

| Instead of... | Use... | CSS Variable | Palette Setting |
|---|---|---|---|
| `p-4`, `p-6` on cards | `p-[var(--card-padding)]` | `--card-padding` | Card Padding (compact/default/spacious) |
| `gap-3`, `gap-4` in grids | `gap-[var(--content-density-gap)]` | `--content-density-gap` | Content Density (compact/default/spacious) |
| `space-y-6`, `py-8` between sections | `space-y-[var(--section-spacing)]` | `--section-spacing` | Section Spacing (compact/default/spacious) |
| Fixed max-width values | `max-w-[var(--container-max-width)]` | `--container-max-width` | Container Max Width |
| Fixed sidebar widths | `w-[var(--sidebar-width)]` | `--sidebar-width` | Sidebar Width (narrow/default/wide) |

**Value mappings:**
- `--card-padding`: compact=0.75rem, default=1.25rem, spacious=1.75rem
- `--content-density-gap`: compact=0.5rem, default=1rem, spacious=1.5rem
- `--section-spacing`: compact=2rem, default=3.5rem, spacious=5rem
- `--sidebar-width`: narrow=14rem, default=16rem, wide=18rem

### Border Radius

| Instead of... | Use... | CSS Variable | Palette Setting |
|---|---|---|---|
| `rounded-lg`, `rounded-md` on cards | `rounded-[var(--card-radius)]` | `--card-radius` | Card Border Radius (none/sm/md/lg/xl) |
| `rounded-full`, `rounded-md` on buttons | `rounded-[var(--btn-radius)]` | `--btn-radius` | Button Radius (pill/rounded) |
| `rounded-full`, `rounded-sm` on badges | `rounded-[var(--badge-radius)]` | `--badge-radius` | Badge Shape (pill/rounded/square) |
| `rounded-md` on inputs | `rounded-[var(--input-radius)]` | `--input-radius` | Input Style Match (mirrors card radius) |

**Value mappings:**
- `--card-radius`: none=0, sm=0.25rem, md=0.5rem, lg=0.75rem, xl=1rem
- `--btn-radius`: pill=9999px, rounded=0.375rem
- `--badge-radius`: pill=9999px, rounded=0.375rem, square=0.125rem

### Shadows & Borders

| Instead of... | Use... | CSS Variable | Palette Setting |
|---|---|---|---|
| `shadow-sm`, `shadow-md` on cards | `shadow-[var(--card-shadow)]` | `--card-shadow` | Card Shadow (none/sm/md/lg) |
| `border`, `border-2` on cards | `border-[length:var(--card-border-width)]` | `--card-border-width` | Card Border Width (0/1px/2px) |
| `border-solid`, `border-dashed` | `border-[var(--card-border-style)]` | `--card-border-style` | Card Border Style (solid/dashed/none) |

### Card Background

| Instead of... | Use... | CSS Variable | Notes |
|---|---|---|---|
| `bg-card` on raw divs/Links | `bg-[var(--card-bg)]` | `--card-bg` | Transparent glass background (rgba). The Card/DSCard component applies this automatically. Raw elements MUST use `bg-[var(--card-bg)]` instead of `bg-card`. |

**Why not `bg-card`?** The `bg-card` Tailwind class resolves to `hsl(var(--card))` — a SOLID opaque color. The actual card background is `--card-bg: rgba(255, 255, 255, 0.09)` — a transparent overlay. These are visually different. The Card component uses `--card-bg`. Any raw element styled as a card must also use `--card-bg`.

### Colors — Semantic Tokens

| Instead of... | Use... | CSS Variable | Notes |
|---|---|---|---|
| `text-green-600`, `bg-green-100` | `text-[hsl(var(--success))]`, `bg-[hsl(var(--success)/0.1)]` | `--success` | Harmonized with primary color |
| `text-amber-600`, `text-yellow-600` | `text-[hsl(var(--warning))]` | `--warning` | Harmonized with primary color |
| `text-red-600`, `bg-red-100` | `text-[hsl(var(--danger))]`, `bg-[hsl(var(--danger)/0.1)]` | `--danger` | Harmonized with primary color |
| `text-blue-600`, `bg-blue-50` | `text-[hsl(var(--info))]`, `bg-[hsl(var(--info)/0.1)]` | `--info` | Info/tip elements, neutral highlights |
| `text-purple-600`, `text-orange-600` | `text-primary` or `text-[hsl(var(--warning))]` | varies | Purple→primary, Orange→warning |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` | `--muted-foreground` | Muted/disabled text |
| `text-primary` | `text-primary` (OK) | `--primary` | Already a CSS variable class |
| `text-destructive` | `text-destructive` (OK) | `--destructive` | Already a CSS variable class — equivalent to `--danger` |
| `text-muted-foreground` | `text-muted-foreground` (OK) | `--muted-foreground` | Already a CSS variable class |

**Allowed Tailwind color classes** (these ARE CSS variables, not hardcoded):
`text-primary`, `text-destructive`, `text-muted-foreground`, `text-foreground`, `bg-[var(--card-bg)]`, `bg-background`, `bg-muted`, `bg-primary`, `border-border`, `border-input`

**⚠ `bg-card` is NOT allowed for card elements.** Use `bg-[var(--card-bg)]` or DSCard instead. `bg-card` resolves to a solid opaque color that doesn't match the transparent card background.

**NEVER use these** (hardcoded, bypass the palette):
`text-green-*`, `text-red-*`, `text-amber-*`, `text-yellow-*`, `text-blue-*`, `bg-green-*`, `bg-red-*`, `bg-amber-*`, `bg-yellow-*`, `bg-blue-*`

### Typography

| CSS Variable | Palette Setting | Values |
|---|---|---|
| `--h1-size` | H1 Font Size | Any valid CSS size |
| `--h1-weight` | H1 Font Weight | 400-900 |
| `--h1-spacing` | H1 Letter Spacing | e.g. `-0.02em` |
| `--h1-transform` | H1 Text Transform | none/uppercase/capitalize |
| `--h2-size`, `--h2-weight`, `--h2-spacing`, `--h2-transform` | H2 variants | Same as H1 |
| `--h3-size`, `--h3-weight`, `--h3-spacing`, `--h3-transform` | H3 variants | Same as H1 |
| `--body-size` | Body Font Size | e.g. `0.875rem` |
| `--body-line-height` | Body Line Height | 1.4/1.5/1.6/1.75 |
| `--font-heading` | Heading Font | Google Font family |
| `--font-body` | Body Font | Google Font family |

### Buttons

| CSS Variable | Palette Setting | Values |
|---|---|---|
| `--btn-radius` | Button Radius | pill=9999px, rounded=0.375rem |
| `--btn-padding` | Button Size | compact=0.375rem 0.75rem, default=0.5rem 1rem, large=0.625rem 1.5rem |
| `--btn-font-weight` | Button Font Weight | 500/600/700 |
| `--btn-text-transform` | Button Text Transform | none/uppercase |

### Interactive States

| CSS Variable | Palette Setting | Values |
|---|---|---|
| `--hover-transform` | Hover Effect | lift=translateY(-2px), glow=none, scale=scale(1.02), none=none |
| `--hover-shadow` | Hover Effect | lift=elevated shadow, glow=primary glow, scale/none=none |
| `--transition-speed` | Animation Speed | fast=100ms, normal=200ms, slow=350ms, none=0ms |
| `--focus-ring-width` | Focus Ring Width | 1px/2px/3px |
| `--click-scale` | Button Click Feedback | 0.97 (enabled) or 1 (disabled) |

### Charts (use `useChartConfig()` hook)

**ALWAYS use the `useChartConfig()` hook for Recharts components.** Never hardcode chart properties.

```tsx
const chartConfig = useChartConfig()

// Colors
chartConfig.colors[0]  // hsl(var(--chart-1))
chartConfig.colors[1]  // hsl(var(--chart-2))
chartConfig.colors[2]  // hsl(var(--chart-3))

// Line charts
<Line strokeWidth={chartConfig.lineWidth} type={chartConfig.lineCurve} dot={chartConfig.showDots} />

// Bar charts
<BarChart barSize={chartConfig.barSize}>
  <Bar radius={[chartConfig.barRadius, chartConfig.barRadius, 0, 0]} />
</BarChart>

// Grid
{chartConfig.showGrid && <CartesianGrid strokeDasharray={chartConfig.gridDasharray} />}
```

| Hook Property | CSS Variable / Setting | Values |
|---|---|---|
| `chartConfig.barSize` | `--chart-bar-size` / chartBarThickness | thin=12, default=20, thick=32 |
| `chartConfig.barRadius` | `--chart-bar-radius` / chartBarRadius | none=0, sm=2, md=4 |
| `chartConfig.lineWidth` | `--chart-line-width` / chartLineWidth | 1/2/3 |
| `chartConfig.lineCurve` | chartLineCurve | monotone/linear/step |
| `chartConfig.showDots` | chartDots | true/false |
| `chartConfig.showGrid` | chartGridLines | visible/hidden |
| `chartConfig.gridDasharray` | chartGridStyle | dashed="3 3"/solid="0" |
| `chartConfig.colors[]` | `--chart-1` through `--chart-5` | Generated from primary color |

### Tables

| CSS Variable | Palette Setting | Values |
|---|---|---|
| `--table-stripe-opacity` | Table Style | striped=0.04, clean=0 |
| `--table-border-opacity` | Table Row Borders | true=1, false=0 |

### Dark Mode

| CSS Variable | Palette Setting | Values |
|---|---|---|
| `--dark-depth-offset` | Dark Card Depth | subtle=2%, default=4%, deep=8% |
| `--dark-accent-saturation` | Dark Accent Brightness | muted=70%, default=100%, vivid=130% |

### Data Attributes (set on `<html>`)

These control CSS rules in `globals.css`:
- `data-heading-color`: primary/foreground/gradient
- `data-skeleton`: pulse/shimmer/static
- `data-divider`: line/gradient/none
- `data-dark-mode`: user-choice/force-light/force-dark
- `data-empty-state`: illustration/icon-only
- `data-toast-position`: top-right/top-center/bottom-right/bottom-center
- `data-label-position`: above/floating
- `data-required-indicator`: asterisk/text/border
- `data-error-style`: inline/tooltip
- `data-chart-curve`, `data-chart-dots`, `data-chart-grid`, etc.

---

## Design System Wrapper Components

Use these instead of raw shadcn components to get automatic palette compliance:

| Component | Import | What it does |
|---|---|---|
| `<DSCard>` | `@/components/ui/ds-card` | Card with auto padding, radius, shadow, border from palette |
| `<DSSection>` | `@/components/ui/ds-section` | Section with auto vertical spacing from palette |
| `<DSGrid>` | `@/components/ui/ds-grid` | Grid with auto gap from content density setting |

---

## Rules — Non-Negotiable

### NEVER DO:
1. Hardcode Tailwind color classes: `text-green-600`, `bg-amber-100`, `text-red-500`
2. Hardcode spacing on cards: `p-4`, `p-6`, `px-8`
3. Hardcode border radius: `rounded-lg`, `rounded-xl`, `rounded-md`
4. Hardcode shadows: `shadow-sm`, `shadow-md`, `shadow-lg`
5. Hardcode grid gaps: `gap-3`, `gap-4`, `gap-6`
6. Hardcode section spacing: `space-y-6`, `space-y-8`, `py-8`, `py-12`
7. Hardcode chart colors: `fill="#22c55e"`, `stroke="hsl(142 71% 45%)"`
8. Use `hsl(var(--primary))` directly in charts — use `chartConfig.colors[n]` instead

### ALWAYS DO:
1. Use CSS variable classes: `p-[var(--card-padding)]`, `gap-[var(--content-density-gap)]`
2. Use semantic color tokens: `text-[hsl(var(--success))]`, `text-[hsl(var(--warning))]`
3. Use `useChartConfig()` hook for ALL chart styling
4. Use DS wrapper components (`DSCard`, `DSSection`, `DSGrid`) when possible
5. Use palette-aware Tailwind classes: `text-primary`, `text-destructive`, `text-muted-foreground`, `bg-card`, `bg-muted`
6. Check this document before writing any component styling

### EXCEPTIONS (allowed hardcoded values):
- `text-xs`, `text-sm`, `text-lg`, `text-2xl` — font sizes not covered by palette
- `font-bold`, `font-medium`, `font-semibold` — font weights in body text
- `min-h-[400px]`, `h-[300px]` — chart container heights
- `w-4`, `h-4`, `w-8`, `h-8` — icon sizes
- `mb-2`, `mt-1`, `ml-1` — micro-spacing between inline elements within a component
- `animate-pulse`, `animate-spin` — animations
- `truncate`, `tabular-nums`, `whitespace-nowrap` — text utilities

---

## UX Standards — Admin Dashboard Patterns

All admin data pages MUST follow these patterns. Using any other pattern creates inconsistency that requires rework.

### Shared Components (MANDATORY)

Every admin page showing a data list MUST use these components:

| Component | Import | Purpose |
|---|---|---|
| `<AdminDataTable>` | `@/components/admin/data-table` | All data tables. Provides sorting, pagination, clickable rows, selectable checkboxes, loading skeleton, coaching-language empty states. |
| `<TableToolbar>` | `@/components/admin/table-toolbar` | Search + filter bar above every table. Includes X clear button on search, filter dropdowns, "Clear All" reset, built-in CSV export. |
| `<ConfirmDialog>` | `@/components/admin/confirm-dialog` | All destructive confirmations. Replaces `window.confirm()` and `confirm()`. Supports loading state. |

### List View Pattern

1. **Toolbar at top:** `<TableToolbar>` with search (always has X clear button) + filter dropdowns side by side.
2. **Data table below:** `<AdminDataTable>` with clickable rows (entire row is clickable, cursor pointer). No card wrapper around the table.
3. **Clickable column headers:** Sortable columns show arrow indicator for sort direction.
4. **Status indicators:** Small colored dots + text using semantic tokens (`--success`, `--danger`, `--warning`). Not large badges.
5. **Pagination:** "Showing X–Y of Z" with prev/next at bottom.
6. **Empty state:** Coaching-language text that guides the admin toward action, not generic "No results."
7. **CSV export:** Available via TableToolbar on every list page.

### Detail View Pattern

1. **Breadcrumb at top:** Full hierarchy path, each segment clickable.
2. **Summary header:** Key facts at a glance + action buttons.
3. **Collapsible accordion sections:** Related data in expandable sections. Multiple can be open.
4. **Cross-linking:** Person names, amounts, and entity references are clickable links to their detail pages.

### Confirmation Pattern

- **All destructive actions** (delete, remove, reject) use `<ConfirmDialog variant="destructive">`.
- **Never use** `window.confirm()` or `confirm()`.
- The dialog shows a clear title, description of consequences, and loading state during async operations.

### Money Display

- Always format as `$X.XX` (e.g., `$0.00`, `$127.50`).
- Never use em-dash (—) for zero amounts.
- Use `tabular-nums` class for numeric columns so digits align vertically.

### Status Indicators

Use small colored dots + text label. Do not use large badges for row-level status.

```tsx
<span className="inline-flex items-center gap-1.5">
  <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
  <span className="text-sm">Active</span>
</span>
```

### Empty States — Coaching Language

Every table's empty state should coach the admin toward the next action:

| Page | Empty Message | Empty Description |
|---|---|---|
| Users | No users yet | Users will appear here once people sign up for your product. |
| Affiliates | No affiliates yet | Share your affiliate program link to start recruiting partners. |
| Revenue | No revenue recorded | Revenue will appear here once customers complete payments. |
| Tickets | No support tickets | Your users haven't submitted any tickets yet — that's a good sign! |
| Feedback | No feedback received | Feedback will appear here when users submit it through the widget. |
| Waitlist | No waitlist entries | Share your waitlist page to start collecting signups. |
| Team | No team members | Invite team members to help manage your product. |
| Audit Logs | No audit entries | Actions will be logged here as you and your team use the admin dashboard. |
