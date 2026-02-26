'use client'

import { useMemo } from 'react'
import { useSettings } from '@/hooks/use-settings'

export interface ChartConfig {
  barSize: number
  barRadius: number
  lineWidth: number
  lineCurve: 'monotone' | 'linear' | 'step'
  showDots: boolean
  showGrid: boolean
  gridDasharray: string
  showTrendLine: boolean
  areaFill: boolean
  areaOpacity: number
  colorStrategy: 'monochromatic' | 'complementary' | 'multi'
  tooltipMatchCard: boolean
  colors: string[]
}

export function useChartConfig(): ChartConfig {
  const { settings } = useSettings()
  const b = settings?.branding

  return useMemo(() => {
    const barSizeMap = { thin: 12, default: 20, thick: 32 }
    const barRadiusMap = { none: 0, sm: 2, md: 4 }

    return {
      barSize: barSizeMap[(b?.chartBarThickness as keyof typeof barSizeMap) || 'default'] || 20,
      barRadius: barRadiusMap[(b?.chartBarRadius as keyof typeof barRadiusMap) || 'sm'] || 2,
      lineWidth: b?.chartLineWidth || 2,
      lineCurve: b?.chartLineCurve || 'monotone',
      showDots: b?.chartDots !== false,
      showGrid: (b?.chartGridLines || 'visible') !== 'hidden',
      gridDasharray: (b?.chartGridStyle || 'dashed') === 'dashed' ? '3 3' : '0',
      showTrendLine: b?.chartTrendLine || false,
      areaFill: b?.chartAreaFill || false,
      areaOpacity: b?.chartAreaOpacity ?? 0.15,
      colorStrategy: b?.chartColorStrategy || 'monochromatic',
      tooltipMatchCard: b?.chartTooltipMatchCard !== false,
      colors: [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
      ],
    }
  }, [b])
}
