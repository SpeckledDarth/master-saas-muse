'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { SiteSettings, defaultSettings } from '@/types/settings'

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const settingsLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      if (!settingsLoadedRef.current) {
        setSettings(defaultSettings)
        setLoading(false)
      }
    }, 8000)
    
    async function loadSettings() {
      try {
        const res = await fetch('/api/public/settings', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!res.ok) {
          throw new Error(`Settings API returned ${res.status}`)
        }

        const { settings: loaded } = await res.json()

        if (loaded) {
          settingsLoadedRef.current = true
          setSettings(loaded as SiteSettings)
        } else {
          settingsLoadedRef.current = true
          setSettings(defaultSettings)
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error('Failed to load settings:', err)
        settingsLoadedRef.current = true
        setSettings(defaultSettings)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }
    
    loadSettings()
    
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  const isLoading = loading || settings === null
  return { settings: isLoading ? null : settings, loading: isLoading, error }
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function hexToHSLParts(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslPartsToString(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generateHarmonizedSemantics(primaryHex: string): { success: string; warning: string; danger: string; successHex: string; warningHex: string; dangerHex: string } {
  const primary = hexToHSLParts(primaryHex)
  if (!primary) {
    return {
      success: '142 71% 45%', warning: '38 92% 50%', danger: '0 84% 60%',
      successHex: '#22c55e', warningHex: '#f59e0b', dangerHex: '#ef4444'
    }
  }

  const BASE_SUCCESS = { h: 142, s: 71, l: 45 }
  const BASE_WARNING = { h: 38, s: 92, l: 50 }
  const BASE_DANGER = { h: 0, s: 84, l: 60 }

  function nudgeHue(baseHue: number, primaryHue: number, amount: number): number {
    let diff = primaryHue - baseHue
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    let result = baseHue + diff * amount
    if (result < 0) result += 360
    if (result >= 360) result -= 360
    return result
  }

  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val))
  }

  function harmonize(base: { h: number; s: number; l: number }, hueNudge: number) {
    const h = nudgeHue(base.h, primary!.h, hueNudge)
    const s = clamp(base.s * 0.7 + primary!.s * 0.3, 40, 85)
    const l = clamp(base.l * 0.8 + primary!.l * 0.2, 35, 55)
    return { h, s, l }
  }

  const success = harmonize(BASE_SUCCESS, 0.15)
  const warning = harmonize(BASE_WARNING, 0.10)
  const danger = harmonize(BASE_DANGER, 0.10)

  return {
    success: hslPartsToString(success.h, success.s, success.l),
    warning: hslPartsToString(warning.h, warning.s, warning.l),
    danger: hslPartsToString(danger.h, danger.s, danger.l),
    successHex: hslToHex(success.h, success.s, success.l),
    warningHex: hslToHex(warning.h, warning.s, warning.l),
    dangerHex: hslToHex(danger.h, danger.s, danger.l),
  }
}

function getContrastForeground(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0% 100%'
  
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? '0 0% 0%' : '0 0% 100%'
}

function applyTheme(theme: { background: string; foreground: string; card: string; border: string } | undefined) {
  if (!theme) return
  
  const root = document.documentElement
  
  if (theme.background) {
    const hsl = hexToHSL(theme.background)
    if (hsl) {
      root.style.setProperty('--background', hsl)
      root.style.setProperty('--popover', hsl)
    }
  }
  if (theme.foreground) {
    const hsl = hexToHSL(theme.foreground)
    if (hsl) {
      root.style.setProperty('--foreground', hsl)
      root.style.setProperty('--popover-foreground', hsl)
      root.style.setProperty('--card-foreground', hsl)
    }
  }
  if (theme.card) {
    const hsl = hexToHSL(theme.card)
    if (hsl) root.style.setProperty('--card', hsl)
  }
  if (theme.border) {
    const hsl = hexToHSL(theme.border)
    if (hsl) {
      root.style.setProperty('--border', hsl)
      root.style.setProperty('--input', hsl)
    }
  }
}

function generateShadeScaleHsl(hex: string): Record<string, string> {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return {}
  
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    const l = (max + min) / 2
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  const hDeg = Math.round(h * 360)
  const sPct = Math.round(s * 100)
  
  const lightnesses: Record<string, number> = {
    '50': 97, '100': 94, '200': 88, '300': 78,
    '400': 64, '500': 50, '600': 40, '700': 32,
    '800': 24, '900': 18, '950': 10,
  }
  const saturations: Record<string, number> = {
    '50': Math.max(sPct * 0.3, 5), '100': Math.max(sPct * 0.5, 8), '200': Math.max(sPct * 0.7, 12),
    '300': Math.max(sPct * 0.85, 18), '400': Math.max(sPct * 0.95, 25), '500': sPct,
    '600': Math.min(sPct * 1.05, 100), '700': Math.min(sPct * 1.08, 100),
    '800': Math.min(sPct * 1.05, 100), '900': Math.min(sPct * 0.95, 100),
    '950': Math.min(sPct * 0.85, 100),
  }

  const scale: Record<string, string> = {}
  for (const [shade, lightness] of Object.entries(lightnesses)) {
    const sat = Math.round(saturations[shade])
    scale[shade] = `${hDeg} ${sat}% ${lightness}%`
  }
  return scale
}

function applyShadeScale(root: HTMLElement, prefix: string, hex: string) {
  const scale = generateShadeScaleHsl(hex)
  for (const [shade, hslVal] of Object.entries(scale)) {
    root.style.setProperty(`--${prefix}-${shade}`, hslVal)
  }
}

function applyChartColors(root: HTMLElement, primaryHex: string, isDark: boolean) {
  const scale = generateShadeScaleHsl(primaryHex)
  if (isDark) {
    root.style.setProperty('--chart-1', scale['400'] || '')
    root.style.setProperty('--chart-2', scale['300'] || '')
    root.style.setProperty('--chart-3', scale['500'] || '')
    root.style.setProperty('--chart-4', scale['200'] || '')
    root.style.setProperty('--chart-5', scale['600'] || '')
  } else {
    root.style.setProperty('--chart-1', scale['500'] || '')
    root.style.setProperty('--chart-2', scale['400'] || '')
    root.style.setProperty('--chart-3', scale['600'] || '')
    root.style.setProperty('--chart-4', scale['300'] || '')
    root.style.setProperty('--chart-5', scale['700'] || '')
  }
}

function loadGoogleFont(fontName: string) {
  if (fontName === 'system' || typeof document === 'undefined') return
  const id = `gfont-${fontName.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

function getFontFamily(value: string): string {
  if (!value || value === 'system') return ''
  const serifFonts = ['Lora', 'Playfair Display', 'Merriweather', 'Source Serif 4', 'Crimson Pro', 'DM Serif Display']
  const monoFonts = ['JetBrains Mono', 'Fira Code']
  const fallback = serifFonts.includes(value) ? ', serif' : monoFonts.includes(value) ? ', monospace' : ', sans-serif'
  return `"${value}"${fallback}`
}

function resolveTypographyVars(b: SiteSettings['branding'], isDark?: boolean): Record<string, string> {
  const vars: Record<string, string> = {}
  if (b.h1FontSize !== undefined) vars['--h1-size'] = b.h1FontSize
  if (b.h1FontWeight !== undefined) vars['--h1-weight'] = b.h1FontWeight
  if (b.h1LetterSpacing !== undefined) vars['--h1-spacing'] = b.h1LetterSpacing
  if (b.h1TextTransform !== undefined) vars['--h1-transform'] = b.h1TextTransform
  if (b.h2FontSize !== undefined) vars['--h2-size'] = b.h2FontSize
  if (b.h2FontWeight !== undefined) vars['--h2-weight'] = b.h2FontWeight
  if (b.h2LetterSpacing !== undefined) vars['--h2-spacing'] = b.h2LetterSpacing
  if (b.h2TextTransform !== undefined) vars['--h2-transform'] = b.h2TextTransform
  if (b.h3FontSize !== undefined) vars['--h3-size'] = b.h3FontSize
  if (b.h3FontWeight !== undefined) vars['--h3-weight'] = b.h3FontWeight
  if (b.h3LetterSpacing !== undefined) vars['--h3-spacing'] = b.h3LetterSpacing
  if (b.h3TextTransform !== undefined) vars['--h3-transform'] = b.h3TextTransform
  if (b.bodyFontSize !== undefined) vars['--body-size'] = b.bodyFontSize
  if (b.bodyLineHeight !== undefined) vars['--body-line-height'] = b.bodyLineHeight
  const headingColor = isDark
    ? (b.headingColorDark || (b as any).headingColor)
    : (b.headingColorLight || (b as any).headingColor)
  const bodyColor = isDark
    ? (b.bodyColorDark || (b as any).bodyColor)
    : (b.bodyColorLight || (b as any).bodyColor)
  if (headingColor) vars['--heading-color'] = headingColor
  if (bodyColor) vars['--body-color'] = bodyColor
  return vars
}

function resolveComponentVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}

  const paddingMap = { compact: '0.75rem', default: '1.25rem', spacious: '1.75rem' }
  const radiusMap = { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' }
  const shadowMap = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  }
  const btnPadMap = { compact: '0.375rem 0.75rem', default: '0.5rem 1rem', large: '0.625rem 1.5rem' }
  const badgeRadiusMap = { pill: '9999px', rounded: '0.375rem', square: '0.125rem' }
  const fontWeightMap = { medium: '500', semibold: '600', bold: '700' }

  if (b.cardPadding !== undefined) vars['--card-padding'] = paddingMap[b.cardPadding] || paddingMap.default
  if (b.cardBorderRadius !== undefined) vars['--card-radius'] = radiusMap[b.cardBorderRadius] || radiusMap.lg
  if (b.cardShadow !== undefined) vars['--card-shadow'] = shadowMap[b.cardShadow] || shadowMap.sm
  if (b.cardBorderWidth !== undefined) vars['--card-border-width'] = `${b.cardBorderWidth}px`
  if (b.cardBorderStyle !== undefined) vars['--card-border-style'] = b.cardBorderStyle === 'none' ? 'none' : b.cardBorderStyle
  const btnRadiusMap = { pill: '9999px', rounded: '0.375rem' }
  if (b.buttonRadius !== undefined) vars['--btn-radius'] = btnRadiusMap[b.buttonRadius] || btnRadiusMap.pill
  if (b.buttonSize !== undefined) vars['--btn-padding'] = btnPadMap[b.buttonSize] || btnPadMap.default
  if (b.buttonFontWeight !== undefined) vars['--btn-font-weight'] = fontWeightMap[b.buttonFontWeight] || fontWeightMap.semibold
  if (b.buttonTextTransform !== undefined) vars['--btn-text-transform'] = b.buttonTextTransform
  if (b.badgeShape !== undefined) vars['--badge-radius'] = badgeRadiusMap[b.badgeShape] || badgeRadiusMap.pill

  if (b.inputStyleMatch !== undefined && b.inputStyleMatch) {
    vars['--input-radius'] = vars['--card-radius'] || radiusMap.lg
  }

  return vars
}

function resolveLayoutVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}
  const gapMap = { compact: '0.5rem', default: '1rem', spacious: '1.5rem' }
  const sectionMap = { compact: '2rem', default: '3.5rem', spacious: '5rem' }
  const sidebarMap = { narrow: '14rem', default: '16rem', wide: '18rem' }

  if (b.contentDensity !== undefined) vars['--content-density-gap'] = gapMap[b.contentDensity] || gapMap.default
  if (b.sectionSpacing !== undefined) vars['--section-spacing'] = sectionMap[b.sectionSpacing] || sectionMap.default
  if (b.sidebarWidth !== undefined) vars['--sidebar-width'] = sidebarMap[b.sidebarWidth] || sidebarMap.default
  if (b.containerMaxWidth !== undefined) vars['--container-max-width'] = b.containerMaxWidth
  if (b.pageHeaderStyle !== undefined) vars['--page-header-size'] = b.pageHeaderStyle === 'compact' ? '1.5rem' : '2.25rem'
  return vars
}

function resolveInteractiveVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}

  const hoverTransformMap = { lift: 'translateY(-2px)', glow: 'none', scale: 'scale(1.02)', none: 'none' }
  const hoverShadowMap = {
    lift: '0 4px 12px rgb(0 0 0 / 0.15)',
    glow: '0 0 12px hsl(var(--primary) / 0.4)',
    scale: 'none',
    none: 'none',
  }
  const speedMap = { fast: '100ms', normal: '200ms', slow: '350ms', none: '0ms' }

  if (b.hoverEffect !== undefined) {
    vars['--hover-transform'] = hoverTransformMap[b.hoverEffect] || 'none'
    vars['--hover-shadow'] = hoverShadowMap[b.hoverEffect] || 'none'
  }
  if (b.animationSpeed !== undefined) vars['--transition-speed'] = speedMap[b.animationSpeed] || speedMap.normal
  if (b.focusRingWidth !== undefined) vars['--focus-ring-width'] = `${b.focusRingWidth}px`
  if (b.buttonClickFeedback === true) vars['--click-scale'] = '0.97'
  if (b.buttonClickFeedback === false) vars['--click-scale'] = '1'
  return vars
}

function resolveChartVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}
  const barSizeMap = { thin: '12', default: '20', thick: '32' }
  const barRadiusMap = { none: '0', sm: '2', md: '4' }

  if (b.chartBarThickness !== undefined) vars['--chart-bar-size'] = barSizeMap[b.chartBarThickness] || barSizeMap.default
  if (b.chartBarRadius !== undefined) vars['--chart-bar-radius'] = barRadiusMap[b.chartBarRadius] || barRadiusMap.sm
  if (b.chartLineWidth !== undefined) vars['--chart-line-width'] = `${b.chartLineWidth}`
  if (b.chartAreaOpacity !== undefined) vars['--chart-area-opacity'] = `${b.chartAreaOpacity}`
  return vars
}

function resolveSemanticVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}
  const harmonized = b.primaryColor ? generateHarmonizedSemantics(b.primaryColor) : null

  const successHsl = b.successColor ? hexToHSL(b.successColor) : ''
  if (successHsl) {
    vars['--success'] = successHsl
  } else if (harmonized) {
    vars['--success'] = harmonized.success
  }

  const warningHsl = b.warningColor ? hexToHSL(b.warningColor) : ''
  if (warningHsl) {
    vars['--warning'] = warningHsl
  } else if (harmonized) {
    vars['--warning'] = harmonized.warning
  }

  const dangerHsl = b.dangerColor ? hexToHSL(b.dangerColor) : ''
  if (dangerHsl) {
    vars['--danger'] = dangerHsl
  } else if (harmonized) {
    vars['--danger'] = harmonized.danger
  }

  if (!vars['--info']) {
    vars['--info'] = '217 91% 60%'
  }

  return vars
}

function resolveTableVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}
  if (b.tableStyle === 'striped') vars['--table-stripe-opacity'] = '0.04'
  if (b.tableStyle === 'clean') vars['--table-stripe-opacity'] = '0'
  if (b.tableRowBorders === true) vars['--table-border-opacity'] = '1'
  if (b.tableRowBorders === false) vars['--table-border-opacity'] = '0'
  return vars
}

function resolveDividerVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}
  if (b.dividerStyle === 'none') vars['--divider-opacity'] = '0'
  else if (b.dividerStyle) vars['--divider-opacity'] = '1'
  return vars
}

function applyDesignSystemVars(root: HTMLElement, b: SiteSettings['branding'], isDark?: boolean) {
  const allVars = {
    ...resolveTypographyVars(b, isDark),
    ...resolveComponentVars(b),
    ...resolveLayoutVars(b),
    ...resolveInteractiveVars(b),
    ...resolveChartVars(b),
    ...resolveSemanticVars(b),
    ...resolveTableVars(b),
    ...resolveDividerVars(b),
  }

  for (const [key, value] of Object.entries(allVars)) {
    root.style.setProperty(key, value)
  }

  if (allVars['--heading-color']) {
    root.setAttribute('data-custom-heading-color', '')
  } else {
    root.removeAttribute('data-custom-heading-color')
  }
  if (allVars['--body-color']) {
    root.setAttribute('data-custom-body-color', '')
  } else {
    root.removeAttribute('data-custom-body-color')
  }

  if (b.smoothScroll) {
    root.style.setProperty('scroll-behavior', 'smooth')
  } else if (b.smoothScroll === false) {
    root.style.removeProperty('scroll-behavior')
  }

  root.setAttribute('data-heading-color', b.headingColorMode || 'foreground')
  root.setAttribute('data-skeleton', b.skeletonStyle || 'pulse')
  root.setAttribute('data-divider', b.dividerStyle || 'line')
  root.setAttribute('data-dark-mode', b.darkModeOption || 'user-choice')
  root.setAttribute('data-empty-state', b.emptyStateStyle || 'illustration')
  root.setAttribute('data-toast-position', b.toastPosition || 'top-right')
  root.setAttribute('data-label-position', b.labelPosition || 'above')
  root.setAttribute('data-required-indicator', b.requiredFieldIndicator || 'asterisk')
  root.setAttribute('data-error-style', b.errorMessageStyle || 'inline')
  root.setAttribute('data-chart-curve', b.chartLineCurve || 'monotone')
  root.setAttribute('data-chart-dots', b.chartDots !== false ? 'true' : 'false')
  root.setAttribute('data-chart-grid', b.chartGridLines || 'visible')
  root.setAttribute('data-chart-grid-style', b.chartGridStyle || 'dashed')
  root.setAttribute('data-chart-trend', b.chartTrendLine ? 'true' : 'false')
  root.setAttribute('data-chart-fill', b.chartAreaFill ? 'true' : 'false')
  root.setAttribute('data-chart-color-strategy', b.chartColorStrategy || 'monochromatic')
  root.setAttribute('data-chart-tooltip-card', b.chartTooltipMatchCard !== false ? 'true' : 'false')
  root.setAttribute('data-table-header', b.tableHeaderStyle || 'bold')
  root.setAttribute('data-page-transition', b.pageTransitionFade !== false ? 'true' : 'false')
  root.setAttribute('data-card-click', b.cardClickFeedback ? 'true' : 'false')
  root.setAttribute('data-scroll-top', b.scrollToTopButton !== false ? 'true' : 'false')
  root.setAttribute('data-sticky-header', b.stickyHeader !== false ? 'true' : 'false')
  root.setAttribute('data-logo-position', b.logoPosition || 'left')
  root.setAttribute('data-page-header', b.pageHeaderStyle || 'large')

  if (b.respectReducedMotion !== false) {
    root.setAttribute('data-reduce-motion', 'true')
  } else {
    root.removeAttribute('data-reduce-motion')
  }

  root.setAttribute('data-contrast', b.contrastEnforcement !== false ? 'true' : 'false')
  root.setAttribute('data-print-styles', b.printStyles !== false ? 'true' : 'false')

  if (b.darkCardDepth) {
    const depthMap = { subtle: '2%', default: '4%', deep: '8%' }
    root.style.setProperty('--dark-depth-offset', depthMap[b.darkCardDepth] || depthMap.default)
  }
  if (b.darkAccentBrightness) {
    const satMap = { muted: '70%', default: '100%', vivid: '130%' }
    root.style.setProperty('--dark-accent-saturation', satMap[b.darkAccentBrightness] || satMap.default)
  }
}

export function useThemeFromSettings(settings: SiteSettings | null) {
  const { resolvedTheme } = useTheme()
  
  useEffect(() => {
    if (!settings) return
    
    const root = document.documentElement
    const isDark = resolvedTheme === 'dark'
    
    if (settings.branding.primaryColor) {
      const hsl = hexToHSL(settings.branding.primaryColor)
      if (hsl) {
        root.style.setProperty('--primary', hsl)
        root.style.setProperty('--primary-foreground', getContrastForeground(settings.branding.primaryColor))
      }
      applyShadeScale(root, 'primary', settings.branding.primaryColor)
      applyChartColors(root, settings.branding.primaryColor, isDark)
    }
    if (settings.branding.accentColor) {
      applyShadeScale(root, 'accent', settings.branding.accentColor)
    }
    root.style.setProperty('--accent', isDark ? '0 0% 15%' : '0 0% 95%')
    root.style.setProperty('--accent-foreground', isDark ? '0 0% 90%' : '0 0% 15%')
    
    const theme = isDark ? settings.branding.darkTheme : settings.branding.lightTheme
    applyTheme(theme)
    
    const siteBgOverride = isDark ? settings.branding.siteBgDarkOverride : settings.branding.siteBgLightOverride
    if (siteBgOverride) {
      const hsl = hexToHSL(siteBgOverride)
      if (hsl) {
        root.style.setProperty('--background', hsl)
        root.style.setProperty('--popover', hsl)
      }
    } else if (settings.branding.primaryColor) {
      const scale = generateShadeScaleHsl(settings.branding.primaryColor)
      const bgShade = isDark ? scale['800'] : scale['100']
      if (bgShade) {
        root.style.setProperty('--background', bgShade)
        root.style.setProperty('--popover', bgShade)
      }
    }

    if (settings.branding.primaryColor) {
      const scale = generateShadeScaleHsl(settings.branding.primaryColor)
      if (!theme?.foreground) {
        const fgShade = isDark ? scale['100'] : scale['900']
        if (fgShade) {
          root.style.setProperty('--foreground', fgShade)
          root.style.setProperty('--popover-foreground', fgShade)
          root.style.setProperty('--card-foreground', fgShade)
        }
      }
      if (!theme?.border) {
        root.style.setProperty('--border', '0 0% 50%')
        root.style.setProperty('--input', '0 0% 50%')
      }
      const mutedShade = isDark ? scale['700'] : scale['200']
      const mutedFgShade = isDark ? scale['300'] : scale['600']
      if (mutedShade) root.style.setProperty('--muted', mutedShade)
      if (mutedFgShade) root.style.setProperty('--muted-foreground', mutedFgShade)
    }

    applyDesignSystemVars(root, settings.branding, isDark)
  }, [settings?.branding, resolvedTheme])
  
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    
    const headingFont = settings.branding.headingFont
    const bodyFont = settings.branding.bodyFont
    
    if (headingFont && headingFont !== 'system') {
      loadGoogleFont(headingFont)
      root.style.setProperty('--font-heading', getFontFamily(headingFont))
    } else {
      root.style.removeProperty('--font-heading')
    }
    
    if (bodyFont && bodyFont !== 'system') {
      loadGoogleFont(bodyFont)
      const family = getFontFamily(bodyFont)
      root.style.setProperty('--font-body', family)
    } else {
      root.style.removeProperty('--font-body')
    }
  }, [settings?.branding.headingFont, settings?.branding.bodyFont])
  
  useEffect(() => {
    if (!settings) return
    
    const applyAllColors = () => {
      const root = document.documentElement
      const isDark = root.classList.contains('dark')
      
      const theme = isDark ? settings.branding.darkTheme : settings.branding.lightTheme
      applyTheme(theme)
      
      if (settings.branding.primaryColor) {
        const hsl = hexToHSL(settings.branding.primaryColor)
        if (hsl) {
          root.style.setProperty('--primary', hsl)
          root.style.setProperty('--primary-foreground', getContrastForeground(settings.branding.primaryColor))
        }
        applyShadeScale(root, 'primary', settings.branding.primaryColor)
        applyChartColors(root, settings.branding.primaryColor, isDark)
      }
      
      if (settings.branding.accentColor) {
        applyShadeScale(root, 'accent', settings.branding.accentColor)
      }
      root.style.setProperty('--accent', isDark ? '0 0% 15%' : '0 0% 95%')
      root.style.setProperty('--accent-foreground', isDark ? '0 0% 90%' : '0 0% 15%')
      
      const siteBgOverride = isDark ? settings.branding.siteBgDarkOverride : settings.branding.siteBgLightOverride
      if (siteBgOverride) {
        const hsl = hexToHSL(siteBgOverride)
        if (hsl) {
          root.style.setProperty('--background', hsl)
          root.style.setProperty('--popover', hsl)
        }
      } else if (settings.branding.primaryColor) {
        const scale = generateShadeScaleHsl(settings.branding.primaryColor)
        const bgShade = isDark ? scale['950'] : scale['50']
        if (bgShade) {
          root.style.setProperty('--background', bgShade)
          root.style.setProperty('--popover', bgShade)
        }
      }

      applyDesignSystemVars(root, settings.branding, isDark)
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyAllColors()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [settings?.branding])
}
