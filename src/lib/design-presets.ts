import type { BrandingSettings } from '@/types/settings'

export type DesignPresetName = 'clean-airy' | 'compact-dense' | 'bold-modern' | 'minimal'

export interface DesignPreset {
  name: DesignPresetName
  label: string
  description: string
  settings: Partial<BrandingSettings>
}

const cleanAirySettings: Partial<BrandingSettings> = {
  h1FontSize: '2.25rem',
  h1FontWeight: '700',
  h1LetterSpacing: '-0.025em',
  h1TextTransform: 'none',
  h2FontSize: '1.5rem',
  h2FontWeight: '600',
  h2LetterSpacing: '-0.015em',
  h2TextTransform: 'none',
  h3FontSize: '1.25rem',
  h3FontWeight: '600',
  h3LetterSpacing: '0',
  h3TextTransform: 'none',
  headingColorMode: 'foreground',
  bodyFontSize: '0.9375rem',
  bodyLineHeight: '1.6',

  cardPadding: 'spacious',
  cardBorderRadius: 'lg',
  cardShadow: 'sm',
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',
  inputStyleMatch: true,
  buttonSize: 'default',
  buttonFontWeight: 'semibold',
  buttonTextTransform: 'none',
  badgeShape: 'pill',
  buttonRadius: 'pill',

  contentDensity: 'spacious',
  sectionSpacing: 'spacious',
  sidebarWidth: 'default',
  containerMaxWidth: '1280px',
  pageHeaderStyle: 'large',
  logoPosition: 'left',
  stickyHeader: true,

  hoverEffect: 'lift',
  animationSpeed: 'normal',
  focusRingWidth: 2,
  buttonClickFeedback: true,
  cardClickFeedback: false,
  pageTransitionFade: true,

  darkModeOption: 'user-choice',
  darkCardDepth: 'default',
  darkAccentBrightness: 'default',

  chartBarThickness: 'default',
  chartBarRadius: 'sm',
  chartLineWidth: 2,
  chartLineCurve: 'monotone',
  chartDots: true,
  chartGridLines: 'visible',
  chartGridStyle: 'dashed',
  chartTrendLine: false,
  chartAreaFill: false,
  chartAreaOpacity: 0.15,
  chartColorStrategy: 'monochromatic',
  chartTooltipMatchCard: true,

  tableStyle: 'clean',
  tableRowBorders: true,
  tableHeaderStyle: 'bold',

  smoothScroll: true,
  scrollToTopButton: true,

  skeletonStyle: 'pulse',
  emptyStateStyle: 'illustration',

  toastPosition: 'top-right',

  labelPosition: 'above',
  requiredFieldIndicator: 'asterisk',
  errorMessageStyle: 'inline',

  contrastEnforcement: true,
  respectReducedMotion: true,

  printStyles: true,

  dividerStyle: 'line',
}

const compactDenseSettings: Partial<BrandingSettings> = {
  ...cleanAirySettings,
  h1FontSize: '1.75rem',
  h1FontWeight: '700',
  h1LetterSpacing: '-0.02em',
  h2FontSize: '1.25rem',
  h2FontWeight: '600',
  h3FontSize: '1.0625rem',
  h3FontWeight: '600',
  bodyFontSize: '0.875rem',
  bodyLineHeight: '1.5',

  cardPadding: 'compact',
  cardBorderRadius: 'sm',
  cardShadow: 'none',
  cardBorderWidth: 1,
  buttonSize: 'compact',

  contentDensity: 'compact',
  sectionSpacing: 'compact',
  sidebarWidth: 'narrow',

  hoverEffect: 'none',
  animationSpeed: 'fast',

  chartBarThickness: 'thin',
  chartBarRadius: 'none',
  chartLineWidth: 1,
  chartDots: false,
  chartGridStyle: 'solid',

  skeletonStyle: 'pulse',
}

const boldModernSettings: Partial<BrandingSettings> = {
  ...cleanAirySettings,
  h1FontSize: '2.75rem',
  h1FontWeight: '800',
  h1LetterSpacing: '-0.03em',
  h1TextTransform: 'uppercase',
  h2FontSize: '1.75rem',
  h2FontWeight: '700',
  h2TextTransform: 'uppercase',
  h3FontSize: '1.375rem',
  h3FontWeight: '700',
  bodyFontSize: '1rem',
  bodyLineHeight: '1.6',

  cardPadding: 'default',
  cardBorderRadius: 'md',
  cardShadow: 'lg',
  cardBorderWidth: 0,
  cardBorderStyle: 'none',
  buttonSize: 'large',
  buttonFontWeight: 'bold',
  buttonTextTransform: 'uppercase',
  badgeShape: 'rounded',

  contentDensity: 'default',
  sectionSpacing: 'default',

  hoverEffect: 'lift',
  animationSpeed: 'normal',

  chartBarThickness: 'thick',
  chartBarRadius: 'md',
  chartLineWidth: 3,
  chartDots: true,

  skeletonStyle: 'shimmer',
}

