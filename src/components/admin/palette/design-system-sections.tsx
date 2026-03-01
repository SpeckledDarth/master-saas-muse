'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { generateHarmonizedSemantics } from '@/hooks/use-settings'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ColorInput } from '@/components/admin/color-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  ChevronDown, Type, Layers, Layout, MousePointer,
  Moon, BarChart3, Table2, Loader2, Bell, FormInput,
  Accessibility, Printer, Minus, Palette, Upload, Download, RotateCcw, Check
} from 'lucide-react'
import { useState, useRef, useMemo, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { BrandingSettings } from '@/types/settings'
import { designPresets, exportDesignConfig, importDesignConfig, type DesignPresetName } from '@/lib/design-presets'

function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string
  icon: ElementType
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        data-testid={`section-toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <Separator />
          {children}
        </div>
      )}
    </div>
  )
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ToggleGroup({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: any) => void
}) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors flex-1",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
          data-testid={`toggle-${opt.value}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function TypographySection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Typography" icon={Type} defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['h1', 'h2', 'h3'] as const).map(tag => {
          const sizeKey = `${tag}FontSize` as keyof BrandingSettings
          const weightKey = `${tag}FontWeight` as keyof BrandingSettings
          const spacingKey = `${tag}LetterSpacing` as keyof BrandingSettings
          const transformKey = `${tag}TextTransform` as keyof BrandingSettings
          const defaults = { h1: { size: '2.25rem', weight: '700' }, h2: { size: '1.5rem', weight: '600' }, h3: { size: '1.25rem', weight: '600' } }
          return (
            <div key={tag} className="space-y-3 p-3 border rounded-md">
              <h4 className="text-sm font-medium uppercase">{tag.toUpperCase()}</h4>
              <OptionGroup label="Size">
                <Select
                  value={(b[sizeKey] as string) || defaults[tag].size}
                  onValueChange={v => updateBranding(sizeKey, v)}
                >
                  <SelectTrigger className="h-8 text-xs" data-testid={`select-${tag}-size`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1rem">1rem (16px)</SelectItem>
                    <SelectItem value="1.125rem">1.125rem (18px)</SelectItem>
                    <SelectItem value="1.25rem">1.25rem (20px)</SelectItem>
                    <SelectItem value="1.375rem">1.375rem (22px)</SelectItem>
                    <SelectItem value="1.5rem">1.5rem (24px)</SelectItem>
                    <SelectItem value="1.75rem">1.75rem (28px)</SelectItem>
                    <SelectItem value="2rem">2rem (32px)</SelectItem>
                    <SelectItem value="2.25rem">2.25rem (36px)</SelectItem>
                    <SelectItem value="2.5rem">2.5rem (40px)</SelectItem>
                    <SelectItem value="2.75rem">2.75rem (44px)</SelectItem>
                    <SelectItem value="3rem">3rem (48px)</SelectItem>
                  </SelectContent>
                </Select>
              </OptionGroup>
              <OptionGroup label="Weight">
                <Select
                  value={(b[weightKey] as string) || defaults[tag].weight}
                  onValueChange={v => updateBranding(weightKey, v)}
                >
                  <SelectTrigger className="h-8 text-xs" data-testid={`select-${tag}-weight`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Medium (500)</SelectItem>
                    <SelectItem value="600">Semibold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                    <SelectItem value="800">Extra Bold (800)</SelectItem>
                  </SelectContent>
                </Select>
              </OptionGroup>
              <OptionGroup label="Letter Spacing">
                <Select
                  value={(b[spacingKey] as string) || '0'}
                  onValueChange={v => updateBranding(spacingKey, v)}
                >
                  <SelectTrigger className="h-8 text-xs" data-testid={`select-${tag}-spacing`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-0.03em">Tight (-0.03em)</SelectItem>
                    <SelectItem value="-0.025em">Snug (-0.025em)</SelectItem>
                    <SelectItem value="-0.015em">Slight (-0.015em)</SelectItem>
                    <SelectItem value="0">Normal (0)</SelectItem>
                    <SelectItem value="0.025em">Wide (0.025em)</SelectItem>
                    <SelectItem value="0.05em">Wider (0.05em)</SelectItem>
                    <SelectItem value="0.1em">Widest (0.1em)</SelectItem>
                  </SelectContent>
                </Select>
              </OptionGroup>
              <OptionGroup label="Transform">
                <ToggleGroup
                  value={(b[transformKey] as string) || 'none'}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'uppercase', label: 'UPPER' },
                    { value: 'capitalize', label: 'Title' },
                  ]}
                  onChange={v => updateBranding(transformKey, v)}
                />
              </OptionGroup>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OptionGroup label="Heading Color Mode">
          <ToggleGroup
            value={b.headingColorMode || 'foreground'}
            options={[
              { value: 'foreground', label: 'Default' },
              { value: 'primary', label: 'Primary' },
              { value: 'gradient', label: 'Gradient' },
            ]}
            onChange={v => updateBranding('headingColorMode', v)}
          />
        </OptionGroup>
        <OptionGroup label="Body Font Size">
          <Select
            value={b.bodyFontSize || '0.9375rem'}
            onValueChange={v => updateBranding('bodyFontSize', v)}
          >
            <SelectTrigger className="h-8 text-xs" data-testid="select-body-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.8125rem">0.8125rem (13px)</SelectItem>
              <SelectItem value="0.875rem">0.875rem (14px)</SelectItem>
              <SelectItem value="0.9375rem">0.9375rem (15px)</SelectItem>
              <SelectItem value="1rem">1rem (16px)</SelectItem>
            </SelectContent>
          </Select>
        </OptionGroup>
        <OptionGroup label="Body Line Height">
          <Select
            value={b.bodyLineHeight || '1.6'}
            onValueChange={v => updateBranding('bodyLineHeight', v)}
          >
            <SelectTrigger className="h-8 text-xs" data-testid="select-body-line-height">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.4">Compact (1.4)</SelectItem>
              <SelectItem value="1.5">Normal (1.5)</SelectItem>
              <SelectItem value="1.6">Relaxed (1.6)</SelectItem>
              <SelectItem value="1.75">Spacious (1.75)</SelectItem>
            </SelectContent>
          </Select>
        </OptionGroup>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Preview</p>
          <h1 data-testid="text-preview-h1">Heading One</h1>
          <h2 data-testid="text-preview-h2">Heading Two</h2>
          <h3 data-testid="text-preview-h3">Heading Three</h3>
          <p data-testid="text-preview-body">Body text looks like this. The quick brown fox jumps over the lazy dog.</p>
        </CardContent>
      </Card>
    </Section>
  )
}

export function ComponentStyleSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Component Style" icon={Layers} defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-sm font-medium">Cards</h4>
          <OptionGroup label="Padding">
            <ToggleGroup
              value={b.cardPadding || 'spacious'}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'default', label: 'Default' },
                { value: 'spacious', label: 'Spacious' },
              ]}
              onChange={v => updateBranding('cardPadding', v)}
            />
          </OptionGroup>
          <OptionGroup label="Border Radius">
            <ToggleGroup
              value={b.cardBorderRadius || 'lg'}
              options={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'SM' },
                { value: 'md', label: 'MD' },
                { value: 'lg', label: 'LG' },
                { value: 'xl', label: 'XL' },
              ]}
              onChange={v => updateBranding('cardBorderRadius', v)}
            />
          </OptionGroup>
          <OptionGroup label="Shadow">
            <ToggleGroup
              value={b.cardShadow || 'sm'}
              options={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'SM' },
                { value: 'md', label: 'MD' },
                { value: 'lg', label: 'LG' },
              ]}
              onChange={v => updateBranding('cardShadow', v)}
            />
          </OptionGroup>
          <OptionGroup label="Border Width">
            <ToggleGroup
              value={String(b.cardBorderWidth ?? 1)}
              options={[
                { value: '0', label: '0' },
                { value: '1', label: '1px' },
                { value: '2', label: '2px' },
              ]}
              onChange={v => updateBranding('cardBorderWidth', parseInt(v) as any)}
            />
          </OptionGroup>
          <OptionGroup label="Border Style">
            <ToggleGroup
              value={b.cardBorderStyle || 'solid'}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
                { value: 'none', label: 'None' },
              ]}
              onChange={v => updateBranding('cardBorderStyle', v)}
            />
          </OptionGroup>
        </div>

        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-sm font-medium">Buttons</h4>
          <OptionGroup label="Size">
            <ToggleGroup
              value={b.buttonSize || 'default'}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'default', label: 'Default' },
                { value: 'large', label: 'Large' },
              ]}
              onChange={v => updateBranding('buttonSize', v)}
            />
          </OptionGroup>
          <OptionGroup label="Font Weight">
            <ToggleGroup
              value={b.buttonFontWeight || 'semibold'}
              options={[
                { value: 'medium', label: 'Medium' },
                { value: 'semibold', label: 'Semi' },
                { value: 'bold', label: 'Bold' },
              ]}
              onChange={v => updateBranding('buttonFontWeight', v)}
            />
          </OptionGroup>
          <OptionGroup label="Text Transform">
            <ToggleGroup
              value={b.buttonTextTransform || 'none'}
              options={[
                { value: 'none', label: 'Normal' },
                { value: 'uppercase', label: 'UPPER' },
              ]}
              onChange={v => updateBranding('buttonTextTransform', v)}
            />
          </OptionGroup>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Click feedback</Label>
            <Switch
              checked={b.buttonClickFeedback !== false}
              onCheckedChange={v => updateBranding('buttonClickFeedback', v)}
              data-testid="switch-btn-click"
            />
          </div>
        </div>

        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-sm font-medium">Other</h4>
          <OptionGroup label="Badge Shape">
            <ToggleGroup
              value={b.badgeShape || 'pill'}
              options={[
                { value: 'pill', label: 'Pill' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'square', label: 'Square' },
              ]}
              onChange={v => updateBranding('badgeShape', v)}
            />
          </OptionGroup>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Match input radius to cards</Label>
            <Switch
              checked={b.inputStyleMatch !== false}
              onCheckedChange={v => updateBranding('inputStyleMatch', v)}
              data-testid="switch-input-match"
            />
          </div>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Preview</p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button data-testid="preview-btn-primary">Primary</Button>
            <Button variant="outline" data-testid="preview-btn-outline">Outline</Button>
            <Button variant="secondary" data-testid="preview-btn-secondary">Secondary</Button>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

