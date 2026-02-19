'use client'

import { useState, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, RotateCcw, Shuffle } from 'lucide-react'
import { ColorInput } from '@/components/admin/color-input'
import { cn } from '@/lib/utils'

function hexToHsl(hex: string): [number, number, number] {
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

function generateShadeScale(hex: string): Record<string, string> {
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
  return result
}

function getContrastText(hex: string): string {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#000000' : '#ffffff'
}

const presetPalettes = [
  { name: 'Indigo', primary: '#6366f1', accent: '#8b5cf6' },
  { name: 'Blue', primary: '#3b82f6', accent: '#06b6d4' },
  { name: 'Emerald', primary: '#10b981', accent: '#14b8a6' },
  { name: 'Rose', primary: '#f43f5e', accent: '#ec4899' },
  { name: 'Amber', primary: '#f59e0b', accent: '#ef4444' },
  { name: 'Slate', primary: '#64748b', accent: '#6366f1' },
  { name: 'Violet', primary: '#8b5cf6', accent: '#d946ef' },
  { name: 'Teal', primary: '#14b8a6', accent: '#3b82f6' },
]

function ShadeStrip({ 
  shades, 
  label, 
  baseColor 
}: { 
  shades: Record<string, string>
  label: string
  baseColor: string
}) {
  const [copiedShade, setCopiedShade] = useState<string | null>(null)

  const copyToClipboard = useCallback((shade: string, hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedShade(shade)
    setTimeout(() => setCopiedShade(null), 1500)
  }, [])

  const shadeKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm border" style={{ backgroundColor: baseColor }} />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{baseColor}</span>
      </div>
      <div className="flex rounded-md overflow-hidden border">
        {shadeKeys.map((shade) => {
          const hex = shades[shade]
          const textColor = getContrastText(hex)
          const isCopied = copiedShade === shade
          return (
            <button
              key={shade}
              onClick={() => copyToClipboard(shade, hex)}
              className="flex-1 flex flex-col items-center justify-center py-3 px-1 transition-transform hover:scale-y-110 hover:z-10 relative cursor-pointer"
              style={{ backgroundColor: hex, color: textColor }}
              title={`${shade}: ${hex} (click to copy)`}
              data-testid={`swatch-${label.toLowerCase()}-${shade}`}
            >
              <span className="text-[10px] font-bold opacity-70">{shade}</span>
              <span className="text-[9px] font-mono opacity-60 mt-0.5">
                {isCopied ? (
                  <span className="flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                ) : hex.toUpperCase()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LivePreview({ 
  primaryColor, 
  accentColor, 
  primaryShades, 
  accentShades 
}: { 
  primaryColor: string
  accentColor: string
  primaryShades: Record<string, string>
  accentShades: Record<string, string>
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Live Preview</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-md border space-y-3" style={{ backgroundColor: '#ffffff' }}>
          <p className="text-xs font-medium" style={{ color: '#374151' }}>Light Mode</p>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
              Primary Button
            </div>
            <div className="px-3 py-1.5 rounded-md text-xs font-medium border" style={{ borderColor: primaryColor, color: primaryColor }}>
              Outline
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-2 py-0.5 rounded-sm text-[10px] font-medium text-white" style={{ backgroundColor: accentColor }}>
              Badge
            </div>
            <div className="px-2 py-0.5 rounded-sm text-[10px] font-medium" style={{ backgroundColor: primaryShades['100'], color: primaryShades['700'] }}>
              Soft Badge
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: primaryShades['100'] }}>
            <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: primaryColor }} />
          </div>
          <p className="text-[10px]" style={{ color: primaryShades['600'] }}>
            Sample link text with accent color
          </p>
        </div>
        <div className="p-4 rounded-md border space-y-3" style={{ backgroundColor: '#0a0a1a' }}>
          <p className="text-xs font-medium" style={{ color: '#e5e7eb' }}>Dark Mode</p>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
              Primary Button
            </div>
            <div className="px-3 py-1.5 rounded-md text-xs font-medium border" style={{ borderColor: primaryShades['400'], color: primaryShades['400'] }}>
              Outline
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-2 py-0.5 rounded-sm text-[10px] font-medium text-white" style={{ backgroundColor: accentColor }}>
              Badge
            </div>
            <div className="px-2 py-0.5 rounded-sm text-[10px] font-medium" style={{ backgroundColor: primaryShades['900'], color: primaryShades['300'] }}>
              Soft Badge
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: primaryShades['900'] }}>
            <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: primaryShades['400'] }} />
          </div>
          <p className="text-[10px]" style={{ color: primaryShades['400'] }}>
            Sample link text with accent color
          </p>
        </div>
      </div>
    </div>
  )
}

