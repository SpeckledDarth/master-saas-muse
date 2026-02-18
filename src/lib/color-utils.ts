export function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
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
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

export function hslToHex(h: number, s: number, l: number): string {
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

export function hexToHslString(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  return `${h} ${s}% ${l}%`
}

export const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const

export type ShadeStep = typeof SHADE_STEPS[number]

export function generateShadeScale(hex: string): Record<ShadeStep, string> {
  const [h, s] = hexToHsl(hex)
  const lightnesses: Record<string, number> = {
    '50': 97, '100': 94, '200': 88, '300': 78,
    '400': 64, '500': 50, '600': 40, '700': 32,
    '800': 24, '900': 18, '950': 10,
  }
  const saturations: Record<string, number> = {
    '50': Math.max(s * 0.3, 5), '100': Math.max(s * 0.5, 8), '200': Math.max(s * 0.7, 12),
    '300': Math.max(s * 0.85, 18), '400': Math.max(s * 0.95, 25), '500': s,
    '600': Math.min(s * 1.05, 100), '700': Math.min(s * 1.08, 100),
    '800': Math.min(s * 1.05, 100), '900': Math.min(s * 0.95, 100),
    '950': Math.min(s * 0.85, 100),
  }
  const result: Record<string, string> = {}
  for (const [shade, lightness] of Object.entries(lightnesses)) {
    result[shade] = hslToHex(h, saturations[shade], lightness)
  }
  return result as Record<ShadeStep, string>
}

export function generateShadeScaleHsl(hex: string): Record<ShadeStep, string> {
  const scale = generateShadeScale(hex)
  const result: Record<string, string> = {}
  for (const [shade, shadeHex] of Object.entries(scale)) {
    result[shade] = hexToHslString(shadeHex)
  }
  return result as Record<ShadeStep, string>
}

export function getContrastText(hex: string): string {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#000000' : '#ffffff'
}