export function LayoutSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Layout" icon={Layout}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <OptionGroup label="Content Density">
          <ToggleGroup
            value={b.contentDensity || 'spacious'}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'default', label: 'Default' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            onChange={v => updateBranding('contentDensity', v)}
          />
        </OptionGroup>
        <OptionGroup label="Section Spacing">
          <ToggleGroup
            value={b.sectionSpacing || 'spacious'}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'default', label: 'Default' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            onChange={v => updateBranding('sectionSpacing', v)}
          />
        </OptionGroup>
        <OptionGroup label="Sidebar Width">
          <ToggleGroup
            value={b.sidebarWidth || 'default'}
            options={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'default', label: 'Default' },
              { value: 'wide', label: 'Wide' },
            ]}
            onChange={v => updateBranding('sidebarWidth', v)}
          />
        </OptionGroup>
        <OptionGroup label="Page Header Style">
          <ToggleGroup
            value={b.pageHeaderStyle || 'large'}
            options={[
              { value: 'large', label: 'Large' },
              { value: 'compact', label: 'Compact' },
            ]}
            onChange={v => updateBranding('pageHeaderStyle', v)}
          />
        </OptionGroup>
        <OptionGroup label="Logo Position">
          <ToggleGroup
            value={b.logoPosition || 'left'}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
            ]}
            onChange={v => updateBranding('logoPosition', v)}
          />
        </OptionGroup>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Sticky Header</Label>
          <Switch
            checked={b.stickyHeader !== false}
            onCheckedChange={v => updateBranding('stickyHeader', v)}
            data-testid="switch-sticky-header"
          />
        </div>
      </div>
    </Section>
  )
}

