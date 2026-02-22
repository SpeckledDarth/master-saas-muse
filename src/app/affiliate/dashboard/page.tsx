'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/use-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2, Copy, Check, DollarSign, Users, TrendingUp, Share2,
  Award, MousePointerClick, FileImage, FileText,
  ExternalLink, Clock, CheckCircle, LogOut, Target, Zap,
  Link2, Trophy, BarChart3, ArrowDown, ArrowUp, Calendar, Gift,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AffiliateDashboardData {
  link: {
    ref_code: string
    shareUrl: string
    is_affiliate: boolean
  }
  stats: {
    totalReferrals: number
    conversions: number
    conversionRate: number
    clicks: number
    pendingEarnings: number
    approvedEarnings: number
    paidEarnings: number
    totalEarnings: number
    effectiveRate: number
  }
  tier: {
    current: { id: string; name: string; commission_rate: number } | null
    next: { id: string; name: string; min_referrals: number; commission_rate: number } | null
    referralsToNext: number
  }
  terms: {
    rate: number
    durationMonths: number
    lockedAt: string
  } | null
  referrals: Array<{
    id: string
    status: string
    created_at: string
    fraud_flags: string[]
    source_tag?: string | null
  }>
  commissions: Array<{
    id: string
    invoice_amount_cents: number
    commission_rate: number
    commission_amount_cents: number
    status: string
    created_at: string
  }>
  payouts: Array<{
    id: string
    amount_cents: number
    method: string
    status: string
    processed_at: string | null
    created_at: string
  }>
  settings: {
    minPayoutCents: number
  }
}

interface MarketingAsset {
  id: string
  title: string
  description: string | null
  asset_type: string
  content: string | null
  file_url: string | null
}

interface LeaderboardEntry {
  rank: number
  displayName: string
  metricValue: number
  isYou: boolean
}

interface FunnelStep {
  stage: string
  count: number
  rate: number
}

interface ForecastData {
  monthSoFar: number
  projectedTotal: number
  optimistic: number
  pessimistic: number
  dailyAvg: number
  paceVsLastMonth: number | null
  daysRemaining: number
  tierInfo: {
    currentTierName: string
    nextTierName: string
    nextTierRate: number
    referralsNeeded: number
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  signed_up: 'secondary',
  converted: 'default',
  churned: 'destructive',
  pending: 'outline',
  approved: 'secondary',
  paid: 'default',
}

const ASSET_TYPE_ICONS: Record<string, any> = {
  banner: FileImage,
  email_template: FileText,
  social_post: Share2,
  text_snippet: FileText,
  video: FileImage,
  case_study: FileText,
  one_pager: FileText,
  swipe_file: FileText,
  landing_page: FileText,
}

const DEEP_LINK_PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Features', path: '/features' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
]

