'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Copy, Check, Shuffle, Sun, Moon, TrendingUp, ShoppingCart, Coffee,
  Zap, Dumbbell, Car, Cross, Phone, Gamepad2, Home, GraduationCap,
  Heart, Star, Users, User, Clock, Mail, ChevronLeft, ChevronRight,
  BookOpen, Eye, MousePointer, DollarSign, BarChart3, ArrowUpRight,
  ArrowDownRight, Sparkles, Rocket, Shield
} from 'lucide-react'
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
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Slate', color: '#64748b' },
  { name: 'Violet', color: '#8b5cf6' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Orange', color: '#f97316' },
]

const shadeKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

interface ThemeColors {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  text: string
  textSecondary: string
  textTertiary: string
  accent: string
  accentSoft: string
  btnPrimary: string
  btnPrimaryText: string
  softBadgeBg: string
  softBadgeText: string
  progressTrack: string
  progressBar: string
  shadow: string
}

function getThemeColors(shades: Record<string, string>, dark: boolean): ThemeColors {
  if (dark) {
    return {
      bg: shades['950'],
      surface: shades['900'],
      surfaceAlt: shades['800'],
      border: `${shades['700']}40`,
      text: shades['100'],
      textSecondary: shades['300'],
      textTertiary: shades['400'],
      accent: shades['400'],
      accentSoft: `${shades['400']}18`,
      btnPrimary: shades['500'],
      btnPrimaryText: getContrastText(shades['500']),
      softBadgeBg: `${shades['400']}20`,
      softBadgeText: shades['300'],
      progressTrack: `${shades['500']}20`,
      progressBar: shades['400'],
      shadow: 'none',
    }
  }
  return {
    bg: shades['50'],
    surface: '#ffffff',
    surfaceAlt: shades['50'],
    border: `${shades['200']}60`,
    text: shades['900'],
    textSecondary: shades['500'],
    textTertiary: shades['400'],
    accent: shades['500'],
    accentSoft: `${shades['500']}10`,
    btnPrimary: shades['500'],
    btnPrimaryText: getContrastText(shades['500']),
    softBadgeBg: `${shades['500']}10`,
    softBadgeText: shades['600'],
    progressTrack: `${shades['500']}12`,
    progressBar: shades['500'],
    shadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
  }
}