export function InteractiveSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Interactive States" icon={MousePointer}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <OptionGroup label="Hover Effect">
          <ToggleGroup
            value={b.hoverEffect || 'lift'}
            options={[
              { value: 'none', label: 'None' },
              { value: 'lift', label: 'Lift' },
              { value: 'glow', label: 'Glow' },
              { value: 'scale', label: 'Scale' },
            ]}
            onChange={v => updateBranding('hoverEffect', v)}
          />
        </OptionGroup>
        <OptionGroup label="Animation Speed">
          <ToggleGroup
            value={b.animationSpeed || 'normal'}
            options={[
              { value: 'none', label: 'None' },
              { value: 'fast', label: 'Fast' },
              { value: 'normal', label: 'Normal' },
              { value: 'slow', label: 'Slow' },
            ]}
            onChange={v => updateBranding('animationSpeed', v)}
          />
        </OptionGroup>
        <OptionGroup label="Focus Ring Width">
          <ToggleGroup
            value={String(b.focusRingWidth || 2)}
            options={[
              { value: '1', label: '1px' },
              { value: '2', label: '2px' },
              { value: '3', label: '3px' },
            ]}
            onChange={v => updateBranding('focusRingWidth', parseInt(v) as any)}
          />
        </OptionGroup>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs text-muted-foreground">Card click feedback</Label>
          <Switch
            checked={b.cardClickFeedback || false}
            onCheckedChange={v => updateBranding('cardClickFeedback', v)}
            data-testid="switch-card-click"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs text-muted-foreground">Page transition fade</Label>
          <Switch
            checked={b.pageTransitionFade !== false}
            onCheckedChange={v => updateBranding('pageTransitionFade', v)}
            data-testid="switch-page-transition"
          />
        </div>
      </div>
    </Section>
  )
}

