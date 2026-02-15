'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Check, Shuffle, Sun, Moon, TrendingUp, ShoppingCart,
  Zap, Heart, Star, Users, User, Clock, Mail,
  ChevronLeft, ChevronRight, BarChart3, ArrowUpRight,
  ArrowDownRight, Shield, Bell, Search,
  Plus, Download, MoreHorizontal, Eye,
  FileText, Rocket, Send, DollarSign,
  Briefcase, Coffee, Car, Smartphone, Wifi, Activity,
  BookOpen, Play, MapPin, Phone, CreditCard, Gift,
  Utensils, Pill, Dumbbell, Monitor, Globe, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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

function hexToHslString(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  return `${h} ${s}% ${l}%`
}

function interpolateHex(hex1: string, hex2: string, t: number): string {
  const [h1, s1, l1] = hexToHsl(hex1)
  const [h2, s2, l2] = hexToHsl(hex2)
  const h = Math.round(h1 + (h2 - h1) * t)
  const s = Math.round(s1 + (s2 - s1) * t)
  const l = Math.round(l1 + (l2 - l1) * t)
  return hslToHex(h, s, l)
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

function getCssOverrides(shades: Record<string, string>, dark: boolean): Record<string, string> {
  const shade850 = interpolateHex(shades['800'], shades['900'], 0.5)
  const shade750 = interpolateHex(shades['700'], shades['800'], 0.5)

  if (dark) {
    return {
      '--background': '0 0% 9%',
      '--foreground': hexToHslString(shades['50']),
      '--card': hexToHslString(shades['900']),
      '--card-foreground': hexToHslString(shades['50']),
      '--card-border': hexToHslString(shades['700']),
      '--primary': hexToHslString(shades['400']),
      '--primary-foreground': hexToHslString(shades['950']),
      '--secondary': hexToHslString(shade850),
      '--secondary-foreground': hexToHslString(shades['100']),
      '--muted': hexToHslString(shade850),
      '--muted-foreground': hexToHslString(shades['300']),
      '--accent': hexToHslString(shades['800']),
      '--accent-foreground': hexToHslString(shades['100']),
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': hexToHslString(shades['50']),
      '--border': hexToHslString(shade750),
      '--input': hexToHslString(shades['700']),
      '--ring': hexToHslString(shades['400']),
      '--badge-outline': hexToHslString(shades['600']),
      'colorScheme': 'dark',
    }
  }
  return {
    '--background': '0 0% 96%',
    '--foreground': hexToHslString(shades['900']),
    '--card': '0 0% 100%',
    '--card-foreground': hexToHslString(shades['900']),
    '--card-border': hexToHslString(shades['200']),
    '--primary': hexToHslString(shades['600']),
    '--primary-foreground': '0 0% 100%',
    '--secondary': hexToHslString(shades['100']),
    '--secondary-foreground': hexToHslString(shades['800']),
    '--muted': hexToHslString(shades['100']),
    '--muted-foreground': hexToHslString(shades['500']),
    '--accent': hexToHslString(shades['50']),
    '--accent-foreground': hexToHslString(shades['800']),
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '0 0% 100%',
    '--border': hexToHslString(shades['200']),
    '--input': hexToHslString(shades['200']),
    '--ring': hexToHslString(shades['600']),
    '--badge-outline': hexToHslString(shades['200']),
    'colorScheme': 'light',
  }
}

function HeroPreview({ shades }: { shades: Record<string, string> }) {
  return (
    <Card className="overflow-hidden border-0">
      <div
        className="p-8"
        style={{
          background: `linear-gradient(135deg, ${shades['600']}, ${shades['500']}, ${shades['400']})`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5" style={{ color: shades['100'] }} />
          <Star className="w-4 h-4" style={{ color: `${shades['200']}99` }} />
        </div>
        <h3 className="text-2xl font-bold mb-2" style={{ color: shades['50'] }}>Increase your revenue by 3x</h3>
        <p className="text-sm mb-6 max-w-xs" style={{ color: `${shades['100']}bb` }}>
          Our platform helps you close more deals and scale faster than ever.
        </p>
        <Button
          variant="secondary"
          data-testid="button-hero-cta"
        >
          Start growing
        </Button>
      </div>
    </Card>
  )
}

function CategoriesPreview({ shades }: { shades: Record<string, string> }) {
  const categories = [
    { name: 'Grocery', icon: ShoppingCart, shade: '400' },
    { name: 'Cafe', icon: Coffee, shade: '500' },
    { name: 'Utilities', icon: Wifi, shade: '600' },
    { name: 'Sport', icon: Dumbbell, shade: '300' },
    { name: 'Taxi', icon: Car, shade: '700' },
    { name: 'Health', icon: Pill, shade: '500' },
    { name: 'Telecom', icon: Phone, shade: '400' },
    { name: 'Gadgets', icon: Smartphone, shade: '600' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {categories.map(c => (
            <div key={c.name} className="flex flex-col items-center gap-2">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${shades[c.shade]}20` }}
              >
                <c.icon className="w-5 h-5" style={{ color: shades[c.shade] }} />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{c.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function BudgetPreview({ shades }: { shades: Record<string, string> }) {
  const items = [
    { name: 'Home Renovation', total: '$33,500', spent: '$19,500', remaining: '$14,000', pct: 58, icon: Briefcase, shade: '500' },
    { name: 'Education & Courses', total: '$40,000', spent: '$19,500', remaining: '$20,500', pct: 49, icon: BookOpen, shade: '400' },
    { name: 'Health & Wellness', total: '$5,500', spent: '$3,000', remaining: '$2,500', pct: 55, icon: Heart, shade: '600' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map(item => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${shades[item.shade]}20` }}
              >
                <item.icon className="w-4 h-4" style={{ color: shades[item.shade] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <span className="text-sm font-bold tabular-nums shrink-0">{item.total}</span>
                </div>
              </div>
            </div>
            <Progress value={item.pct} className="h-1.5" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">{item.spent}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{item.remaining}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function NewsletterPreview() {
  const items = [
    { name: 'Newsletter', desc: 'Last message sent an hour ago', active: true },
    { name: 'Existing customers', desc: 'Last message sent 2 weeks ago', active: false },
    { name: 'Trial users', desc: 'Last message sent 4 days ago', active: false },
  ]
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {items.map(item => (
          <div key={item.name} className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            {item.active && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SchedulePreview({ shades }: { shades: Record<string, string> }) {
  const events = [
    { time: '9:15', period: 'AM', title: 'Weekly Team Sync', desc: 'Quick check-in to align priorities and share updates for the week.', shade: '400' },
    { time: '4:00', period: 'PM', title: 'Client Pitch Rehearsal', desc: 'Run through tomorrow\'s presentation and refine messaging with the team.', shade: '600' },
    { time: '7:30', period: 'PM', title: 'Product Design Review', desc: 'Collaborative session to go over latest UI/UX proposals and feedback.', shade: '300' },
  ]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Schedule</CardTitle>
        <Button size="icon" variant="outline" data-testid="button-schedule-add">
          <Plus className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map(e => (
          <div
            key={e.time}
            className="flex gap-4 rounded-lg border p-4"
          >
            <div className="shrink-0 text-center">
              <p className="text-lg font-bold tabular-nums leading-tight" style={{ color: shades[e.shade] }}>{e.time}</p>
              <p className="text-[10px] font-medium text-muted-foreground">{e.period}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.desc}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ProfilePreview() {
  return (
    <Card className="overflow-hidden">
      <div className="relative w-full aspect-[4/3]">
        <Image
          src="/images/preview/profile.jpg"
          alt="Profile"
          fill
          className="object-cover object-top"
          unoptimized
        />
      </div>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold">Sarah Jones</p>
            <p className="text-sm text-muted-foreground">Product designer</p>
          </div>
          <Badge variant="outline" className="text-xs">Online</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueChartPreview({ shades }: { shades: Record<string, string> }) {
  const w = 400, h = 160, px = 0, py = 10
  const dataIncome = [40, 55, 45, 65, 50, 75, 60, 80, 70, 85, 75, 90]
  const dataExpenses = [30, 35, 40, 35, 45, 40, 50, 45, 55, 50, 60, 55]
  const dataSavings = [10, 20, 5, 30, 5, 35, 10, 35, 15, 35, 15, 35]

  const toPath = (data: number[]) => {
    const max = 100
    const stepX = (w - px * 2) / (data.length - 1)
    return data.map((d, i) => {
      const x = px + i * stepX
      const y = py + (h - py * 2) * (1 - d / max)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-sm">Revenue</CardTitle>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tabular-nums">$213,000</span>
            <Badge variant="secondary" className="text-xs">+19%</Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shades['400'] }} />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shades['600'] }} />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shades['200'] }} />
            <span className="text-xs text-muted-foreground">Savings</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted p-4">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 140 }}>
            <path d={toPath(dataSavings)} fill="none" stroke={shades['200']} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={toPath(dataExpenses)} fill="none" stroke={shades['600']} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={toPath(dataIncome)} fill="none" stroke={shades['400']} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}

function PricingPreview() {
  const plans = [
    { name: 'Individual', price: '$0', period: '/month', desc: 'Perfect for freelancers and solo creators.', features: ['1 project', '100MB storage', 'Community support'], featured: false },
    { name: 'Team', price: '$99', period: '/month', desc: 'Ideal for growing teams and startups.', features: ['Unlimited projects', '10GB storage', 'Priority support'], featured: true },
    { name: 'Enterprise', price: '$199', period: '/month', desc: 'Designed for scaling organizations.', features: ['Custom limits', '100GB storage', 'Dedicated support'], featured: false },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Pricing plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.name} className={cn('rounded-lg border p-5 space-y-4', plan.featured && 'border-primary')}>
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
              </div>
              <div>
                <span className="text-3xl font-bold tabular-nums">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <div className="space-y-2">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs">{f}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" size="sm" variant={plan.featured ? 'default' : 'outline'} data-testid={`button-pricing-${plan.name.toLowerCase()}`}>
                {plan.featured ? 'Get started' : 'Contact us'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TicketsPreview({ shades }: { shades: Record<string, string> }) {
  const tickets = [
    { name: 'Amy P.', status: 'Open', time: '23 min', initials: 'AP', shade: '400' },
    { name: 'Sarah A.', status: 'Closed', time: '1 hour', initials: 'SA', shade: '600' },
    { name: 'Jessica P.', status: 'Processing', time: '45 min', initials: 'JP', shade: '500' },
    { name: 'James A.', status: 'Open', time: '2 days', initials: 'JA', shade: '300' },
  ]
  const statusVariant = (s: string) => {
    if (s === 'Open') return 'default' as const
    if (s === 'Closed') return 'secondary' as const
    return 'outline' as const
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.map(t => (
          <div key={t.name} className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className="text-xs"
                style={{ backgroundColor: `${shades[t.shade]}25`, color: shades[t.shade] }}
              >{t.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.name}</p>
            </div>
            <Badge variant={statusVariant(t.status)} className="text-[10px]">{t.status}</Badge>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">{t.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ContinueWatchingPreview() {
  const courses = [
    { title: 'Front End Dev.', desc: 'Design principles and tools for creating intuitive user interfaces.', img: '/images/preview/course-1.jpg', author: 'Richard C.' },
    { title: 'UI/UX Design', desc: 'Build responsive web pages using HTML, CSS, and JavaScript.', img: '/images/preview/course-2.jpg', author: 'Sarah M.' },
    { title: 'Sound Design', desc: 'Create and mix custom audio for games and film projects.', img: '/images/preview/course-3.jpg', author: 'James L.' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Continue Watching</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.title} className="space-y-2">
              <div className="group relative aspect-[16/10] rounded-lg overflow-hidden">
                <Image src={c.img} alt={c.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center invisible group-hover:visible transition-all">
                  <Play className="w-8 h-8 text-foreground" />
                </div>
              </div>
              <p className="text-xs font-semibold leading-tight">{c.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{c.desc}</p>
              <p className="text-[10px] text-muted-foreground">{c.author}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmailStatsPreview() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Subscribers</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums">71,842</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">+10.2%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg. Open Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums">58.16%</span>
              <Badge variant="secondary" className="text-[10px]">+14.6%</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg. Click Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums">24.57%</span>
              <Badge variant="secondary" className="text-[10px]">+4.6%</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureCardsPreview({ shades }: { shades: Record<string, string> }) {
  const features = [
    { title: 'Manage team access', desc: 'Control permissions and approve content across your organization.', icon: Users, shade: '500' },
    { title: 'Notification settings', desc: 'Choose the alerts you receive and detailed reports in your inbox.', icon: Bell, shade: '400' },
    { title: 'Download reports', desc: 'Export your analytics and detailed reports in multiple formats.', icon: Download, shade: '600' },
  ]
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="rounded-lg border p-5 space-y-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${shades[f.shade]}20` }}
              >
                <f.icon className="w-5 h-5" style={{ color: shades[f.shade] }} />
              </div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ButtonShowcase() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted-foreground w-16">Default</span>
          <span className="text-xs text-muted-foreground w-16">Hover</span>
          <span className="text-xs text-muted-foreground w-16">Active</span>
          <span className="text-xs text-muted-foreground w-16">Disabled</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Primary</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" data-testid="button-primary-default">Primary</Button>
            <Button size="sm" data-testid="button-primary-hover">Primary</Button>
            <Button size="sm" data-testid="button-primary-active">Primary</Button>
            <Button size="sm" disabled data-testid="button-primary-disabled">Primary</Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Secondary</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" variant="secondary" data-testid="button-secondary-default">Secondary</Button>
            <Button size="sm" variant="secondary" data-testid="button-secondary-hover">Secondary</Button>
            <Button size="sm" variant="secondary" data-testid="button-secondary-active">Secondary</Button>
            <Button size="sm" variant="secondary" disabled data-testid="button-secondary-disabled">Secondary</Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Tertiary</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" variant="outline" data-testid="button-tertiary-default">Tertiary</Button>
            <Button size="sm" variant="outline" data-testid="button-tertiary-hover">Tertiary</Button>
            <Button size="sm" variant="outline" data-testid="button-tertiary-active">Tertiary</Button>
            <Button size="sm" variant="outline" disabled data-testid="button-tertiary-disabled">Tertiary</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CalendarPreview() {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const dates = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ]
  const today = 15
  const events = [8, 22]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">July</CardTitle>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" data-testid="button-calendar-prev">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" data-testid="button-calendar-next">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {days.map(d => (
            <span key={d} className="text-[10px] font-medium py-1.5 text-muted-foreground">{d}</span>
          ))}
          {dates.flat().map((d, i) => {
            if (!d) return <span key={i} />
            const isToday = d === today
            const hasEvent = events.includes(d)
            return (
              <div key={i} className="flex flex-col items-center">
                <span
                  className={cn(
                    'text-xs w-8 h-8 flex items-center justify-center rounded-md tabular-nums',
                    isToday && 'bg-primary text-primary-foreground font-semibold',
                    hasEvent && !isToday && 'bg-secondary font-medium',
                  )}
                >
                  {d}
                </span>
                {hasEvent && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function BookCardPreview({ shades }: { shades: Record<string, string> }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/4]">
        <Image src="/images/preview/book.jpg" alt="Book" fill className="object-cover" unoptimized />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${shades['950']}ee, ${shades['950']}33, transparent)` }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <Badge variant="secondary" className="mb-2 text-[10px]">MUST CO. OF NIT</Badge>
          <p className="text-lg font-bold leading-tight text-primary-foreground">Design Principles Handbook</p>
          <Button size="sm" variant="outline" className="mt-3" data-testid="button-book-continue">
            Continue reading
          </Button>
        </div>
      </div>
    </Card>
  )
}

function BarChartPreview({ shades }: { shades: Record<string, string> }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const series = [
    { label: 'Income', shade: '400', values: [65, 80, 55, 90, 70, 85] },
    { label: 'Expenses', shade: '600', values: [45, 50, 40, 55, 50, 60] },
    { label: 'Savings', shade: '200', values: [20, 30, 15, 35, 20, 25] },
  ]
  const maxVal = 100
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-sm">Revenue</CardTitle>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tabular-nums" data-testid="text-barchart-revenue">$213,000</span>
            <Badge variant="secondary" className="text-xs" data-testid="badge-barchart-growth">+16%</Badge>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {series.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shades[s.shade] }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted p-4" data-testid="chart-bar-container">
          <div className="flex items-end gap-3 h-[140px]">
            {months.map((month, mi) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full h-[120px]">
                  {series.map(s => (
                    <div
                      key={s.label}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        backgroundColor: shades[s.shade],
                        height: `${(s.values[mi] / maxVal) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatsDonutPreview({ shades }: { shades: Record<string, string> }) {
  const size = 120
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const value = 0.72

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Stats</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={shades['800']}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={shades['400']}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - value)}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold tabular-nums">1.7K</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PalettePage() {
  const { settings, updateBranding } = useSetupSettingsContext()
  const [localColor, setLocalColor] = useState(settings.branding.primaryColor || '#6366f1')
  const [darkMode, setDarkMode] = useState(false)
  const [copiedShade, setCopiedShade] = useState<string | null>(null)

  const shades = useMemo(() => generateShadeScale(localColor), [localColor])
  const cssOverrides = useMemo(() => getCssOverrides(shades, darkMode), [shades, darkMode])

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
        >
          {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {presetPalettes.map(p => (
          <Button
            key={p.name}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(p.color)}
            data-testid={`preset-palette-${p.name.toLowerCase()}`}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.name}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={randomize}
          data-testid="button-palette-randomize"
        >
          <Shuffle className="w-3 h-3" />
          Random
        </Button>
      </div>

      <div>
        <div className="flex rounded-lg overflow-hidden border">
          {shadeKeys.map(shade => {
            const hex = shades[shade]
            const textColor = getContrastText(hex)
            const isCopied = copiedShade === shade
            return (
              <div
                key={shade}
                onClick={() => copyHex(shade, hex)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && copyHex(shade, hex)}
                className="flex-1 flex flex-col items-center justify-center py-5 px-1 transition-colors hover:opacity-80 relative cursor-pointer"
                style={{ backgroundColor: hex, color: textColor }}
                title={`${shade}: ${hex} (click to copy)`}
                data-testid={`palette-swatch-${shade}`}
              >
                <span className="text-[11px] font-semibold opacity-75">{shade}</span>
                <span className="text-[9px] font-mono opacity-50 mt-1">
                  {isCopied ? <Check className="w-3 h-3" /> : hex.toUpperCase()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="rounded-xl p-8 transition-colors duration-300"
        style={cssOverrides as React.CSSProperties}
      >
        <p className="text-xs font-medium text-muted-foreground mb-6 uppercase tracking-wider">Examples</p>
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HeroPreview shades={shades} />
            <CategoriesPreview shades={shades} />
            <BudgetPreview shades={shades} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <NewsletterPreview />
            <SchedulePreview shades={shades} />
            <ProfilePreview />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChartPreview shades={shades} />
            <PricingPreview />
          </div>

          <BarChartPreview shades={shades} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TicketsPreview shades={shades} />
            <ContinueWatchingPreview />
          </div>

          <EmailStatsPreview />

          <FeatureCardsPreview shades={shades} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ButtonShowcase />
            <CalendarPreview />
            <div className="grid grid-cols-2 gap-6">
              <BookCardPreview shades={shades} />
              <StatsDonutPreview shades={shades} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
