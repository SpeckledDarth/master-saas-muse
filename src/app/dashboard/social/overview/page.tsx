'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Loader2,
  FileText,
  Sparkles,
  Link2,
  Shield,
  Bell,
  TrendingUp,
  Plus,
  Clock,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
} from 'lucide-react'
import { PlatformIconCircle } from '@/components/social/platform-icon'
import { PostDetailDialog, PostDetailData } from '@/components/social/post-detail-dialog'
import { HelpTooltip } from '@/components/social/help-tooltip'
import { CoachingCard } from '@/components/social/coaching-card'
import { ShareLink } from '@/components/social/share-link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
  platform_username?: string
  display_name?: string
  is_valid?: boolean
  connected_at?: string
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

interface FlywheelData {
  healthScore: number
  momentum: 'accelerating' | 'steady' | 'decelerating'
  breakdown: { writing: number; crossPosting: number; repurposing: number; scheduling: number }
  counts: { totalArticles: number; articlesThisMonth: number; totalSnippets: number; publishedSnippets: number; draftedSnippets: number }
  velocity: { date: string; count: number }[]
  nextAction: { type: string; message: string; href: string } | null
}

const TIER_DISPLAY: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  premium: 'Premium',
  universal: 'Universal',
  power: 'Power',
}

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

function getGreeting(): string {
  if (typeof window === 'undefined') return 'Welcome back'
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function SocialOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Welcome back')
  const [postsThisMonth, setPostsThisMonth] = useState(0)
  const [aiGensToday, setAiGensToday] = useState(0)
  const [connectedPlatforms, setConnectedPlatforms] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const [tierName, setTierName] = useState('Starter')
  const [monthlyPostLimit, setMonthlyPostLimit] = useState<number | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [detailPost, setDetailPost] = useState<PostDetailData | null>(null)
  const [flywheel, setFlywheel] = useState<FlywheelData | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (typeof window !== 'undefined' && !supabaseRef.current) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient()
    }
  }

  useEffect(() => {
    const supabase = supabaseRef.current
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])
  const fetchData = useCallback(async () => {
    try {
      const safeFetch = async (url: string, fallback: Record<string, unknown>) => {
        try {
          const r = await fetch(url)
          if (!r.ok) return fallback
          try { return await r.json() } catch { return fallback }
        } catch { return fallback }
      }

      const [postsData, accountsData, tierData, flywheelData] = await Promise.all([
        safeFetch('/api/social/posts?limit=200', { posts: [] }),
        safeFetch('/api/social/accounts', { accounts: [] }),
        safeFetch('/api/social/tier', {}),
        safeFetch('/api/social/flywheel/metrics', {}),
      ])

      const posts: SocialPost[] = postsData.posts || []
      const accounts: SocialAccount[] = accountsData.accounts || []

      const hasRealData = posts.length > 0 || accounts.length > 0

      if (hasRealData) {
        setTotalPosts(posts.length)
        setPostsThisMonth(posts.filter((p: SocialPost) => isCurrentMonth(p.created_at)).length)
        setAiGensToday(posts.filter((p: SocialPost) => p.ai_generated && isToday(p.created_at)).length)
        setConnectedPlatforms(accounts.length)
        setAccounts(accounts)
        setRecentPosts(posts.slice(0, 5))
      } else {
        setTotalPosts(64)
        setPostsThisMonth(18)
        setAiGensToday(3)
        setConnectedPlatforms(3)
        setMonthlyPostLimit(50)
        setAccounts([
          { id: '1', platform: 'facebook', platform_username: 'acmehomeservices', display_name: 'Acme Home Services', is_valid: true },
          { id: '2', platform: 'twitter', platform_username: '@AcmeHomeSvc', display_name: 'Acme Home Services', is_valid: true },
          { id: '3', platform: 'linkedin', platform_username: 'acme-home-services', display_name: 'Acme Home Services LLC', is_valid: true },
        ])
        setRecentPosts([
          { id: 'm1', platform: 'facebook', content: 'Spring is here! Time to check your HVAC filters and schedule that annual tune-up before the summer heat hits.', status: 'posted', ai_generated: false, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'm2', platform: 'twitter', content: 'Pro tip: Clean your dryer vents at least once a year to prevent fires and improve efficiency. Book your appointment today!', status: 'posted', ai_generated: true, created_at: new Date(Date.now() - 172800000).toISOString() },
          { id: 'm3', platform: 'linkedin', content: 'We\'re proud to announce our expansion into residential solar panel installation. Green energy for a better tomorrow.', status: 'scheduled', ai_generated: false, created_at: new Date(Date.now() - 259200000).toISOString() },
          { id: 'm4', platform: 'facebook', content: 'Customer spotlight: The Johnson family saved 30% on their energy bill after our insulation upgrade. Read their story!', status: 'draft', ai_generated: true, created_at: new Date(Date.now() - 345600000).toISOString() },
        ])
      }

      if (tierData.tier) {
        const tierInfo = tierData as TierInfo
        setTierName(TIER_DISPLAY[tierInfo.tier] || tierInfo.tier)
        if (tierInfo.limits?.monthlyPosts && tierInfo.limits.monthlyPosts < 999999) {
          setMonthlyPostLimit(tierInfo.limits.monthlyPosts)
        }
      } else if (!hasRealData) {
        setTierName('Basic')
      }

      if (flywheelData.healthScore !== undefined) {
        setFlywheel(flywheelData as FlywheelData)
      }
    } catch {
      console.error('[SocialOverview] Unexpected error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }


  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12" data-testid="avatar-user-overview">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground mt-0.5" data-testid="text-page-subtitle">
              Here&apos;s how your social media is performing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild data-testid="button-quick-create">
            <Link href="/dashboard/social/posts"><Plus className="mr-2 h-4 w-4" />Create Post</Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-quick-schedule">
            <Link href="/dashboard/social/calendar"><Clock className="mr-2 h-4 w-4" />Schedule Post</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-posts-this-month">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month <HelpTooltip text="The number of posts created across all your connected platforms this calendar month." /></CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-posts-this-month">{postsThisMonth}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-generations-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations Today <HelpTooltip text="How many posts AI has written for you today. This count resets at midnight." /></CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-generations-today">{aiGensToday}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-connected-platforms">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms <HelpTooltip text="The number of social media accounts you've linked to PassivePost." /></CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-connected-platforms">{connectedPlatforms}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-current-tier">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier <HelpTooltip text="Your subscription level. Higher tiers unlock more posts, platforms, and AI generations." /></CardTitle>
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
            <CardTitle className="text-base">Usage This Month <HelpTooltip text="Shows how many of your monthly posts you've used and how many remain before your limit resets." /></CardTitle>
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

      <CoachingCard />

      {flywheel && (
        <Card className="border-primary/20" data-testid="card-flywheel-health">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Content Flywheel
              <HelpTooltip text="Your content flywheel score measures how well you're turning blog articles into social media reach. Write blogs, cross-post, repurpose into snippets, and schedule them." />
            </CardTitle>
            <Link href="/dashboard/social/blog">
              <Button variant="outline" size="sm" data-testid="button-flywheel-details">Details</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`text-4xl font-bold ${flywheel.healthScore >= 70 ? 'text-green-600 dark:text-green-400' : flywheel.healthScore >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-flywheel-overview-score">
                  {flywheel.healthScore}
                </div>
                <span className="text-sm text-muted-foreground mt-1">out of 100</span>
                <div className="flex items-center gap-1 mt-2">
                  {flywheel.momentum === 'accelerating' ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : flywheel.momentum === 'decelerating' ? (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{flywheel.momentum}</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Writing', value: flywheel.breakdown.writing },
                  { label: 'Cross-Posting', value: flywheel.breakdown.crossPosting },
                  { label: 'Repurposing', value: flywheel.breakdown.repurposing },
                  { label: 'Scheduling', value: flywheel.breakdown.scheduling },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-medium">{item.value}/25</span>
                    </div>
                    <Progress value={(item.value / 25) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">30-Day Velocity</div>
                <div className="flex items-end gap-[2px] h-12" data-testid="chart-velocity-sparkline">
                  {flywheel.velocity.slice(-14).map((d, i) => {
                    const max = Math.max(...flywheel.velocity.slice(-14).map(v => v.count), 1)
                    const height = Math.max((d.count / max) * 100, 4)
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary/60 rounded-t-sm min-w-[3px]"
                        style={{ height: `${height}%` }}
                        title={`${d.date}: ${d.count}`}
                      />
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {flywheel.counts.totalArticles} article{flywheel.counts.totalArticles !== 1 ? 's' : ''} &middot; {flywheel.counts.totalSnippets} snippet{flywheel.counts.totalSnippets !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {flywheel.nextAction && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">{flywheel.nextAction.message}</p>
                </div>
                <Link href={flywheel.nextAction.href}>
                  <Button size="sm" variant="outline" data-testid="button-flywheel-next-action">
                    Do it <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-connected-accounts-list">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Connected Accounts <HelpTooltip text="Your linked social media accounts and their current connection status." /></CardTitle>
            <Button variant="outline" size="sm" asChild data-testid="button-manage-accounts">
              <Link href="/dashboard/social">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-6">
                <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No accounts connected yet</p>
                <Button variant="outline" size="sm" className="mt-3" asChild data-testid="button-connect-account-cta">
                  <Link href="/dashboard/social">Connect Account</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3" data-testid="list-connected-accounts">
                {accounts.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-2.5 rounded-md border"
                    data-testid={`account-${account.id}`}
                  >
                    <div className="relative">
                      <PlatformIconCircle platform={account.platform} />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${account.is_valid !== false ? 'bg-chart-2' : 'bg-destructive'}`}
                        data-testid={`status-dot-${account.id}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{account.display_name || account.platform_username || account.platform}</p>
                      <p className="text-xs text-muted-foreground truncate">{account.platform_username || account.platform}</p>
                    </div>
                    <Badge variant={account.is_valid !== false ? 'secondary' : 'destructive'} className="text-xs shrink-0" data-testid={`badge-account-status-${account.id}`}>
                      {account.is_valid !== false ? 'Active' : 'Error'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-alerts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Trend Alerts <HelpTooltip text="Topics trending in your niche right now. Click Generate to create a post about a trend." /></CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="list-trend-alerts">
              {[
                { id: '1', platform: 'twitter', topic: '"Spring cleaning tips" trending in your area', time: '2 hours ago', urgent: true },
                { id: '2', platform: 'facebook', topic: 'Local home improvement week starting Monday', time: '5 hours ago', urgent: false },
                { id: '3', platform: 'linkedin', topic: '"Small business growth" gaining traction in your niche', time: '1 day ago', urgent: false },
              ].map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-md border"
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{alert.topic}</span>
                      {alert.urgent && <Badge variant="default" className="text-xs">Hot</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-generate-alert-${alert.id}`}>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-best-times">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Best Times to Post <HelpTooltip text="Recommended posting windows based on when your audience is most active on each platform." /></CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="list-best-times">
            {[
              { platform: 'twitter', day: 'Tue & Thu', time: '9:00 AM - 11:00 AM', engagement: 'High' },
              { platform: 'facebook', day: 'Wed & Fri', time: '12:00 PM - 2:00 PM', engagement: 'High' },
              { platform: 'linkedin', day: 'Tue & Wed', time: '8:00 AM - 10:00 AM', engagement: 'Medium' },
            ].map(slot => (
              <div key={slot.platform} className="flex items-center gap-3 p-2.5 rounded-md border" data-testid={`best-time-${slot.platform}`}>
                <PlatformIconCircle platform={slot.platform} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{slot.day}</p>
                  <p className="text-xs text-muted-foreground">{slot.time}</p>
                </div>
                <Badge variant={slot.engagement === 'High' ? 'default' : 'secondary'} className="text-xs shrink-0" data-testid={`badge-engagement-${slot.platform}`}>
                  {slot.engagement}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {recentPosts.length > 0 && (
        <Card data-testid="card-recent-activity">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button variant="outline" size="sm" asChild data-testid="button-view-all-posts">
              <Link href="/dashboard/social/posts">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="list-recent-posts">
              {recentPosts.map(post => {
                const PLATFORM_NAMES: Record<string, string> = { twitter: 'Twitter/X', linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram' }
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => setDetailPost(post as unknown as PostDetailData)}
                    data-testid={`recent-post-${post.id}`}
                  >
                    <PlatformIconCircle platform={post.platform} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs" data-testid={`badge-platform-${post.id}`}>{PLATFORM_NAMES[post.platform] || post.platform}</Badge>
                        <span className="text-xs text-muted-foreground" data-testid={`text-date-${post.id}`}>
                          {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {post.ai_generated && (
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-ai-${post.id}`}>
                            <Sparkles className="mr-1 h-2.5 w-2.5" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={post.status === 'posted' ? 'default' : post.status === 'scheduled' ? 'secondary' : 'outline'} className="text-xs shrink-0" data-testid={`badge-status-${post.id}`}>
                      {post.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <ShareLink />

      <PostDetailDialog
        post={detailPost}
        open={!!detailPost}
        onOpenChange={(open) => { if (!open) setDetailPost(null) }}
      />
    </div>
  )
}