export function DarkModeSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Dark Mode" icon={Moon}>
      <OptionGroup label="Mode Control">
        <ToggleGroup
          value={b.darkModeOption || 'user-choice'}
          options={[
            { value: 'user-choice', label: 'User Choice' },
            { value: 'force-light', label: 'Force Light' },
            { value: 'force-dark', label: 'Force Dark' },
          ]}
          onChange={v => updateBranding('darkModeOption', v)}
        />
      </OptionGroup>
      <p className="text-xs text-muted-foreground">
        {b.darkModeOption === 'force-light' && 'The site will always use light mode. The toggle will be hidden.'}
        {b.darkModeOption === 'force-dark' && 'The site will always use dark mode. The toggle will be hidden.'}
        {(!b.darkModeOption || b.darkModeOption === 'user-choice') && 'Users can switch between light and dark mode. Their preference is saved.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionGroup label="Dark Card Depth">
          <ToggleGroup
            value={b.darkCardDepth || 'default'}
            options={[
              { value: 'subtle', label: 'Subtle' },
              { value: 'default', label: 'Default' },
              { value: 'deep', label: 'Deep' },
            ]}
            onChange={v => updateBranding('darkCardDepth', v)}
          />
        </OptionGroup>
        <OptionGroup label="Dark Accent Brightness">
          <ToggleGroup
            value={b.darkAccentBrightness || 'default'}
            options={[
              { value: 'muted', label: 'Muted' },
              { value: 'default', label: 'Default' },
              { value: 'vivid', label: 'Vivid' },
            ]}
            onChange={v => updateBranding('darkAccentBrightness', v)}
          />
        </OptionGroup>
      </div>
    </Section>
  )
}

