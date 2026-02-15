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
  border: string
  text: string
  textSecondary: string
  accent: string
  btnPrimary: string
  btnPrimaryText: string
  softBadgeBg: string
  softBadgeText: string
  progressTrack: string
  progressBar: string
}

function getThemeColors(shades: Record<string, string>, dark: boolean): ThemeColors {
  if (dark) {
    return {
      bg: shades['950'],
      surface: shades['900'],
      border: shades['800'],
      text: shades['50'],
      textSecondary: shades['300'],
      accent: shades['400'],
      btnPrimary: shades['500'],
      btnPrimaryText: getContrastText(shades['500']),
      softBadgeBg: shades['800'],
      softBadgeText: shades['200'],
      progressTrack: shades['800'],
      progressBar: shades['400'],
    }
  }
  return {
    bg: shades['50'],
    surface: '#ffffff',
    border: shades['100'],
    text: shades['900'],
    textSecondary: shades['600'],
    accent: shades['500'],
    btnPrimary: shades['500'],
    btnPrimaryText: getContrastText(shades['500']),
    softBadgeBg: shades['100'],
    softBadgeText: shades['700'],
    progressTrack: shades['100'],
    progressBar: shades['500'],
  }
}

function PreviewPanel({ children, theme, className = '' }: { children: React.ReactNode, theme: ThemeColors, className?: string }) {
  return (
    <div
      className={cn('rounded-lg overflow-hidden', className)}
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {children}
    </div>
  )
}

