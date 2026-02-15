'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Type } from 'lucide-react'

const curatedFonts = [
  { name: 'System Default', value: 'system', category: 'system' },
  { name: 'Inter', value: 'Inter', category: 'sans-serif' },
  { name: 'DM Sans', value: 'DM Sans', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', category: 'sans-serif' },
  { name: 'Outfit', value: 'Outfit', category: 'sans-serif' },
  { name: 'Manrope', value: 'Manrope', category: 'sans-serif' },
  { name: 'Space Grotesk', value: 'Space Grotesk', category: 'sans-serif' },
  { name: 'Sora', value: 'Sora', category: 'sans-serif' },
  { name: 'Poppins', value: 'Poppins', category: 'sans-serif' },
  { name: 'Nunito', value: 'Nunito', category: 'sans-serif' },
  { name: 'Raleway', value: 'Raleway', category: 'sans-serif' },
  { name: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
  { name: 'Lora', value: 'Lora', category: 'serif' },
  { name: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', value: 'Merriweather', category: 'serif' },
  { name: 'Source Serif 4', value: 'Source Serif 4', category: 'serif' },
  { name: 'Crimson Pro', value: 'Crimson Pro', category: 'serif' },
  { name: 'DM Serif Display', value: 'DM Serif Display', category: 'serif' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'mono' },
  { name: 'Fira Code', value: 'Fira Code', category: 'mono' },
]

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
  if (value === 'system') return 'ui-sans-serif, system-ui, -apple-system, sans-serif'
  const font = curatedFonts.find(f => f.value === value)
  const fallback = font?.category === 'serif' ? ', serif' : font?.category === 'mono' ? ', monospace' : ', sans-serif'
  return `"${value}"${fallback}`
}

interface FontPickerProps {
  headingFont: string
  bodyFont: string
  headingGradient: boolean
  primaryColor: string
  accentColor: string
  onHeadingFontChange: (font: string) => void
  onBodyFontChange: (font: string) => void
  onHeadingGradientChange: (enabled: boolean) => void
}

export function FontPicker({
  headingFont,
  bodyFont,
  headingGradient,
  primaryColor,
  accentColor,
  onHeadingFontChange,
  onBodyFontChange,
  onHeadingGradientChange,
}: FontPickerProps) {
  useEffect(() => {
    if (headingFont && headingFont !== 'system') loadGoogleFont(headingFont)
    if (bodyFont && bodyFont !== 'system') loadGoogleFont(bodyFont)
  }, [headingFont, bodyFont])

  const sansSerif = curatedFonts.filter(f => f.category === 'sans-serif' || f.category === 'system')
  const serif = curatedFonts.filter(f => f.category === 'serif')
  const mono = curatedFonts.filter(f => f.category === 'mono')

  const headingStyle = useMemo(() => ({
    fontFamily: getFontFamily(headingFont || 'system'),
    ...(headingGradient ? {
      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } : {}),
  }), [headingFont, headingGradient, primaryColor, accentColor])

  const bodyStyle = useMemo(() => ({
    fontFamily: getFontFamily(bodyFont || 'system'),
  }), [bodyFont])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typography
        </CardTitle>
        <CardDescription>
          Choose fonts for headings and body text with live preview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Heading Font</Label>
            <Select value={headingFont || 'system'} onValueChange={v => { if (v !== 'system') loadGoogleFont(v); onHeadingFontChange(v) }}>
              <SelectTrigger data-testid="select-heading-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sansSerif.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>
                ))}
                <SelectItem disabled value="---serif---">--- Serif ---</SelectItem>
                {serif.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>
                ))}
                <SelectItem disabled value="---mono---">--- Monospace ---</SelectItem>
                {mono.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body Font</Label>
            <Select value={bodyFont || 'system'} onValueChange={v => { if (v !== 'system') loadGoogleFont(v); onBodyFontChange(v) }}>
              <SelectTrigger data-testid="select-body-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sansSerif.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>
                ))}
                <SelectItem disabled value="---serif---">--- Serif ---</SelectItem>
                {serif.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={headingGradient}
            onCheckedChange={onHeadingGradientChange}
            data-testid="switch-heading-gradient"
          />
          <Label>Gradient headings (uses primary to accent color)</Label>
        </div>

        <div className="p-5 rounded-md border space-y-3">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <h1 className="text-2xl font-bold" style={headingStyle as React.CSSProperties} data-testid="text-heading-preview">
            The quick brown fox jumps
          </h1>
          <h2 className="text-lg font-semibold" style={headingStyle as React.CSSProperties}>
            Over the lazy dog
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed" style={bodyStyle}>
            This is body text in your chosen font. It shows how paragraphs, descriptions, and other content will look across your site. Good typography improves readability and gives your brand a polished feel.
          </p>
          <p className="text-xs text-muted-foreground" style={bodyStyle}>
            Small text for captions, metadata, and secondary information.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
