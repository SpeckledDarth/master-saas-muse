import type { SiteSettings } from '@/types/settings'

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

function getContrastForeground(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0% 100%'

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '0 0% 0%' : '0 0% 100%'
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

function generateHarmonizedSemantics(primaryHex: string): { success: string; warning: string; danger: string } {
  const primary = hexToHSLParts(primaryHex)
  if (!primary) {
    return { success: '142 71% 45%', warning: '38 92% 50%', danger: '0 84% 60%' }
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
  }
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

  const paddingMap: Record<string, string> = { compact: '0.75rem', default: '1.25rem', spacious: '1.75rem' }
  const radiusMap: Record<string, string> = { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' }
  const shadowMap: Record<string, string> = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  }
  const btnPadMap: Record<string, string> = { compact: '0.375rem 0.75rem', default: '0.5rem 1rem', large: '0.625rem 1.5rem' }
  const badgeRadiusMap: Record<string, string> = { pill: '9999px', rounded: '0.375rem', square: '0.125rem' }
  const fontWeightMap: Record<string, string> = { medium: '500', semibold: '600', bold: '700' }

  if (b.cardPadding !== undefined) vars['--card-padding'] = paddingMap[b.cardPadding] || paddingMap.default
  if (b.cardBorderRadius !== undefined) vars['--card-radius'] = radiusMap[b.cardBorderRadius] || radiusMap.lg
  if (b.cardShadow !== undefined) vars['--card-shadow'] = shadowMap[b.cardShadow] || shadowMap.sm
  if (b.cardBorderWidth !== undefined) vars['--card-border-width'] = `${b.cardBorderWidth}px`
  if (b.cardBorderStyle !== undefined) vars['--card-border-style'] = b.cardBorderStyle === 'none' ? 'none' : b.cardBorderStyle
  const btnRadiusMap: Record<string, string> = { pill: '9999px', rounded: '0.375rem', square: '0.125rem' }
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
  const gapMap: Record<string, string> = { compact: '0.5rem', default: '1rem', spacious: '1.5rem' }
  const sectionMap: Record<string, string> = { compact: '2rem', default: '3.5rem', spacious: '5rem' }
  const sidebarMap: Record<string, string> = { narrow: '14rem', default: '16rem', wide: '18rem' }

  if (b.contentDensity !== undefined) vars['--content-density-gap'] = gapMap[b.contentDensity] || gapMap.default
  if (b.sectionSpacing !== undefined) vars['--section-spacing'] = sectionMap[b.sectionSpacing] || sectionMap.default
  if (b.sidebarWidth !== undefined) vars['--sidebar-width'] = sidebarMap[b.sidebarWidth] || sidebarMap.default
  if (b.containerMaxWidth !== undefined) vars['--container-max-width'] = b.containerMaxWidth
  if (b.pageHeaderStyle !== undefined) vars['--page-header-size'] = b.pageHeaderStyle === 'compact' ? '1.5rem' : '2.25rem'
  return vars
}

function resolveInteractiveVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}

  const hoverTransformMap: Record<string, string> = { lift: 'translateY(-2px)', glow: 'none', scale: 'scale(1.02)', none: 'none' }
  const hoverShadowMap: Record<string, string> = {
    lift: '0 4px 12px rgb(0 0 0 / 0.15)',
    glow: '0 0 12px hsl(var(--primary) / 0.4)',
    scale: 'none',
    none: 'none',
  }
  const speedMap: Record<string, string> = { fast: '100ms', normal: '200ms', slow: '350ms', none: '0ms' }

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
  const barSizeMap: Record<string, string> = { thin: '12', default: '20', thick: '32' }
  const barRadiusMap: Record<string, string> = { none: '0', sm: '2', md: '4' }

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

