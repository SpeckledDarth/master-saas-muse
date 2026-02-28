'use client'

export function Sparkline({
  data,
  width = 60,
  height = 16,
  color = 'hsl(var(--chart-1))',
  strokeWidth = 1.5,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
}) {
  if (!data || data.length < 2) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const padding = 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - padding * 2) - padding
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      className="inline-block align-middle"
      data-testid="sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