interface ColorPaletteBuilderProps {
  primaryColor: string
  accentColor: string
  onPrimaryChange: (color: string) => void
  onAccentChange: (color: string) => void
}

export function ColorPaletteBuilder({ 
  primaryColor, 
  accentColor, 
  onPrimaryChange, 
  onAccentChange 
}: ColorPaletteBuilderProps) {
  const [localPrimary, setLocalPrimary] = useState(primaryColor)
  const [localAccent, setLocalAccent] = useState(accentColor)

  const primaryShades = useMemo(() => generateShadeScale(localPrimary), [localPrimary])
  const accentShades = useMemo(() => generateShadeScale(localAccent), [localAccent])

  const handlePrimaryChange = useCallback((hex: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setLocalPrimary(hex)
      onPrimaryChange(hex)
    } else {
      setLocalPrimary(hex)
    }
  }, [onPrimaryChange])

  const handleAccentChange = useCallback((hex: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setLocalAccent(hex)
      onAccentChange(hex)
    } else {
      setLocalAccent(hex)
    }
  }, [onAccentChange])

  const applyPreset = useCallback((preset: typeof presetPalettes[0]) => {
    setLocalPrimary(preset.primary)
    setLocalAccent(preset.accent)
    onPrimaryChange(preset.primary)
    onAccentChange(preset.accent)
  }, [onPrimaryChange, onAccentChange])

  const randomizeColors = useCallback(() => {
    const h1 = Math.floor(Math.random() * 360)
    const h2 = (h1 + 30 + Math.floor(Math.random() * 90)) % 360
    const s = 60 + Math.floor(Math.random() * 30)
    const hex1 = hslToHex(h1, s, 50)
    const hex2 = hslToHex(h2, s, 50)
    setLocalPrimary(hex1)
    setLocalAccent(hex2)
    onPrimaryChange(hex1)
    onAccentChange(hex2)
  }, [onPrimaryChange, onAccentChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Color Palette
        </CardTitle>
        <CardDescription>
          Pick your brand colors and see auto-generated shade scales for light and dark modes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {presetPalettes.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium hover-elevate active-elevate-2 transition-colors cursor-pointer"
              data-testid={`preset-${preset.name.toLowerCase()}`}
            >
              <div className="flex">
                <div className="w-3 h-3 rounded-l-sm" style={{ backgroundColor: preset.primary }} />
                <div className="w-3 h-3 rounded-r-sm" style={{ backgroundColor: preset.accent }} />
              </div>
              {preset.name}
            </button>
          ))}
          <button
            onClick={randomizeColors}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium hover-elevate active-elevate-2 transition-colors cursor-pointer"
            data-testid="button-randomize-colors"
          >
            <Shuffle className="w-3 h-3" />
            Random
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ColorInput
            label="Primary Color"
            value={localPrimary}
            onChange={handlePrimaryChange}
            defaultValue="#6366f1"
            placeholder="#6366f1"
            testId="input-primary-color"
          />
          <ColorInput
            label="Accent Color"
            value={localAccent}
            onChange={handleAccentChange}
            defaultValue="#8b5cf6"
            placeholder="#8b5cf6"
            testId="input-accent-color"
          />
        </div>

        <ShadeStrip shades={primaryShades} label="Primary" baseColor={localPrimary} />
        <ShadeStrip shades={accentShades} label="Accent" baseColor={localAccent} />

        <LivePreview 
          primaryColor={localPrimary} 
          accentColor={localAccent} 
          primaryShades={primaryShades} 
          accentShades={accentShades} 
        />
      </CardContent>
    </Card>
  )
}