const minimalSettings: Partial<BrandingSettings> = {
  ...cleanAirySettings,
  h1FontSize: '2rem',
  h1FontWeight: '600',
  h1LetterSpacing: '-0.02em',
  h2FontSize: '1.375rem',
  h2FontWeight: '500',
  h3FontSize: '1.125rem',
  h3FontWeight: '500',
  bodyFontSize: '0.9375rem',
  bodyLineHeight: '1.65',

  cardPadding: 'default',
  cardBorderRadius: 'sm',
  cardShadow: 'none',
  cardBorderWidth: 0,
  cardBorderStyle: 'none',
  buttonSize: 'default',
  buttonFontWeight: 'medium',
  buttonTextTransform: 'none',
  badgeShape: 'square',

  contentDensity: 'default',
  sectionSpacing: 'default',

  hoverEffect: 'none',
  animationSpeed: 'fast',

  chartBarThickness: 'thin',
  chartBarRadius: 'none',
  chartLineWidth: 1,
  chartDots: false,
  chartGridLines: 'hidden',

  skeletonStyle: 'static',
  emptyStateStyle: 'icon-only',

  dividerStyle: 'none',
}

export const designPresets: DesignPreset[] = [
  {
    name: 'clean-airy',
    label: 'Clean & Airy',
    description: 'Spacious layouts, subtle shadows, smooth transitions. Great for content platforms and general SaaS.',
    settings: cleanAirySettings,
  },
  {
    name: 'compact-dense',
    label: 'Compact & Dense',
    description: 'Tight spacing, minimal decoration, fast transitions. Built for data-heavy tools and analytics.',
    settings: compactDenseSettings,
  },
  {
    name: 'bold-modern',
    label: 'Bold & Modern',
    description: 'Large headings, strong shadows, uppercase accents. Perfect for marketing-forward and creative tools.',
    settings: boldModernSettings,
  },
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'No shadows, no borders, flat surfaces. Ideal for developer tools and productivity apps.',
    settings: minimalSettings,
  },
]

export function getPresetByName(name: DesignPresetName): DesignPreset | undefined {
  return designPresets.find(p => p.name === name)
}

export function getDefaultPreset(): DesignPreset {
  return designPresets[0]
}

export type DesignSystemExport = {
  version: 1
  exportedAt: string
  preset?: DesignPresetName
  settings: Partial<BrandingSettings>
}

export function exportDesignConfig(branding: BrandingSettings): string {
  const designKeys: (keyof BrandingSettings)[] = [
    'primaryColor', 'accentColor',
    'headingFont', 'bodyFont',
    'h1FontSize', 'h1FontWeight', 'h1LetterSpacing', 'h1TextTransform',
    'h2FontSize', 'h2FontWeight', 'h2LetterSpacing', 'h2TextTransform',
    'h3FontSize', 'h3FontWeight', 'h3LetterSpacing', 'h3TextTransform',
    'headingColorMode', 'headingColor', 'bodyColor', 'bodyFontSize', 'bodyLineHeight',
    'cardPadding', 'cardBorderRadius', 'cardShadow', 'cardBorderWidth', 'cardBorderStyle',
    'inputStyleMatch', 'buttonRadius', 'buttonSize', 'buttonFontWeight', 'buttonTextTransform',
    'badgeShape',
    'contentDensity', 'sectionSpacing', 'sidebarWidth', 'containerMaxWidth',
    'pageHeaderStyle', 'logoPosition', 'stickyHeader',
    'hoverEffect', 'animationSpeed', 'focusRingWidth',
    'buttonClickFeedback', 'cardClickFeedback', 'pageTransitionFade',
    'darkModeOption', 'darkCardDepth', 'darkAccentBrightness',
    'chartBarThickness', 'chartBarRadius', 'chartLineWidth', 'chartLineCurve',
    'chartDots', 'chartGridLines', 'chartGridStyle', 'chartTrendLine',
    'chartAreaFill', 'chartAreaOpacity', 'chartColorStrategy', 'chartTooltipMatchCard',
    'tableStyle', 'tableRowBorders', 'tableHeaderStyle',
    'successColor', 'warningColor', 'dangerColor',
    'smoothScroll', 'scrollToTopButton',
    'skeletonStyle', 'emptyStateStyle',
    'toastPosition',
    'labelPosition', 'requiredFieldIndicator', 'errorMessageStyle',
    'contrastEnforcement', 'respectReducedMotion',
    'printStyles', 'dividerStyle',
  ]

  const exportSettings: Partial<BrandingSettings> = {}
  for (const key of designKeys) {
    if (branding[key] !== undefined) {
      ;(exportSettings as any)[key] = branding[key]
    }
  }

  const exportData: DesignSystemExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: exportSettings,
  }

  return JSON.stringify(exportData, null, 2)
}

export function importDesignConfig(json: string): Partial<BrandingSettings> | null {
  try {
    const parsed = JSON.parse(json) as DesignSystemExport
    if (parsed.version !== 1 || !parsed.settings) {
      return null
    }
    return parsed.settings
  } catch {
    return null
  }
}