function HeroCard({ shades }: { shades: Record<string, string> }) {
  return (
    <div
      className="rounded-lg p-6 flex flex-col gap-3"
      style={{ background: `linear-gradient(135deg, ${shades['700']}, ${shades['500']})` }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <TrendingUp className="w-5 h-5" style={{ color: '#ffffff' }} />
      </div>
      <p className="text-lg font-bold" style={{ color: '#ffffff' }}>Increase your revenue by 3x</p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
        Track and optimize your business performance with real-time analytics and smart insights.
      </p>
      <button
        className="mt-2 self-start px-4 py-2 rounded-md text-xs font-semibold"
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
    <div className="p-4">
      <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Categories</p>
      <div className="grid grid-cols-4 gap-3">
        {categories.map(c => (
          <div key={c.name} className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: shades['100'] }}>
              <c.icon className="w-4 h-4" style={{ color: shades['500'] }} />
            </div>
            <span className="text-[10px]" style={{ color: theme.textSecondary }}>{c.name}</span>
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
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Budget</p>
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: shades['100'] }}>
            <item.icon className="w-4 h-4" style={{ color: shades['500'] }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium truncate" style={{ color: theme.text }}>{item.name}</span>
              <span className="text-xs font-semibold shrink-0" style={{ color: theme.text }}>{item.amount}</span>
            </div>
            <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
              <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: theme.progressBar }} />
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
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Audience Lists</p>
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{
              backgroundColor: item.checked ? shades['500'] : 'transparent',
              border: item.checked ? 'none' : `2px solid ${theme.border}`,
            }}
          >
            {item.checked && <Check className="w-3 h-3" style={{ color: '#ffffff' }} />}
          </div>
          <span className="text-xs flex-1" style={{ color: theme.text }}>{item.name}</span>
          <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>{item.count}</span>
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
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Schedule</p>
      {slots.map(slot => (
        <div key={slot.time} className="flex items-center gap-3">
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded shrink-0"
            style={{ backgroundColor: shades['500'], color: getContrastText(shades['500']) }}
          >
            {slot.time}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: theme.textSecondary }}>{slot.title}</p>
            <p className="text-[10px] truncate" style={{ color: theme.textSecondary, opacity: 0.7 }}>{slot.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileCard({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  return (
    <div className="p-4 flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: shades['200'] }}>
        <User className="w-8 h-8" style={{ color: shades['500'] }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Sarah Jones</p>
      <p className="text-[11px]" style={{ color: theme.textSecondary }}>Product designer</p>
      <span
        className="text-[10px] font-medium px-2.5 py-0.5 rounded-full"
        style={{ backgroundColor: shades['100'], color: shades['500'] }}
      >
        Online
      </span>
    </div>
  )
}

function RevenueChart({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const bars = [
    { h: 40, shade: '300' }, { h: 65, shade: '400' }, { h: 85, shade: '500' },
    { h: 55, shade: '600' }, { h: 70, shade: '700' }, { h: 50, shade: '400' },
    { h: 90, shade: '500' },
  ]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  return (
    <div className="p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: theme.text }}>Revenue</p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold" style={{ color: theme.text }}>$213,000</span>
          <span className="text-[10px] font-semibold" style={{ color: '#22c55e' }}>+20%</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5" style={{ height: 100 }}>
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-sm" style={{ height: bar.h, backgroundColor: shades[bar.shade] }} />
            <span className="text-[8px]" style={{ color: theme.textSecondary }}>{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PricingPlans({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const plans = [
    { name: 'Individual', price: '$0', icon: User, desc: 'For personal use' },
    { name: 'Team', price: '$99', icon: Users, desc: 'For small teams' },
    { name: 'Enterprise', price: '$199', icon: Shield, desc: 'For large orgs' },
  ]
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Pricing</p>
      <div className="grid grid-cols-3 gap-2">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            className="rounded-md p-3 flex flex-col items-center gap-1.5 text-center"
            style={{
              backgroundColor: i === 1 ? shades['500'] : theme.bg,
              border: i !== 1 ? `1px solid ${theme.border}` : 'none',
            }}
          >
            <plan.icon className="w-4 h-4" style={{ color: i === 1 ? '#ffffff' : shades['500'] }} />
            <span className="text-[10px] font-semibold" style={{ color: i === 1 ? '#ffffff' : theme.text }}>{plan.name}</span>
            <span className="text-sm font-bold" style={{ color: i === 1 ? '#ffffff' : theme.text }}>{plan.price}</span>
            <span className="text-[9px]" style={{ color: i === 1 ? 'rgba(255,255,255,0.7)' : theme.textSecondary }}>/month</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TicketsList({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const tickets = [
    { name: 'Alex Morgan', issue: 'Login issue', status: 'Open', badgeBg: shades['100'], badgeText: shades['600'] },
    { name: 'Jamie Lee', issue: 'Payment failed', status: 'Processing', badgeBg: shades['200'], badgeText: shades['700'] },
    { name: 'Chris Park', issue: 'Bug report', status: 'Closed', badgeBg: shades['300'], badgeText: shades['800'] },
    { name: 'Sam Rivera', issue: 'Feature request', status: 'Open', badgeBg: shades['100'], badgeText: shades['600'] },
  ]
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Tickets</p>
      {tickets.map((t, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: shades[String(300 + i * 100) as string] || shades['500'] }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: theme.text }}>{t.name}</p>
            <p className="text-[10px] truncate" style={{ color: theme.textSecondary }}>{t.issue}</p>
          </div>
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: t.badgeBg, color: t.badgeText }}>
            {t.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function CourseCards({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const courses = [
    { title: 'Design Systems', badge: 'UI/UX', progress: 72, bgShade: '100' },
    { title: 'React Advanced', badge: 'Front End Dev', progress: 45, bgShade: '200' },
    { title: 'Audio Mixing', badge: 'Sound Effects', progress: 30, bgShade: '100' },
  ]
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Courses</p>
      {courses.map(c => (
        <div key={c.title} className="rounded-md overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
          <div className="h-16" style={{ backgroundColor: shades[c.bgShade] }} />
          <div className="p-2.5 space-y-2" style={{ backgroundColor: theme.surface }}>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.softBadgeBg, color: theme.softBadgeText }}>{c.badge}</span>
            <p className="text-xs font-medium" style={{ color: theme.text }}>{c.title}</p>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressTrack }}>
              <div className="h-full rounded-full" style={{ width: `${c.progress}%`, backgroundColor: theme.progressBar }} />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shades['300'] }} />
              <span className="text-[9px]" style={{ color: theme.textSecondary }}>{c.progress}% complete</span>
            </div>
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
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Metrics</p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="rounded-md p-2.5" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
            <p className="text-[9px] mb-1" style={{ color: theme.textSecondary }}>{s.label}</p>
            <p className="text-sm font-bold" style={{ color: theme.text }}>{s.value}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {s.positive ? (
                <ArrowUpRight className="w-3 h-3" style={{ color: '#22c55e' }} />
              ) : (
                <ArrowDownRight className="w-3 h-3" style={{ color: '#ef4444' }} />
              )}
              <span className="text-[10px] font-semibold" style={{ color: s.positive ? '#22c55e' : '#ef4444' }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCards({ shades }: { shades: Record<string, string> }) {
  const features = [
    { title: 'Analytics', desc: 'Track key metrics in real-time', icon: BarChart3 },
    { title: 'Security', desc: 'Enterprise-grade protection', icon: Shield },
    { title: 'Integrations', desc: 'Connect with 100+ tools', icon: Sparkles },
  ]
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {features.map(f => (
          <div
            key={f.title}
            className="rounded-md p-3 flex flex-col gap-2"
            style={{ background: `linear-gradient(135deg, ${shades['400']}, ${shades['500']})` }}
          >
            <Heart className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.8)' }} />
            <p className="text-xs font-semibold" style={{ color: '#ffffff' }}>{f.title}</p>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ButtonStates({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const states = ['Default', 'Hover', 'Active', 'Disabled']
  const variants = [
    { name: 'Primary', bg: shades['500'], text: getContrastText(shades['500']) },
    { name: 'Secondary', bg: shades['200'], text: shades['800'] },
    { name: 'Tertiary', bg: shades['100'], text: shades['700'] },
  ]
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Button States</p>
      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-1">
          <div />
          {states.map(s => (
            <span key={s} className="text-[9px] text-center font-medium" style={{ color: theme.textSecondary }}>{s}</span>
          ))}
        </div>
        {variants.map(v => (
          <div key={v.name} className="grid grid-cols-5 gap-1 items-center">
            <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>{v.name}</span>
            {states.map((s, i) => (
              <div
                key={s}
                className="text-[9px] font-medium text-center py-1.5 rounded"
                style={{
                  backgroundColor: v.bg,
                  color: v.text,
                  opacity: i === 3 ? 0.4 : i === 1 ? 0.85 : i === 2 ? 0.75 : 1,
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
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: theme.text }}>July 2025</p>
        <div className="flex gap-1">
          <ChevronLeft className="w-4 h-4" style={{ color: theme.textSecondary }} />
          <ChevronRight className="w-4 h-4" style={{ color: theme.textSecondary }} />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map(d => (
          <span key={d} className="text-[9px] font-medium py-1" style={{ color: theme.textSecondary }}>{d}</span>
        ))}
        {dates.flat().map((d, i) => {
          if (!d) return <span key={i} />
          const isToday = d === today
          const isSelected = selected.includes(d)
          return (
            <span
              key={i}
              className="text-[10px] py-1 rounded"
              style={{
                backgroundColor: isToday ? shades['500'] : isSelected ? shades['100'] : 'transparent',
                color: isToday ? getContrastText(shades['500']) : isSelected ? shades['700'] : theme.text,
                fontWeight: isToday ? 700 : 400,
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
      className="rounded-lg p-5 flex flex-col gap-3 justify-between"
      style={{ background: `linear-gradient(135deg, ${shades['400']}, ${shades['600']})`, minHeight: 180 }}
    >
      <span className="text-[9px] font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
        PAGE 22 OF 197
      </span>
      <div>
        <p className="text-base font-bold" style={{ color: '#ffffff' }}>Design Principles Handbook</p>
        <p className="text-[10px] mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Continue reading &rarr;
        </p>
      </div>
    </div>
  )
}

function DonutChart({ shades, theme }: { shades: Record<string, string>, theme: ThemeColors }) {
  const segments = [
    { label: 'Views', shade: '300', pct: 50 },
    { label: 'Clicks', shade: '400', pct: 30 },
    { label: 'Sales', shade: '500', pct: 20 },
  ]
  let offset = 0
  const r = 40
  const c = 2 * Math.PI * r
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm font-semibold" style={{ color: theme.text }}>Overview</p>
      <div className="flex items-center gap-4">
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
                  stroke={shades[seg.shade]}
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += dash
              return el
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold" style={{ color: theme.text }}>1.7K</span>
            <span className="text-[8px]" style={{ color: theme.textSecondary }}>Total</span>
          </div>
        </div>
        <div className="space-y-2">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: shades[seg.shade] }} />
              <span className="text-[10px]" style={{ color: theme.textSecondary }}>{seg.label}</span>
              <span className="text-[10px] font-semibold" style={{ color: theme.text }}>{seg.pct}%</span>
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Label>Base Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localColor.startsWith('#') && localColor.length === 7 ? localColor : '#6366f1'}
              onChange={e => handleColorChange(e.target.value)}
              className="w-14 h-10 p-1 cursor-pointer"
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
          className="mt-6"
        >
          {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presetPalettes.map(p => (
          <button
            key={p.name}
            onClick={() => applyPreset(p.color)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium hover-elevate transition-colors cursor-pointer"
            data-testid={`preset-palette-${p.name.toLowerCase()}`}
          >
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
        <button
          onClick={randomize}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium hover-elevate transition-colors cursor-pointer"
          data-testid="button-palette-randomize"
        >
          <Shuffle className="w-3 h-3" />
          Random
        </button>
      </div>

      <div>
        <div className="flex rounded-md overflow-hidden border">
          {shadeKeys.map(shade => {
            const hex = shades[shade]
            const textColor = getContrastText(hex)
            const isCopied = copiedShade === shade
            return (
              <button
                key={shade}
                onClick={() => copyHex(shade, hex)}
                className="flex-1 flex flex-col items-center justify-center py-4 px-1 transition-transform hover:scale-y-110 hover:z-10 relative cursor-pointer"
                style={{ backgroundColor: hex, color: textColor }}
                title={`${shade}: ${hex} (click to copy)`}
                data-testid={`palette-swatch-${shade}`}
              >
                <span className="text-[11px] font-bold opacity-80">{shade}</span>
                <span className="text-[9px] font-mono opacity-60 mt-0.5">
                  {isCopied ? <Check className="w-3 h-3" /> : hex.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="rounded-xl p-4 transition-colors duration-300"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <FeatureCards shades={shades} />
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
