'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/use-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2, Copy, Check, DollarSign, Users, TrendingUp, Share2,
  Award, MousePointerClick, FileImage, FileText,
  ExternalLink, Clock, CheckCircle, LogOut, Target, Zap, Lock,
  Link2, Trophy, BarChart3, ArrowDown, ArrowUp, Calendar, Gift,
  LayoutDashboard, Settings, Receipt, Megaphone, HelpCircle,
  Bell, Bookmark, Download, QrCode,
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
    current: { id: string; name: string; commission_rate: number; perks?: string[] } | null
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

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  created_at: string
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

type DashboardSection = 'overview' | 'referrals' | 'earnings' | 'payouts' | 'assets' | 'tools' | 'announcements' | 'account' | 'support'

const NAV_ITEMS: { key: DashboardSection; label: string; icon: any }[] = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'referrals', label: 'Referrals', icon: Users },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'payouts', label: 'Payouts', icon: Receipt },
  { key: 'assets', label: 'Marketing', icon: FileImage },
  { key: 'tools', label: 'Tools', icon: Link2 },
  { key: 'announcements', label: 'News', icon: Megaphone },
  { key: 'account', label: 'Account', icon: Settings },
  { key: 'support', label: 'Support', icon: HelpCircle },
]

export default function StandaloneAffiliateDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings: appSettings } = useSettings()
  const appName = appSettings?.branding?.appName || 'Our Product'

  const initialSection = (searchParams.get('section') as DashboardSection) || 'overview'
  const [section, setSection] = useState<DashboardSection>(initialSection)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [profile, setProfile] = useState<Record<string, any>>({})
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const [discountCodes, setDiscountCodes] = useState<any[]>([])
  const [codeRequests, setCodeRequests] = useState<any[]>([])
  const [newCodeRequest, setNewCodeRequest] = useState('')
  const [codeRequestSubmitting, setCodeRequestSubmitting] = useState(false)

  const [linkPresets, setLinkPresets] = useState<any[]>([])
  const [presetName, setPresetName] = useState('')

  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  const [referralFilter, setReferralFilter] = useState('all')
  const [referralSort, setReferralSort] = useState<'newest' | 'oldest'>('newest')
  const [earningsFilter, setEarningsFilter] = useState('all')
  const [earningsSort, setEarningsSort] = useState<'newest' | 'oldest'>('newest')
  const [payoutSort, setPayoutSort] = useState<'newest' | 'oldest'>('newest')

  const { toast } = useToast()

  const navigate = (s: DashboardSection) => {
    setSection(s)
    setMobileNavOpen(false)
    window.history.replaceState(null, '', `/affiliate/dashboard?section=${s}`)
  }

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
      if (dashData.affiliate?.tier?.current?.perks && Array.isArray(dashData.affiliate.tier.current.perks)) {
        setTierPerks(dashData.affiliate.tier.current.perks)
      }
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

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/affiliate/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile || {})
      }
    } catch {}
    setProfileLoading(false)
  }, [])

  const saveProfile = async () => {
    setProfileSaving(true)
    try {
      const res = await fetch('/api/affiliate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        toast({ title: 'Saved', description: 'Your profile has been updated.' })
      } else {
        toast({ title: 'Error', description: 'Failed to save profile.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save profile.', variant: 'destructive' })
    }
    setProfileSaving(false)
  }

  const fetchDiscountCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/discount-codes')
      if (res.ok) {
        const data = await res.json()
        setDiscountCodes(data.codes || [])
        setCodeRequests(data.requests || [])
      }
    } catch {}
  }, [])

  const fetchLinkPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/link-presets')
      if (res.ok) {
        const data = await res.json()
        setLinkPresets(data.presets || [])
      }
    } catch {}
  }, [])

  const submitCodeRequest = async () => {
    if (!newCodeRequest.trim()) return
    setCodeRequestSubmitting(true)
    try {
      const res = await fetch('/api/affiliate/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_code', code: newCodeRequest }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Submitted', description: 'Your promo code request has been submitted for review.' })
        setNewCodeRequest('')
        fetchDiscountCodes()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to submit request', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit request', variant: 'destructive' })
    }
    setCodeRequestSubmitting(false)
  }

  const saveLinkPreset = async () => {
    if (!presetName.trim()) return
    try {
      const res = await fetch('/api/affiliate/link-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName,
          page_path: deepLinkPage === 'custom' ? customPath : deepLinkPage,
          source_tag: sourceTag || null,
          include_utm: includeUtm,
        }),
      })
      if (res.ok) {
        toast({ title: 'Saved', description: 'Link preset saved.' })
        setPresetName('')
        fetchLinkPresets()
      }
    } catch {}
  }

  const deleteLinkPreset = async (id: string) => {
    try {
      await fetch('/api/affiliate/link-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      fetchLinkPresets()
    } catch {}
  }

  const loadLinkPreset = (preset: any) => {
    const matchedPage = DEEP_LINK_PAGES.find(p => p.path === preset.page_path)
    if (matchedPage) {
      setDeepLinkPage(preset.page_path)
    } else {
      setDeepLinkPage('custom')
      setCustomPath(preset.page_path)
    }
    setSourceTag(preset.source_tag || '')
    setIncludeUtm(preset.include_utm !== false)
    toast({ title: 'Loaded', description: `Preset "${preset.name}" loaded into link generator.` })
  }

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }, [])

  useEffect(() => {
    if (!authChecking) {
      fetchData()
      fetchNotifications()
      fetchProfile()
      fetchDiscountCodes()
      fetchLinkPresets()
    }
  }, [authChecking, fetchData, fetchNotifications, fetchProfile, fetchDiscountCodes, fetchLinkPresets])

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

  const filteredReferrals = data.referrals
    .filter(r => referralFilter === 'all' || r.status === referralFilter)
    .sort((a, b) => referralSort === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const filteredCommissions = data.commissions
    .filter(c => earningsFilter === 'all' || c.status === earningsFilter)
    .sort((a, b) => earningsSort === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const sortedPayouts = [...data.payouts].sort((a, b) => payoutSort === 'newest'
    ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const renderOverview = () => (
    <div className="space-y-6">
      <Card data-testid="card-share-link">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0 w-full">
              <p className="text-sm font-medium mb-1">Your Referral Link</p>
              <div className="flex items-center gap-2">
                <Input value={data.link.shareUrl} readOnly className="font-mono text-sm" data-testid="input-share-url" />
                <Button variant="outline" size="sm" onClick={() => handleCopy(data.link.shareUrl)} data-testid="button-copy-link">
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

      <Card data-testid="card-achievement-badges">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </CardTitle>
          <CardDescription>Unlock badges as you grow your affiliate business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {BADGES.map(badge => {
              const earned = badge.check()
              const BadgeIcon = badge.icon
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-lg border text-center transition-all ${earned ? 'border-primary/40 bg-primary/5' : 'border-muted bg-muted/20 opacity-50'}`}
                  data-testid={`badge-${badge.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${earned ? 'bg-primary/10' : 'bg-muted'}`}>
                    <BadgeIcon className={`h-5 w-5 ${earned ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-xs font-medium">{badge.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                  {earned && (
                    <Badge variant="default" className="text-[10px] mt-1.5 px-1.5 py-0">Earned</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderReferrals = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-referrals-heading">Referrals ({data.referrals.length})</h2>
        <div className="flex gap-2">
          <Select value={referralFilter} onValueChange={setReferralFilter}>
            <SelectTrigger className="h-8 text-xs w-[120px]" data-testid="select-referral-filter">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="signed_up">Signed Up</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={referralSort} onValueChange={(v: 'newest' | 'oldest') => setReferralSort(v)}>
            <SelectTrigger className="h-8 text-xs w-[100px]" data-testid="select-referral-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-referrals">
              <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {referralFilter === 'all' ? 'No referrals yet. Share your link to get started!' : `No ${referralFilter.replace('_', ' ')} referrals found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReferrals.map(ref => (
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance by Source</CardTitle>
          <CardDescription>See which campaigns and channels drive your referrals</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(sourceBreakdown).length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-sources">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No source data yet. Add a source tag (e.g. ?src=youtube) to your links.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(sourceBreakdown)
                .sort(([, a], [, b]) => b.referrals - a.referrals)
                .map(([tag, srcData]) => (
                  <div key={tag} className="flex items-center justify-between p-3 rounded-md border" data-testid={`source-${tag}`}>
                    <Badge variant="outline" className="text-xs font-mono">{tag}</Badge>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{srcData.referrals} signup{srcData.referrals !== 1 ? 's' : ''}</span>
                      <span className="text-muted-foreground">{srcData.converted} converted</span>
                      <span className="font-medium">
                        {srcData.referrals > 0 ? Math.round((srcData.converted / srcData.referrals) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderEarnings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-earnings-heading">Earnings ({data.commissions.length})</h2>
        <div className="flex gap-2">
          <Select value={earningsFilter} onValueChange={setEarningsFilter}>
            <SelectTrigger className="h-8 text-xs w-[120px]" data-testid="select-earnings-filter">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={earningsSort} onValueChange={(v: 'newest' | 'oldest') => setEarningsSort(v)}>
            <SelectTrigger className="h-8 text-xs w-[100px]" data-testid="select-earnings-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Pending</span>
            <p className="text-xl font-bold mt-1">${(data.stats.pendingEarnings / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Approved</span>
            <p className="text-xl font-bold mt-1">${(data.stats.approvedEarnings / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Paid Out</span>
            <p className="text-xl font-bold mt-1">${(data.stats.paidEarnings / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Min Payout</span>
            <p className="text-xl font-bold mt-1">${(data.settings.minPayoutCents / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {filteredCommissions.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-commissions">
              <DollarSign className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {earningsFilter === 'all' ? 'No commissions yet. When your referrals pay, you earn!' : `No ${earningsFilter} commissions.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCommissions.map(com => (
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
        </CardContent>
      </Card>
    </div>
  )

  const renderPayouts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-payouts-heading">Payouts ({data.payouts.length})</h2>
        <Select value={payoutSort} onValueChange={(v: 'newest' | 'oldest') => setPayoutSort(v)}>
          <SelectTrigger className="h-8 text-xs w-[100px]" data-testid="select-payout-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4">
          {sortedPayouts.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-payouts">
              <CheckCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payouts yet. Once your balance reaches the minimum, payouts will be processed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedPayouts.map(payout => (
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
    </div>
  )

  const renderAssets = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" data-testid="text-assets-heading">Marketing Materials</h2>
      <p className="text-sm text-muted-foreground -mt-2">Ready-to-use assets to help you promote and earn more</p>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="pt-4">
            <div className="text-center py-8" data-testid="text-no-assets">
              <FileImage className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No marketing assets available yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assets.map(asset => {
            const Icon = ASSET_TYPE_ICONS[asset.asset_type] || FileText
            return (
              <Card key={asset.id} data-testid={`asset-${asset.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{asset.title}</p>
                        {asset.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{asset.description}</p>
                        )}
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                          {asset.asset_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {asset.content && (
                        <Button variant="outline" size="sm" onClick={() => handleCopy(asset.content!, asset.id)} data-testid={`button-copy-asset-${asset.id}`}>
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderTools = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" data-testid="text-tools-heading">Affiliate Tools</h2>

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
                <Input className="mt-2" placeholder="/your/custom/path" value={customPath} onChange={e => setCustomPath(e.target.value)} data-testid="input-custom-path" />
              )}
            </div>
            <div>
              <Label className="text-xs">Source Tag (optional)</Label>
              <Input className="mt-1" placeholder="e.g. youtube-review, newsletter-jan" value={sourceTag} onChange={e => setSourceTag(e.target.value)} data-testid="input-source-tag" />
              <p className="text-[10px] text-muted-foreground mt-1">Track which campaigns drive your conversions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input type="checkbox" id="utm-toggle" checked={includeUtm} onChange={e => setIncludeUtm(e.target.checked)} className="rounded" data-testid="checkbox-utm" />
            <Label htmlFor="utm-toggle" className="text-xs cursor-pointer">Include UTM parameters (for Google Analytics)</Label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input value={generateDeepLink()} readOnly className="font-mono text-xs" data-testid="input-deep-link-result" />
            <Button variant="outline" size="sm" onClick={handleCopyDeepLink} data-testid="button-copy-deep-link">
              {copiedDeepLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-qr-code">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code
          </CardTitle>
          <CardDescription>Generate a QR code for your referral link — great for events, business cards, and presentations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg" data-testid="qr-code-container">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.link.shareUrl)}`}
                alt="Referral QR Code"
                className="w-48 h-48"
                data-testid="img-qr-code"
              />
            </div>
            <Button variant="outline" size="sm" asChild data-testid="button-download-qr">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(data.link.shareUrl)}`}
                download="referral-qr-code.png"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" /> Download QR Code
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-saved-presets">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Link Presets
          </CardTitle>
          <CardDescription>Save your frequently used link configurations for quick access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name (e.g. Newsletter CTA)" className="flex-1" data-testid="input-preset-name" />
            <Button size="sm" onClick={saveLinkPreset} disabled={!presetName.trim()} data-testid="button-save-preset">
              <Bookmark className="h-4 w-4 mr-1" /> Save Current
            </Button>
          </div>
          {linkPresets.length > 0 ? (
            <div className="space-y-1.5">
              {linkPresets.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 text-sm" data-testid={`preset-${p.id}`}>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p.page_path}{p.source_tag ? ` (${p.source_tag})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => loadLinkPreset(p)} data-testid={`button-load-preset-${p.id}`}>
                      Load
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => deleteLinkPreset(p.id)} data-testid={`button-delete-preset-${p.id}`}>
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">No presets saved yet. Configure a link above and save it.</p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-discount-code">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Your Promo Code
          </CardTitle>
          <CardDescription>Share your personal discount code with potential customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {discountCodes.length > 0 ? (
            <div className="space-y-2">
              {discountCodes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40" data-testid={`discount-code-${code.id}`}>
                  <div>
                    <span className="font-mono font-bold text-lg">{code.code}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">{code.discount_percent}% off</Badge>
                      {code.is_active ? (
                        <Badge variant="outline" className="text-xs text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                      )}
                      {code.current_uses !== undefined && (
                        <span className="text-xs text-muted-foreground">{code.current_uses} uses</span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(code.code); toast({ title: 'Copied!', description: 'Promo code copied to clipboard.' }) }} data-testid={`button-copy-code-${code.id}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">You don't have a promo code yet. Request one below!</p>
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <Label className="text-xs font-medium">Request a Custom Code</Label>
            <p className="text-[10px] text-muted-foreground">Choose your own code name (e.g. STEELE40, MYSAVINGS). Admin will review and activate it.</p>
            <div className="flex gap-2">
              <Input value={newCodeRequest} onChange={e => setNewCodeRequest(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="YOUR_CODE" maxLength={20} className="font-mono flex-1" data-testid="input-code-request" />
              <Button size="sm" onClick={submitCodeRequest} disabled={codeRequestSubmitting || !newCodeRequest.trim()} data-testid="button-submit-code-request">
                {codeRequestSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request'}
              </Button>
            </div>
          </div>

          {codeRequests.length > 0 && (
            <div className="border-t pt-3 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Your Requests</Label>
              {codeRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/30" data-testid={`code-request-${r.id}`}>
                  <span className="font-mono">{r.requested_code}</span>
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs capitalize">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-social-sharing">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Social Sharing
          </CardTitle>
          <CardDescription>Share your referral link directly to social platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-twitter">
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${appName}! ${data.link.shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Twitter / X
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-facebook">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.link.shareUrl)}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Facebook
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-linkedin">
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.link.shareUrl)}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> LinkedIn
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-email">
              <a href={`mailto:?subject=${encodeURIComponent(`Check out ${appName}`)}&body=${encodeURIComponent(`I've been using ${appName} and thought you'd love it too!\n\n${data.link.shareUrl}`)}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Email
              </a>
            </Button>
          </div>
          <div className="mt-3 p-3 rounded-md bg-muted/40">
            <Label className="text-xs text-muted-foreground mb-1 block">Quick Copy Text</Label>
            <p className="text-xs mb-2">Check out {appName}! Sign up with my link for a special offer: {data.link.shareUrl}</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(`Check out ${appName}! Sign up with my link for a special offer: ${data.link.shareUrl}`); toast({ title: 'Copied!', description: 'Sharing text copied to clipboard.' }) }} data-testid="button-copy-share-text">
              <Copy className="h-3 w-3 mr-1" /> Copy Text
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnnouncements = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" data-testid="text-announcements-heading">News & Notifications</h2>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-4">
            <div className="text-center py-8" data-testid="text-no-notifications">
              <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet. You'll see updates here when things happen.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={!n.read ? 'border-primary/30' : ''} data-testid={`notification-${n.id}`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const updateProfile = (field: string, value: any) => {
    setProfile(p => ({ ...p, [field]: value }))
  }

  const renderAccount = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-account-heading">Account Settings</h2>
        <Button onClick={saveProfile} disabled={profileSaving} size="sm" data-testid="button-save-profile">
          {profileSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{userEmail}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Referral Code</Label>
              <p className="text-sm font-mono">{data.link.ref_code}</p>
            </div>
          </div>
          {data.tier.current && (
            <div>
              <Label className="text-xs text-muted-foreground">Current Tier</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">{data.tier.current.name}</Badge>
                <Badge variant="outline" className="text-xs">{data.stats.effectiveRate}% commission</Badge>
              </div>
            </div>
          )}
          <div className="pt-2 border-t">
            <Link href="/affiliate/set-password">
              <Button variant="outline" size="sm" className="justify-start" data-testid="button-change-password">
                <Lock className="h-4 w-4 mr-2" /> Change Password
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your public display name and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input value={profile.display_name || ''} onChange={e => updateProfile('display_name', e.target.value)} placeholder="How you appear on leaderboards" className="mt-1" data-testid="input-display-name" />
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input value={profile.website || ''} onChange={e => updateProfile('website', e.target.value)} placeholder="https://yoursite.com" className="mt-1" data-testid="input-website" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={profile.phone || ''} onChange={e => updateProfile('phone', e.target.value)} placeholder="(555) 123-4567" className="mt-1" data-testid="input-phone" />
          </div>
          <div>
            <Label className="text-xs">Short Bio</Label>
            <Input value={profile.bio || ''} onChange={e => updateProfile('bio', e.target.value)} placeholder="Tell us a little about yourself and how you promote products" className="mt-1" data-testid="input-bio" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mailing Address</CardTitle>
          <CardDescription>Used for tax documents and correspondence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Legal Name (for tax documents)</Label>
            <Input value={profile.legal_name || ''} onChange={e => updateProfile('legal_name', e.target.value)} placeholder="Full legal name" className="mt-1" data-testid="input-legal-name" />
          </div>
          <div>
            <Label className="text-xs">Address Line 1</Label>
            <Input value={profile.address_line1 || ''} onChange={e => updateProfile('address_line1', e.target.value)} placeholder="123 Main St" className="mt-1" data-testid="input-address1" />
          </div>
          <div>
            <Label className="text-xs">Address Line 2</Label>
            <Input value={profile.address_line2 || ''} onChange={e => updateProfile('address_line2', e.target.value)} placeholder="Apt, Suite, Unit (optional)" className="mt-1" data-testid="input-address2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input value={profile.city || ''} onChange={e => updateProfile('city', e.target.value)} className="mt-1" data-testid="input-city" />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input value={profile.state || ''} onChange={e => updateProfile('state', e.target.value)} className="mt-1" data-testid="input-state" />
            </div>
            <div>
              <Label className="text-xs">Postal Code</Label>
              <Input value={profile.postal_code || ''} onChange={e => updateProfile('postal_code', e.target.value)} className="mt-1" data-testid="input-postal" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Country</Label>
            <Input value={profile.country || 'US'} onChange={e => updateProfile('country', e.target.value)} className="mt-1" data-testid="input-country" />
          </div>
          <div>
            <Label className="text-xs">Tax ID (SSN/EIN for US affiliates)</Label>
            <Input value={profile.tax_id || ''} onChange={e => updateProfile('tax_id', e.target.value)} placeholder="XXX-XX-XXXX" type="password" className="mt-1" data-testid="input-tax-id" />
            <p className="text-[10px] text-muted-foreground mt-1">Required for 1099 tax reporting if you earn over $600/year</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Preferences</CardTitle>
          <CardDescription>How you'd like to receive your earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Payout Method</Label>
            <Select value={profile.payout_method || 'paypal'} onValueChange={v => updateProfile('payout_method', v)}>
              <SelectTrigger className="mt-1" data-testid="select-payout-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(profile.payout_method === 'paypal' || !profile.payout_method) && (
            <div>
              <Label className="text-xs">PayPal Email</Label>
              <Input value={profile.payout_email || ''} onChange={e => updateProfile('payout_email', e.target.value)} placeholder="your-paypal@email.com" className="mt-1" data-testid="input-payout-email" />
            </div>
          )}

          {profile.payout_method === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Bank Name</Label>
                <Input value={profile.payout_bank_name || ''} onChange={e => updateProfile('payout_bank_name', e.target.value)} className="mt-1" data-testid="input-bank-name" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Routing Number</Label>
                  <Input value={profile.payout_bank_routing || ''} onChange={e => updateProfile('payout_bank_routing', e.target.value)} type="password" className="mt-1" data-testid="input-bank-routing" />
                </div>
                <div>
                  <Label className="text-xs">Account Number</Label>
                  <Input value={profile.payout_bank_account || ''} onChange={e => updateProfile('payout_bank_account', e.target.value)} type="password" className="mt-1" data-testid="input-bank-account" />
                </div>
              </div>
            </div>
          )}

          {profile.payout_method === 'check' && (
            <p className="text-xs text-muted-foreground">Checks will be mailed to the address above. Please ensure your mailing address is up to date.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports & Downloads</CardTitle>
          <CardDescription>Download your earnings data and tax documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-download-performance-report"
            onClick={() => {
              const csv = ['Date,Type,Amount,Status']
              data.commissions.forEach(c => {
                csv.push(`${new Date(c.created_at).toLocaleDateString()},commission,$${(c.commission_amount_cents / 100).toFixed(2)},${c.status}`)
              })
              data.payouts.forEach(p => {
                csv.push(`${new Date(p.created_at).toLocaleDateString()},payout,$${(p.amount_cents / 100).toFixed(2)},${p.status}`)
              })
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `affiliate-report-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
              toast({ title: 'Downloaded', description: 'Your report has been downloaded.' })
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Performance Report (CSV)
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-download-tax-summary"
            onClick={() => {
              const lines = [
                `Tax Summary - ${new Date().getFullYear()}`,
                `Generated: ${new Date().toLocaleDateString()}`,
                '',
                `Legal Name: ${profile.legal_name || 'Not provided'}`,
                `Address: ${[profile.address_line1, profile.address_line2, profile.city, profile.state, profile.postal_code, profile.country].filter(Boolean).join(', ') || 'Not provided'}`,
                `Tax ID: ${profile.tax_id ? '****' + profile.tax_id.slice(-4) : 'Not provided'}`,
                '',
                `Total Paid: $${(data.stats.paidEarnings / 100).toFixed(2)}`,
                `Total Pending: $${(data.stats.pendingEarnings / 100).toFixed(2)}`,
                `Total Approved: $${(data.stats.approvedEarnings / 100).toFixed(2)}`,
                `Total Earnings: $${(data.stats.totalEarnings / 100).toFixed(2)}`,
              ]
              const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `tax-summary-${new Date().getFullYear()}.txt`
              a.click()
              URL.revokeObjectURL(url)
              toast({ title: 'Downloaded', description: 'Your tax summary has been downloaded.' })
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Tax Summary (1099-ready)
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderSupport = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" data-testid="text-support-heading">Help & Support</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>As an affiliate partner, you agree to promote {appName} ethically and in accordance with our program guidelines.</p>
          <div className="space-y-2">
            <div className="p-3 rounded-md bg-muted/50">
              <p className="font-medium text-foreground text-xs mb-1">Commission Structure</p>
              <p className="text-xs">You earn a commission on every paying customer you refer. Commission rates are based on your tier level and may include locked-in rates from your acceptance terms.</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <p className="font-medium text-foreground text-xs mb-1">Payouts</p>
              <p className="text-xs">Payouts are processed once your approved balance reaches the minimum threshold (${(data.settings.minPayoutCents / 100).toFixed(2)}). Payouts are reviewed and processed by our team.</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <p className="font-medium text-foreground text-xs mb-1">Prohibited Activities</p>
              <p className="text-xs">Self-referrals, misleading claims, spam, and cookie stuffing are strictly prohibited and may result in account termination.</p>
            </div>
            <div className="p-3 rounded-md bg-muted/50">
              <p className="font-medium text-foreground text-xs mb-1">Need Help?</p>
              <p className="text-xs">Contact us at support@{appName.toLowerCase().replace(/\s+/g, '')}.com for any questions about the affiliate program.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard Tour</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => { setTourStep(0); setShowTour(true) }} data-testid="button-retake-tour">
            <HelpCircle className="h-4 w-4 mr-2" /> Take the Dashboard Tour
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const TOUR_STEPS = [
    {
      title: 'Welcome to Your Dashboard!',
      description: 'This is your affiliate home base. Here you can see your stats, earnings, referrals, and everything you need to promote successfully.',
      icon: LayoutDashboard,
    },
    {
      title: 'Your Referral Link',
      description: 'Copy your unique referral link and share it anywhere — social media, blog posts, emails, or conversations. When someone signs up through your link, you earn commissions!',
      icon: Link2,
    },
    {
      title: 'Track Your Earnings',
      description: 'Head to the Earnings tab to see every commission you\'ve earned. Commissions go from Pending → Approved → Paid as they\'re processed.',
      icon: DollarSign,
    },
    {
      title: 'Marketing & Tools',
      description: 'Use the Tools section to create deep links to specific pages, generate QR codes, save link presets, request a personal promo code, and share on social media.',
      icon: Zap,
    },
    {
      title: 'How Payouts Work',
      description: 'Once your approved earnings reach the minimum payout threshold, they\'ll be batched and sent to you via your chosen payment method. Set up your payout preferences in Account Settings.',
      icon: Receipt,
    },
    {
      title: 'You\'re All Set!',
      description: 'Start by sharing your referral link. You can always revisit this tour from the Support section. Happy promoting!',
      icon: Trophy,
    },
  ]

  useEffect(() => {
    if (!loading && !profileLoading && profile && !profile.tour_completed && data) {
      const hasSeenTour = localStorage.getItem('affiliate_tour_completed')
      if (!hasSeenTour) {
        setShowTour(true)
      }
    }
  }, [loading, profileLoading, profile, data])

  const completeTour = () => {
    setShowTour(false)
    setTourStep(0)
    localStorage.setItem('affiliate_tour_completed', 'true')
    fetch('/api/affiliate/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tour_completed: true }),
    }).catch(() => {})
  }

  const BADGES = [
    { id: 'first_referral', label: 'First Referral', icon: Users, description: 'Got your first referral signup', check: () => data.stats.totalReferrals >= 1 },
    { id: 'first_commission', label: 'First Dollar', icon: DollarSign, description: 'Earned your first commission', check: () => data.stats.totalEarnings > 0 },
    { id: 'five_referrals', label: 'Growing Network', icon: TrendingUp, description: 'Reached 5 referrals', check: () => data.stats.totalReferrals >= 5 },
    { id: 'ten_referrals', label: 'Super Referrer', icon: Award, description: 'Reached 10 referrals', check: () => data.stats.totalReferrals >= 10 },
    { id: 'first_payout', label: 'Payday', icon: Receipt, description: 'Received your first payout', check: () => data.payouts.some((p: any) => p.status === 'completed') },
    { id: 'hundred_clicks', label: 'Traffic Driver', icon: MousePointerClick, description: '100+ clicks on your link', check: () => data.stats.clicks >= 100 },
    { id: 'profile_complete', label: 'Profile Pro', icon: Settings, description: 'Completed your profile', check: () => profile.display_name && profile.payout_method },
  ]

  const renderSection = () => {
    switch (section) {
      case 'overview': return renderOverview()
      case 'referrals': return renderReferrals()
      case 'earnings': return renderEarnings()
      case 'payouts': return renderPayouts()
      case 'assets': return renderAssets()
      case 'tools': return renderTools()
      case 'announcements': return renderAnnouncements()
      case 'account': return renderAccount()
      case 'support': return renderSupport()
      default: return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-affiliate-dashboard">
      <header className="border-b bg-muted/30 sticky top-0 z-30">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              data-testid="button-mobile-nav"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileNavOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
            <Link href="/affiliate" className="font-semibold text-black dark:text-white" data-testid="link-affiliate-home">
              {appName} Affiliates
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('announcements')}
              className="relative p-2 rounded-md hover:bg-muted"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:sticky top-14 left-0 z-20
          w-56 h-[calc(100vh-3.5rem)] bg-background border-r
          transition-transform duration-200 ease-in-out
          overflow-y-auto
        `}>
          <nav className="p-3 space-y-1" data-testid="nav-affiliate-sidebar">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = section === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                  data-testid={`nav-${item.key}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {item.key === 'announcements' && unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">{unreadCount}</Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 bg-black/30 z-10 lg:hidden" onClick={() => setMobileNavOpen(false)} />
        )}

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 max-w-4xl">
          {renderSection()}
        </main>
      </div>

      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="tour-overlay">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardContent className="pt-6 pb-4">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  {(() => {
                    const StepIcon = TOUR_STEPS[tourStep].icon
                    return <StepIcon className="h-7 w-7 text-primary" />
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{TOUR_STEPS[tourStep].title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{TOUR_STEPS[tourStep].description}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-2">
                  {TOUR_STEPS.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === tourStep ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={completeTour} data-testid="button-skip-tour">
                    Skip Tour
                  </Button>
                  <div className="flex gap-2">
                    {tourStep > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setTourStep(s => s - 1)} data-testid="button-tour-back">
                        Back
                      </Button>
                    )}
                    {tourStep < TOUR_STEPS.length - 1 ? (
                      <Button size="sm" onClick={() => setTourStep(s => s + 1)} data-testid="button-tour-next">
                        Next
                      </Button>
                    ) : (
                      <Button size="sm" onClick={completeTour} data-testid="button-tour-finish">
                        Get Started
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