function computeColorVars(b: SiteSettings['branding'], isDark: boolean): Record<string, string> {
  const vars: Record<string, string> = {}

  if (b.primaryColor) {
    const hsl = hexToHSL(b.primaryColor)
    if (hsl) {
      vars['--primary'] = hsl
      vars['--primary-foreground'] = getContrastForeground(b.primaryColor)
    }
    const primaryScale = generateShadeScaleHsl(b.primaryColor)
    for (const [shade, hslVal] of Object.entries(primaryScale)) {
      vars[`--primary-${shade}`] = hslVal
    }

    if (isDark) {
      vars['--chart-1'] = primaryScale['400'] || ''
      vars['--chart-2'] = primaryScale['300'] || ''
      vars['--chart-3'] = primaryScale['500'] || ''
      vars['--chart-4'] = primaryScale['200'] || ''
      vars['--chart-5'] = primaryScale['600'] || ''
    } else {
      vars['--chart-1'] = primaryScale['500'] || ''
      vars['--chart-2'] = primaryScale['400'] || ''
      vars['--chart-3'] = primaryScale['600'] || ''
      vars['--chart-4'] = primaryScale['300'] || ''
      vars['--chart-5'] = primaryScale['700'] || ''
    }
  }

  if (b.accentColor) {
    const accentScale = generateShadeScaleHsl(b.accentColor)
    for (const [shade, hslVal] of Object.entries(accentScale)) {
      vars[`--accent-${shade}`] = hslVal
    }
  }

  vars['--accent'] = isDark ? '0 0% 15%' : '0 0% 95%'
  vars['--accent-foreground'] = isDark ? '0 0% 90%' : '0 0% 15%'

  const theme = isDark ? b.darkTheme : b.lightTheme
  if (theme) {
    if (theme.background) {
      const hsl = hexToHSL(theme.background)
      if (hsl) {
        vars['--background'] = hsl
        vars['--popover'] = hsl
      }
    }
    if (theme.foreground) {
      const hsl = hexToHSL(theme.foreground)
      if (hsl) {
        vars['--foreground'] = hsl
        vars['--popover-foreground'] = hsl
        vars['--card-foreground'] = hsl
      }
    }
    if (theme.card) {
      const hsl = hexToHSL(theme.card)
      if (hsl) vars['--card'] = hsl
    }
    if (theme.border) {
      const hsl = hexToHSL(theme.border)
      if (hsl) {
        vars['--border'] = hsl
        vars['--input'] = hsl
      }
    }
  }

  const siteBgOverride = isDark ? b.siteBgDarkOverride : b.siteBgLightOverride
  if (siteBgOverride) {
    const hsl = hexToHSL(siteBgOverride)
    if (hsl) {
      vars['--background'] = hsl
      vars['--popover'] = hsl
    }
  } else if (b.primaryColor) {
    const scale = generateShadeScaleHsl(b.primaryColor)
    const bgShade = isDark ? scale['800'] : scale['100']
    if (bgShade) {
      vars['--background'] = bgShade
      vars['--popover'] = bgShade
    }
  }

  if (b.primaryColor) {
    const scale = generateShadeScaleHsl(b.primaryColor)
    if (!theme?.foreground) {
      const fgShade = isDark ? scale['100'] : scale['900']
      if (fgShade) {
        vars['--foreground'] = fgShade
        vars['--popover-foreground'] = fgShade
        vars['--card-foreground'] = fgShade
      }
    }
    if (!theme?.border) {
      vars['--border'] = '0 0% 50%'
      vars['--input'] = '0 0% 50%'
    }
    const mutedShade = isDark ? scale['700'] : scale['200']
    const mutedFgShade = isDark ? scale['300'] : scale['600']
    if (mutedShade) vars['--muted'] = mutedShade
    if (mutedFgShade) vars['--muted-foreground'] = mutedFgShade
  }

  if (b.darkCardDepth) {
    const depthMap: Record<string, string> = { subtle: '2%', default: '4%', deep: '8%' }
    vars['--dark-depth-offset'] = depthMap[b.darkCardDepth] || depthMap.default
  }
  if (b.darkAccentBrightness) {
    const satMap: Record<string, string> = { muted: '70%', default: '100%', vivid: '130%' }
    vars['--dark-accent-saturation'] = satMap[b.darkAccentBrightness] || satMap.default
  }

  return vars
}