function PreviewPanel({ children, theme, className = '' }: { children: React.ReactNode, theme: ThemeColors, className?: string }) {
  return (
    <div
      className={cn('rounded-2xl overflow-hidden transition-all duration-200', className)}
      style={{
        backgroundColor: theme.surface,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      {children}
    </div>
  )
}

function HeroCard({ shades }: { shades: Record<string, string> }) {
  return (
    <div
      className="rounded-2xl p-7 flex flex-col gap-4"
      style={{ background: `linear-gradient(135deg, ${shades['600']}, ${shades['500']}, ${shades['400']})` }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
        <TrendingUp className="w-5 h-5" style={{ color: '#ffffff' }} />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold tracking-tight" style={{ color: '#ffffff' }}>Increase your revenue by 3x</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Track and optimize your business performance with real-time analytics and smart insights.
        </p>
      </div>
      <button
        className="mt-1 self-start px-5 py-2.5 rounded-xl text-xs font-medium tracking-wide"
        style={{ backgroundColor: '#ffffff', color: shades['700'] }}
      >
        Get Started
      </button>
    </div>
  )
}

function CategoriesCard({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const categories = [
    { name: 'Grocery', icon: ShoppingCart },
    { name: 'Cafe', icon: Coffee },
    { name: 'Utilities', icon: Zap },
    { name: 'Sport', icon: Dumbbell },
    { name: 'Taxi', icon: Car },
    { name: 'Pharmacies', icon: Cross },
    { name: 'Telecom', icon: Phone },
    { name: 'Gadgets', icon: Gamepad2 },
  ]
  return (
    <div className="p-5">
      <p className="text-sm font-semibold mb-4 tracking-tight" style={{ color: theme.text }}>Categories</p>
      <div className="grid grid-cols-4 gap-4">
        {categories.map(c => (
          <div key={c.name} className="flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.accentSoft }}>
              <c.icon className="w-4 h-4" style={{ color: theme.accent }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetCards({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const items = [
    { name: 'Home Renovation', amount: '$10,000', progress: 65, icon: Home },
    { name: 'Education', amount: '$40,000', progress: 40, icon: GraduationCap },
    { name: 'Health', amount: '$5,500', progress: 85, icon: Heart },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Budget</p>
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.accentSoft }}>
            <item.icon className="w-4 h-4" style={{ color: theme.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium truncate" style={{ color: theme.text }}>{item.name}</span>
              <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: theme.text }}>{item.amount}</span>
            </div>
            <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${item.progress}%`, backgroundColor: theme.progressBar }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function NewsletterList({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const items = [
    { name: 'Newsletter', count: '1,248', checked: true },
    { name: 'Existing customers', count: '842', checked: false },
    { name: 'Trial users', count: '356', checked: false },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Audience Lists</p>
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-3.5">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
            style={{
              backgroundColor: item.checked ? theme.accent : 'transparent',
              border: item.checked ? 'none' : `1.5px solid ${theme.textTertiary}`,
            }}
          >
            {item.checked && <Check className="w-3 h-3" style={{ color: '#ffffff' }} />}
          </div>
          <span className="text-xs flex-1 font-medium" style={{ color: theme.text }}>{item.name}</span>
          <span className="text-[11px] tabular-nums" style={{ color: theme.textTertiary }}>{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function ScheduleCard({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const slots = [
    { time: '9:15 AM', title: 'Morning standup', desc: 'Team sync' },
    { time: '4:00 PM', title: 'Design review', desc: 'UI feedback' },
    { time: '7:30 PM', title: 'Client call', desc: 'Project update' },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Schedule</p>
      {slots.map(slot => (
        <div key={slot.time} className="flex items-center gap-3.5">
          <span
            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 tabular-nums"
            style={{ backgroundColor: theme.accent, color: getContrastText(shades['500']) }}
          >
            {slot.time}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: theme.text }}>{slot.title}</p>
            <p className="text-[10px] truncate" style={{ color: theme.textTertiary }}>{slot.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileCard({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  return (
    <div className="p-6 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.accentSoft }}>
        <User className="w-7 h-7" style={{ color: theme.accent }} />
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Sarah Jones</p>
        <p className="text-[11px]" style={{ color: theme.textSecondary }}>Product designer</p>
      </div>
      <span
        className="text-[10px] font-medium px-3 py-1 rounded-full"
        style={{ backgroundColor: theme.softBadgeBg, color: theme.accent }}
      >
        Online
      </span>
    </div>
  )
}

function RevenueChart({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const bars = [
    { h: 40, opacity: 0.35 }, { h: 65, opacity: 0.5 }, { h: 85, opacity: 0.7 },
    { h: 55, opacity: 0.55 }, { h: 70, opacity: 0.65 }, { h: 50, opacity: 0.45 },
    { h: 90, opacity: 1 },
  ]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Revenue</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold tabular-nums tracking-tight" style={{ color: theme.text }}>$213,000</span>
          <span className="text-[10px] font-semibold" style={{ color: '#22c55e' }}>+20%</span>
        </div>
      </div>
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-md transition-all"
              style={{ height: bar.h, backgroundColor: theme.accent, opacity: bar.opacity }}
            />
            <span className="text-[9px] font-medium" style={{ color: theme.textTertiary }}>{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PricingPlans({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const plans = [
    { name: 'Individual', price: '$0', icon: User, desc: 'For personal use' },
    { name: 'Team', price: '$99', icon: Users, desc: 'For small teams', featured: true },
    { name: 'Enterprise', price: '$199', icon: Shield, desc: 'For large orgs' },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Pricing</p>
      <div className="grid grid-cols-3 gap-2.5">
        {plans.map(plan => (
          <div
            key={plan.name}
            className="rounded-xl p-3.5 flex flex-col items-center gap-2 text-center transition-all"
            style={{
              backgroundColor: plan.featured ? theme.accent : theme.surfaceAlt,
            }}
          >
            <plan.icon className="w-4 h-4" style={{ color: plan.featured ? '#ffffff' : theme.accent }} />
            <span className="text-[10px] font-semibold" style={{ color: plan.featured ? '#ffffff' : theme.text }}>{plan.name}</span>
            <span className="text-base font-bold tabular-nums" style={{ color: plan.featured ? '#ffffff' : theme.text }}>{plan.price}</span>
            <span className="text-[9px]" style={{ color: plan.featured ? 'rgba(255,255,255,0.65)' : theme.textTertiary }}>/month</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TicketsList({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const tickets = [
    { name: 'Alex Morgan', issue: 'Login issue', status: 'Open' },
    { name: 'Jamie Lee', issue: 'Payment failed', status: 'Processing' },
    { name: 'Chris Park', issue: 'Bug report', status: 'Closed' },
    { name: 'Sam Rivera', issue: 'Feature request', status: 'Open' },
  ]
  const statusColors: Record<string, { bg: string, text: string }> = {
    'Open': { bg: theme.softBadgeBg, text: theme.accent },
    'Processing': { bg: `${shades['300']}20`, text: shades['400'] },
    'Closed': { bg: theme.surfaceAlt, text: theme.textTertiary },
  }
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Tickets</p>
      {tickets.map((t, i) => {
        const sc = statusColors[t.status] || statusColors['Open']
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${shades[String(300 + i * 100) as string] || shades['500']}30` }}>
              <User className="w-3.5 h-3.5" style={{ color: shades[String(300 + i * 100) as string] || shades['500'] }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: theme.text }}>{t.name}</p>
              <p className="text-[10px] truncate" style={{ color: theme.textTertiary }}>{t.issue}</p>
            </div>
            <span className="text-[9px] font-medium px-2.5 py-1 rounded-full shrink-0"
              style={{ backgroundColor: sc.bg, color: sc.text }}>
              {t.status}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function CourseCards({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const courses = [
    { title: 'Design Systems', badge: 'UI/UX', progress: 72 },
    { title: 'React Advanced', badge: 'Front End Dev', progress: 45 },
    { title: 'Audio Mixing', badge: 'Sound Effects', progress: 30 },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Courses</p>
      {courses.map((c, i) => (
        <div key={c.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.surfaceAlt }}>
          <div className="h-14 rounded-t-xl" style={{ background: `linear-gradient(135deg, ${shades[String(200 + i * 100)]}50, ${shades[String(300 + i * 100)]}40)` }} />
          <div className="p-3 space-y-2.5">
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.softBadgeBg, color: theme.softBadgeText }}>{c.badge}</span>
            <p className="text-xs font-medium" style={{ color: theme.text }}>{c.title}</p>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
              <div className="h-full rounded-full" style={{ width: `${c.progress}%`, backgroundColor: theme.progressBar }} />
            </div>
            <span className="text-[9px] tabular-nums" style={{ color: theme.textTertiary }}>{c.progress}% complete</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatsRow({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const stats = [
    { label: 'Total Subscribers', value: '71,842', change: '+12%', positive: true },
    { label: 'Avg. Open Rate', value: '58.16%', change: '+2.02%', positive: true },
    { label: 'Avg. Click Rate', value: '24.57%', change: '-4.05%', positive: false },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Metrics</p>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: theme.surfaceAlt }}>
            <p className="text-[9px] font-medium mb-1.5" style={{ color: theme.textTertiary }}>{s.label}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: theme.text }}>{s.value}</p>
            <div className="flex items-center gap-0.5 mt-1.5">
              {s.positive ? (
                <ArrowUpRight className="w-3 h-3" style={{ color: '#22c55e' }} />
              ) : (
                <ArrowDownRight className="w-3 h-3" style={{ color: '#ef4444' }} />
              )}
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: s.positive ? '#22c55e' : '#ef4444' }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCards({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const features = [
    { title: 'Analytics', desc: 'Track key metrics in real-time', icon: BarChart3 },
    { title: 'Security', desc: 'Enterprise-grade protection', icon: Shield },
    { title: 'Integrations', desc: 'Connect with 100+ tools', icon: Sparkles },
  ]
  return (
    <div className="p-5">
      <div className="grid grid-cols-3 gap-2.5">
        {features.map(f => (
          <div
            key={f.title}
            className="rounded-xl p-3.5 flex flex-col gap-2.5"
            style={{ background: `linear-gradient(145deg, ${shades['500']}, ${shades['400']})` }}
          >
            <f.icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.85)' }} />
            <p className="text-[11px] font-semibold" style={{ color: '#ffffff' }}>{f.title}</p>
            <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ButtonStates({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const states = ['Default', 'Hover', 'Active', 'Disabled']
  const variants = [
    { name: 'Primary', bg: theme.accent, text: getContrastText(shades['500']) },
    { name: 'Secondary', bg: theme.accentSoft, text: theme.accent },
    { name: 'Tertiary', bg: theme.surfaceAlt, text: theme.textSecondary },
  ]
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Button States</p>
      <div className="space-y-2.5">
        <div className="grid grid-cols-5 gap-1.5">
          <div />
          {states.map(s => (
            <span key={s} className="text-[9px] text-center font-medium" style={{ color: theme.textTertiary }}>{s}</span>
          ))}
        </div>
        {variants.map(v => (
          <div key={v.name} className="grid grid-cols-5 gap-1.5 items-center">
            <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>{v.name}</span>
            {states.map((s, i) => (
              <div
                key={s}
                className="text-[9px] font-medium text-center py-2 rounded-lg"
                style={{
                  backgroundColor: v.bg,
                  color: v.text,
                  opacity: i === 3 ? 0.35 : i === 1 ? 0.85 : i === 2 ? 0.7 : 1,
                }}
              >
                Button
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarCard({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const dates = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ]
  const today = 15
  const selected = [8, 22]
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>July 2025</p>
        <div className="flex gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.surfaceAlt }}>
            <ChevronLeft className="w-3.5 h-3.5" style={{ color: theme.textSecondary }} />
          </div>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.surfaceAlt }}>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: theme.textSecondary }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map(d => (
          <span key={d} className="text-[9px] font-medium py-1.5" style={{ color: theme.textTertiary }}>{d}</span>
        ))}
        {dates.flat().map((d, i) => {
          if (!d) return <span key={i} />
          const isToday = d === today
          const isSelected = selected.includes(d)
          return (
            <span
              key={i}
              className="text-[10px] py-1.5 rounded-lg tabular-nums"
              style={{
                backgroundColor: isToday ? theme.accent : isSelected ? theme.accentSoft : 'transparent',
                color: isToday ? getContrastText(shades['500']) : isSelected ? theme.accent : theme.text,
                fontWeight: isToday || isSelected ? 600 : 400,
              }}
            >
              {d}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function BookCard({ shades }: { shades: Record<string, string> }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 justify-between"
      style={{ background: `linear-gradient(145deg, ${shades['500']}, ${shades['600']})`, minHeight: 180 }}
    >
      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
        PAGE 22 OF 197
      </span>
      <div className="space-y-2">
        <p className="text-base font-semibold tracking-tight" style={{ color: '#ffffff' }}>Design Principles Handbook</p>
        <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Continue reading &rarr;
        </p>
      </div>
    </div>
  )
}

function DonutChart({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const segments = [
    { label: 'Views', pct: 50, color: `${shades['400']}80` },
    { label: 'Clicks', pct: 30, color: shades['400'] },
    { label: 'Sales', pct: 20, color: shades['600'] },
  ]
  let offset = 0
  const r = 38
  const c = 2 * Math.PI * r
  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold tracking-tight" style={{ color: theme.text }}>Overview</p>
      <div className="flex items-center gap-5">
        <div className="relative" style={{ width: 100, height: 100 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            {segments.map(seg => {
              const dash = (seg.pct / 100) * c
              const gap = c - dash
              const el = (
                <circle
                  key={seg.label}
                  cx="50" cy="50" r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              )
              offset += dash
              return el
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold tabular-nums" style={{ color: theme.text }}>1.7K</span>
            <span className="text-[9px] font-medium" style={{ color: theme.textTertiary }}>Total</span>
          </div>
        </div>
        <div className="space-y-3">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-[11px]" style={{ color: theme.textSecondary }}>{seg.label}</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: theme.text }}>{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PalettePage() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const [localColor, setLocalColor] = useState(settings.branding.primaryColor || '#6366f1')
  const [darkMode, setDarkMode] = useState(false)
  const [copiedShade, setCopiedShade] = useState<string | null>(null)

  const shades = useMemo(() => generateShadeScale(localColor), [localColor])
  const theme = useMemo(() => getThemeColors(shades, darkMode), [shades, darkMode])

  const handleColorChange = useCallback((hex: string) => {
    setLocalColor(hex)
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      updateBranding('primaryColor', hex)
    }
  }, [updateBranding])

  const applyPreset = useCallback((color: string) => {
    setLocalColor(color)
    updateBranding('primaryColor', color)
  }, [updateBranding])

  const randomize = useCallback(() => {
    const h = Math.floor(Math.random() * 360)
    const s = 55 + Math.floor(Math.random() * 35)
    const hex = hslToHex(h, s, 50)
    setLocalColor(hex)
    updateBranding('primaryColor', hex)
  }, [updateBranding])

  const copyHex = useCallback((shade: string, hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedShade(shade)
    setTimeout(() => setCopiedShade(null), 1500)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Base Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localColor.startsWith('#') && localColor.length === 7 ? localColor : '#6366f1'}
              onChange={e => handleColorChange(e.target.value)}
              className="w-14 h-10 p-1 cursor-pointer rounded-xl"
              data-testid="input-palette-color-picker"
            />
            <Input
              value={localColor}
              onChange={e => handleColorChange(e.target.value)}
              placeholder="#6366f1"
              className="w-32 font-mono text-sm"
              data-testid="input-palette-hex"
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDarkMode(!darkMode)}
          data-testid="button-toggle-dark-mode"
        >
          {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetPalettes.map(p => (
          <button
            key={p.name}
            onClick={() => applyPreset(p.color)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover-elevate transition-colors cursor-pointer"
            style={{ backgroundColor: `${p.color}10`, color: p.color }}
            data-testid={`preset-palette-${p.name.toLowerCase()}`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
        <button
          onClick={randomize}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover-elevate transition-colors cursor-pointer"
          style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
          data-testid="button-palette-randomize"
        >
          <Shuffle className="w-3 h-3" />
          Random
        </button>
      </div>

      <div>
        <div className="flex rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {shadeKeys.map(shade => {
            const hex = shades[shade]
            const textColor = getContrastText(hex)
            const isCopied = copiedShade === shade
            return (
              <button
                key={shade}
                onClick={() => copyHex(shade, hex)}
                className="flex-1 flex flex-col items-center justify-center py-5 px-1 transition-all hover:scale-y-110 hover:z-10 relative cursor-pointer"
                style={{ backgroundColor: hex, color: textColor }}
                title={`${shade}: ${hex} (click to copy)`}
                data-testid={`palette-swatch-${shade}`}
              >
                <span className="text-[11px] font-semibold opacity-75">{shade}</span>
                <span className="text-[9px] font-mono opacity-50 mt-1">
                  {isCopied ? <Check className="w-3 h-3" /> : hex.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="rounded-2xl p-5 transition-colors duration-300"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <PreviewPanel theme={theme}>
            <HeroCard shades={shades} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <CategoriesCard shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <BudgetCards shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <NewsletterList shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <ScheduleCard shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <ProfileCard shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <RevenueChart shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <PricingPlans shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <TicketsList shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <CourseCards shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <StatsRow shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <FeatureCards shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <ButtonStates shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <CalendarCard shades={shades} theme={theme} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <BookCard shades={shades} />
          </PreviewPanel>

          <PreviewPanel theme={theme}>
            <DonutChart shades={shades} theme={theme} />
          </PreviewPanel>
        </div>
      </div>
    </div>
  )
}