export default function StandaloneAffiliateDashboard() {
  const router = useRouter()
  const { settings: appSettings } = useSettings()
  const appName = appSettings?.branding?.appName || 'Our Product'

  const [authChecking, setAuthChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AffiliateDashboardData | null>(null)
  const [assets, setAssets] = useState<MarketingAsset[]>([])
  const [copied, setCopied] = useState(false)
  const [copiedAsset, setCopiedAsset] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [earnings, setEarnings] = useState<{ today: number; thisWeek: number; thisMonth: number; allTime: number } | null>(null)
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'thisWeek' | 'thisMonth'>('today')
  const [milestoneData, setMilestoneData] = useState<{ milestones: any[]; currentReferrals: number; totalBonusEarned: number } | null>(null)

  const [deepLinkPage, setDeepLinkPage] = useState('/')
  const [customPath, setCustomPath] = useState('')
  const [sourceTag, setSourceTag] = useState('')
  const [includeUtm, setIncludeUtm] = useState(true)
  const [copiedDeepLink, setCopiedDeepLink] = useState(false)

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true)
  const [ownPosition, setOwnPosition] = useState<number | null>(null)
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('month')
  const [leaderboardMetric, setLeaderboardMetric] = useState('referrals')

  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [funnelPeriod, setFunnelPeriod] = useState('30d')

  const [forecast, setForecast] = useState<ForecastData | null>(null)

  const [contests, setContests] = useState<any[]>([])
  const [tierPerks, setTierPerks] = useState<string[]>([])

  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/affiliate/login')
        return
      }
      setUserEmail(user.email || '')
      setAuthChecking(false)
    }
    checkAuth()
  }, [router])

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, assetsRes, earningsRes, milestonesRes, forecastRes] = await Promise.all([
        fetch('/api/affiliate/dashboard'),
        fetch('/api/affiliate/assets'),
        fetch('/api/affiliate/earnings'),
        fetch('/api/affiliate/milestones'),
        fetch('/api/affiliate/forecast'),
      ])

      const [dashData, assetsData, earningsData, msData, forecastData] = await Promise.all([
        dashRes.json(),
        assetsRes.json(),
        earningsRes.json(),
        milestonesRes.json(),
        forecastRes.ok ? forecastRes.json() : null,
      ])

      setData(dashData.affiliate)
      setAssets(assetsData.assets || [])
      setEarnings(earningsData)
      setMilestoneData(msData)
      if (forecastData && !forecastData.error) setForecast(forecastData)
      if (dashData.affiliate?.link?.is_affiliate) {
        fetch('/api/affiliate/contests').then(r => r.json()).then(d => setContests(d.contests || [])).catch(() => {})
      }
      if (dashData.affiliate?.tier?.current?.perks) setTierPerks(dashData.affiliate.tier.current.perks)
    } catch (err) {
      console.error('Failed to load affiliate data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/affiliate/leaderboard?period=${leaderboardPeriod}&metric=${leaderboardMetric}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.enabled === false) {
        setLeaderboardEnabled(false)
      } else {
        setLeaderboardEnabled(true)
        setLeaderboard(data.leaderboard || [])
        setOwnPosition(data.ownPosition)
      }
    } catch {}
  }, [leaderboardPeriod, leaderboardMetric])

  const fetchFunnel = useCallback(async () => {
    try {
      const res = await fetch(`/api/affiliate/funnel?period=${funnelPeriod}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.funnel) setFunnel(data.funnel)
    } catch {}
  }, [funnelPeriod])

  useEffect(() => {
    if (!authChecking) fetchData()
  }, [authChecking, fetchData])

  useEffect(() => {
    if (!authChecking && !loading) fetchLeaderboard()
  }, [authChecking, loading, fetchLeaderboard])

  useEffect(() => {
    if (!authChecking && !loading) fetchFunnel()
  }, [authChecking, loading, fetchFunnel])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/affiliate/login')
  }

  const handleCopy = async (text: string, isAsset?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (isAsset) {
        setCopiedAsset(isAsset)
        setTimeout(() => setCopiedAsset(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
      toast({ title: 'Copied!', description: 'Copied to clipboard' })
    } catch {
      toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
  }

  const generateDeepLink = () => {
    if (!data?.link?.ref_code) return ''
    const baseUrl = data.link.shareUrl.split('?')[0].replace(/\/$/, '')
    const baseDomain = baseUrl.replace(/\/+$/, '')
    const path = deepLinkPage === 'custom' ? customPath : deepLinkPage
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    const params = new URLSearchParams()
    params.set('ref', data.link.ref_code)

    if (sourceTag.trim()) {
      params.set('src', sourceTag.trim())
    }

    if (includeUtm) {
      params.set('utm_source', appName.toLowerCase().replace(/\s+/g, '-'))
      params.set('utm_medium', 'affiliate')
      params.set('utm_campaign', data.link.ref_code)
      if (sourceTag.trim()) {
        params.set('utm_content', sourceTag.trim())
      }
    }

    return `${baseDomain}${cleanPath}?${params.toString()}`
  }

  const handleCopyDeepLink = async () => {
    const link = generateDeepLink()
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiedDeepLink(true)
      setTimeout(() => setCopiedDeepLink(false), 2000)
      toast({ title: 'Copied!', description: 'Deep link copied to clipboard' })
    } catch {
      toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
  }

  if (authChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-affiliate-dashboard">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data || !data.link?.is_affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-gray-500/50">
          <CardContent className="pt-8 pb-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold text-black dark:text-white mb-2" data-testid="text-no-affiliate">Not an Affiliate Yet</h2>
            <p className="text-muted-foreground mb-6">
              Your account doesn't have affiliate access. If you recently applied, your application may still be under review.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/affiliate/join">
                <Button className="w-full" data-testid="button-apply">Apply to Program</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" /> Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tierProgress = data.tier.next
    ? ((data.stats.totalReferrals / data.tier.next.min_referrals) * 100)
    : 100

  const sourceBreakdown: Record<string, { referrals: number; converted: number }> = {}
  data.referrals.forEach(ref => {
    const tag = ref.source_tag || '(no tag)'
    if (!sourceBreakdown[tag]) sourceBreakdown[tag] = { referrals: 0, converted: 0 }
    sourceBreakdown[tag].referrals++
    if (ref.status === 'converted') sourceBreakdown[tag].converted++
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/affiliate" className="font-semibold text-black dark:text-white" data-testid="link-affiliate-home">
              {appName} Affiliates
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white" data-testid="text-dashboard-heading">Affiliate Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track your referrals, earnings, and access marketing materials.</p>
          </div>

          <Card data-testid="card-share-link">
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm font-medium mb-1">Your Referral Link</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={data.link.shareUrl}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-share-url"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(data.link.shareUrl)}
                      data-testid="button-copy-link"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {data.terms && (
                  <Badge variant="secondary" className="shrink-0" data-testid="badge-locked-terms">
                    {data.terms.rate}% for {data.terms.durationMonths} months
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {earnings && (
            <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/20" data-testid="card-live-earnings">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Live Earnings</span>
                  </div>
                  <div className="flex gap-1">
                    {(['today', 'thisWeek', 'thisMonth'] as const).map(period => (
                      <Button
                        key={period}
                        variant={earningsPeriod === period ? 'default' : 'ghost'}
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => setEarningsPeriod(period)}
                        data-testid={`button-earnings-${period}`}
                      >
                        {period === 'today' ? 'Today' : period === 'thisWeek' ? 'Week' : 'Month'}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400" data-testid="text-live-earnings-value">
                  ${(earnings[earningsPeriod] / 100).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card data-testid="stat-clicks">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Link Clicks</span>
                </div>
                <p className="text-2xl font-bold mt-1">{data.stats.clicks}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-referrals">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Signups</span>
                </div>
                <p className="text-2xl font-bold mt-1">{data.stats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">{data.stats.conversionRate}% convert to paid</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-pending-earnings">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold mt-1">${(data.stats.pendingEarnings / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-earned">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-2xl font-bold mt-1">${(data.stats.totalEarnings / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {data.tier.current && (
            <Card data-testid="card-tier-progress">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{data.tier.current.name} Tier</span>
                    <Badge variant="outline" className="text-xs">{data.stats.effectiveRate}% commission</Badge>
                  </div>
                  {data.tier.next && (
                    <span className="text-xs text-muted-foreground">
                      {data.tier.referralsToNext} more to {data.tier.next.name} ({data.tier.next.commission_rate}%)
                    </span>
                  )}
                </div>
                {data.tier.next && (
                  <Progress value={Math.min(tierProgress, 100)} className="h-2" data-testid="progress-tier" />
                )}
                {!data.tier.next && (
                  <p className="text-xs text-muted-foreground">You've reached the highest tier!</p>
                )}
                {tierPerks.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gift className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">Your Tier Perks</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tierPerks.map((perk, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{perk}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {milestoneData && milestoneData.milestones.length > 0 && (
            <Card data-testid="card-milestone-progress">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Milestone Bonuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  You have {milestoneData.currentReferrals} referral{milestoneData.currentReferrals !== 1 ? 's' : ''} total.
                  {milestoneData.totalBonusEarned > 0 && ` Earned $${(milestoneData.totalBonusEarned / 100).toFixed(2)} in milestone bonuses.`}
                </p>
                <div className="space-y-2">
                  {milestoneData.milestones.map(ms => {
                    const achieved = milestoneData.currentReferrals >= ms.referral_threshold
                    const progress = Math.min((milestoneData.currentReferrals / ms.referral_threshold) * 100, 100)
                    return (
                      <div key={ms.id} className={`p-3 rounded-md border ${achieved ? 'border-green-500/30 bg-green-50/30 dark:bg-green-950/20' : ''}`} data-testid={`milestone-progress-${ms.id}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{ms.name}</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            ${(ms.bonus_amount_cents / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {achieved ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1 justify-end"><CheckCircle className="h-3 w-3" /> Done</span>
                            ) : (
                              `${milestoneData.currentReferrals}/${ms.referral_threshold}`
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {contests.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-950/20" data-testid="card-active-contests">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  Active Contests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contests.map(contest => {
                    const now = new Date()
                    const end = new Date(contest.end_date)
                    const start = new Date(contest.start_date)
                    const isActive = contest.status === 'active' && now >= start && now <= end
                    const daysLeft = isActive ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null
                    return (
                      <div key={contest.id} className={`p-4 rounded-md border ${isActive ? 'border-yellow-500/50' : ''}`} data-testid={`contest-${contest.id}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{contest.name}</span>
                              <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">
                                {isActive ? 'Active' : 'Upcoming'}
                              </Badge>
                            </div>
                            {contest.description && <p className="text-xs text-muted-foreground">{contest.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>Metric: {contest.metric}</span>
                              <span>Prize: ${((contest.prize_amount_cents || 0) / 100).toFixed(2)}</span>
                              {contest.prize_description && <span>{contest.prize_description}</span>}
                            </div>
                          </div>
                          {daysLeft !== null && (
                            <div className="text-right shrink-0">
                              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{daysLeft}</p>
                              <p className="text-[10px] text-muted-foreground">days left</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {forecast && (
              <Card data-testid="card-earnings-forecast">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Earnings Forecast
                  </CardTitle>
                  <CardDescription>Based on your last 14 days performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This month so far</span>
                      <span className="text-sm font-medium">${(forecast.monthSoFar / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Projected total</span>
                      <span className="text-lg font-bold text-primary">${(forecast.projectedTotal / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Range: ${(forecast.pessimistic / 100).toFixed(2)} — ${(forecast.optimistic / 100).toFixed(2)}</span>
                      <span>{forecast.daysRemaining} days left</span>
                    </div>
                    {forecast.paceVsLastMonth !== null && (
                      <div className="flex items-center gap-1 text-xs">
                        {forecast.paceVsLastMonth >= 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={forecast.paceVsLastMonth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {Math.abs(forecast.paceVsLastMonth)}% vs last month
                        </span>
                      </div>
                    )}
                    {forecast.tierInfo && (
                      <div className="p-2 rounded bg-primary/10 text-xs">
                        <span className="font-medium">{forecast.tierInfo.referralsNeeded} more referrals</span> to reach{' '}
                        <span className="font-medium">{forecast.tierInfo.nextTierName}</span> tier ({forecast.tierInfo.nextTierRate}% commission)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {leaderboardEnabled && (
              <Card data-testid="card-leaderboard">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Leaderboard
                    </CardTitle>
                    <div className="flex gap-1">
                      <Select value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
                        <SelectTrigger className="h-7 text-xs w-24" data-testid="select-leaderboard-period">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={leaderboardMetric} onValueChange={setLeaderboardMetric}>
                        <SelectTrigger className="h-7 text-xs w-24" data-testid="select-leaderboard-metric">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="referrals">Referrals</SelectItem>
                          <SelectItem value="earnings">Earnings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-leaderboard">No data for this period yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {leaderboard.map(entry => (
                        <div
                          key={entry.rank}
                          className={`flex items-center justify-between p-2 rounded-md text-sm ${entry.isYou ? 'bg-primary/10 border border-primary/30 font-medium' : ''}`}
                          data-testid={`leaderboard-rank-${entry.rank}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-6 text-center text-xs font-bold ${entry.rank <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                              #{entry.rank}
                            </span>
                            <span>{entry.displayName} {entry.isYou && <Badge variant="outline" className="text-[10px] ml-1">You</Badge>}</span>
                          </div>
                          <span className="font-medium">
                            {leaderboardMetric === 'earnings' ? `$${(entry.metricValue / 100).toFixed(2)}` : entry.metricValue}
                          </span>
                        </div>
                      ))}
                      {ownPosition !== null && ownPosition > leaderboard.length && (
                        <div className="text-center text-xs text-muted-foreground pt-2 border-t" data-testid="text-own-position">
                          Your position: #{ownPosition}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {funnel.length > 0 && (
            <Card data-testid="card-conversion-funnel">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Conversion Funnel
                  </CardTitle>
                  <Select value={funnelPeriod} onValueChange={setFunnelPeriod}>
                    <SelectTrigger className="h-7 text-xs w-24" data-testid="select-funnel-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="90d">90 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funnel.map((step, i) => {
                    const maxCount = funnel[0]?.count || 1
                    const barWidth = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 4) : 4
                    return (
                      <div key={step.stage} data-testid={`funnel-stage-${step.stage.toLowerCase()}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{step.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{step.count}</span>
                            {i > 0 && (
                              <span className={`text-xs ${step.rate >= 50 ? 'text-green-600 dark:text-green-400' : step.rate >= 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                {step.rate}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-deep-link-generator">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Deep Link Generator
              </CardTitle>
              <CardDescription>Create referral links to specific pages with optional source tracking and UTM tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Target Page</Label>
                  <Select value={deepLinkPage} onValueChange={setDeepLinkPage}>
                    <SelectTrigger className="mt-1" data-testid="select-deep-link-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEEP_LINK_PAGES.map(p => (
                        <SelectItem key={p.path} value={p.path}>{p.label} ({p.path})</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom URL...</SelectItem>
                    </SelectContent>
                  </Select>
                  {deepLinkPage === 'custom' && (
                    <Input
                      className="mt-2"
                      placeholder="/your/custom/path"
                      value={customPath}
                      onChange={e => setCustomPath(e.target.value)}
                      data-testid="input-custom-path"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs">Source Tag (optional)</Label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. youtube-review, newsletter-jan"
                    value={sourceTag}
                    onChange={e => setSourceTag(e.target.value)}
                    data-testid="input-source-tag"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Track which campaigns drive your conversions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  id="utm-toggle"
                  checked={includeUtm}
                  onChange={e => setIncludeUtm(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-utm"
                />
                <Label htmlFor="utm-toggle" className="text-xs cursor-pointer">Include UTM parameters (for Google Analytics)</Label>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={generateDeepLink()}
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-deep-link-result"
                />
                <Button variant="outline" size="sm" onClick={handleCopyDeepLink} data-testid="button-copy-deep-link">
                  {copiedDeepLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="referrals" data-testid="tabs-affiliate-dashboard">
            <TabsList className="flex-wrap">
              <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals ({data.referrals.length})</TabsTrigger>
              <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings ({data.commissions.length})</TabsTrigger>
              <TabsTrigger value="payouts" data-testid="tab-payouts">Payouts ({data.payouts.length})</TabsTrigger>
              <TabsTrigger value="sources" data-testid="tab-sources">Sources ({Object.keys(sourceBreakdown).length})</TabsTrigger>
              <TabsTrigger value="assets" data-testid="tab-assets">Marketing ({assets.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  {data.referrals.length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-referrals">
                      <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.referrals.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`referral-${ref.id}`}>
                          <div className="flex items-center gap-3">
                            <Badge variant={STATUS_COLORS[ref.status] as any || 'outline'} className="text-xs capitalize">
                              {ref.status.replace('_', ' ')}
                            </Badge>
                            {ref.source_tag && (
                              <Badge variant="outline" className="text-[10px]">{ref.source_tag}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(ref.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  {data.commissions.length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-commissions">
                      <DollarSign className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No commissions yet. When your referrals pay, you earn!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.commissions.map(com => (
                        <div key={com.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`commission-${com.id}`}>
                          <div className="flex items-center gap-3">
                            <Badge variant={STATUS_COLORS[com.status] as any || 'outline'} className="text-xs capitalize">
                              {com.status}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">${(com.commission_amount_cents / 100).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {com.commission_rate}% of ${(com.invoice_amount_cents / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(com.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground" data-testid="text-earnings-breakdown">
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span>${(data.stats.pendingEarnings / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Approved (ready for payout)</span>
                      <span>${(data.stats.approvedEarnings / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Already paid</span>
                      <span>${(data.stats.paidEarnings / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t font-medium text-foreground">
                      <span>Minimum payout threshold</span>
                      <span>${(data.settings.minPayoutCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  {data.payouts.length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-payouts">
                      <CheckCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No payouts yet. Once your balance reaches the minimum, payouts will be processed.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.payouts.map(payout => (
                        <div key={payout.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`payout-${payout.id}`}>
                          <div className="flex items-center gap-3">
                            <Badge variant={STATUS_COLORS[payout.status] as any || 'outline'} className="text-xs capitalize">
                              {payout.status}
                            </Badge>
                            <p className="text-sm font-medium">${(payout.amount_cents / 100).toFixed(2)}</p>
                            <span className="text-xs text-muted-foreground">{payout.method}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(payout.processed_at || payout.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance by Source</CardTitle>
                  <CardDescription>See which campaigns and channels drive your referrals. Use source tags in your deep links to track this.</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(sourceBreakdown).length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-sources">
                      <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No source data yet. Add a source tag (e.g. ?src=youtube) to your links to track performance by channel.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(sourceBreakdown)
                        .sort(([, a], [, b]) => b.referrals - a.referrals)
                        .map(([tag, data]) => (
                          <div key={tag} className="flex items-center justify-between p-3 rounded-md border" data-testid={`source-${tag}`}>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs font-mono">{tag}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{data.referrals} signup{data.referrals !== 1 ? 's' : ''}</span>
                              <span className="text-muted-foreground">{data.converted} converted</span>
                              <span className="font-medium">
                                {data.referrals > 0 ? Math.round((data.converted / data.referrals) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Marketing Materials</CardTitle>
                  <CardDescription>Ready-to-use assets to help you promote and earn more</CardDescription>
                </CardHeader>
                <CardContent>
                  {assets.length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-assets">
                      <FileImage className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No marketing assets available yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assets.map(asset => {
                        const Icon = ASSET_TYPE_ICONS[asset.asset_type] || FileText
                        return (
                          <div key={asset.id} className="p-4 rounded-md border" data-testid={`asset-${asset.id}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-medium text-sm">{asset.title}</p>
                                  {asset.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{asset.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {asset.content && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(asset.content!, asset.id)}
                                    data-testid={`button-copy-asset-${asset.id}`}
                                  >
                                    {copiedAsset === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  </Button>
                                )}
                                {asset.file_url && (
                                  <Button variant="outline" size="sm" asChild data-testid={`button-download-asset-${asset.id}`}>
                                    <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                            {asset.content && (
                              <pre className="mt-3 p-3 rounded bg-muted text-xs overflow-auto max-h-32 whitespace-pre-wrap" data-testid={`content-asset-${asset.id}`}>
                                {asset.content}
                              </pre>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