export function DataVizSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Data Visualization" icon={BarChart3}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-sm font-medium">Bars</h4>
          <OptionGroup label="Thickness">
            <ToggleGroup
              value={b.chartBarThickness || 'default'}
              options={[
                { value: 'thin', label: 'Thin' },
                { value: 'default', label: 'Default' },
                { value: 'thick', label: 'Thick' },
              ]}
              onChange={v => updateBranding('chartBarThickness', v)}
            />
          </OptionGroup>
          <OptionGroup label="Corner Radius">
            <ToggleGroup
              value={b.chartBarRadius || 'sm'}
              options={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'SM' },
                { value: 'md', label: 'MD' },
              ]}
              onChange={v => updateBranding('chartBarRadius', v)}
            />
          </OptionGroup>
        </div>

        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-sm font-medium">Lines</h4>
          <OptionGroup label="Width">
            <ToggleGroup
              value={String(b.chartLineWidth || 2)}
              options={[
                { value: '1', label: '1px' },
                { value: '2', label: '2px' },
                { value: '3', label: '3px' },
              ]}
              onChange={v => updateBranding('chartLineWidth', parseInt(v) as any)}
            />
          </OptionGroup>
          <OptionGroup label="Curve">
            <ToggleGroup
              value={b.chartLineCurve || 'monotone'}
              options={[
                { value: 'monotone', label: 'Smooth' },
                { value: 'linear', label: 'Linear' },
                { value: 'step', label: 'Step' },
              ]}
              onChange={v => updateBranding('chartLineCurve', v)}
            />
          </OptionGroup>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Show dots</Label>
            <Switch
              checked={b.chartDots !== false}
              onCheckedChange={v => updateBranding('chartDots', v)}
              data-testid="switch-chart-dots"
            />
          </div>
        </div>

        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-sm font-medium">Grid & Fill</h4>
          <OptionGroup label="Grid Lines">
            <ToggleGroup
              value={b.chartGridLines || 'visible'}
              options={[
                { value: 'visible', label: 'Visible' },
                { value: 'hidden', label: 'Hidden' },
              ]}
              onChange={v => updateBranding('chartGridLines', v)}
            />
          </OptionGroup>
          <OptionGroup label="Grid Style">
            <ToggleGroup
              value={b.chartGridStyle || 'dashed'}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
              ]}
              onChange={v => updateBranding('chartGridStyle', v)}
            />
          </OptionGroup>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Area fill</Label>
            <Switch
              checked={b.chartAreaFill || false}
              onCheckedChange={v => updateBranding('chartAreaFill', v)}
              data-testid="switch-chart-fill"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Trend line</Label>
            <Switch
              checked={b.chartTrendLine || false}
              onCheckedChange={v => updateBranding('chartTrendLine', v)}
              data-testid="switch-chart-trend"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionGroup label="Color Strategy">
          <ToggleGroup
            value={b.chartColorStrategy || 'monochromatic'}
            options={[
              { value: 'monochromatic', label: 'Mono' },
              { value: 'complementary', label: 'Complement' },
              { value: 'multi', label: 'Multi' },
            ]}
            onChange={v => updateBranding('chartColorStrategy', v)}
          />
        </OptionGroup>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Tooltip matches card style</Label>
          <Switch
            checked={b.chartTooltipMatchCard !== false}
            onCheckedChange={v => updateBranding('chartTooltipMatchCard', v)}
            data-testid="switch-chart-tooltip"
          />
        </div>
      </div>
    </Section>
  )
}

export function TablesSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Tables" icon={Table2}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OptionGroup label="Row Style">
          <ToggleGroup
            value={b.tableStyle || 'clean'}
            options={[
              { value: 'clean', label: 'Clean' },
              { value: 'striped', label: 'Striped' },
            ]}
            onChange={v => updateBranding('tableStyle', v)}
          />
        </OptionGroup>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Row borders</Label>
          <Switch
            checked={b.tableRowBorders !== false}
            onCheckedChange={v => updateBranding('tableRowBorders', v)}
            data-testid="switch-table-borders"
          />
        </div>
        <OptionGroup label="Header Style">
          <ToggleGroup
            value={b.tableHeaderStyle || 'bold'}
            options={[
              { value: 'bold', label: 'Bold' },
              { value: 'subtle', label: 'Subtle' },
            ]}
            onChange={v => updateBranding('tableHeaderStyle', v)}
          />
        </OptionGroup>
      </div>
    </Section>
  )
}

export function LoadingStatesSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Loading & States" icon={Loader2}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionGroup label="Skeleton Animation">
          <ToggleGroup
            value={b.skeletonStyle || 'pulse'}
            options={[
              { value: 'pulse', label: 'Pulse' },
              { value: 'shimmer', label: 'Shimmer' },
              { value: 'static', label: 'Static' },
            ]}
            onChange={v => updateBranding('skeletonStyle', v)}
          />
        </OptionGroup>
        <OptionGroup label="Empty State Style">
          <ToggleGroup
            value={b.emptyStateStyle || 'illustration'}
            options={[
              { value: 'illustration', label: 'Illustration' },
              { value: 'icon-only', label: 'Icon Only' },
            ]}
            onChange={v => updateBranding('emptyStateStyle', v)}
          />
        </OptionGroup>
      </div>
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Skeleton Preview</p>
          <div className="space-y-2">
            <div className="skeleton h-4 w-3/4 bg-muted rounded" />
            <div className="skeleton h-4 w-1/2 bg-muted rounded" />
            <div className="skeleton h-4 w-2/3 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

