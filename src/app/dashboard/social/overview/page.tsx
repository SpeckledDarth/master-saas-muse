'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2,
  FileText,
  Sparkles,
  Link2,
  Shield,
  CalendarDays,
  BarChart3,
  Clock,
  Palette,
  Bell,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { SocialUpgradeBanner } from '@/components/social-upgrade-banner'

interface SocialPost {
  id: string
  platform: string
  content: string
  status: string
  ai_generated: boolean
  created_at: string
}

interface SocialAccount {
  id: string
  platform: string
}

interface TierInfo {
  tier: string
  limits: {
    dailyAiGenerations: number
    dailyPosts: number
    monthlyPosts?: number
    maxPlatforms?: number
  }
}

const TIER_DISPLAY: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  premium: 'Premium',
  universal: 'Universal',
  power: 'Power',
}

const QUICK_LINKS = [
  { label: 'Calendar', href: '/dashboard/social/calendar', icon: CalendarDays },
  { label: 'Engagement', href: '/dashboard/social/engagement', icon: BarChart3 },
  { label: 'Post Queue', href: '/dashboard/social/queue', icon: Clock },
  { label: 'Brand Preferences', href: '/dashboard/social/brand', icon: Palette },
]

function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export default function SocialOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postsThisMonth, setPostsThisMonth] = useState(0)
  const [aiGensToday, setAiGensToday] = useState(0)
  const [connectedPlatforms, setConnectedPlatforms] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const [tierName, setTierName] = useState('Starter')
  const [monthlyPostLimit, setMonthlyPostLimit] = useState<number | null>(null)
  const [quickGenOpen, setQuickGenOpen] = useState(false)
  const [quickGenPlatform, setQuickGenPlatform] = useState('facebook')
  const [quickGenTopic, setQuickGenTopic] = useState('')
  const [quickGenLoading, setQuickGenLoading] = useState(false)
  const [quickGenResult, setQuickGenResult] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetch('/api/social/posts?limit=200').then(r => {
          if (r.status === 403) return { posts: [] }
          if (!r.ok) return r.json().then(d => d.posts ? d : Promise.reject(new Error('Server error'))).catch(() => Promise.reject(new Error('Server error')))
          return r.json()
        }),
        fetch('/api/social/accounts').then(r => {
          if (r.status === 403) return { accounts: [] }
          if (!r.ok) return r.json().then(d => d.accounts ? d : Promise.reject(new Error('Server error'))).catch(() => Promise.reject(new Error('Server error')))
          return r.json()
        }),
        fetch('/api/social/tier').then(r => r.ok ? r.json() : Promise.reject()),
      ])

      const criticalFailed = results[0].status === 'rejected' && results[1].status === 'rejected'
      if (criticalFailed) {
        setError('Could not load dashboard data. Please try again.')
        setLoading(false)
        return
      }

      if (results[0].status === 'fulfilled') {
        const posts: SocialPost[] = results[0].value.posts || []
        setTotalPosts(posts.length)
        setPostsThisMonth(posts.filter(p => isCurrentMonth(p.created_at)).length)
        setAiGensToday(posts.filter(p => p.ai_generated && isToday(p.created_at)).length)
      }

      if (results[1].status === 'fulfilled') {
        const accounts: SocialAccount[] = results[1].value.accounts || []
        setConnectedPlatforms(accounts.length)
      }

      if (results[2].status === 'fulfilled') {
        const tierInfo: TierInfo = results[2].value
        setTierName(TIER_DISPLAY[tierInfo.tier] || tierInfo.tier)
        if (tierInfo.limits?.monthlyPosts && tierInfo.limits.monthlyPosts < 999999) {
          setMonthlyPostLimit(tierInfo.limits.monthlyPosts)
        }
      }
    } catch {
      setError('Could not load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleQuickGenerate() {
    if (!quickGenTopic.trim()) {
      toast({ title: 'Enter a topic', description: 'Give the AI something to write about.', variant: 'destructive' })
      return
    }
    setQuickGenLoading(true)
    setQuickGenResult(null)
    try {
      const res = await fetch('/api/social/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: quickGenPlatform, topic: quickGenTopic.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Generation failed', description: data.error || 'Something went wrong', variant: 'destructive' })
        return
      }
      setQuickGenResult(data.content || data.post || '')
      toast({ title: 'Post generated', description: 'Copy it or head to Posts to schedule it.' })
    } catch {
      toast({ title: 'Error', description: 'Could not reach the AI service.', variant: 'destructive' })
    } finally {
      setQuickGenLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card data-testid="error-state-overview">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchData() }} data-testid="button-retry-overview">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (totalPosts === 0 && connectedPlatforms === 0) {
    return (
      <>
      <SocialUpgradeBanner />
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Social Dashboard</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
            Your social media overview at a glance
          </p>
        </div>
        <Card data-testid="empty-state-overview">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No posts or accounts yet</h3>
            <p className="text-muted-foreground mt-1">
              Get started by creating your first post or connecting a social media account.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <Button asChild data-testid="button-create-first-post">
                <Link href="/dashboard/social/posts">Create Your First Post</Link>
              </Button>
              <Button variant="outline" asChild data-testid="button-set-brand">
                <Link href="/dashboard/social/brand">Set Up Brand</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-quick-links-empty">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Onboarding', href: '/dashboard/social/onboarding', icon: Sparkles },
                ...QUICK_LINKS,
                { label: 'All Posts', href: '/dashboard/social/posts', icon: FileText },
              ].map(link => {
                const Icon = link.icon
                return (
                  <Button
                    key={link.href}
                    variant="outline"
                    asChild
                    data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={link.href} className="flex flex-col items-center gap-2 h-auto py-4">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{link.label}</span>
                    </Link>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  return (
    <>
    <SocialUpgradeBanner />
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Social Dashboard</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
            Your social media overview at a glance
          </p>
        </div>
        <Dialog open={quickGenOpen} onOpenChange={(open) => { setQuickGenOpen(open); if (!open) { setQuickGenResult(null) } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-quick-generate">
              <Zap className="mr-2 h-4 w-4" />
              Quick Generate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Generate Post</DialogTitle>
              <DialogDescription>Pick a platform and topic, then let AI write a post for you.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={quickGenPlatform} onValueChange={setQuickGenPlatform}>
                  <SelectTrigger data-testid="select-quick-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic</label>
                <Input
                  placeholder="e.g., Spring cleaning special, New service launch..."
                  value={quickGenTopic}
                  onChange={(e) => setQuickGenTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !quickGenLoading) handleQuickGenerate() }}
                  data-testid="input-quick-topic"
                />
              </div>
              {quickGenResult && (
                <div className="rounded-md bg-muted p-3 space-y-2" data-testid="text-quick-result">
                  <p className="text-sm whitespace-pre-wrap">{quickGenResult}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(quickGenResult)
                      toast({ title: 'Copied to clipboard' })
                    }}
                    data-testid="button-copy-result"
                  >
                    Copy
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleQuickGenerate}
                  disabled={quickGenLoading || !quickGenTopic.trim()}
                  data-testid="button-generate-post"
                >
                  {quickGenLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {quickGenLoading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-posts-this-month">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-posts-this-month">{postsThisMonth}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-generations-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations Today</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-generations-today">{aiGensToday}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-connected-platforms">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-connected-platforms">{connectedPlatforms}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-current-tier">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" data-testid="badge-current-tier">{tierName}</Badge>
          </CardContent>
        </Card>
      </div>

      {monthlyPostLimit !== null && (
        <Card data-testid="card-usage-this-month">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base">Usage This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Posts used</span>
              <span className="text-sm font-medium" data-testid="text-usage-count">
                {postsThisMonth} / {monthlyPostLimit}
              </span>
            </div>
            <Progress
              value={Math.min((postsThisMonth / monthlyPostLimit) * 100, 100)}
              data-testid="progress-usage"
            />
            <p className="text-xs text-muted-foreground" data-testid="text-remaining-count">
              {postsThisMonth >= monthlyPostLimit
                ? 'No posts remaining this month'
                : `${monthlyPostLimit - postsThisMonth} post${monthlyPostLimit - postsThisMonth === 1 ? '' : 's'} remaining / ${monthlyPostLimit} total`}
            </p>
            {postsThisMonth >= monthlyPostLimit * 0.8 && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  {postsThisMonth >= monthlyPostLimit
                    ? 'Upgrade to keep posting.'
                    : `You\u2019re at ${Math.round((postsThisMonth / monthlyPostLimit) * 100)}% of your limit.`}
                </p>
                <Button variant="outline" size="sm" asChild data-testid="button-upgrade-cta">
                  <Link href="/pricing">Upgrade</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-alerts">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Trend Alerts</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium" data-testid="text-no-alerts">No alerts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              When AI detects trending topics in your niche, alerts will appear here for quick action.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-quick-links">
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon
              return (
                <Button
                  key={link.href}
                  variant="outline"
                  asChild
                  data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Link href={link.href} className="flex flex-col items-center gap-2 h-auto py-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{link.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
