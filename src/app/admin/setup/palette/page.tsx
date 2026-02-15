'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Check, Shuffle, Sun, Moon, TrendingUp, ShoppingCart,
  Zap, Heart, Star, Users, User, Clock, Mail,
  ChevronLeft, ChevronRight, BarChart3, ArrowUpRight,
  ArrowDownRight, Sparkles, Shield, Bell, Search,
  Settings, Plus, Download, MoreHorizontal, Eye,
  Calendar, FileText, Rocket, Send, DollarSign
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
      '--background': hexToHslString(shades['950']),
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
    '--background': hexToHslString(shades['50']),
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

function StatsPreview() {
  const stats = [
    { label: 'Total Revenue', value: '$45,231', change: '+20.1%', positive: true, icon: DollarSign },
    { label: 'Subscribers', value: '2,350', change: '+180', positive: true, icon: Users },
    { label: 'Active Now', value: '573', change: '+12%', positive: true, icon: TrendingUp },
  ]
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
            <s.icon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums">{s.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {s.positive ? (
                <ArrowUpRight className="w-3 h-3 text-primary" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">{s.change} from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ButtonsAndBadges() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Buttons & Badges</CardTitle>
        <CardDescription>All component variants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Buttons</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
            <Button size="sm" variant="destructive">Destructive</Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Badges</p>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfilePreview() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-semibold">Sarah Jones</p>
            <p className="text-xs text-muted-foreground">sarah@example.com</p>
          </div>
          <Badge variant="secondary">Admin</Badge>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Notifications</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Email updates</span>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Two-factor auth</span>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskListPreview() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Tasks</CardTitle>
          <Badge variant="secondary" className="text-xs">3 remaining</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { label: 'Update landing page copy', done: true },
          { label: 'Review pull requests', done: true },
          { label: 'Deploy to production', done: false },
          { label: 'Write API documentation', done: false },
          { label: 'Set up monitoring alerts', done: false },
        ].map(task => (
          <div key={task.label} className="flex items-center gap-3">
            <Checkbox checked={task.done} />
            <span className={cn('text-sm', task.done && 'line-through text-muted-foreground')}>{task.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ProgressPreview() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Project Progress</CardTitle>
        <CardDescription>3 of 5 milestones complete</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { name: 'Research', progress: 100 },
          { name: 'Design', progress: 100 },
          { name: 'Development', progress: 68 },
          { name: 'Testing', progress: 25 },
          { name: 'Launch', progress: 0 },
        ].map(item => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TeamPreview() {
  const members = [
    { name: 'Alex Morgan', role: 'Developer', initials: 'AM' },
    { name: 'Jamie Chen', role: 'Designer', initials: 'JC' },
    { name: 'Sam Rivera', role: 'Product Manager', initials: 'SR' },
    { name: 'Chris Park', role: 'Marketing', initials: 'CP' },
  ]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Team Members</CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="w-3 h-3 mr-1" />
          Invite
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map(m => (
          <div key={m.name} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.role}</p>
            </div>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TabsPreview() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="overview">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Page Views</p>
                <p className="text-lg font-bold tabular-nums">12,543</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
                <p className="text-lg font-bold tabular-nums">24.3%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">Traffic is up 12% compared to last week.</p>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="pt-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Analytics content here</p>
            </div>
          </TabsContent>
          <TabsContent value="reports" className="pt-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Reports content here</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function NotificationsPreview() {
  const notifications = [
    { title: 'New sign-up', desc: 'A new user registered 2 minutes ago', icon: User, time: '2m' },
    { title: 'Payment received', desc: 'Invoice #1234 has been paid', icon: Zap, time: '1h' },
    { title: 'Deploy complete', desc: 'v2.4.1 deployed to production', icon: Rocket, time: '3h' },
    { title: 'Comment added', desc: 'Jamie left feedback on your design', icon: FileText, time: '5h' },
  ]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Notifications</CardTitle>
        <Badge>4 new</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map(n => (
          <div key={n.title} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <n.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-muted-foreground truncate">{n.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FormPreview() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quick Send</CardTitle>
        <CardDescription>Send a message to your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input placeholder="team@company.com" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <Input placeholder="Weekly update" className="h-9" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="urgent" />
          <Label htmlFor="urgent" className="text-xs font-normal">Mark as urgent</Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" size="sm">Save draft</Button>
        <Button size="sm">
          <Send className="w-3 h-3 mr-1.5" />
          Send
        </Button>
      </CardFooter>
    </Card>
  )
}

function PricingPreview() {
  const plans = [
    { name: 'Free', price: '$0', desc: 'For personal projects', features: ['1 project', '100MB storage', 'Community support'], featured: false },
    { name: 'Pro', price: '$19', desc: 'For growing teams', features: ['Unlimited projects', '10GB storage', 'Priority support'], featured: true },
    { name: 'Enterprise', price: '$99', desc: 'For large orgs', features: ['Custom limits', '100GB storage', 'Dedicated support'], featured: false },
  ]
  return (
    <div className="grid grid-cols-3 gap-4">
      {plans.map(plan => (
        <Card key={plan.name} className={cn(plan.featured && 'border-primary')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{plan.name}</CardTitle>
            <CardDescription className="text-xs">{plan.desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-2xl font-bold tabular-nums">{plan.price}</span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <div className="space-y-2">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-primary" />
                  <span className="text-xs">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="sm" variant={plan.featured ? 'default' : 'outline'}>
              {plan.featured ? 'Get Started' : 'Learn More'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
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
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">July 2025</CardTitle>
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
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map(d => (
            <span key={d} className="text-[10px] font-medium py-1 text-muted-foreground">{d}</span>
          ))}
          {dates.flat().map((d, i) => {
            if (!d) return <span key={i} />
            const isToday = d === today
            const hasEvent = events.includes(d)
            return (
              <div key={i} className="flex flex-col items-center">
                <span
                  className={cn(
                    'text-xs w-7 h-7 flex items-center justify-center rounded-md tabular-nums',
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

function ActivityPreview() {
  const items = [
    { action: 'Created new project', user: 'Sarah J.', time: 'Just now', initials: 'SJ' },
    { action: 'Merged pull request #42', user: 'Alex M.', time: '30 min ago', initials: 'AM' },
    { action: 'Deployed v2.4.0', user: 'Jamie C.', time: '2 hours ago', initials: 'JC' },
    { action: 'Updated billing info', user: 'Chris P.', time: 'Yesterday', initials: 'CP' },
  ]
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">{item.initials}</AvatarFallback>
                </Avatar>
                {i < items.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <p className="text-sm">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.user} &middot; {item.time}</p>
              </div>
            </div>
          ))}
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
          <button
            key={p.name}
            onClick={() => applyPreset(p.color)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium hover-elevate transition-colors cursor-pointer border"
            data-testid={`preset-palette-${p.name.toLowerCase()}`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
        <button
          onClick={randomize}
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium hover-elevate transition-colors cursor-pointer"
          data-testid="button-palette-randomize"
        >
          <Shuffle className="w-3 h-3" />
          Random
        </button>
      </div>

      <div>
        <div className="flex rounded-lg overflow-hidden border">
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
        className="rounded-xl p-6 transition-colors duration-300"
        style={cssOverrides as React.CSSProperties}
      >
        <div className="space-y-6">
          <StatsPreview />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <ButtonsAndBadges />
            <ProfilePreview />
            <TaskListPreview />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <ProgressPreview />
            <TeamPreview />
            <TabsPreview />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <NotificationsPreview />
            <FormPreview />
            <CalendarPreview />
          </div>

          <PricingPreview />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityPreview />
          </div>
        </div>
      </div>
    </div>
  )
}