export function NotificationsSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Notifications" icon={Bell}>
      <OptionGroup label="Toast Position">
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          {([
            { value: 'top-right', label: 'Top Right' },
            { value: 'top-center', label: 'Top Center' },
            { value: 'bottom-right', label: 'Bottom Right' },
            { value: 'bottom-center', label: 'Bottom Center' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => updateBranding('toastPosition', opt.value)}
              className={cn(
                "px-3 py-2 text-xs rounded-md border transition-colors",
                (b.toastPosition || 'top-right') === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              )}
              data-testid={`toast-position-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </OptionGroup>
    </Section>
  )
}

export function FormsSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Forms" icon={FormInput}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OptionGroup label="Label Position">
          <ToggleGroup
            value={b.labelPosition || 'above'}
            options={[
              { value: 'above', label: 'Above' },
              { value: 'floating', label: 'Floating' },
            ]}
            onChange={v => updateBranding('labelPosition', v)}
          />
        </OptionGroup>
        <OptionGroup label="Required Indicator">
          <ToggleGroup
            value={b.requiredFieldIndicator || 'asterisk'}
            options={[
              { value: 'asterisk', label: '* Asterisk' },
              { value: 'text', label: 'Text' },
              { value: 'border', label: 'Border' },
            ]}
            onChange={v => updateBranding('requiredFieldIndicator', v)}
          />
        </OptionGroup>
        <OptionGroup label="Error Style">
          <ToggleGroup
            value={b.errorMessageStyle || 'inline'}
            options={[
              { value: 'inline', label: 'Inline' },
              { value: 'tooltip', label: 'Tooltip' },
            ]}
            onChange={v => updateBranding('errorMessageStyle', v)}
          />
        </OptionGroup>
      </div>
    </Section>
  )
}

export function ScrollPageSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Scroll & Page" icon={MousePointer}>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Smooth scroll</Label>
          <Switch
            checked={b.smoothScroll !== false}
            onCheckedChange={v => updateBranding('smoothScroll', v)}
            data-testid="switch-smooth-scroll"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Scroll-to-top button</Label>
          <Switch
            checked={b.scrollToTopButton !== false}
            onCheckedChange={v => updateBranding('scrollToTopButton', v)}
            data-testid="switch-scroll-top"
          />
        </div>
      </div>
    </Section>
  )
}

export function AccessibilitySection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Accessibility" icon={Accessibility}>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">WCAG AA contrast enforcement</Label>
          <Switch
            checked={b.contrastEnforcement !== false}
            onCheckedChange={v => updateBranding('contrastEnforcement', v)}
            data-testid="switch-contrast"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Respect reduced motion</Label>
          <Switch
            checked={b.respectReducedMotion !== false}
            onCheckedChange={v => updateBranding('respectReducedMotion', v)}
            data-testid="switch-reduced-motion"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Both are enabled by default. Disabling contrast enforcement may produce text that is hard to read.</p>
    </Section>
  )
}

export function SemanticColorsSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding
  const harmonized = b.primaryColor ? generateHarmonizedSemantics(b.primaryColor) : null
  const defaultSuccess = harmonized?.successHex || '#22c55e'
  const defaultWarning = harmonized?.warningHex || '#f59e0b'
  const defaultDanger = harmonized?.dangerHex || '#ef4444'
  const hasAnyOverride = !!(b.successColor || b.warningColor || b.dangerColor)

  return (
    <Section title="Semantic Colors" icon={Palette}>
      <p className="text-xs text-muted-foreground">
        {harmonized
          ? 'These colors are auto-harmonized from your primary color. Override any color manually, or reset to harmonized defaults.'
          : 'Set a primary color first to auto-generate harmonious defaults, or pick colors manually.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <ColorInput
            label={b.successColor ? 'Success' : 'Success (auto-harmonized)'}
            value={b.successColor || defaultSuccess}
            onChange={hex => updateBranding('successColor', hex)}
            onClear={() => updateBranding('successColor', undefined)}
            defaultValue={defaultSuccess}
            testId="input-success-color"
          />
        </div>
        <div>
          <ColorInput
            label={b.warningColor ? 'Warning' : 'Warning (auto-harmonized)'}
            value={b.warningColor || defaultWarning}
            onChange={hex => updateBranding('warningColor', hex)}
            onClear={() => updateBranding('warningColor', undefined)}
            defaultValue={defaultWarning}
            testId="input-warning-color"
          />
        </div>
        <div>
          <ColorInput
            label={b.dangerColor ? 'Danger' : 'Danger (auto-harmonized)'}
            value={b.dangerColor || defaultDanger}
            onChange={hex => updateBranding('dangerColor', hex)}
            onClear={() => updateBranding('dangerColor', undefined)}
            defaultValue={defaultDanger}
            testId="input-danger-color"
          />
        </div>
      </div>
      {hasAnyOverride && (
        <button
          onClick={() => {
            updateBranding('successColor', undefined)
            updateBranding('warningColor', undefined)
            updateBranding('dangerColor', undefined)
          }}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          data-testid="button-reset-semantic-colors"
        >
          Reset all to harmonized defaults
        </button>
      )}
    </Section>
  )
}

export function DividerSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Dividers" icon={Minus}>
      <OptionGroup label="Divider Style">
        <ToggleGroup
          value={b.dividerStyle || 'line'}
          options={[
            { value: 'line', label: 'Line' },
            { value: 'gradient', label: 'Gradient' },
            { value: 'none', label: 'None' },
          ]}
          onChange={v => updateBranding('dividerStyle', v)}
        />
      </OptionGroup>
      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Preview</p>
          <p className="text-sm">Content above the divider</p>
          <Separator />
          <p className="text-sm">Content below the divider</p>
        </CardContent>
      </Card>
    </Section>
  )
}

export function PrintSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const b = settings.branding

  return (
    <Section title="Print" icon={Printer}>
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground">Print-friendly stylesheet</Label>
        <Switch
          checked={b.printStyles !== false}
          onCheckedChange={v => updateBranding('printStyles', v)}
          data-testid="switch-print"
        />
      </div>
      <p className="text-xs text-muted-foreground">When enabled, invoices, reports, and earnings pages use a clean print layout with hidden navigation.</p>
    </Section>
  )
}

export function PresetsSection() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const activePreset = useMemo(() => {
    const b = settings.branding
    for (const preset of designPresets) {
      const allMatch = Object.entries(preset.settings).every(([key, value]) => {
        const current = b[key as keyof BrandingSettings]
        return current === value
      })
      if (allMatch) return preset.name
    }
    return null
  }, [settings.branding])

  const applyPreset = (name: DesignPresetName) => {
    const preset = designPresets.find(p => p.name === name)
    if (!preset) return
    for (const [key, value] of Object.entries(preset.settings)) {
      updateBranding(key as keyof BrandingSettings, value)
    }
    toast({
      title: `${preset.label} applied`,
      description: 'Click Save to keep your changes.',
    })
  }

  const handleExport = () => {
    const json = exportDesignConfig(settings.branding)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `design-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const imported = importDesignConfig(text)
      if (!imported) {
        setImportStatus('Invalid design config file')
        setTimeout(() => setImportStatus(null), 3000)
        return
      }
      for (const [key, value] of Object.entries(imported)) {
        updateBranding(key as keyof BrandingSettings, value)
      }
      setImportStatus('Design config imported successfully')
      setTimeout(() => setImportStatus(null), 3000)
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetToDefault = () => {
    applyPreset('clean-airy')
  }

  return (
    <Section title="Presets & Reset" icon={Palette} defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {designPresets.map(preset => {
          const isActive = activePreset === preset.name
          return (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              className={cn(
                "p-3 border-2 rounded-lg text-left transition-all space-y-1 relative",
                isActive
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:bg-muted/50 hover:border-muted-foreground/30"
              )}
              data-testid={`preset-${preset.name}`}
            >
              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </span>
              )}
              <span className={cn("text-sm font-medium", isActive && "text-primary")}>{preset.label}</span>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-config">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Config
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-import-config">
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Import Config
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <Button variant="outline" size="sm" onClick={resetToDefault} data-testid="button-reset-defaults">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset to Defaults
        </Button>
      </div>

      {importStatus && (
        <p className={cn(
          "text-xs",
          importStatus.includes('Invalid') ? 'text-destructive' : 'text-[hsl(var(--success))]'
        )} data-testid="text-import-status">
          {importStatus}
        </p>
      )}
    </Section>
  )
}