function resolveFontVars(b: SiteSettings['branding']): Record<string, string> {
  const vars: Record<string, string> = {}
  const serifFonts = ['Lora', 'Playfair Display', 'Merriweather', 'Source Serif 4', 'Crimson Pro', 'DM Serif Display']
  const monoFonts = ['JetBrains Mono', 'Fira Code']

  function getFontFamily(value: string): string {
    if (!value || value === 'system') return ''
    const fallback = serifFonts.includes(value) ? ', serif' : monoFonts.includes(value) ? ', monospace' : ', sans-serif'
    return `"${value}"${fallback}`
  }

  if (b.headingFont && b.headingFont !== 'system') {
    vars['--font-heading'] = getFontFamily(b.headingFont)
  }
  if (b.bodyFont && b.bodyFont !== 'system') {
    vars['--font-body'] = getFontFamily(b.bodyFont)
  }
  return vars
}

export function computeAllCSSVars(b: SiteSettings['branding'], isDark: boolean): Record<string, string> {
  try {
    return {
      ...computeColorVars(b, isDark),
      ...resolveTypographyVars(b, isDark),
      ...resolveComponentVars(b),
      ...resolveLayoutVars(b),
      ...resolveInteractiveVars(b),
      ...resolveChartVars(b),
      ...resolveSemanticVars(b),
      ...resolveTableVars(b),
      ...resolveDividerVars(b),
      ...resolveFontVars(b),
    }
  } catch (err) {
    console.error('[computeAllCSSVars] Error computing CSS variables:', err)
    return {}
  }
}

export function computeDesignSystemCSS(b: SiteSettings['branding']): string {
  try {
    const lightVars = computeAllCSSVars(b, false)
    const darkVars = computeAllCSSVars(b, true)

    const lightEntries = Object.entries(lightVars)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')

    const darkOnlyEntries: string[] = []
    for (const [key, darkVal] of Object.entries(darkVars)) {
      if (darkVal === '' || darkVal === undefined) continue
      if (lightVars[key] !== darkVal) {
        darkOnlyEntries.push(`  ${key}: ${darkVal};`)
      }
    }

    let css = ''
    if (lightEntries) {
      css += `:root {\n${lightEntries}\n}`
    }
    if (darkOnlyEntries.length > 0) {
      css += `\n.dark {\n${darkOnlyEntries.join('\n')}\n}`
    }

    return css
  } catch (err) {
    console.error('[computeDesignSystemCSS] Error generating CSS:', err)
    return ''
  }
}

export function computeDataAttributes(b: SiteSettings['branding']): Record<string, string> {
  return {
    'data-heading-color': b.headingColorMode || 'foreground',
    'data-skeleton': b.skeletonStyle || 'pulse',
    'data-divider': b.dividerStyle || 'line',
    'data-dark-mode': b.darkModeOption || 'user-choice',
    'data-empty-state': b.emptyStateStyle || 'illustration',
    'data-toast-position': b.toastPosition || 'top-right',
    'data-label-position': b.labelPosition || 'above',
    'data-required-indicator': b.requiredFieldIndicator || 'asterisk',
    'data-error-style': b.errorMessageStyle || 'inline',
    'data-chart-curve': b.chartLineCurve || 'monotone',
    'data-chart-dots': b.chartDots !== false ? 'true' : 'false',
    'data-chart-grid': b.chartGridLines || 'visible',
    'data-chart-grid-style': b.chartGridStyle || 'dashed',
    'data-chart-trend': b.chartTrendLine ? 'true' : 'false',
    'data-chart-fill': b.chartAreaFill ? 'true' : 'false',
    'data-chart-color-strategy': b.chartColorStrategy || 'monochromatic',
    'data-chart-tooltip-card': b.chartTooltipMatchCard !== false ? 'true' : 'false',
    'data-table-header': b.tableHeaderStyle || 'bold',
    'data-page-transition': b.pageTransitionFade !== false ? 'true' : 'false',
    'data-card-click': b.cardClickFeedback ? 'true' : 'false',
    'data-scroll-top': b.scrollToTopButton !== false ? 'true' : 'false',
    'data-sticky-header': b.stickyHeader !== false ? 'true' : 'false',
    'data-logo-position': b.logoPosition || 'left',
    'data-page-header': b.pageHeaderStyle || 'large',
    'data-reduce-motion': b.respectReducedMotion !== false ? 'true' : 'false',
    'data-contrast': b.contrastEnforcement !== false ? 'true' : 'false',
    'data-print-styles': b.printStyles !== false ? 'true' : 'false',
  }
}
