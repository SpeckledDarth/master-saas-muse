'use client'

import type { TooltipProps } from 'recharts'

export function ThemedChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  valueFormatter,
}: TooltipProps<number, string> & {
  valueLabel?: string
  valueFormatter?: (value: number) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mt-1">
          <span
            className="block h-2.5 w-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {valueLabel || entry.name}
          </span>
          <span className="font-medium tabular-nums text-popover-foreground ml-auto">
            {valueFormatter && typeof entry.value === 'number'
              ? valueFormatter(entry.value)
              : entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
