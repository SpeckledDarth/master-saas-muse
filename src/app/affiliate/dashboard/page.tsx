'use client'

const S = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch { return '[object]' }
  }
  return String(v)
}
const N = (v: unknown): number => {
  if (typeof v === 'number' && !isNaN(v)) return v
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n }
  return 0
}

if (typeof window !== 'undefined' && !(window as any).__CONSOLE_PATCHED__) {
  (window as any).__CONSOLE_PATCHED__ = true
  const _origErr = console.error
  console.error = function (...args: any[]) {
    try {
      const full = args.map((a: any) => {
        if (a === null || a === undefined) return String(a)
        if (typeof a === 'string') return a
        if (a instanceof Error) return `Error: ${a.message}\n${a.stack || ''}`
        try { return JSON.stringify(a, null, 2) } catch { return String(a) }
      }).join(' | ')
      if (full.includes('Objects are not valid') || full.includes('object with keys') || full.includes('#310') || full.includes('not valid as a React child')) {
        (window as any).__REACT_FULL_ERROR__ = full
      }
      const prev = (window as any).__REACT_ALL_ERRORS__ || []
      if (prev.length < 20) {
        prev.push({ ts: Date.now(), msg: full.substring(0, 3000) })
        ;(window as any).__REACT_ALL_ERRORS__ = prev
      }
    } catch {}
    _origErr.apply(console, args)
  }
  window.addEventListener('error', (event) => {
    try {
      const msg = event.error?.message || event.message || ''
      const stack = event.error?.stack || ''
      const detail = `[window.error] ${msg}\nFile: ${event.filename || 'unknown'}:${event.lineno}:${event.colno}\nStack: ${stack}`
      ;(window as any).__REACT_FULL_ERROR__ = ((window as any).__REACT_FULL_ERROR__ || '') + '\n---\n' + detail
      const prev = (window as any).__REACT_ALL_ERRORS__ || []
      if (prev.length < 20) {
        prev.push({ ts: Date.now(), msg: detail.substring(0, 3000) })
        ;(window as any).__REACT_ALL_ERRORS__ = prev
      }
    } catch {}
  })
}

import { useState, useEffect, useCallback, Suspense, useRef, useMemo, Component, type ErrorInfo, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/use-settings'
import { DSCard as Card, DSCardContent as CardContent, DSCardDescription as CardDescription, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
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
  Bell, Bookmark, Download, QrCode, Key, Trash2, Eye, EyeOff, Globe, Palette,
  Webhook, Send, AlertTriangle, RefreshCw, MessageSquare,
  ChevronDown, ChevronRight, Briefcase, UserCheck, UserX, CircleDot,
  GripVertical, Plus, RotateCcw, X, Pencil,
  Youtube, Play, ThumbsUp, MessageCircle, ArrowRight, Activity,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EarningsGoalSetter, CommissionDisputes, ReferralOfMonth, GracePeriodNotice, AffiliateManagerCard } from '@/components/affiliate/partner-experience'
import { LinkShortener, QRCodeGenerator, MediaKitPage, CopyPasteCaptions, StarterKit } from '@/components/affiliate/marketing-toolkit'
import { ExpandedAnalyticsSection } from '@/components/affiliate/analytics-expanded'
import { FlywheelAnalyticsSection } from '@/components/affiliate/flywheel-analytics'
import { FlywheelReportsSection } from '@/components/affiliate/flywheel-reports'
import { EarningsProjectionsPanel, PayoutHistoryPanel, TaxCenterPanel, CommissionRenewalStatsPanel, BulkRenewalButton } from '@/components/affiliate/retention-tools'
import { KnowledgeBasePanel, SwipeFileLibrary, PromotionalCalendarPanel, TopPerformerBadge, AssetUsageBadge } from '@/components/affiliate/resource-center'
import { WeeklyChallengesPanel, CaseStudyLibrary, PromotionQuizPanel, AudienceAnalyzerPanel, AffiliateDirectoryPreview } from '@/components/affiliate/delight-features'

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
    twoTierEnabled?: boolean
    secondTierCommissionRate?: number
  }
  secondTierCommissions?: Array<{
    id: string
    tier2_affiliate_id: string
    commission_rate: number
    commission_amount_cents: number
    created_at: string
  }>
  secondTierTotal?: number
  nextMilestone?: {
    name: string
    referralThreshold: number
    bonusAmountCents: number
    referralsAway: number
    progress: number
  } | null
  payoutSchedule?: {
    scheduleDay: number
    nextPayoutDate: string
    pendingAmountCents: number
    minPayoutCents: number
    meetsMinimum: boolean
  } | null
  tierPromotionCelebration?: {
    tierName: string
    commissionRate: number
  } | null
}

interface MarketingAsset {
  id: string
  title: string
  description: string | null
  asset_type: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
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
  faq: HelpCircle,
  video_tutorial: FileImage,
  best_practice: Bookmark,
  guide: FileText,
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  banner: 'Banner Image',
  email_template: 'Email Template',
  social_post: 'Social Post',
  text_snippet: 'Text Snippet',
  video: 'Video',
  case_study: 'Case Study',
  one_pager: 'One-Pager / PDF',
  swipe_file: 'Swipe File',
  landing_page: 'Landing Page',
  faq: 'FAQ',
  video_tutorial: 'Video Tutorial',
  best_practice: 'Best Practice',
  guide: 'Guide',
}

const DEEP_LINK_PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Features', path: '/features' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
]

type DashboardSection = 'overview' | 'analytics' | 'referrals' | 'earnings' | 'payouts' | 'assets' | 'tools' | 'announcements' | 'messages' | 'account' | 'support'

type WidgetId = 'share_link' | 'live_earnings' | 'quick_stats' | 'tier_progress' | 'milestone_progress' | 'active_contests' | 'earnings_forecast' | 'leaderboard' | 'conversion_funnel' | 'ai_coach' | 'content_analytics' | 'achievements' | 'milestone_countdown' | 'payout_schedule' | 'tier_celebration'

interface WidgetConfig {
  id: WidgetId
  label: string
  icon: any
}

const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: 'share_link', label: 'Referral Link', icon: Link2 },
  { id: 'live_earnings', label: 'Live Earnings', icon: Zap },
  { id: 'quick_stats', label: 'Quick Stats', icon: BarChart3 },
  { id: 'tier_progress', label: 'Tier Progress', icon: Award },
  { id: 'milestone_progress', label: 'Milestone Bonuses', icon: Target },
  { id: 'active_contests', label: 'Active Contests', icon: Calendar },
  { id: 'earnings_forecast', label: 'Earnings Forecast', icon: TrendingUp },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'conversion_funnel', label: 'Conversion Funnel', icon: BarChart3 },
  { id: 'ai_coach', label: 'AI Coach', icon: Zap },
  { id: 'content_analytics', label: 'Content Analytics', icon: BarChart3 },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'milestone_countdown', label: 'Milestone Countdown', icon: Target },
  { id: 'payout_schedule', label: 'Payout Schedule', icon: Calendar },
  { id: 'tier_celebration', label: 'Tier Celebration', icon: Award },
]

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'share_link', 'tier_celebration', 'milestone_countdown', 'payout_schedule',
  'live_earnings', 'quick_stats', 'tier_progress',
  'milestone_progress', 'active_contests', 'earnings_forecast',
  'leaderboard', 'conversion_funnel', 'ai_coach', 'content_analytics', 'achievements',
]

const LAYOUT_STORAGE_KEY = 'affiliate_dashboard_layout'

interface DashboardLayout {
  order: WidgetId[]
  hidden: WidgetId[]
}

function loadDashboardLayout(): DashboardLayout {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.order && Array.isArray(parsed.order)) {
        const allIds = new Set(DEFAULT_WIDGET_ORDER)
        const validOrder = parsed.order.filter((id: string) => allIds.has(id as WidgetId))
        const missing = DEFAULT_WIDGET_ORDER.filter(id => !validOrder.includes(id))
        return {
          order: [...validOrder, ...missing] as WidgetId[],
          hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((id: string) => allIds.has(id as WidgetId)) : [],
        }
      }
    }
  } catch {}
  return { order: [...DEFAULT_WIDGET_ORDER], hidden: [] }
}

function saveDashboardLayout(layout: DashboardLayout) {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
  } catch {}
}

const NAV_ITEMS: { key: DashboardSection; label: string; icon: any }[] = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'referrals', label: 'Referrals', icon: Users },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'payouts', label: 'Payouts', icon: Receipt },
  { key: 'assets', label: 'Resources', icon: Bookmark },
  { key: 'tools', label: 'Tools', icon: Link2 },
  { key: 'announcements', label: 'News', icon: Megaphone },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'account', label: 'Account', icon: Settings },
  { key: 'support', label: 'Support', icon: HelpCircle },
]

class WidgetErrorBoundary extends Component<{ widgetId: string; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { widgetId: string; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Widget "${this.props.widgetId}" render error:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-destructive">Widget &quot;{this.props.widgetId}&quot; failed to render</p>
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => this.setState({ hasError: false })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}

class SectionErrorBoundary extends Component<{ sectionName: string; children: ReactNode }, { hasError: boolean; error: Error | null; componentStack: string | null }> {
  constructor(props: { sectionName: string; children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SECTION CRASH] "${this.props.sectionName}":`, error.message, '\nComponent Stack:', errorInfo.componentStack)
    this.setState({ componentStack: errorInfo.componentStack || null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 pb-3 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-sm font-medium text-destructive mb-1">Section &quot;{this.props.sectionName}&quot; crashed</p>
            <p className="text-xs text-muted-foreground mb-2">{this.state.error?.message || 'Unknown error'}</p>
            {this.state.componentStack && (
              <details className="text-left mb-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">Component Stack</summary>
                <pre className="text-[10px] font-mono text-muted-foreground mt-1 overflow-auto max-h-32 whitespace-pre-wrap">{this.state.componentStack}</pre>
              </details>
            )}
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => this.setState({ hasError: false, error: null, componentStack: null })}>
              Retry Section
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}

function LazySectionComponent({ renderFn }: { renderFn: () => ReactNode }) {
  try {
    const result = renderFn()
    return <>{result}</>
  } catch (e: any) {
    console.error('[LAZY_SECTION_CRASH]', e?.message, e?.stack)
    return (
      <Card className="border-destructive/30">
        <CardContent className="pt-4 pb-3 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
          <p className="text-sm font-medium text-destructive mb-1">Section render error</p>
          <p className="text-xs text-muted-foreground">{String(e?.message || e)}</p>
        </CardContent>
      </Card>
    )
  }
}

function deepScanForObjects(obj: any, path: string, results: string[]): void {
  if (results.length > 20) return
  if (obj === null || obj === undefined) return
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj)) {
      const p = `${path}.${key}`
      if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
        const isDate = val instanceof Date
        if (!isDate) {
          results.push(`${p} = object{${Object.keys(val).join(',')}}`)
        }
      }
      if (typeof val === 'object' && val !== null) {
        deepScanForObjects(val, p, results)
      }
    }
  } else if (Array.isArray(obj)) {
    obj.slice(0, 3).forEach((item, i) => {
      deepScanForObjects(item, `${path}[${i}]`, results)
    })
  }
}

class SafeZone extends Component<{ name: string; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { name: string; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) {
    console.error(`[SafeZone "${this.props.name}" crash]`, error.message)
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-2 text-xs text-destructive bg-destructive/10 rounded">{this.props.name} failed to render</div>
    }
    return this.props.children
  }
}

class DashboardErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; componentStack: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Affiliate Dashboard Error:', error.message)
    this.setState({ componentStack: errorInfo.componentStack || null })
  }

  render() {
    if (this.state.hasError) {
      const decodedError = this.state.error?.message || 'Unknown error'

      let fullReactError: string | null = null
      let allErrors: string | null = null
      try {
        fullReactError = (typeof window !== 'undefined' && (window as any).__REACT_FULL_ERROR__) || null
        const errs = (typeof window !== 'undefined' && (window as any).__REACT_ALL_ERRORS__) || []
        if (errs.length > 0) allErrors = errs.map((e: any) => `[${new Date(e.ts).toISOString()}] ${e.msg}`).join('\n\n---\n\n')
      } catch {}

      let diagnosticInfo: string | null = null
      let objectScanResults: string | null = null
      try {
        const diag = (typeof window !== 'undefined' && (window as any).__DASHBOARD_DIAGNOSTIC__) || null
        if (diag) {
          diagnosticInfo = JSON.stringify(diag, null, 2)
          const objFindings: string[] = []
          deepScanForObjects(diag, 'state', objFindings)
          if (objFindings.length > 0) objectScanResults = objFindings.join('\n')
        }
      } catch {}

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive" />
                <h2 className="text-xl font-bold mb-2" data-testid="text-dashboard-error">Dashboard Error</h2>
                <p className="text-sm text-muted-foreground mb-4">Something went wrong loading the dashboard.</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 mb-4 overflow-auto max-h-[80vh]">
                <p className="text-xs font-bold mb-1">Minified Error:</p>
                <p className="text-xs font-mono text-destructive break-all" data-testid="text-error-detail">
                  {decodedError}
                </p>
                {fullReactError && (
                  <>
                    <p className="text-xs font-bold mt-3 mb-1 text-destructive">FULL React Error (captured from console):</p>
                    <pre className="text-xs font-mono text-destructive break-all whitespace-pre-wrap border border-destructive/30 rounded p-2 bg-destructive/5 dark:bg-destructive/10">{fullReactError}</pre>
                  </>
                )}
                {objectScanResults && (
                  <>
                    <p className="text-xs font-bold mt-3 mb-1 text-[hsl(var(--warning))]">Objects Found in State:</p>
                    <pre className="text-xs font-mono text-[hsl(var(--warning))] break-all whitespace-pre-wrap">{objectScanResults}</pre>
                  </>
                )}
                {this.state.componentStack && (
                  <>
                    <p className="text-xs font-bold mt-3 mb-1">React Component Stack:</p>
                    <pre className="text-[10px] font-mono text-muted-foreground break-all whitespace-pre-wrap">
                      {this.state.componentStack}
                    </pre>
                  </>
                )}
                {allErrors && (
                  <details className="mt-3">
                    <summary className="text-xs font-bold cursor-pointer">All Captured console.error Logs ({((typeof window !== 'undefined' && (window as any).__REACT_ALL_ERRORS__) || []).length})</summary>
                    <pre className="text-[10px] font-mono text-muted-foreground break-all whitespace-pre-wrap mt-1 max-h-60 overflow-auto">{allErrors}</pre>
                  </details>
                )}
                {diagnosticInfo && (
                  <details className="mt-3">
                    <summary className="text-xs font-bold cursor-pointer">Full State Dump</summary>
                    <pre className="text-[10px] font-mono text-muted-foreground break-all whitespace-pre-wrap mt-1 max-h-40 overflow-auto">{diagnosticInfo}</pre>
                  </details>
                )}
              </div>
              <Button className="w-full" onClick={() => this.setState({ hasError: false, error: null, componentStack: null })} data-testid="button-retry-dashboard">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}

export default function StandaloneAffiliateDashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <StandaloneAffiliateDashboard />
      </Suspense>
    </DashboardErrorBoundary>
  )
}

function StandaloneAffiliateDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings: appSettings } = useSettings()
  const appName = S(appSettings?.branding?.appName) || 'Our Product'

  const initialSection = (searchParams.get('section') as DashboardSection) || 'overview'
  const [section, setSection] = useState<DashboardSection>(initialSection)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [authChecking, setAuthChecking] = useState(true)
  const [isAdminViewer, setIsAdminViewer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AffiliateDashboardData | null>(null)
  const [assets, setAssets] = useState<MarketingAsset[]>([])
  const [copied, setCopied] = useState(false)
  const [copiedAsset, setCopiedAsset] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [earnings, setEarnings] = useState<{ today: number; thisWeek: number; thisMonth: number; allTime: number } | null>(null)
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'thisWeek' | 'thisMonth'>('today')
  const [milestoneData, setMilestoneData] = useState<{ milestones: any[]; currentReferrals: number; totalBonusEarned: number } | null>(null)

  const [assetTypeFilter, setAssetTypeFilter] = useState('all')
  const [assetSearch, setAssetSearch] = useState('')

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

  const [taxInfo, setTaxInfo] = useState<Record<string, any> | null>(null)
  const [taxInfoLoading, setTaxInfoLoading] = useState(false)
  const [taxInfoSaving, setTaxInfoSaving] = useState(false)
  const [taxForm, setTaxForm] = useState<Record<string, any>>({
    legal_name: '',
    tax_id_type: 'ssn',
    tax_id_last4: '',
    address_line1: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'US',
    form_type: 'w9',
  })

  const [discountCodes, setDiscountCodes] = useState<any[]>([])
  const [codeRequests, setCodeRequests] = useState<any[]>([])
  const [newCodeRequest, setNewCodeRequest] = useState('')
  const [codeRequestSubmitting, setCodeRequestSubmitting] = useState(false)
  const [renameCode, setRenameCode] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameSuggestions, setRenameSuggestions] = useState<string[]>([])
  const [renameError, setRenameError] = useState('')
  const [affiliateDisplayName, setAffiliateDisplayName] = useState('')

  const [linkPresets, setLinkPresets] = useState<any[]>([])
  const [presetName, setPresetName] = useState('')

  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null)
  const [copiedApiKey, setCopiedApiKey] = useState(false)

  const [landingPage, setLandingPage] = useState<any>(null)
  const [landingPageLoading, setLandingPageLoading] = useState(false)
  const [landingPageSaving, setLandingPageSaving] = useState(false)
  const [lpHeadline, setLpHeadline] = useState('')
  const [lpBio, setLpBio] = useState('')
  const [lpPhotoUrl, setLpPhotoUrl] = useState('')
  const [lpCta, setLpCta] = useState('Get Started')
  const [lpThemeColor, setLpThemeColor] = useState('#6366f1')
  const [lpActive, setLpActive] = useState(true)

  const [promoGenerating, setPromoGenerating] = useState(false)
  const [promoContent, setPromoContent] = useState('')
  const [promoPlatform, setPromoPlatform] = useState('twitter')
  const [promoTone, setPromoTone] = useState('professional')
  const [promoCopied, setPromoCopied] = useState(false)

  const [aiWriterFocus, setAiWriterFocus] = useState('')
  const [aiWriterPost, setAiWriterPost] = useState('')
  const [aiWriterHashtags, setAiWriterHashtags] = useState<string[]>([])
  const [aiWriterCharCount, setAiWriterCharCount] = useState(0)
  const [aiWriterShareUrl, setAiWriterShareUrl] = useState('')
  const [aiWriterRefCode, setAiWriterRefCode] = useState('')
  const [aiWriterGenerating, setAiWriterGenerating] = useState(false)
  const [aiWriterCopied, setAiWriterCopied] = useState(false)

  const [aiToolActive, setAiToolActive] = useState<string | null>(null)
  const [aiToolGenerating, setAiToolGenerating] = useState(false)
  const [aiToolResult, setAiToolResult] = useState<any>(null)
  const [aiToolCopied, setAiToolCopied] = useState(false)

  const [aiEmailPurpose, setAiEmailPurpose] = useState('cold outreach')
  const [aiEmailAudience, setAiEmailAudience] = useState('')
  const [aiEmailTone, setAiEmailTone] = useState('professional')

  const [aiBlogTopic, setAiBlogTopic] = useState('')
  const [aiBlogAudience, setAiBlogAudience] = useState('')
  const [aiBlogStyle, setAiBlogStyle] = useState('how-to')

  const [aiVideoType, setAiVideoType] = useState('review')
  const [aiVideoDuration, setAiVideoDuration] = useState('5-7 minutes')
  const [aiVideoPlatform, setAiVideoPlatform] = useState('youtube')

  const [aiAdPlatform, setAiAdPlatform] = useState('facebook')
  const [aiAdObjective, setAiAdObjective] = useState('conversions')
  const [aiAdAudience, setAiAdAudience] = useState('')

  const [aiAudienceNiche, setAiAudienceNiche] = useState('')
  const [aiAudienceDesc, setAiAudienceDesc] = useState('')
  const [aiAudienceType, setAiAudienceType] = useState('social_post')

  const [aiPitchProspect, setAiPitchProspect] = useState('')
  const [aiPitchUrl, setAiPitchUrl] = useState('')
  const [aiPitchRelationship, setAiPitchRelationship] = useState('cold')

  const [aiObjection, setAiObjection] = useState('')
  const [aiObjectionContext, setAiObjectionContext] = useState('')

  const [aiPromoNiche, setAiPromoNiche] = useState('')
  const [aiPromoChannels, setAiPromoChannels] = useState('social media, blog, email')
  const [aiPromoExperience, setAiPromoExperience] = useState('beginner')

  const [aiConversionScenario, setAiConversionScenario] = useState('')

  const [aiOnboardingData, setAiOnboardingData] = useState<any>(null)
  const [aiOnboardingLoading, setAiOnboardingLoading] = useState(false)

  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  const [webhooks, setWebhooks] = useState<any[]>([])
  const [webhooksLoading, setWebhooksLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['affiliate.commission', 'affiliate.payout'])
  const [webhookCreating, setWebhookCreating] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null)
  const [webhookDeliveries, setWebhookDeliveries] = useState<Record<string, any[]>>({})
  const [webhookDeliveriesOpen, setWebhookDeliveriesOpen] = useState<string | null>(null)
  const [webhookTesting, setWebhookTesting] = useState<string | null>(null)

  const [youtubeAnalytics, setYoutubeAnalytics] = useState<any>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(false)

  const [chartData, setChartData] = useState<{
    earningsTimeSeries: { date: string; amount: number }[]
    heatmapData: { date: string; amount: number }[]
    funnelData: { clicks: number; signups: number; conversions: number; paid: number }
    topSources: { source: string; earnings: number; count: number }[]
    benchmarks: { percentile: number; avgEarnings: number; avgReferrals: number; yourEarnings: number; yourReferrals: number }
  } | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [chartLoading, setChartLoading] = useState(false)

  const [coachTips, setCoachTips] = useState<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }[]>([])
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachLastUpdated, setCoachLastUpdated] = useState<string | null>(null)

  const [surveyRating, setSurveyRating] = useState(0)
  const [surveyFeedback, setSurveyFeedback] = useState('')
  const [surveyTestimonialOptIn, setSurveyTestimonialOptIn] = useState(false)
  const [surveySubmitting, setSurveySubmitting] = useState(false)
  const [surveyData, setSurveyData] = useState<{ surveys: any[]; canTakeSurvey: boolean; lastSurveyAt: string | null } | null>(null)

  const [contracts, setContracts] = useState<any[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [contractSigning, setContractSigning] = useState<string | null>(null)
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>(() => loadDashboardLayout())
  const [customizeMode, setCustomizeMode] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null)
  const [dragOverWidget, setDragOverWidget] = useState<WidgetId | null>(null)
  const [showAddWidgetPanel, setShowAddWidgetPanel] = useState(false)

  const [campaigns, setCampaigns] = useState<any[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [campaignUtmSource, setCampaignUtmSource] = useState('')
  const [campaignUtmMedium, setCampaignUtmMedium] = useState('')
  const [campaignUtmCampaign, setCampaignUtmCampaign] = useState('')
  const [campaignCreating, setCampaignCreating] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null)
  const [campaignEditName, setCampaignEditName] = useState('')
  const [campaignEditDescription, setCampaignEditDescription] = useState('')
  const [campaignSaving, setCampaignSaving] = useState(false)

  const [earnedBadges, setEarnedBadges] = useState<any[]>([])
  const [badgeTiers, setBadgeTiers] = useState<any[]>([])
  const [badgesLoading, setBadgesLoading] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState<string | null>(null)

  const [renewals, setRenewals] = useState<any[]>([])
  const [expiringReferrals, setExpiringReferrals] = useState<any[]>([])
  const [renewalsLoading, setRenewalsLoading] = useState(false)
  const [renewalSubmitting, setRenewalSubmitting] = useState(false)
  const [renewalStats, setRenewalStats] = useState<any>(null)
  const [renewalCheckInType, setRenewalCheckInType] = useState<'email' | 'call' | 'note'>('email')
  const [renewalNotes, setRenewalNotes] = useState('')
  const [renewalTargetId, setRenewalTargetId] = useState<string | null>(null)

  const [referralFilter, setReferralFilter] = useState('all')
  const [referralSort, setReferralSort] = useState<'newest' | 'oldest'>('newest')
  const [earningsFilter, setEarningsFilter] = useState('all')
  const [earningsSort, setEarningsSort] = useState<'newest' | 'oldest'>('newest')
  const [payoutSort, setPayoutSort] = useState<'newest' | 'oldest'>('newest')
  const [referralView, setReferralView] = useState<'list' | 'portfolio'>('list')
  const [expandedCommission, setExpandedCommission] = useState<string | null>(null)

  const [statementPeriod, setStatementPeriod] = useState<'current_month' | 'last_month' | 'custom'>('current_month')
  const [statementStartDate, setStatementStartDate] = useState('')
  const [statementEndDate, setStatementEndDate] = useState('')
  const [statementDownloading, setStatementDownloading] = useState(false)

  const [taxSummaryYear, setTaxSummaryYear] = useState(new Date().getFullYear())
  const [taxSummaryData, setTaxSummaryData] = useState<any>(null)
  const [taxSummaryLoading, setTaxSummaryLoading] = useState(false)
  const [taxSummaryDownloading, setTaxSummaryDownloading] = useState(false)

  const [financialTools, setFinancialTools] = useState<any>(null)
  const [financialToolsLoading, setFinancialToolsLoading] = useState(false)
  const [businessMode, setBusinessMode] = useState(false)
  const [calcReferrals, setCalcReferrals] = useState('10')
  const [calcPrice, setCalcPrice] = useState('49')
  const [calcRate, setCalcRate] = useState('')
  const [csvExporting, setCsvExporting] = useState(false)
  const [financialSubTab, setFinancialSubTab] = useState<'overview' | 'referrals' | 'history' | 'tools'>('overview')

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
      try {
        const memberRes = await fetch('/api/user/membership')
        if (memberRes.ok) {
          const memberData = await memberRes.json()
          if (memberData.isAppAdmin || memberData.hasAdminAccess) {
            setIsAdminViewer(true)
          }
        }
      } catch {}
      setAuthChecking(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: ErrorEvent) => {
      const msg = event.error?.message || event.message || ''
      if (msg.includes('310') || msg.includes('Objects are not valid')) {
        console.error('[GLOBAL_ERROR_INTERCEPT] React #310 caught!')
        console.error('[GLOBAL_ERROR_INTERCEPT] Error:', msg)
        console.error('[GLOBAL_ERROR_INTERCEPT] Stack:', event.error?.stack || 'no stack')
        const urlMatch = msg.match(/https:\/\/react\.dev\/errors\/\d+\?args\[\]=(.+?)(?:&|\s|$)/)
        if (urlMatch) {
          try { console.error('[GLOBAL_ERROR_INTERCEPT] Decoded arg:', decodeURIComponent(urlMatch[1])) } catch {}
        }
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const scanForObjects = (label: string, val: unknown): string[] => {
      const issues: string[] = []
      if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        issues.push(`${label} is an object: ${JSON.stringify(val).slice(0, 200)}`)
      }
      if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item)) {
            const keys = Object.keys(item)
            for (const k of keys) {
              if (item[k] !== null && item[k] !== undefined && typeof item[k] === 'object') {
                issues.push(`${label}[${i}].${k} is nested object: ${JSON.stringify(item[k]).slice(0, 150)}`)
              }
            }
          }
        })
      }
      return issues
    }
    const diag: Record<string, unknown> = {}
    if (data) {
      const issues: string[] = []
      if (data.link) issues.push(...scanForObjects('link', data.link))
      if (data.stats) issues.push(...scanForObjects('stats', data.stats))
      if (data.tier) issues.push(...scanForObjects('tier', data.tier))
      if (data.referrals) issues.push(...scanForObjects('referrals', data.referrals))
      if (data.commissions) issues.push(...scanForObjects('commissions', data.commissions))
      if (data.payouts) issues.push(...scanForObjects('payouts', data.payouts))
      if (issues.length > 0) {
        diag.dataIssues = issues
        console.warn('[DIAGNOSTIC] Potential render issues in dashboard data:', issues)
      }
    }
    if (earnings) diag.earningsKeys = Object.keys(earnings)
    if (milestoneData) diag.milestoneDataType = typeof milestoneData
    if (forecast) diag.forecastType = typeof forecast
    diag.section = section
    diag.timestamp = new Date().toISOString()
    ;(window as any).__DASHBOARD_DIAGNOSTIC__ = diag
  }, [data, earnings, milestoneData, forecast, section])

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, assetsRes, earningsRes, milestonesRes, forecastRes] = await Promise.all([
        fetch('/api/affiliate/dashboard'),
        fetch('/api/affiliate/assets'),
        fetch('/api/affiliate/earnings'),
        fetch('/api/affiliate/milestones'),
        fetch('/api/affiliate/forecast'),
      ])

      const dashData = dashRes.ok ? await dashRes.json() : null
      const assetsData = assetsRes.ok ? await assetsRes.json() : null
      const earningsData = earningsRes.ok ? await earningsRes.json() : null
      const msData = milestonesRes.ok ? await milestonesRes.json() : null
      const forecastData = forecastRes.ok ? await forecastRes.json() : null

      if (dashData?.affiliate) {
        setData(dashData.affiliate)
      }
      setAssets(assetsData?.assets || [])
      if (earningsData && typeof earningsData.today === 'number') {
        setEarnings(earningsData)
      }
      if (msData && Array.isArray(msData.milestones)) {
        setMilestoneData(msData)
      }
      if (forecastData && !forecastData.error && typeof forecastData.projectedTotal === 'number') {
        setForecast(forecastData)
      }
      if (dashData?.affiliate?.link?.is_affiliate) {
        fetch('/api/affiliate/contests').then(r => r.ok ? r.json() : null).then(d => setContests(d?.contests || [])).catch(() => {})
      }
      if (dashData?.affiliate?.tier?.current?.perks && Array.isArray(dashData.affiliate.tier.current.perks)) {
        const safePerks = dashData.affiliate.tier.current.perks.map((p: unknown) => typeof p === 'string' ? p : (typeof p === 'object' && p !== null && 'name' in p ? String((p as any).name) : String(p)))
        setTierPerks(safePerks)
      }
    } catch (err) {
      console.error('Failed to load affiliate data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFinancialTools = useCallback(async () => {
    setFinancialToolsLoading(true)
    try {
      const res = await fetch('/api/affiliate/financial-tools')
      if (res.ok) {
        const ft = await res.json()
        setFinancialTools(ft)
        if (ft.revenueShare?.avgCommissionRate && !calcRate) {
          setCalcRate(String(ft.revenueShare.avgCommissionRate))
        }
      }
    } catch {}
    setFinancialToolsLoading(false)
  }, [calcRate])

  const handleCsvExport = async (type: string) => {
    setCsvExporting(true)
    try {
      const res = await fetch(`/api/affiliate/export-csv?type=${type}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: 'Export Complete', description: `Your ${type} data has been downloaded.` })
      } else {
        toast({ title: 'Export Failed', description: 'Unable to generate the export.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Export Failed', description: 'An error occurred during export.', variant: 'destructive' })
    }
    setCsvExporting(false)
  }

  const handleInvoiceDownload = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/affiliate/invoice?payoutId=${payoutId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${payoutId.slice(0, 8)}.html`
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: 'Invoice Downloaded', description: 'Your invoice has been generated and downloaded.' })
      }
    } catch {
      toast({ title: 'Download Failed', description: 'Unable to generate invoice.', variant: 'destructive' })
    }
  }

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

  const fetchRenewals = useCallback(async () => {
    setRenewalsLoading(true)
    try {
      const res = await fetch('/api/affiliate/renewals')
      if (res.ok) {
        const data = await res.json()
        setRenewals(data.renewals || [])
        setExpiringReferrals(data.expiringReferrals || [])
        if (data.stats) setRenewalStats(data.stats)
      }
    } catch {}
    setRenewalsLoading(false)
  }, [])

  const submitRenewal = async (referralId: string, originalEndDate: string) => {
    setRenewalSubmitting(true)
    try {
      const res = await fetch('/api/affiliate/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_id: referralId,
          check_in_type: renewalCheckInType,
          check_in_notes: renewalNotes,
          original_end_date: originalEndDate,
        }),
      })
      if (res.ok) {
        toast({ title: 'Renewal Requested', description: 'Your commission renewal request has been submitted for review.' })
        setRenewalTargetId(null)
        setRenewalNotes('')
        setRenewalCheckInType('email')
        fetchRenewals()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to submit renewal request.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit renewal request.', variant: 'destructive' })
    }
    setRenewalSubmitting(false)
  }

  const fetchFunnel = useCallback(async () => {
    try {
      const res = await fetch(`/api/affiliate/funnel?period=${funnelPeriod}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.funnel) setFunnel(data.funnel)
    } catch {}
  }, [funnelPeriod])

  const fetchChartData = useCallback(async () => {
    setChartLoading(true)
    try {
      const res = await fetch(`/api/affiliate/analytics/charts?period=${chartPeriod}`)
      if (res.ok) {
        const d = await res.json()
        setChartData(d)
      }
    } catch {}
    setChartLoading(false)
  }, [chartPeriod])

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

  const fetchApiKeys = useCallback(async () => {
    setApiKeysLoading(true)
    try {
      const res = await fetch('/api/affiliate/api-keys')
      if (res.ok) {
        const d = await res.json()
        setApiKeys(d.keys || [])
      }
    } catch {}
    setApiKeysLoading(false)
  }, [])

  const generateNewApiKey = async () => {
    setGeneratingKey(true)
    setNewlyGeneratedKey(null)
    try {
      const res = await fetch('/api/affiliate/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'Default' }),
      })
      if (res.ok) {
        const d = await res.json()
        setNewlyGeneratedKey(d.key.fullKey)
        setNewKeyName('')
        fetchApiKeys()
        toast({ title: 'API Key Generated', description: 'Save this key now. It will not be shown again.' })
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error || 'Failed to generate key.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate API key.', variant: 'destructive' })
    }
    setGeneratingKey(false)
  }

  const revokeApiKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/affiliate/api-keys?id=${keyId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchApiKeys()
        toast({ title: 'Revoked', description: 'API key has been revoked.' })
      } else {
        toast({ title: 'Error', description: 'Failed to revoke key.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke key.', variant: 'destructive' })
    }
  }

  const fetchTaxInfo = useCallback(async () => {
    setTaxInfoLoading(true)
    try {
      const res = await fetch('/api/affiliate/tax-info')
      if (res.ok) {
        const d = await res.json()
        if (d.taxInfo) {
          setTaxInfo(d.taxInfo)
          setTaxForm({
            legal_name: d.taxInfo.legal_name || '',
            tax_id_type: d.taxInfo.tax_id_type || 'ssn',
            tax_id_last4: d.taxInfo.tax_id_last4 || '',
            address_line1: d.taxInfo.address_line1 || '',
            address_city: d.taxInfo.address_city || '',
            address_state: d.taxInfo.address_state || '',
            address_zip: d.taxInfo.address_zip || '',
            address_country: d.taxInfo.address_country || 'US',
            form_type: d.taxInfo.form_type || 'w9',
          })
        }
      }
    } catch {}
    setTaxInfoLoading(false)
  }, [])

  const saveTaxInfo = async () => {
    setTaxInfoSaving(true)
    try {
      if (!taxForm.legal_name) {
        toast({ title: 'Error', description: 'Legal name is required.', variant: 'destructive' })
        setTaxInfoSaving(false)
        return
      }
      if (taxForm.form_type === 'w9' && !taxForm.tax_id_last4) {
        toast({ title: 'Error', description: 'Last 4 digits of SSN/EIN required for W-9.', variant: 'destructive' })
        setTaxInfoSaving(false)
        return
      }
      const res = await fetch('/api/affiliate/tax-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxForm),
      })
      if (res.ok) {
        const d = await res.json()
        setTaxInfo(d.taxInfo)
        toast({ title: 'Saved', description: 'Your tax information has been submitted.' })
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to save tax info.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save tax info.', variant: 'destructive' })
    }
    setTaxInfoSaving(false)
  }

  const fetchCoachTips = useCallback(async () => {
    setCoachLoading(true)
    try {
      const res = await fetch('/api/affiliate/ai-coach')
      if (res.ok) {
        const d = await res.json()
        setCoachTips(d.tips || [])
        setCoachLastUpdated(d.generatedAt || new Date().toISOString())
      }
    } catch {}
    setCoachLoading(false)
  }, [])

  const getStatementDates = () => {
    const now = new Date()
    if (statementPeriod === 'current_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      }
    } else if (statementPeriod === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      }
    }
    return { start: statementStartDate, end: statementEndDate }
  }

  const downloadEarningsStatement = async () => {
    const dates = getStatementDates()
    if (!dates.start || !dates.end) {
      toast({ title: 'Error', description: 'Please select a date range.', variant: 'destructive' })
      return
    }
    setStatementDownloading(true)
    try {
      const res = await fetch(`/api/affiliate/earnings-statement?start=${dates.start}&end=${dates.end}&format=html`)
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to generate statement.', variant: 'destructive' })
        setStatementDownloading(false)
        return
      }
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `earnings-statement-${dates.start}-to-${dates.end}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Downloaded', description: 'Your earnings statement has been downloaded.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to download statement.', variant: 'destructive' })
    }
    setStatementDownloading(false)
  }

  const fetchTaxSummary = useCallback(async (year?: number) => {
    setTaxSummaryLoading(true)
    try {
      const y = year || taxSummaryYear
      const res = await fetch(`/api/affiliate/tax-summary?year=${y}`)
      if (res.ok) {
        const d = await res.json()
        setTaxSummaryData(d)
      }
    } catch {}
    setTaxSummaryLoading(false)
  }, [taxSummaryYear])

  const downloadTaxSummary = async () => {
    setTaxSummaryDownloading(true)
    try {
      const res = await fetch(`/api/affiliate/tax-summary?year=${taxSummaryYear}&format=html`)
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to generate tax summary.', variant: 'destructive' })
        setTaxSummaryDownloading(false)
        return
      }
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-summary-${taxSummaryYear}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Downloaded', description: 'Your tax summary has been downloaded.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to download tax summary.', variant: 'destructive' })
    }
    setTaxSummaryDownloading(false)
  }

  const fetchDiscountCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/discount-codes')
      if (res.ok) {
        const data = await res.json()
        setDiscountCodes(data.codes || [])
        setCodeRequests(data.requests || [])
        if (data.displayName) setAffiliateDisplayName(data.displayName)
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

  const handleRenameCode = async (codeId: string) => {
    if (!renameValue.trim()) return
    setRenaming(true)
    setRenameError('')
    setRenameSuggestions([])
    try {
      const res = await fetch('/api/affiliate/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', code_id: codeId, new_code: renameValue }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Code renamed!', description: `Your code is now ${data.code}` })
        setRenameCode(null)
        setRenameValue('')
        fetchDiscountCodes()
      } else if (data.taken && data.suggestions) {
        setRenameError(data.error)
        setRenameSuggestions(data.suggestions)
      } else {
        setRenameError(data.error || 'Failed to rename')
      }
    } catch {
      setRenameError('Failed to rename code')
    }
    setRenaming(false)
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

  const fetchLandingPage = useCallback(async () => {
    setLandingPageLoading(true)
    try {
      const res = await fetch('/api/affiliate/landing-page')
      if (res.ok) {
        const data = await res.json()
        if (data.page) {
          setLandingPage(data.page)
          setLpHeadline(data.page.headline || '')
          setLpBio(data.page.bio || '')
          setLpPhotoUrl(data.page.photo_url || '')
          setLpCta(data.page.custom_cta || 'Get Started')
          setLpThemeColor(data.page.theme_color || '#6366f1')
          setLpActive(data.page.is_active !== false)
        }
      }
    } catch {}
    setLandingPageLoading(false)
  }, [])

  const saveLandingPage = async () => {
    setLandingPageSaving(true)
    try {
      const payload = {
        headline: lpHeadline,
        bio: lpBio,
        photo_url: lpPhotoUrl,
        custom_cta: lpCta,
        theme_color: lpThemeColor,
        is_active: lpActive,
      }

      if (landingPage) {
        const res = await fetch('/api/affiliate/landing-page', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const data = await res.json()
          setLandingPage(data.page)
          toast({ title: 'Saved', description: 'Landing page updated.' })
        } else {
          toast({ title: 'Error', description: 'Failed to update landing page.', variant: 'destructive' })
        }
      } else {
        const res = await fetch('/api/affiliate/landing-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const data = await res.json()
          setLandingPage(data.page)
          toast({ title: 'Created', description: 'Your landing page is live!' })
        } else {
          toast({ title: 'Error', description: 'Failed to create landing page.', variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save landing page.', variant: 'destructive' })
    }
    setLandingPageSaving(false)
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

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/surveys')
      if (!res.ok) return
      const data = await res.json()
      setSurveyData(data)
    } catch {}
  }, [])

  const fetchBadges = useCallback(async () => {
    setBadgesLoading(true)
    try {
      const res = await fetch('/api/affiliate/badges')
      if (!res.ok) return
      const data = await res.json()
      setEarnedBadges(data.badges || [])
      setBadgeTiers(data.tiers || [])
    } catch {}
    setBadgesLoading(false)
  }, [])

  const fetchContracts = useCallback(async () => {
    setContractsLoading(true)
    try {
      const res = await fetch('/api/contracts?contract_type=affiliate_terms')
      if (res.ok) {
        const d = await res.json()
        setContracts(d.contracts || [])
      }
    } catch {}
    setContractsLoading(false)
  }, [])

  const signContract = async (contractId: string) => {
    setContractSigning(contractId)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign: true }),
      })
      if (res.ok) {
        toast({ title: 'Signed', description: 'Contract has been signed successfully.' })
        fetchContracts()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error || 'Failed to sign contract.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to sign contract.', variant: 'destructive' })
    }
    setContractSigning(null)
  }

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true)
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const d = await res.json()
        setCampaigns(d.campaigns || [])
      }
    } catch {}
    setCampaignsLoading(false)
  }, [])

  const fetchYoutubeAnalytics = useCallback(async () => {
    setYoutubeLoading(true)
    try {
      const res = await fetch('/api/affiliate/analytics/youtube')
      if (res.ok) {
        const d = await res.json()
        setYoutubeAnalytics(d)
      }
    } catch {}
    setYoutubeLoading(false)
  }, [])

  const createCampaign = async () => {
    if (!campaignName.trim()) return
    setCampaignCreating(true)
    try {
      const refCode = data?.link?.ref_code || ''
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          description: campaignDescription || null,
          utm_source: campaignUtmSource || refCode,
          utm_medium: campaignUtmMedium || 'affiliate',
          utm_campaign: campaignUtmCampaign || campaignName.toLowerCase().replace(/\s+/g, '-'),
        }),
      })
      if (res.ok) {
        toast({ title: 'Created', description: 'Campaign created successfully.' })
        setCampaignName('')
        setCampaignDescription('')
        setCampaignUtmSource('')
        setCampaignUtmMedium('')
        setCampaignUtmCampaign('')
        fetchCampaigns()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error || 'Failed to create campaign.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create campaign.', variant: 'destructive' })
    }
    setCampaignCreating(false)
  }

  const updateCampaign = async (campaignId: string) => {
    setCampaignSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignEditName,
          description: campaignEditDescription || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Updated', description: 'Campaign updated.' })
        setEditingCampaign(null)
        fetchCampaigns()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error || 'Failed to update campaign.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update campaign.', variant: 'destructive' })
    }
    setCampaignSaving(false)
  }

  const deleteCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Campaign deleted.' })
        fetchCampaigns()
      } else {
        toast({ title: 'Error', description: 'Failed to delete campaign.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete campaign.', variant: 'destructive' })
    }
  }

  const getCampaignLink = (campaign: any) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const refCode = data?.link?.ref_code || ''
    const params = new URLSearchParams()
    params.set('ref', refCode)
    if (campaign.utm_source) params.set('utm_source', campaign.utm_source)
    if (campaign.utm_medium) params.set('utm_medium', campaign.utm_medium)
    if (campaign.utm_campaign) params.set('utm_campaign', campaign.utm_campaign)
    if (campaign.utm_term) params.set('utm_term', campaign.utm_term)
    if (campaign.utm_content) params.set('utm_content', campaign.utm_content)
    return `${baseUrl}/?${params.toString()}`
  }

  const submitSurvey = async () => {
    if (surveyRating === 0) {
      toast({ title: 'Rating Required', description: 'Please select a star rating.', variant: 'destructive' })
      return
    }
    setSurveySubmitting(true)
    try {
      const res = await fetch('/api/affiliate/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: surveyRating,
          feedback: surveyFeedback || null,
          can_use_as_testimonial: surveyTestimonialOptIn,
        }),
      })
      if (res.ok) {
        toast({ title: 'Thank you!', description: 'Your feedback has been submitted.' })
        setSurveyRating(0)
        setSurveyFeedback('')
        setSurveyTestimonialOptIn(false)
        fetchSurveys()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to submit survey.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit survey.', variant: 'destructive' })
    }
    setSurveySubmitting(false)
  }

  useEffect(() => {
    if (!authChecking) {
      fetchData()
      fetchNotifications()
      fetchProfile()
      fetchTaxInfo()
      fetchDiscountCodes()
      fetchLinkPresets()
      fetchLandingPage()
      fetchApiKeys()
      fetchSurveys()
      fetchBadges()
      fetchContracts()
      fetchCampaigns()
      fetchTaxSummary()
      fetchYoutubeAnalytics()
      fetchRenewals()
      fetchFinancialTools()
      fetch('/api/affiliate/messages').then(r => r.ok ? r.json() : null).then(d => {
        if (d?.messages) {
          setMessages(d.messages)
          setUnreadMessages(d.messages.filter((m: any) => m.sender_role === 'admin' && !m.is_read).length)
        }
      }).catch(() => {})
    }
  }, [authChecking, fetchData, fetchNotifications, fetchProfile, fetchTaxInfo, fetchDiscountCodes, fetchLinkPresets, fetchLandingPage, fetchApiKeys, fetchSurveys, fetchBadges, fetchContracts, fetchCampaigns, fetchTaxSummary])

  useEffect(() => {
    if (!authChecking && !loading) fetchLeaderboard()
  }, [authChecking, loading, fetchLeaderboard])

  useEffect(() => {
    if (!authChecking && !loading) fetchFunnel()
  }, [authChecking, loading, fetchFunnel])

  useEffect(() => {
    if (!authChecking && !loading && section === 'analytics') fetchChartData()
  }, [authChecking, loading, section, fetchChartData])

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
    const baseUrl = data?.link?.shareUrl || "".split('?')[0].replace(/\/$/, '')
    const baseDomain = baseUrl.replace(/\/+$/, '')
    const path = deepLinkPage === 'custom' ? customPath : deepLinkPage
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    const params = new URLSearchParams()
    params.set('ref', data?.link?.ref_code)

    if (sourceTag.trim()) {
      params.set('src', sourceTag.trim())
    }

    if (includeUtm) {
      params.set('utm_source', appName.toLowerCase().replace(/\s+/g, '-'))
      params.set('utm_medium', 'affiliate')
      params.set('utm_campaign', data?.link?.ref_code)
      if (sourceTag.trim()) {
        params.set('utm_content', sourceTag.trim())
      }
    }

    return `${baseDomain}${cleanPath}?${params.toString()}`
  }

  const generatePromoPost = async () => {
    setPromoGenerating(true)
    setPromoContent('')
    setPromoCopied(false)
    try {
      const res = await fetch('/api/affiliate/auto-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: promoPlatform, tone: promoTone, productName: appName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate')
      setPromoContent(json.content)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate promo post', variant: 'destructive' })
    } finally {
      setPromoGenerating(false)
    }
  }

  const copyPromoContent = async () => {
    try {
      await navigator.clipboard.writeText(promoContent)
      setPromoCopied(true)
      setTimeout(() => setPromoCopied(false), 2000)
      toast({ title: 'Copied!', description: 'Promo post copied to clipboard' })
    } catch {
      toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
  }

  const generateAiWriterPost = async () => {
    setAiWriterGenerating(true)
    setAiWriterPost('')
    setAiWriterHashtags([])
    setAiWriterCharCount(0)
    setAiWriterCopied(false)
    try {
      const res = await fetch('/api/affiliate/ai-post-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: promoPlatform,
          tone: promoTone,
          focusTopic: aiWriterFocus,
          productName: appName,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate')
      setAiWriterPost(json.post)
      setAiWriterHashtags(json.hashtags || [])
      setAiWriterCharCount(json.characterCount || 0)
      setAiWriterShareUrl(json.shareUrl || '')
      setAiWriterRefCode(json.refCode || '')
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate post', variant: 'destructive' })
    } finally {
      setAiWriterGenerating(false)
    }
  }

  const copyAiWriterPost = async () => {
    try {
      await navigator.clipboard.writeText(aiWriterPost)
      setAiWriterCopied(true)
      setTimeout(() => setAiWriterCopied(false), 2000)
      toast({ title: 'Copied!', description: 'Post copied to clipboard' })
    } catch {
      toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
  }

  const generateAiTool = async (toolName: string, endpoint: string, bodyData: Record<string, any>) => {
    setAiToolGenerating(true)
    setAiToolResult(null)
    setAiToolCopied(false)
    setAiToolActive(toolName)
    try {
      const method = endpoint.includes('onboarding-advisor') ? 'GET' : 'POST'
      const fetchOpts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
      if (method === 'POST') {
        fetchOpts.body = JSON.stringify({ ...bodyData, productName: appName })
      }
      const res = await fetch(endpoint, fetchOpts)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate')
      setAiToolResult(json)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate content', variant: 'destructive' })
    } finally {
      setAiToolGenerating(false)
    }
  }

  const copyAiToolContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setAiToolCopied(true)
      setTimeout(() => setAiToolCopied(false), 2000)
      toast({ title: 'Copied!', description: 'Content copied to clipboard' })
    } catch {
      toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
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

  const updateLayout = useCallback((newLayout: DashboardLayout) => {
    setDashboardLayout(newLayout)
    saveDashboardLayout(newLayout)
  }, [])

  const handleWidgetDragStart = useCallback((widgetId: WidgetId) => {
    setDraggedWidget(widgetId)
  }, [])

  const handleWidgetDragOver = useCallback((e: React.DragEvent, widgetId: WidgetId) => {
    e.preventDefault()
    if (draggedWidget && draggedWidget !== widgetId) {
      setDragOverWidget(widgetId)
    }
  }, [draggedWidget])

  const handleWidgetDrop = useCallback((targetId: WidgetId) => {
    if (!draggedWidget || draggedWidget === targetId) {
      setDraggedWidget(null)
      setDragOverWidget(null)
      return
    }
    const newOrder = [...dashboardLayout.order]
    const dragIdx = newOrder.indexOf(draggedWidget)
    const dropIdx = newOrder.indexOf(targetId)
    if (dragIdx !== -1 && dropIdx !== -1) {
      newOrder.splice(dragIdx, 1)
      newOrder.splice(dropIdx, 0, draggedWidget)
      updateLayout({ ...dashboardLayout, order: newOrder })
    }
    setDraggedWidget(null)
    setDragOverWidget(null)
  }, [draggedWidget, dashboardLayout, updateLayout])

  const handleWidgetDragEnd = useCallback(() => {
    setDraggedWidget(null)
    setDragOverWidget(null)
  }, [])

  const hideWidget = useCallback((widgetId: WidgetId) => {
    updateLayout({
      ...dashboardLayout,
      hidden: [...dashboardLayout.hidden, widgetId],
    })
  }, [dashboardLayout, updateLayout])

  const showWidget = useCallback((widgetId: WidgetId) => {
    updateLayout({
      ...dashboardLayout,
      hidden: dashboardLayout.hidden.filter(id => id !== widgetId),
    })
    setShowAddWidgetPanel(false)
  }, [dashboardLayout, updateLayout])

  const resetLayout = useCallback(() => {
    const defaultLayout: DashboardLayout = { order: [...DEFAULT_WIDGET_ORDER], hidden: [] }
    updateLayout(defaultLayout)
    setShowAddWidgetPanel(false)
  }, [updateLayout])

  const visibleWidgets = useMemo(() => {
    return dashboardLayout.order.filter(id => !dashboardLayout.hidden.includes(id))
  }, [dashboardLayout])

  const hiddenWidgetIds = useMemo(() => {
    return dashboardLayout.order.filter(id => dashboardLayout.hidden.includes(id))
  }, [dashboardLayout])

  const renderWidgetContent = (widgetId: WidgetId): React.ReactNode => {
    try {
      const inner = renderWidgetInner(widgetId)
      if (!inner) return null
      return (
        <WidgetErrorBoundary widgetId={widgetId} key={`eb-${widgetId}`}>
          {inner}
        </WidgetErrorBoundary>
      )
    } catch (err) {
      console.error(`Widget "${widgetId}" crashed:`, err)
      return (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-destructive">Widget &quot;{widgetId}&quot; failed to load</p>
          </CardContent>
        </Card>
      )
    }
  }

  const renderWidgetInner = (widgetId: WidgetId): React.ReactNode => {
    if (!data) return null

    switch (widgetId) {
      case 'share_link':
        return (
          <Card data-testid="card-share-link">
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm font-medium mb-1">Your Referral Link</p>
                  <div className="flex items-center gap-2">
                    <Input value={data?.link?.shareUrl || ""} readOnly className="font-mono text-sm" data-testid="input-share-url" />
                    <Button variant="outline" size="sm" onClick={() => handleCopy(data?.link?.shareUrl || "")} data-testid="button-copy-link">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {data?.terms && (
                  <Badge variant="secondary" className="shrink-0" data-testid="badge-locked-terms">
                    {S(data?.terms.rate)}% for {S(data?.terms.durationMonths)} months
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'live_earnings':
        if (!earnings) return null
        return (
          <Card className="border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)] dark:bg-[hsl(var(--success)/0.1)]" data-testid="card-live-earnings">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[hsl(var(--success))]" />
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
              <p className="text-3xl font-bold mt-2 text-[hsl(var(--success))]" data-testid="text-live-earnings-value">
                ${((earnings?.[earningsPeriod] ?? 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        )

      case 'quick_stats':
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="stat-clicks">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Link Clicks</span>
                </div>
                <p className="text-2xl font-bold mt-1">{S(data.stats.clicks)}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-referrals">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Signups</span>
                </div>
                <p className="text-2xl font-bold mt-1">{S(data.stats.totalReferrals)}</p>
                <p className="text-xs text-muted-foreground">{S(data.stats.conversionRate)}% convert to paid</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-pending-earnings">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold mt-1">${(data?.stats?.pendingEarnings / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-earned">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-2xl font-bold mt-1">${(data?.stats?.totalEarnings / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )

      case 'tier_progress':
        if (!data?.tier?.current) return null
        return (
          <Card data-testid="card-tier-progress">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{S(data?.tier?.current.name)} Tier</span>
                  <Badge variant="outline" className="text-xs">{S(data?.stats?.effectiveRate)}% commission</Badge>
                </div>
                {data?.tier?.next && (
                  <span className="text-xs text-muted-foreground">
                    {S(data.tier.referralsToNext)} more to {S(data?.tier?.next.name)} ({S(data?.tier?.next.commission_rate)}%)
                  </span>
                )}
              </div>
              {data?.tier?.next && (
                <Progress value={Math.min(tierProgress, 100)} className="h-2" data-testid="progress-tier" />
              )}
              {!data?.tier?.next && (
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
                      <Badge key={i} variant="outline" className="text-xs">{typeof perk === 'string' ? perk : String(perk)}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'milestone_progress':
        if (!milestoneData || !Array.isArray(milestoneData.milestones) || milestoneData.milestones.length === 0) return null
        return (
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
                    <div key={ms.id} className={`p-3 rounded-md border ${achieved ? 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)] dark:bg-[hsl(var(--success)/0.1)]' : ''}`} data-testid={`milestone-progress-${ms.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{S(ms.name)}</span>
                        <span className="text-sm font-medium text-[hsl(var(--success))]">
                          ${(ms.bonus_amount_cents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {achieved ? (
                            <span className="text-[hsl(var(--success))] flex items-center gap-1 justify-end"><CheckCircle className="h-3 w-3" /> Done</span>
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
        )

      case 'active_contests':
        if (contests.length === 0) return null
        return (
          <Card className="border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)] dark:bg-[hsl(var(--warning)/0.1)]" data-testid="card-active-contests">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[hsl(var(--warning))]" />
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
                    <div key={contest.id} className={`p-4 rounded-md border ${isActive ? 'border-[hsl(var(--warning)/0.5)]' : ''}`} data-testid={`contest-${contest.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{S(contest.name)}</span>
                            <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">
                              {isActive ? 'Active' : 'Upcoming'}
                            </Badge>
                          </div>
                          {contest.description && <p className="text-xs text-muted-foreground">{S(contest.description)}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Metric: {S(contest.metric)}</span>
                            <span>Prize: ${((contest.prize_amount_cents || 0) / 100).toFixed(2)}</span>
                            {contest.prize_description && <span>{S(contest.prize_description)}</span>}
                          </div>
                        </div>
                        {daysLeft !== null && (
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-bold text-[hsl(var(--warning))]">{daysLeft}</p>
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
        )

      case 'earnings_forecast':
        if (!forecast) return null
        return (
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
                      <ArrowUp className="h-3 w-3 text-[hsl(var(--success))]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={forecast.paceVsLastMonth >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}>
                      {Math.abs(forecast.paceVsLastMonth)}% vs last month
                    </span>
                  </div>
                )}
                {forecast.tierInfo && (
                  <div className="p-2 rounded bg-primary/10 text-xs">
                    <span className="font-medium">{S(forecast.tierInfo.referralsNeeded)} more referrals</span> to reach{' '}
                    <span className="font-medium">{S(forecast.tierInfo.nextTierName)}</span> tier ({S(forecast.tierInfo.nextTierRate)}% commission)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'leaderboard':
        if (!leaderboardEnabled) return null
        return (
          <Card data-testid="card-leaderboard">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </CardTitle>
                <div className="flex gap-1">
                  <div className="flex border rounded-md overflow-hidden">
                    {([['month', 'Month'], ['last_month', 'Last'], ['all', 'All']] as const).map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setLeaderboardPeriod(val)}
                        className={`px-2 py-1 text-[10px] transition-colors ${leaderboardPeriod === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                        data-testid={`btn-lb-period-${val}`}
                      >{lbl}</button>
                    ))}
                  </div>
                  <div className="flex border rounded-md overflow-hidden">
                    {([['referrals', 'Refs'], ['earnings', '$']] as const).map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setLeaderboardMetric(val)}
                        className={`px-2 py-1 text-[10px] transition-colors ${leaderboardMetric === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                        data-testid={`btn-lb-metric-${val}`}
                      >{lbl}</button>
                    ))}
                  </div>
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
                        <span className={`w-6 text-center text-xs font-bold ${entry.rank <= 3 ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'}`}>
                          #{entry.rank}
                        </span>
                        <span>{S(entry.displayName)} {entry.isYou && <Badge variant="outline" className="text-[10px] ml-1">You</Badge>}</span>
                      </div>
                      <span className="font-medium">
                        {leaderboardMetric === 'earnings' ? `$${(N(entry.metricValue) / 100).toFixed(2)}` : S(entry.metricValue)}
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
        )

      case 'conversion_funnel':
        if (funnel.length === 0) return null
        return (
          <Card data-testid="card-conversion-funnel">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Conversion Funnel
              </CardTitle>
              <div className="flex border rounded-md overflow-hidden">
                {([['7d', '7d'], ['30d', '30d'], ['90d', '90d'], ['all', 'All']] as const).map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setFunnelPeriod(val)}
                    className={`px-2 py-1 text-[10px] transition-colors ${funnelPeriod === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                    data-testid={`btn-funnel-period-${val}`}
                  >{lbl}</button>
                ))}
              </div>
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
                      <span className="text-sm font-medium">{S(step.stage)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{N(step.count)}</span>
                        {i > 0 && (
                          <span className={`text-xs ${N(step.rate) >= 50 ? 'text-[hsl(var(--success))]' : N(step.rate) >= 20 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>
                            {N(step.rate)}%
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
        )

      case 'ai_coach':
        return (
          <Card data-testid="card-ai-coach">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Coach
            </CardTitle>
            <div className="flex items-center gap-2">
              {coachLastUpdated && (
                <span className="text-[10px] text-muted-foreground">
                  Updated {new Date(coachLastUpdated).toLocaleString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCoachTips}
                disabled={coachLoading}
                data-testid="button-refresh-coach"
              >
                {coachLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                <span className="ml-1.5">{coachTips.length > 0 ? 'Refresh' : 'Get Tips'}</span>
              </Button>
            </div>
          </div>
          <CardDescription>Personalized tips to boost your affiliate earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {coachLoading && coachTips.length === 0 ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-coach-tips">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing your performance...</span>
            </div>
          ) : coachTips.length > 0 ? (
            <div className="space-y-3">
              {coachTips.map((tip, i) => {
                const priorityColors = {
                  high: 'border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.05)] dark:bg-[hsl(var(--danger)/0.1)]',
                  medium: 'border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)] dark:bg-[hsl(var(--warning)/0.1)]',
                  low: 'border-primary/30 bg-primary/5 dark:bg-primary/10',
                }
                const priorityLabels = {
                  high: 'High Impact',
                  medium: 'Medium Impact',
                  low: 'Quick Win',
                }
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-md border ${priorityColors[tip.priority]}`}
                    data-testid={`coach-tip-${i}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">{S(tip.title)}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {S(priorityLabels[tip.priority])}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{S(tip.description)}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6" data-testid="text-no-coach-tips">
              <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">Get personalized coaching tips</p>
              <p className="text-xs text-muted-foreground">Click "Get Tips" to analyze your performance and receive actionable advice.</p>
            </div>
          )}
        </CardContent>
      </Card>
        )

      case 'content_analytics':
        return (
          <Card data-testid="card-content-analytics">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              Content Analytics
            </CardTitle>
            {youtubeAnalytics?.connected && (
              <Button variant="ghost" size="sm" onClick={fetchYoutubeAnalytics} disabled={youtubeLoading} data-testid="button-refresh-youtube">
                <RefreshCw className={`h-3.5 w-3.5 ${youtubeLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          <CardDescription>Track your YouTube video performance and referral attribution</CardDescription>
        </CardHeader>
        <CardContent>
          {youtubeLoading && !youtubeAnalytics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : youtubeAnalytics?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                <span>Connected as <span className="font-medium text-foreground">{S(youtubeAnalytics.account?.displayName || youtubeAnalytics.account?.username)}</span></span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-md border" data-testid="stat-yt-videos">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Play className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Videos</span>
                  </div>
                  <p className="text-lg font-bold">{N(youtubeAnalytics.channelStats?.totalVideos)}</p>
                </div>
                <div className="p-3 rounded-md border" data-testid="stat-yt-views">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total Views</span>
                  </div>
                  <p className="text-lg font-bold">{N(youtubeAnalytics.channelStats?.totalViews).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-md border" data-testid="stat-yt-likes">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Likes</span>
                  </div>
                  <p className="text-lg font-bold">{N(youtubeAnalytics.channelStats?.totalLikes).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-md border" data-testid="stat-yt-comments">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Comments</span>
                  </div>
                  <p className="text-lg font-bold">{N(youtubeAnalytics.channelStats?.totalComments).toLocaleString()}</p>
                </div>
              </div>

              {youtubeAnalytics.attribution && (
                <div className="p-3 rounded-md border bg-muted/30" data-testid="card-yt-attribution">
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Referral Attribution
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold">{N(youtubeAnalytics.attribution.youtubeClicks)}</p>
                      <p className="text-[10px] text-muted-foreground">YouTube Clicks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{N(youtubeAnalytics.attribution.youtubeReferrals)}</p>
                      <p className="text-[10px] text-muted-foreground">YouTube Signups</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{N(youtubeAnalytics.attribution.youtubeConverted)}</p>
                      <p className="text-[10px] text-muted-foreground">Converted</p>
                    </div>
                  </div>
                  {youtubeAnalytics.attribution.viewsToClickRate && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Views-to-click rate: {S(youtubeAnalytics.attribution.viewsToClickRate)}%
                    </p>
                  )}
                </div>
              )}

              {youtubeAnalytics.videos?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent Videos</p>
                  <div className="space-y-2">
                    {youtubeAnalytics.videos.slice(0, 5).map((video: any) => (
                      <div key={video.id} className="flex items-center justify-between gap-3 p-2 rounded-md border" data-testid={`video-${video.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{S(video.title)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(String(video.publishedAt || '')).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {N(video.views).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {N(video.likes)}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {N(video.comments)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Youtube className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">YouTube Not Connected</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                Connect your YouTube account to see video performance and track how your content drives referrals.
              </p>
              <p className="text-xs text-muted-foreground">
                Use source tags like <Badge variant="outline" className="text-[10px] mx-0.5">youtube</Badge> or <Badge variant="outline" className="text-[10px] mx-0.5">yt</Badge> in your referral links to track YouTube-driven referrals even without connecting.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        )

      case 'achievements':
        return (
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
                  let earned = false
                  try { earned = badge.check() } catch {}
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
        )

      case 'milestone_countdown':
        if (!data?.nextMilestone) return null
        return (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-milestone-countdown">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Next Milestone: {data.nextMilestone.name}</span>
                </div>
                <Badge variant="outline" className="text-xs" data-testid="badge-milestone-bonus">
                  ${(data.nextMilestone.bonusAmountCents / 100).toFixed(2)} bonus
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                <Progress value={data.nextMilestone.progress} className="h-2" data-testid="progress-milestone-countdown" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span data-testid="text-milestone-remaining">{data.nextMilestone.referralsAway} referral{data.nextMilestone.referralsAway !== 1 ? 's' : ''} away</span>
                  <span>{Math.round(data.nextMilestone.progress)}% complete</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'payout_schedule':
        if (!data?.payoutSchedule) return null
        return (
          <Card data-testid="card-payout-schedule">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Upcoming Payout</span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid="text-next-payout-date">
                  {new Date(data.payoutSchedule.nextPayoutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-lg font-bold" data-testid="text-payout-balance">
                    ${(data.payoutSchedule.pendingAmountCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Minimum Payout</p>
                  <p className="text-lg font-bold" data-testid="text-payout-minimum">
                    ${(data.payoutSchedule.minPayoutCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              {data.payoutSchedule.meetsMinimum ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--success))]" data-testid="text-payout-eligible">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Eligible for next payout
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-payout-not-eligible">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  ${((data.payoutSchedule.minPayoutCents - data.payoutSchedule.pendingAmountCents) / 100).toFixed(2)} more needed
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'tier_celebration':
        if (!data?.tierPromotionCelebration) return null
        return (
          <Card className="border-[hsl(var(--warning)/0.3)] bg-gradient-to-r from-[hsl(var(--warning)/0.05)] to-[hsl(var(--warning)/0.08)] dark:from-[hsl(var(--warning)/0.1)] dark:to-[hsl(var(--warning)/0.12)]" data-testid="card-tier-celebration">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                  <Award className="h-6 w-6 text-[hsl(var(--warning))]" />
                </div>
                <div>
                  <p className="text-sm font-bold" data-testid="text-tier-celebration-title">
                    You reached {S(data.tierPromotionCelebration.tierName)} Tier!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your commission rate is now {S(data.tierPromotionCelebration.commissionRate)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold" data-testid="text-overview-heading">Dashboard</h2>
        <div className="flex items-center gap-2">
          {customizeMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddWidgetPanel(!showAddWidgetPanel)}
                data-testid="button-add-widget"
                disabled={hiddenWidgetIds.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
                data-testid="button-reset-layout"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </>
          )}
          <Button
            variant={customizeMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCustomizeMode(!customizeMode)
              setShowAddWidgetPanel(false)
            }}
            data-testid="button-customize-dashboard"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {customizeMode ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {showAddWidgetPanel && hiddenWidgetIds.length > 0 && (
        <Card data-testid="panel-add-widget">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Hidden Widgets</p>
              <Button variant="ghost" size="icon" onClick={() => setShowAddWidgetPanel(false)} data-testid="button-close-add-panel">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hiddenWidgetIds.map(widgetId => {
                const config = AVAILABLE_WIDGETS.find(w => w.id === widgetId)
                if (!config) return null
                const WidgetIcon = config.icon
                return (
                  <Button
                    key={widgetId}
                    variant="outline"
                    size="sm"
                    onClick={() => showWidget(widgetId)}
                    data-testid={`button-show-widget-${widgetId}`}
                  >
                    <WidgetIcon className="h-3.5 w-3.5 mr-1.5" />
                    {config.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {visibleWidgets.map(widgetId => {
        const content = renderWidgetContent(widgetId)
        if (!content && !customizeMode) return null

        const config = AVAILABLE_WIDGETS.find(w => w.id === widgetId)
        const isDragging = draggedWidget === widgetId
        const isDragOver = dragOverWidget === widgetId

        if (customizeMode) {
          return (
            <div
              key={widgetId}
              draggable
              onDragStart={() => handleWidgetDragStart(widgetId)}
              onDragOver={(e) => handleWidgetDragOver(e, widgetId)}
              onDrop={() => handleWidgetDrop(widgetId)}
              onDragEnd={handleWidgetDragEnd}
              className={`relative transition-all ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}
              data-testid={`widget-wrapper-${widgetId}`}
            >
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-md bg-background/80 border shadow-sm" data-testid={`drag-handle-${widgetId}`}>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <button
                  onClick={() => hideWidget(widgetId)}
                  className="p-1.5 rounded-md bg-background/80 border shadow-sm"
                  data-testid={`button-hide-widget-${widgetId}`}
                >
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {content || (
                <Card className="border-dashed opacity-50">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">{S(config?.label)} (no data)</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        }

        return <div key={widgetId} data-testid={`widget-${widgetId}`}>{content}</div>
      })}
    </div>
  )

  const renderReferrals = () => {
    if (!data) return null
    const referralCommissions: Record<string, number> = {}
    data?.commissions?.forEach(c => {
      const refId = (c as any).referral_id
      if (refId) {
        referralCommissions[refId] = (referralCommissions[refId] || 0) + c.commission_amount_cents
      }
    })

    const totalCommissionRevenue = data.commissions.reduce((sum, c) => sum + c.commission_amount_cents, 0)

    const activeReferrals = data.referrals.filter(r => r.status === 'converted')
    const churnedReferrals = data.referrals.filter(r => r.status === 'churned')
    const trialReferrals = data.referrals.filter(r => r.status === 'signed_up')

    const avgLTV = data.referrals.length > 0
      ? totalCommissionRevenue / data.referrals.filter(r => r.status === 'converted' || r.status === 'churned').length || 0
      : 0

    const bestReferral = data.referrals.reduce<{ id: string; revenue: number } | null>((best, ref) => {
      const rev = referralCommissions[ref.id] || 0
      if (!best || rev > best.revenue) return { id: ref.id, revenue: rev }
      return best
    }, null)

    return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold" data-testid="text-referrals-heading">Referrals ({data.referrals.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="flex rounded-md border overflow-hidden">
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${referralView === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setReferralView('list')}
              data-testid="button-referral-view-list"
            >
              List
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${referralView === 'portfolio' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setReferralView('portfolio')}
              data-testid="button-referral-view-portfolio"
            >
              Portfolio
            </button>
          </div>
          {referralView === 'list' && (
            <>
              <Select value={referralFilter} onValueChange={setReferralFilter}>
                <SelectTrigger className="h-8 text-xs w-full sm:w-[120px]" data-testid="select-referral-filter">
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
            </>
          )}
        </div>
      </div>

      {referralView === 'portfolio' ? (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="stat-portfolio-value">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Portfolio Value</span>
                </div>
                <p className="text-xl font-bold mt-1">${(totalCommissionRevenue / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-avg-ltv">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg LTV</span>
                </div>
                <p className="text-xl font-bold mt-1">${(avgLTV / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-active-subscribers">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[hsl(var(--success))]" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-xl font-bold mt-1">{activeReferrals.length}</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-best-referral">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Best Referral</span>
                </div>
                <p className="text-xl font-bold mt-1">${bestReferral ? (bestReferral.revenue / 100).toFixed(2) : '0.00'}</p>
              </CardContent>
            </Card>
          </div>

          {activeReferrals.length > 0 && (
            <Card data-testid="card-portfolio-active">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[hsl(var(--success))]" />
                  Active Subscribers ({activeReferrals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeReferrals.map(ref => {
                    const revenue = referralCommissions[ref.id] || 0
                    const daysSinceSignup = Math.floor((Date.now() - new Date(ref.created_at).getTime()) / (1000 * 60 * 60 * 24))
                    const monthlyLTV = daysSinceSignup > 0 ? (revenue / daysSinceSignup) * 30 : 0
                    return (
                      <div key={ref.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`portfolio-referral-${ref.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--success)/0.1)] flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-[hsl(var(--success))]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Referral #{ref.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(ref.created_at).toLocaleDateString()} · {daysSinceSignup}d ago
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${(revenue / 100).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">${(monthlyLTV / 100).toFixed(2)}/mo est.</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {trialReferrals.length > 0 && (
            <Card data-testid="card-portfolio-trial">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />
                  Free / Trial ({trialReferrals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trialReferrals.map(ref => (
                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`portfolio-trial-${ref.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                          <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Referral #{ref.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            Signed up {new Date(ref.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Pending Conversion</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {churnedReferrals.length > 0 && (
            <Card data-testid="card-portfolio-churned">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserX className="h-4 w-4 text-[hsl(var(--danger))]" />
                  Churned ({churnedReferrals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {churnedReferrals.map(ref => {
                    const revenue = referralCommissions[ref.id] || 0
                    return (
                      <div key={ref.id} className="flex items-center justify-between p-3 rounded-md border opacity-75" data-testid={`portfolio-churned-${ref.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--danger)/0.1)] flex items-center justify-center">
                            <UserX className="h-4 w-4 text-[hsl(var(--danger))]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Referral #{ref.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(ref.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground">${(revenue / 100).toFixed(2)}</p>
                          <p className="text-xs text-[hsl(var(--danger))]">Churned</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
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
                      {S(ref.status).replace('_', ' ')}
                    </Badge>
                    {ref.source_tag && (
                      <Badge variant="outline" className="text-[10px]">{S(ref.source_tag)}</Badge>
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
        </>
      )}

      <Card data-testid="card-commission-renewals">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Commission Renewals
            </CardTitle>
            <CardDescription>Extend your commission window by checking in with referrals</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchRenewals} disabled={renewalsLoading} data-testid="button-refresh-renewals">
            <RefreshCw className={`h-4 w-4 ${renewalsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {renewalsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              {expiringReferrals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
                    Expiring Soon ({expiringReferrals.length})
                  </p>
                  <BulkRenewalButton expiringReferrals={expiringReferrals} onSuccess={fetchRenewals} />
                  {expiringReferrals.map((ref: any) => {
                    const hasPending = renewals.some(r => r.referral_id === ref.id && r.status === 'pending')
                    return (
                      <div key={ref.id} className="p-3 rounded-md border space-y-2" data-testid={`expiring-referral-${ref.id}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-sm font-medium">Referral #{ref.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              Expires {ref.computed_end_date} ({ref.days_remaining} day{ref.days_remaining !== 1 ? 's' : ''} left)
                            </p>
                          </div>
                          {hasPending ? (
                            <Badge variant="outline" className="text-xs" data-testid={`badge-pending-renewal-${ref.id}`}>
                              <Clock className="h-3 w-3 mr-1" /> Renewal Pending
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRenewalTargetId(renewalTargetId === ref.id ? null : ref.id)}
                              data-testid={`button-request-renewal-${ref.id}`}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Request Renewal
                            </Button>
                          )}
                        </div>
                        {renewalTargetId === ref.id && (
                          <div className="border-t pt-3 space-y-3">
                            <div>
                              <Label className="text-xs">Check-in Type</Label>
                              <Select value={renewalCheckInType} onValueChange={(v: 'email' | 'call' | 'note') => setRenewalCheckInType(v)}>
                                <SelectTrigger className="h-8 text-xs mt-1" data-testid="select-renewal-checkin-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email Check-in</SelectItem>
                                  <SelectItem value="call">Phone/Video Call</SelectItem>
                                  <SelectItem value="note">Written Note</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Notes (describe your check-in with the customer)</Label>
                              <Input
                                value={renewalNotes}
                                onChange={e => setRenewalNotes(e.target.value)}
                                placeholder="e.g., Spoke with customer about their experience, they are happy..."
                                className="mt-1 text-xs"
                                data-testid="input-renewal-notes"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => submitRenewal(ref.id, ref.computed_end_date)}
                                disabled={renewalSubmitting || !renewalNotes.trim()}
                                data-testid="button-submit-renewal"
                              >
                                {renewalSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                Submit Request
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setRenewalTargetId(null); setRenewalNotes('') }} data-testid="button-cancel-renewal">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {renewals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Renewal History</p>
                  {renewals.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`renewal-${r.id}`}>
                      <div>
                        <p className="text-sm">Referral #{r.referral_id?.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {S(r.check_in_type)} · {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={r.status === 'approved' ? 'default' : r.status === 'denied' ? 'destructive' : 'outline'}
                        className="text-xs capitalize"
                        data-testid={`badge-renewal-status-${r.id}`}
                      >
                        {r.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {r.status === 'denied' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {r.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {S(r.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {expiringReferrals.length === 0 && renewals.length === 0 && (
                <div className="text-center py-6" data-testid="text-no-renewals">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No expiring referrals or renewal requests at this time.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CommissionRenewalStatsPanel stats={renewalStats} />
    </div>
    )
  }

  const renderEarnings = () => {
    if (!data) return null
    return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-earnings-heading">Earnings ({data.commissions.length})</h2>
        <div className="flex gap-2">
          <Select value={earningsFilter} onValueChange={setEarningsFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[120px]" data-testid="select-earnings-filter">
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Pending</span>
            <p className="text-xl font-bold mt-1">${(data?.stats?.pendingEarnings / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Approved</span>
            <p className="text-xl font-bold mt-1">${(data?.stats?.approvedEarnings / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Paid Out</span>
            <p className="text-xl font-bold mt-1">${(data?.stats?.paidEarnings / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <span className="text-xs text-muted-foreground">Min Payout</span>
            <p className="text-xl font-bold mt-1">${(data?.settings?.minPayoutCents / 100).toFixed(2)}</p>
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
              {filteredCommissions.map(com => {
                const isExpanded = expandedCommission === com.id
                const lifecycleSteps = (() => {
                  const steps: { label: string; status: 'completed' | 'current' | 'pending' | 'skipped'; date?: string }[] = []
                  steps.push({ label: 'Click', status: 'completed', date: undefined })
                  steps.push({ label: 'Signup', status: 'completed', date: undefined })
                  const hasTrial = com.invoice_amount_cents === 0
                  if (hasTrial) {
                    steps.push({ label: 'Trial', status: 'completed', date: undefined })
                  } else {
                    steps.push({ label: 'Trial', status: 'skipped' })
                  }
                  steps.push({ label: 'Paid', status: 'completed', date: undefined })
                  steps.push({ label: 'Commission Created', status: 'completed', date: com.created_at })
                  if (com.status === 'pending') {
                    steps.push({ label: 'Approved', status: 'pending' })
                    steps.push({ label: 'Paid Out', status: 'pending' })
                  } else if (com.status === 'approved') {
                    steps.push({ label: 'Approved', status: 'completed', date: undefined })
                    steps.push({ label: 'Paid Out', status: 'current' })
                  } else if (com.status === 'paid') {
                    steps.push({ label: 'Approved', status: 'completed', date: undefined })
                    steps.push({ label: 'Paid Out', status: 'completed', date: undefined })
                  } else {
                    steps.push({ label: 'Approved', status: 'pending' })
                    steps.push({ label: 'Paid Out', status: 'pending' })
                  }
                  return steps
                })()

                return (
                <div key={com.id} className="rounded-md border" data-testid={`commission-${com.id}`}>
                  <button
                    className="w-full flex items-center justify-between p-3 text-left"
                    onClick={() => setExpandedCommission(isExpanded ? null : com.id)}
                    data-testid={`button-expand-commission-${com.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <Badge variant={STATUS_COLORS[com.status] as any || 'outline'} className="text-xs capitalize">
                        {S(com.status)}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">${(N(com.commission_amount_cents) / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {N(com.commission_rate)}% of ${(N(com.invoice_amount_cents) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(com.created_at).toLocaleDateString()}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-4 pt-1 border-t" data-testid={`lifecycle-${com.id}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-3 ml-7">Commission Lifecycle</p>
                      <div className="flex items-start gap-0 overflow-x-auto pb-1 ml-7">
                        {lifecycleSteps.map((step, i) => (
                          <div key={i} className="flex items-start min-w-0">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                step.status === 'completed' ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]' :
                                step.status === 'current' ? 'bg-primary/10 text-primary ring-2 ring-primary/30' :
                                step.status === 'skipped' ? 'bg-muted text-muted-foreground line-through' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {step.status === 'completed' ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : step.status === 'skipped' ? (
                                  <span className="text-[9px]">-</span>
                                ) : step.status === 'current' ? (
                                  <CircleDot className="h-3.5 w-3.5" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                              </div>
                              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px] ${
                                step.status === 'skipped' ? 'text-muted-foreground/50 line-through' :
                                step.status === 'completed' || step.status === 'current' ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {S(step.label)}
                              </span>
                              {step.date && (
                                <span className="text-[9px] text-muted-foreground mt-0.5">
                                  {new Date(step.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            {i < lifecycleSteps.length - 1 && (
                              <div className={`h-[2px] w-6 mt-3 shrink-0 ${
                                step.status === 'completed' && lifecycleSteps[i + 1].status !== 'pending'
                                  ? 'bg-[hsl(var(--success)/0.4)]'
                                  : 'bg-muted'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {data.settings.twoTierEnabled && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Second-Tier Earnings
            </CardTitle>
            <CardDescription>
              Earn {N(data.settings.secondTierCommissionRate) || 5}% from affiliates you recruited
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <span className="text-xs text-muted-foreground">Total Second-Tier Earnings</span>
              <p className="text-xl font-bold" data-testid="text-second-tier-total">
                ${((data.secondTierTotal || 0) / 100).toFixed(2)}
              </p>
            </div>
            {(data.secondTierCommissions?.length || 0) === 0 ? (
              <div className="text-center py-6" data-testid="text-no-second-tier">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No second-tier commissions yet. Share your affiliate link with potential partners to start earning!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.secondTierCommissions!.map(stc => (
                  <div key={stc.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`second-tier-commission-${stc.id}`}>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        Tier 2
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">${(stc.commission_amount_cents / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {S(stc.commission_rate)}% second-tier rate
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(stc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-download-statement">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Statement
          </CardTitle>
          <CardDescription>Generate a printable earnings statement for your records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <Label className="text-xs">Period</Label>
              <Select value={statementPeriod} onValueChange={(v: 'current_month' | 'last_month' | 'custom') => setStatementPeriod(v)}>
                <SelectTrigger className="mt-1 w-full sm:w-[160px]" data-testid="select-statement-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {statementPeriod === 'custom' && (
              <>
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={statementStartDate}
                    onChange={e => setStatementStartDate(e.target.value)}
                    className="mt-1 w-full sm:w-[160px]"
                    data-testid="input-statement-start"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={statementEndDate}
                    onChange={e => setStatementEndDate(e.target.value)}
                    className="mt-1 w-full sm:w-[160px]"
                    data-testid="input-statement-end"
                  />
                </div>
              </>
            )}
            <Button
              onClick={downloadEarningsStatement}
              disabled={statementDownloading}
              size="sm"
              data-testid="button-download-statement"
            >
              {statementDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Statement will be downloaded as an HTML file you can print or save as PDF from your browser.
          </p>
        </CardContent>
      </Card>

      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2" data-testid="text-financial-tools-heading">
            <TrendingUp className="h-4 w-4" />
            Financial Tools
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBusinessMode(!businessMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${businessMode ? 'bg-primary' : 'bg-muted'}`}
              data-testid="toggle-business-mode"
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${businessMode ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
            </button>
            <span className="text-xs text-muted-foreground">Business Mode</span>
          </div>
        </div>

        <div className="flex rounded-md border overflow-hidden mb-4">
          {(['overview', 'referrals', 'history', 'tools'] as const).map(tab => (
            <button
              key={tab}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex-1 capitalize ${financialSubTab === tab ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setFinancialSubTab(tab)}
              data-testid={`tab-financial-${tab}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {financialToolsLoading && !financialTools ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : financialSubTab === 'overview' ? (
          <div className="space-y-4">
            {financialTools?.sleepEarnings > 0 && (
              <Card data-testid="card-sleep-earnings">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Earnings While You Sleep
                      </p>
                      <p className="text-2xl font-bold mt-1" data-testid="text-sleep-earnings">
                        ${((financialTools?.sleepEarnings || 0) / 100).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Earned in the last 24 hours passively</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {financialTools?.projection && (
              <Card data-testid="card-annual-projection">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Annual Projection
                  </CardTitle>
                  <CardDescription>Based on your current month performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Daily Avg</p>
                      <p className="text-sm font-bold" data-testid="text-daily-avg">
                        ${((financialTools.projection.dailyAvg || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">This Month</p>
                      <p className="text-sm font-bold" data-testid="text-month-earnings">
                        ${((financialTools.projection.currentMonthEarnings || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Month Projected</p>
                      <p className="text-sm font-bold" data-testid="text-projected-monthly">
                        ${((financialTools.projection.projectedMonthly || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-primary/10 text-center">
                      <p className="text-xs text-muted-foreground">Annual Projected</p>
                      <p className="text-lg font-bold text-primary" data-testid="text-projected-annual">
                        ${((financialTools.projection.projectedAnnual || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {financialTools.projection.yoyGrowth !== null && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={financialTools.projection.yoyGrowth >= 0 ? 'default' : 'destructive'} className="text-xs">
                        {financialTools.projection.yoyGrowth >= 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                        {Math.abs(financialTools.projection.yoyGrowth)}% YoY
                      </Badge>
                      <span className="text-xs text-muted-foreground">compared to last year</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {financialTools.projection.daysRemaining} days remaining this month
                  </p>
                </CardContent>
              </Card>
            )}

            {financialTools?.revenueShare && (
              <Card data-testid="card-revenue-share">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenue Share Transparency
                  </CardTitle>
                  <CardDescription>See exactly how revenue is split</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Your Share</span>
                          <span className="text-sm font-bold" data-testid="text-your-share">
                            ${((financialTools.revenueShare.yourEarnings || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md bg-primary transition-all"
                            style={{ width: `${financialTools.revenueShare.yourPercentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Platform Share</span>
                          <span className="text-sm font-bold" data-testid="text-platform-share">
                            ${((financialTools.revenueShare.platformShare || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md bg-muted-foreground/30 transition-all"
                            style={{ width: `${100 - (financialTools.revenueShare.yourPercentage || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Total invoice revenue: ${((financialTools.revenueShare.totalInvoiceRevenue || 0) / 100).toFixed(2)}</span>
                      <span>Avg rate: {financialTools.revenueShare.avgCommissionRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {financialTools?.expenseOffset && businessMode && (
              <Card data-testid="card-expense-offset">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Expense Offset
                  </CardTitle>
                  <CardDescription>How your affiliate earnings compare to your subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Subscription</p>
                      <p className="text-sm font-bold">-${((financialTools.expenseOffset.subscriptionCostCents || 0) / 100).toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">This Month</p>
                      <p className="text-sm font-bold text-[hsl(var(--success))]">
                        +${((financialTools.expenseOffset.monthlyEarnings || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-md text-center ${financialTools.expenseOffset.monthlyNet >= 0 ? 'bg-[hsl(var(--success)/0.1)]' : 'bg-[hsl(var(--danger)/0.1)]'}`}>
                      <p className="text-xs text-muted-foreground">Net</p>
                      <p className={`text-sm font-bold ${financialTools.expenseOffset.monthlyNet >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`} data-testid="text-monthly-net">
                        {financialTools.expenseOffset.monthlyNet >= 0 ? '+' : ''}${((financialTools.expenseOffset.monthlyNet || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {financialTools.expenseOffset.isProfitable && (
                    <p className="text-xs text-[hsl(var(--success))] mt-3 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Your subscription pays for itself through affiliate earnings
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {financialTools?.churnAlerts && financialTools.churnAlerts.length > 0 && (
              <Card data-testid="card-churn-alerts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                    Churn Impact Alerts
                  </CardTitle>
                  <CardDescription>Recent referral cancellations and their earnings impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financialTools.churnAlerts.slice(0, 5).map((alert: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-md border" data-testid={`churn-alert-${i}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--danger)/0.1)] flex items-center justify-center">
                            <UserX className="h-4 w-4 text-[hsl(var(--danger))]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Referral #{alert.referralId.slice(0, 8)} churned</p>
                            <p className="text-xs text-muted-foreground">{new Date(alert.churnedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[hsl(var(--danger))]">-${((alert.lostEarnings || 0) / 100).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{alert.activeRemaining} active remaining</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {financialTools?.monthlyGrowthData && financialTools.monthlyGrowthData.some((m: any) => m.earnings > 0) && (
              <Card data-testid="card-compound-growth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Compound Growth
                  </CardTitle>
                  <CardDescription>Cumulative earnings growth this year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[140px] relative">
                    <svg viewBox={`0 0 ${Math.max(financialTools.monthlyGrowthData.length * 40, 200)} 130`} className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.3" />
                          <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const maxCum = Math.max(...financialTools.monthlyGrowthData.map((m: any) => m.cumulative), 1)
                        const pts = financialTools.monthlyGrowthData.map((m: any, i: number) => ({
                          x: (i / Math.max(financialTools.monthlyGrowthData.length - 1, 1)) * (financialTools.monthlyGrowthData.length * 40 - 10),
                          y: 120 - (m.cumulative / maxCum) * 110,
                        }))
                        return (
                          <>
                            <path
                              d={`M 0 120 ${pts.map((p: any) => `L ${p.x} ${p.y}`).join(' ')} L ${pts[pts.length - 1]?.x || 0} 120 Z`}
                              fill="url(#growthGrad)"
                            />
                            <polyline
                              points={pts.map((p: any) => `${p.x},${p.y}`).join(' ')}
                              fill="none"
                              className="stroke-primary"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            {pts.map((p: any, i: number) => (
                              <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-primary">
                                <title>{`${financialTools.monthlyGrowthData[i].month}: $${(financialTools.monthlyGrowthData[i].cumulative / 100).toFixed(2)} cumulative`}</title>
                              </circle>
                            ))}
                          </>
                        )
                      })()}
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                    {financialTools.monthlyGrowthData.map((m: any, i: number) => (
                      <span key={i}>{m.month}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : financialSubTab === 'referrals' ? (
          <div className="space-y-4">
            {financialTools?.earningsByReferral && financialTools.earningsByReferral.length > 0 ? (
              <Card data-testid="card-earnings-by-referral">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Earnings by Referral
                  </CardTitle>
                  <CardDescription>Revenue breakdown per referred customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financialTools.earningsByReferral.map((ref: any, i: number) => {
                      const maxEarn = financialTools.earningsByReferral[0]?.totalEarnings || 1
                      return (
                        <div key={ref.referralId} className="space-y-1" data-testid={`earnings-referral-${i}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">#{ref.referralId.slice(0, 8)}</span>
                              <Badge
                                variant={ref.status === 'converted' ? 'default' : ref.status === 'churned' ? 'destructive' : 'outline'}
                                className="text-[10px] capitalize"
                              >
                                {S(ref.status)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{ref.commissionCount} commissions</span>
                            </div>
                            <span className="text-sm font-bold">${(ref.totalEarnings / 100).toFixed(2)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-md overflow-hidden">
                            <div
                              className={`h-full rounded-md transition-all ${ref.status === 'churned' ? 'bg-[hsl(var(--danger))]' : 'bg-primary/70'}`}
                              style={{ width: `${Math.max((ref.totalEarnings / maxEarn) * 100, 2)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center py-8" data-testid="text-no-earnings-by-referral">
                    <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No referral earnings data yet.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : financialSubTab === 'history' ? (
          <div className="space-y-4">
            {financialTools?.multiYearHistory && financialTools.multiYearHistory.length > 0 ? (
              <Card data-testid="card-multi-year-history">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Multi-Year Financial History
                  </CardTitle>
                  <CardDescription>Year-over-year comparison of your affiliate performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialTools.multiYearHistory.map((yr: any) => (
                      <div key={yr.year} className="p-3 rounded-md border" data-testid={`year-history-${yr.year}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold">{S(yr.year)}</span>
                          <span className="text-sm font-bold text-primary">${(N(yr.earnings) / 100).toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Commissions</p>
                            <p className="text-xs font-medium">{N(yr.commissions)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Referrals</p>
                            <p className="text-xs font-medium">{N(yr.referrals)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Paid Out</p>
                            <p className="text-xs font-medium">${(N(yr.payouts) / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Financial history will appear once you start earning commissions.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card data-testid="card-commission-calculator">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Commission Calculator
                </CardTitle>
                <CardDescription>Estimate your potential earnings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Referrals</Label>
                    <Input
                      type="number"
                      value={calcReferrals}
                      onChange={e => setCalcReferrals(e.target.value)}
                      min="1"
                      className="mt-1"
                      data-testid="input-calc-referrals"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Price ($)</Label>
                    <Input
                      type="number"
                      value={calcPrice}
                      onChange={e => setCalcPrice(e.target.value)}
                      min="1"
                      className="mt-1"
                      data-testid="input-calc-price"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rate (%)</Label>
                    <Input
                      type="number"
                      value={calcRate || String(data?.stats?.effectiveRate || 30)}
                      onChange={e => setCalcRate(e.target.value)}
                      min="1"
                      max="100"
                      className="mt-1"
                      data-testid="input-calc-rate"
                    />
                  </div>
                </div>
                {(() => {
                  const refs = parseInt(calcReferrals) || 0
                  const price = parseFloat(calcPrice) || 0
                  const rate = parseFloat(calcRate || String(data?.stats?.effectiveRate || 30)) || 0
                  const monthlyEarning = refs * price * (rate / 100)
                  const annualEarning = monthlyEarning * 12
                  return (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <div className="p-3 rounded-md bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground">Monthly Earnings</p>
                        <p className="text-lg font-bold" data-testid="text-calc-monthly">${monthlyEarning.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-md bg-primary/10 text-center">
                        <p className="text-xs text-muted-foreground">Annual Earnings</p>
                        <p className="text-lg font-bold text-primary" data-testid="text-calc-annual">${annualEarning.toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card data-testid="card-split-estimator">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Commission Split Estimator
                </CardTitle>
                <CardDescription>See the detailed breakdown over time</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const price = parseFloat(calcPrice) || 49
                  const rate = parseFloat(calcRate || String(data?.stats?.effectiveRate || 30)) || 30
                  const commission = price * (rate / 100)
                  const months = [1, 3, 6, 12]
                  return (
                    <div className="space-y-2">
                      {months.map(m => (
                        <div key={m} className="flex items-center justify-between p-3 rounded-md border" data-testid={`split-month-${m}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{m} month{m !== 1 ? 's' : ''}</span>
                            <span className="text-xs text-muted-foreground">at ${price}/mo</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">${(commission * m).toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">{rate}% of ${(price * m).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card data-testid="card-csv-export">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </CardTitle>
                <CardDescription>Download your financial data as CSV for records or taxes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCsvExport('commissions')}
                    disabled={csvExporting}
                    data-testid="button-export-commissions"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Commissions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCsvExport('referrals')}
                    disabled={csvExporting}
                    data-testid="button-export-referrals"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Referrals
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCsvExport('payouts')}
                    disabled={csvExporting}
                    data-testid="button-export-payouts"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Payouts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCsvExport('bookkeeping')}
                    disabled={csvExporting}
                    data-testid="button-export-bookkeeping"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Bookkeeping
                  </Button>
                </div>
                {csvExporting && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Generating export...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
  }

  const renderPayouts = () => {
    if (!data) return null
    return (
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
                      {S(payout.status)}
                    </Badge>
                    <p className="text-sm font-medium">${(N(payout.amount_cents) / 100).toFixed(2)}</p>
                    <span className="text-xs text-muted-foreground">{S(payout.method)}</span>
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

      <PayoutHistoryPanel />

      {/* Partner Experience Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EarningsGoalSetter />
        <ReferralOfMonth />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AffiliateManagerCard />
        <GracePeriodNotice />
      </div>

      <WeeklyChallengesPanel />
    </div>
  )
  }

  const renderAssets = () => {
    const availableTypes = [...new Set(assets.map(a => a.asset_type))]
    const filteredAssets = assets
      .filter(a => assetTypeFilter === 'all' || a.asset_type === assetTypeFilter)
      .filter(a => {
        if (!assetSearch.trim()) return true
        const q = assetSearch.toLowerCase()
        return (a.title?.toLowerCase().includes(q)) || (a.description?.toLowerCase().includes(q))
      })

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" data-testid="text-assets-heading">Resource Center</h2>
        <p className="text-sm text-muted-foreground -mt-2">Swipe files, templates, guides, and more to help you promote and earn</p>

        {assets.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search resources..."
                value={assetSearch}
                onChange={e => setAssetSearch(e.target.value)}
                data-testid="input-asset-search"
              />
            </div>
            <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-asset-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types ({assets.length})</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {ASSET_TYPE_LABELS[type] || type.replace('_', ' ')} ({assets.filter(a => a.asset_type === type).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {assets.length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="text-center py-8" data-testid="text-no-assets">
                <FileImage className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No marketing assets available yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No resources match your filter.</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setAssetTypeFilter('all'); setAssetSearch('') }} data-testid="button-clear-asset-filters">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAssets.map(asset => {
              const Icon = ASSET_TYPE_ICONS[asset.asset_type] || FileText
              return (
                <Card key={asset.id} data-testid={`asset-${asset.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{S(asset.title)}</p>
                          {asset.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{S(asset.description)}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type.replace('_', ' ')}
                            </Badge>
                            {(asset as any).is_top_performer && <TopPerformerBadge />}
                            {(asset as any).usage_stats?.total > 0 && <AssetUsageBadge count={(asset as any).usage_stats.total} />}
                          </div>
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
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer" download={asset.file_name || true}>
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    {asset.content && (
                      <pre className="mt-3 p-3 rounded bg-muted text-xs overflow-auto max-h-32 whitespace-pre-wrap" data-testid={`content-asset-${asset.id}`}>
                        {S(asset.content)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      <SwipeFileLibrary />
      <CaseStudyLibrary />
      </div>
    )
  }

  const loadWebhooks = useCallback(async () => {
    setWebhooksLoading(true)
    try {
      const res = await fetch('/api/affiliate/webhooks')
      if (res.ok) {
        const d = await res.json()
        setWebhooks(d.webhooks || [])
      }
    } catch (e) {
      console.error('Failed to load webhooks:', e)
    } finally {
      setWebhooksLoading(false)
    }
  }, [])

  const createWebhook = async () => {
    if (!webhookUrl.trim()) return
    setWebhookCreating(true)
    try {
      const res = await fetch('/api/affiliate/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, events: webhookEvents }),
      })
      const d = await res.json()
      if (res.ok) {
        setWebhookSecret(d.secret)
        setWebhookUrl('')
        setWebhookEvents(['affiliate.commission', 'affiliate.payout'])
        await loadWebhooks()
        toast({ title: 'Webhook Created', description: 'Copy the signing secret below — it will only be shown once.' })
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to create webhook', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create webhook', variant: 'destructive' })
    } finally {
      setWebhookCreating(false)
    }
  }

  const deleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/affiliate/webhooks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setWebhooks(prev => prev.filter(w => w.id !== id))
        toast({ title: 'Deleted', description: 'Webhook removed.' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete webhook', variant: 'destructive' })
    }
  }

  const testWebhook = async (id: string) => {
    setWebhookTesting(id)
    try {
      const res = await fetch(`/api/affiliate/webhooks/${id}/test`, { method: 'POST' })
      const d = await res.json()
      if (d.success) {
        toast({ title: 'Test Sent', description: `Response: ${d.status} OK` })
      } else {
        toast({ title: 'Test Failed', description: `Status: ${d.status || 'N/A'} — ${d.body?.slice(0, 100) || 'No response'}`, variant: 'destructive' })
      }
      await loadWebhookDeliveries(id)
    } catch {
      toast({ title: 'Error', description: 'Failed to send test', variant: 'destructive' })
    } finally {
      setWebhookTesting(null)
    }
  }

  const loadWebhookDeliveries = async (webhookId: string) => {
    try {
      const res = await fetch(`/api/affiliate/webhooks/${webhookId}/deliveries`)
      if (res.ok) {
        const d = await res.json()
        setWebhookDeliveries(prev => ({ ...prev, [webhookId]: d.deliveries || [] }))
      }
    } catch (e) {
      console.error('Failed to load deliveries:', e)
    }
  }

  const toggleWebhookEvent = (event: string) => {
    setWebhookEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  const AVAILABLE_WEBHOOK_EVENTS = [
    { value: 'affiliate.click', label: 'Click Tracked' },
    { value: 'affiliate.signup', label: 'Signup' },
    { value: 'affiliate.commission', label: 'Commission Earned' },
    { value: 'affiliate.payout', label: 'Payout Processed' },
    { value: 'affiliate.tier_change', label: 'Tier Change' },
    { value: 'affiliate.milestone', label: 'Milestone Reached' },
  ]

  useEffect(() => {
    if (section === 'tools' && webhooks.length === 0 && !webhooksLoading) {
      loadWebhooks()
    }
  }, [section, loadWebhooks])

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true)
    try {
      const res = await fetch('/api/affiliate/messages')
      if (res.ok) {
        const json = await res.json()
        setMessages(json.messages || [])
        const unread = (json.messages || []).filter((m: any) => m.sender_role === 'admin' && !m.is_read).length
        setUnreadMessages(unread)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  const sendMessage = async () => {
    if (!messageBody.trim() || messageSending) return
    setMessageSending(true)
    try {
      const res = await fetch('/api/affiliate/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageBody.trim() }),
      })
      if (res.ok) {
        setMessageBody('')
        await loadMessages()
        toast({ title: 'Sent', description: 'Your message has been sent.' })
      } else {
        const json = await res.json()
        toast({ title: 'Error', description: json.error || 'Failed to send message', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
    } finally {
      setMessageSending(false)
    }
  }

  const markMessagesRead = async () => {
    try {
      await fetch('/api/affiliate/messages/read', { method: 'PATCH' })
      setUnreadMessages(0)
      setMessages(prev => prev.map(m => m.sender_role === 'admin' ? { ...m, is_read: true } : m))
    } catch (err) {
      console.error('Failed to mark messages read:', err)
    }
  }

  useEffect(() => {
    if (section === 'messages' && messages.length === 0 && !messagesLoading) {
      loadMessages()
    }
    if (section === 'messages' && unreadMessages > 0) {
      markMessagesRead()
    }
  }, [section, loadMessages])

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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data?.link?.shareUrl || "")}`}
                alt="Referral QR Code"
                className="w-48 h-48"
                data-testid="img-qr-code"
              />
            </div>
            <Button variant="outline" size="sm" asChild data-testid="button-download-qr">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(data?.link?.shareUrl || "")}`}
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
                    <span className="font-medium">{S(p.name)}</span>
                    <span className="text-xs text-muted-foreground ml-2">{S(p.page_path)}{p.source_tag ? ` (${S(p.source_tag)})` : ''}</span>
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
          <CardDescription>Your personal brand in action — share your code with potential customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-md bg-muted/30 text-xs text-muted-foreground" data-testid="text-code-coaching">
            Your discount code is your personal brand in action. Choose something memorable that your audience will associate with YOU — your name, your show, your catchphrase. Great codes are short, easy to say out loud, and easy to remember. Codes are first-come, first-served — the more unique to your brand, the better!
          </div>

          {discountCodes.length > 0 ? (
            <div className="space-y-3">
              {discountCodes.map(code => {
                const cooldownEnd = code.last_renamed_at
                  ? new Date(new Date(code.last_renamed_at).getTime() + 30 * 24 * 60 * 60 * 1000)
                  : null
                const canRename = !cooldownEnd || cooldownEnd <= new Date()
                const cooldownDays = cooldownEnd && cooldownEnd > new Date()
                  ? Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0

                return (
                  <div key={code.id} data-testid={`discount-code-${code.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/40">
                      <div>
                        <span className="font-mono font-bold text-lg" data-testid={`text-code-value-${code.id}`}>{code.code}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs">{code.discount_percent}% off</Badge>
                          {code.is_active ? (
                            <Badge variant="outline" className="text-xs text-[hsl(var(--success))]">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                          )}
                          {code.current_uses !== undefined && (
                            <span className="text-xs text-muted-foreground">{code.current_uses} uses</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(code.code); toast({ title: 'Copied!', description: 'Promo code copied to clipboard.' }) }} data-testid={`button-copy-code-${code.id}`}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        {code.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (renameCode === code.id) {
                                setRenameCode(null)
                                setRenameValue('')
                                setRenameError('')
                                setRenameSuggestions([])
                              } else {
                                setRenameCode(code.id)
                                setRenameValue(code.code)
                                setRenameError('')
                                setRenameSuggestions([])
                              }
                            }}
                            disabled={!canRename}
                            title={canRename ? 'Rename your code' : `Rename available in ${cooldownDays} days`}
                            data-testid={`button-rename-code-${code.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {!canRename && (
                      <p className="text-[10px] text-muted-foreground mt-1 px-1">
                        Rename available in {cooldownDays} day{cooldownDays !== 1 ? 's' : ''}. Cooldown prevents confusion with existing content that references your current code.
                      </p>
                    )}

                    {renameCode === code.id && (
                      <div className="mt-2 p-3 rounded-md border space-y-2" data-testid="form-rename-code">
                        <Label className="text-xs font-medium">Rename Your Code</Label>
                        <div className="flex gap-2">
                          <Input
                            value={renameValue}
                            onChange={e => { setRenameValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setRenameError(''); setRenameSuggestions([]) }}
                            placeholder="YOURNEWCODE"
                            maxLength={20}
                            className="font-mono flex-1"
                            data-testid="input-rename-code"
                          />
                          <Button size="sm" onClick={() => handleRenameCode(code.id)} disabled={renaming || !renameValue.trim() || renameValue === code.code} data-testid="button-confirm-rename">
                            {renaming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setRenameCode(null); setRenameValue(''); setRenameError(''); setRenameSuggestions([]) }} data-testid="button-cancel-rename">
                            Cancel
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Uppercase letters and numbers only, 4-20 characters. You can rename once every 30 days.</p>

                        {renameError && (
                          <div className="p-2 rounded-md bg-destructive/10 text-xs text-destructive" data-testid="text-rename-error">
                            {renameError}
                          </div>
                        )}

                        {renameSuggestions.length > 0 && (
                          <div className="space-y-1" data-testid="rename-suggestions">
                            <Label className="text-xs text-muted-foreground">Try one of these instead:</Label>
                            <div className="flex flex-wrap gap-1">
                              {renameSuggestions.map(s => (
                                <Button key={s} variant="outline" size="sm" className="h-7 text-xs font-mono" onClick={() => { setRenameValue(s); setRenameError(''); setRenameSuggestions([]) }} data-testid={`button-suggestion-${s}`}>
                                  {s}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="p-3 rounded-md bg-muted/30 text-xs text-muted-foreground" data-testid="text-code-protip">
                <strong>Pro tip:</strong> Say your code out loud. If it's easy to say on a podcast or livestream, your audience is more likely to remember it.
              </div>

              <div className="p-3 rounded-md bg-muted/30 text-xs text-muted-foreground" data-testid="text-code-performance">
                Every use of your code earns you commission. Share it in your bio, your email signature, your content descriptions. Even if someone uses your code 5 years from now, you'll still earn credit under your active terms.
              </div>
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
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${appName}! ${data?.link?.shareUrl || ""}`)}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Twitter / X
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-facebook">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data?.link?.shareUrl || "")}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Facebook
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-linkedin">
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data?.link?.shareUrl || "")}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> LinkedIn
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild data-testid="button-share-email">
              <a href={`mailto:?subject=${encodeURIComponent(`Check out ${appName}`)}&body=${encodeURIComponent(`I've been using ${appName} and thought you'd love it too!\n\n${data?.link?.shareUrl || ""}`)}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Email
              </a>
            </Button>
          </div>
          <div className="mt-3 p-3 rounded-md bg-muted/40">
            <Label className="text-xs text-muted-foreground mb-1 block">Quick Copy Text</Label>
            <p className="text-xs mb-2">Check out {appName}! Sign up with my link for a special offer: {data?.link?.shareUrl || ""}</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(`Check out ${appName}! Sign up with my link for a special offer: ${data?.link?.shareUrl || ""}`); toast({ title: 'Copied!', description: 'Sharing text copied to clipboard.' }) }} data-testid="button-copy-share-text">
              <Copy className="h-3 w-3 mr-1" /> Copy Text
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-landing-page-editor">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Co-Branded Landing Page
          </CardTitle>
          <CardDescription>Create a personalized landing page with your branding and referral link built in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {landingPageLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Headline</Label>
                  <Input
                    value={lpHeadline}
                    onChange={e => setLpHeadline(e.target.value)}
                    placeholder="Your personalized headline"
                    className="mt-1"
                    data-testid="input-lp-headline"
                  />
                </div>
                <div>
                  <Label className="text-xs">Call to Action Button Text</Label>
                  <Input
                    value={lpCta}
                    onChange={e => setLpCta(e.target.value)}
                    placeholder="Get Started"
                    className="mt-1"
                    data-testid="input-lp-cta"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Bio / Description</Label>
                <Input
                  value={lpBio}
                  onChange={e => setLpBio(e.target.value)}
                  placeholder="Tell visitors why they should sign up through you"
                  className="mt-1"
                  data-testid="input-lp-bio"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Photo URL</Label>
                  <Input
                    value={lpPhotoUrl}
                    onChange={e => setLpPhotoUrl(e.target.value)}
                    placeholder="https://example.com/your-photo.jpg"
                    className="mt-1"
                    data-testid="input-lp-photo"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Palette className="h-3 w-3" /> Theme Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={lpThemeColor}
                      onChange={e => setLpThemeColor(e.target.value)}
                      className="w-9 h-9 rounded-md border cursor-pointer"
                      data-testid="input-lp-color"
                    />
                    <Input
                      value={lpThemeColor}
                      onChange={e => setLpThemeColor(e.target.value)}
                      className="flex-1 font-mono text-xs"
                      data-testid="input-lp-color-text"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lp-active-toggle"
                  checked={lpActive}
                  onChange={e => setLpActive(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-lp-active"
                />
                <Label htmlFor="lp-active-toggle" className="text-xs cursor-pointer">Page is active and publicly visible</Label>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={saveLandingPage} disabled={landingPageSaving} data-testid="button-save-landing-page">
                  {landingPageSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  {landingPage ? 'Save Changes' : 'Create Landing Page'}
                </Button>
                {landingPage?.slug && (
                  <Button variant="outline" size="sm" asChild data-testid="button-preview-landing-page">
                    <a href={`/partner/${landingPage.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </a>
                  </Button>
                )}
              </div>
              {landingPage?.slug && (
                <div className="p-3 rounded-md bg-muted/40 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Your Landing Page URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/partner/${landingPage.slug}`}
                      readOnly
                      className="font-mono text-xs"
                      data-testid="input-lp-url"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(`${window.location.origin}/partner/${landingPage.slug}`)}
                      data-testid="button-copy-lp-url"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {landingPage.views !== undefined && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {landingPage.views} view{landingPage.views !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-post-writer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            AI Post Writer
          </CardTitle>
          <CardDescription>Generate platform-specific promotional posts with your referral link automatically embedded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={promoPlatform} onValueChange={setPromoPlatform}>
                <SelectTrigger className="mt-1" data-testid="select-ai-writer-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="blog">Blog Snippet</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tone</Label>
              <Select value={promoTone} onValueChange={setPromoTone}>
                <SelectTrigger className="mt-1" data-testid="select-ai-writer-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Focus / Topic (optional)</Label>
            <Input
              value={aiWriterFocus}
              onChange={(e) => setAiWriterFocus(e.target.value)}
              placeholder="e.g. time-saving features, pricing, free trial..."
              className="mt-1"
              data-testid="input-ai-writer-focus"
            />
          </div>
          {data?.link?.ref_code && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>Your ref link will be embedded: <span className="font-mono text-foreground" data-testid="text-ai-writer-ref-link">?ref={data?.link?.ref_code}</span></span>
            </div>
          )}
          <Button onClick={generateAiWriterPost} disabled={aiWriterGenerating} data-testid="button-ai-writer-generate">
            {aiWriterGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {aiWriterGenerating ? 'Generating...' : 'Generate Post'}
          </Button>
          {aiWriterPost && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted/40 text-sm whitespace-pre-wrap" data-testid="text-ai-writer-post">
                {aiWriterPost}
              </div>
              {aiWriterHashtags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-1">Hashtags:</span>
                  {aiWriterHashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-ai-writer-hashtag-${i}`}>{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={copyAiWriterPost} data-testid="button-ai-writer-copy">
                    {aiWriterCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {aiWriterCopied ? 'Copied!' : 'Copy Post'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={generateAiWriterPost} disabled={aiWriterGenerating} data-testid="button-ai-writer-regenerate">
                    <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground" data-testid="text-ai-writer-char-count">
                  {aiWriterCharCount} characters
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="border-t pt-4">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2" data-testid="text-ai-content-suite-heading">
          <Zap className="h-4 w-4" />
          AI Content Suite
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Advanced AI tools to create promotional content, optimize conversions, and grow your affiliate earnings.</p>
      </div>

      <Card data-testid="card-ai-email-draft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            AI Email Draft Generator
          </CardTitle>
          <CardDescription>Generate complete promotional emails with your referral link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Purpose</Label>
              <Select value={aiEmailPurpose} onValueChange={setAiEmailPurpose}>
                <SelectTrigger className="mt-1" data-testid="select-ai-email-purpose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold outreach">Cold Outreach</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="newsletter mention">Newsletter Mention</SelectItem>
                  <SelectItem value="personal recommendation">Personal Recommendation</SelectItem>
                  <SelectItem value="re-engagement">Re-engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target Audience</Label>
              <Input value={aiEmailAudience} onChange={e => setAiEmailAudience(e.target.value)} placeholder="e.g. freelancers, coaches..." className="mt-1" data-testid="input-ai-email-audience" />
            </div>
            <div>
              <Label className="text-xs">Tone</Label>
              <Select value={aiEmailTone} onValueChange={setAiEmailTone}>
                <SelectTrigger className="mt-1" data-testid="select-ai-email-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => generateAiTool('email', '/api/affiliate/ai-email-draft', { purpose: aiEmailPurpose, audience: aiEmailAudience, tone: aiEmailTone })} disabled={aiToolGenerating && aiToolActive === 'email'} data-testid="button-ai-email-generate">
            {aiToolGenerating && aiToolActive === 'email' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Email
          </Button>
          {aiToolResult && aiToolActive === 'email' && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted/40 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Subject Line:</p>
                <p className="text-sm font-medium" data-testid="text-ai-email-subject">{aiToolResult.subject}</p>
                <p className="text-xs font-medium text-muted-foreground mt-2">Email Body:</p>
                <p className="text-sm whitespace-pre-wrap" data-testid="text-ai-email-body">{aiToolResult.body}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyAiToolContent(`Subject: ${aiToolResult.subject}\n\n${aiToolResult.body}`)} data-testid="button-ai-email-copy">
                  {aiToolCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {aiToolCopied ? 'Copied!' : 'Copy Email'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateAiTool('email', '/api/affiliate/ai-email-draft', { purpose: aiEmailPurpose, audience: aiEmailAudience, tone: aiEmailTone })} disabled={aiToolGenerating} data-testid="button-ai-email-regenerate">
                  <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-blog-outline">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            AI Blog Post Outline
          </CardTitle>
          <CardDescription>Get a structured blog post outline with SEO keywords and your referral link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Topic / Angle</Label>
              <Input value={aiBlogTopic} onChange={e => setAiBlogTopic(e.target.value)} placeholder="e.g. productivity tips, tool review..." className="mt-1" data-testid="input-ai-blog-topic" />
            </div>
            <div>
              <Label className="text-xs">Target Audience</Label>
              <Input value={aiBlogAudience} onChange={e => setAiBlogAudience(e.target.value)} placeholder="e.g. small business owners" className="mt-1" data-testid="input-ai-blog-audience" />
            </div>
            <div>
              <Label className="text-xs">Blog Style</Label>
              <Select value={aiBlogStyle} onValueChange={setAiBlogStyle}>
                <SelectTrigger className="mt-1" data-testid="select-ai-blog-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="how-to">How-To Guide</SelectItem>
                  <SelectItem value="review">Product Review</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => generateAiTool('blog', '/api/affiliate/ai-blog-outline', { topic: aiBlogTopic, audience: aiBlogAudience, style: aiBlogStyle })} disabled={aiToolGenerating && aiToolActive === 'blog'} data-testid="button-ai-blog-generate">
            {aiToolGenerating && aiToolActive === 'blog' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Outline
          </Button>
          {aiToolResult && aiToolActive === 'blog' && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted/40 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Title:</p>
                  <p className="text-sm font-semibold" data-testid="text-ai-blog-title">{aiToolResult.title}</p>
                </div>
                {aiToolResult.metaDescription && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Meta Description:</p>
                    <p className="text-xs" data-testid="text-ai-blog-meta">{aiToolResult.metaDescription}</p>
                  </div>
                )}
                {aiToolResult.sections?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Sections:</p>
                    {aiToolResult.sections.map((s: any, i: number) => (
                      <div key={i} className="pl-3 border-l-2 border-muted" data-testid={`section-blog-${i}`}>
                        <p className="text-sm font-medium">{s.heading}</p>
                        {s.keyPoints?.map((kp: string, j: number) => (
                          <p key={j} className="text-xs text-muted-foreground ml-2">- {kp}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {aiToolResult.keywords?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">Keywords:</span>
                    {aiToolResult.keywords.map((kw: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-blog-keyword-${i}`}>{kw}</Badge>
                    ))}
                  </div>
                )}
                {aiToolResult.ctaText && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">CTA:</p>
                    <p className="text-xs" data-testid="text-ai-blog-cta">{aiToolResult.ctaText}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => {
                  const text = `# ${aiToolResult.title}\n\n${aiToolResult.metaDescription ? `Meta: ${aiToolResult.metaDescription}\n\n` : ''}${aiToolResult.sections?.map((s: any) => `## ${s.heading}\n${s.keyPoints?.map((kp: string) => `- ${kp}`).join('\n') || ''}`).join('\n\n') || ''}\n\n${aiToolResult.ctaText || ''}\n\nKeywords: ${aiToolResult.keywords?.join(', ') || ''}`
                  copyAiToolContent(text)
                }} data-testid="button-ai-blog-copy">
                  {aiToolCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {aiToolCopied ? 'Copied!' : 'Copy Outline'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateAiTool('blog', '/api/affiliate/ai-blog-outline', { topic: aiBlogTopic, audience: aiBlogAudience, style: aiBlogStyle })} disabled={aiToolGenerating} data-testid="button-ai-blog-regenerate">
                  <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-video-script">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4" />
            AI Video Script Generator
          </CardTitle>
          <CardDescription>Create video scripts with hooks, sections, and CTAs for YouTube and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Video Type</Label>
              <Select value={aiVideoType} onValueChange={setAiVideoType}>
                <SelectTrigger className="mt-1" data-testid="select-ai-video-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">Product Review</SelectItem>
                  <SelectItem value="tutorial">Tutorial / How-To</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="unboxing">Unboxing / First Look</SelectItem>
                  <SelectItem value="tips">Tips & Tricks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target Duration</Label>
              <Select value={aiVideoDuration} onValueChange={setAiVideoDuration}>
                <SelectTrigger className="mt-1" data-testid="select-ai-video-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 minutes">Short (1-2 min)</SelectItem>
                  <SelectItem value="5-7 minutes">Medium (5-7 min)</SelectItem>
                  <SelectItem value="10-15 minutes">Long (10-15 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={aiVideoPlatform} onValueChange={setAiVideoPlatform}>
                <SelectTrigger className="mt-1" data-testid="select-ai-video-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram-reels">Instagram Reels</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => generateAiTool('video', '/api/affiliate/ai-video-script', { videoType: aiVideoType, duration: aiVideoDuration, platform: aiVideoPlatform })} disabled={aiToolGenerating && aiToolActive === 'video'} data-testid="button-ai-video-generate">
            {aiToolGenerating && aiToolActive === 'video' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Script
          </Button>
          {aiToolResult && aiToolActive === 'video' && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted/40 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Title:</p>
                  <p className="text-sm font-semibold" data-testid="text-ai-video-title">{aiToolResult.title}</p>
                </div>
                {aiToolResult.thumbnailConcept && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Thumbnail Concept:</p>
                    <p className="text-xs" data-testid="text-ai-video-thumbnail">{aiToolResult.thumbnailConcept}</p>
                  </div>
                )}
                {aiToolResult.hook && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Hook (first 10 seconds):</p>
                    <p className="text-sm italic" data-testid="text-ai-video-hook">{aiToolResult.hook}</p>
                  </div>
                )}
                {aiToolResult.sections?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Script Sections:</p>
                    {aiToolResult.sections.map((s: any, i: number) => (
                      <div key={i} className="pl-3 border-l-2 border-muted space-y-1" data-testid={`section-video-${i}`}>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs whitespace-pre-wrap">{s.script}</p>
                        {s.visualNotes && <p className="text-[10px] text-muted-foreground">[Visual: {s.visualNotes}]</p>}
                      </div>
                    ))}
                  </div>
                )}
                {aiToolResult.cta && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">CTA:</p>
                    <p className="text-sm" data-testid="text-ai-video-cta">{aiToolResult.cta}</p>
                  </div>
                )}
                {aiToolResult.estimatedDuration && (
                  <p className="text-xs text-muted-foreground">Est. duration: {aiToolResult.estimatedDuration}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => {
                  const text = `Title: ${aiToolResult.title}\n\nHook: ${aiToolResult.hook || ''}\n\n${aiToolResult.sections?.map((s: any) => `--- ${s.name} ---\n${s.script}${s.visualNotes ? `\n[Visual: ${s.visualNotes}]` : ''}`).join('\n\n') || ''}\n\nCTA: ${aiToolResult.cta || ''}`
                  copyAiToolContent(text)
                }} data-testid="button-ai-video-copy">
                  {aiToolCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {aiToolCopied ? 'Copied!' : 'Copy Script'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateAiTool('video', '/api/affiliate/ai-video-script', { videoType: aiVideoType, duration: aiVideoDuration, platform: aiVideoPlatform })} disabled={aiToolGenerating} data-testid="button-ai-video-regenerate">
                  <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-ad-copy">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            AI Ad Copy Generator
          </CardTitle>
          <CardDescription>Generate ad variations for Facebook, Instagram, Google, and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Ad Platform</Label>
              <Select value={aiAdPlatform} onValueChange={setAiAdPlatform}>
                <SelectTrigger className="mt-1" data-testid="select-ai-ad-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook / Instagram</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Campaign Objective</Label>
              <Select value={aiAdObjective} onValueChange={setAiAdObjective}>
                <SelectTrigger className="mt-1" data-testid="select-ai-ad-objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target Audience</Label>
              <Input value={aiAdAudience} onChange={e => setAiAdAudience(e.target.value)} placeholder="e.g. solopreneurs, creators..." className="mt-1" data-testid="input-ai-ad-audience" />
            </div>
          </div>
          <Button onClick={() => generateAiTool('adcopy', '/api/affiliate/ai-ad-copy', { platform: aiAdPlatform, objective: aiAdObjective, audience: aiAdAudience })} disabled={aiToolGenerating && aiToolActive === 'adcopy'} data-testid="button-ai-ad-generate">
            {aiToolGenerating && aiToolActive === 'adcopy' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Ad Copy
          </Button>
          {aiToolResult && aiToolActive === 'adcopy' && (
            <div className="space-y-3">
              {aiToolResult.variations?.map((v: any, i: number) => (
                <div key={i} className="p-3 rounded-md bg-muted/40 space-y-2" data-testid={`ad-variation-${i}`}>
                  <Badge variant="secondary" className="text-xs">{v.angle || `Variation ${i + 1}`}</Badge>
                  <p className="text-sm font-semibold">{v.headline}</p>
                  <p className="text-xs">{v.primaryText}</p>
                  {v.ctaText && <p className="text-xs text-muted-foreground">CTA: {v.ctaText}</p>}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyAiToolContent(`${v.headline}\n\n${v.primaryText}\n\nCTA: ${v.ctaText || ''}\nURL: ${v.destinationUrl || aiToolResult.shareUrl}`)} data-testid={`button-copy-ad-${i}`}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              ))}
              {aiToolResult.tips?.length > 0 && (
                <div className="p-3 rounded-md bg-muted/20 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tips:</p>
                  {aiToolResult.tips.map((tip: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">- {tip}</p>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => generateAiTool('adcopy', '/api/affiliate/ai-ad-copy', { platform: aiAdPlatform, objective: aiAdObjective, audience: aiAdAudience })} disabled={aiToolGenerating} data-testid="button-ai-ad-regenerate">
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-audience-content">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Audience-Aware Content
          </CardTitle>
          <CardDescription>Generate niche-specific content tailored to your audience's pain points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Your Niche</Label>
              <Input value={aiAudienceNiche} onChange={e => setAiAudienceNiche(e.target.value)} placeholder="e.g. fitness coaches, SaaS founders..." className="mt-1" data-testid="input-ai-audience-niche" />
            </div>
            <div>
              <Label className="text-xs">Audience Description</Label>
              <Input value={aiAudienceDesc} onChange={e => setAiAudienceDesc(e.target.value)} placeholder="e.g. busy professionals who..." className="mt-1" data-testid="input-ai-audience-desc" />
            </div>
            <div>
              <Label className="text-xs">Content Type</Label>
              <Select value={aiAudienceType} onValueChange={setAiAudienceType}>
                <SelectTrigger className="mt-1" data-testid="select-ai-audience-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_post">Social Post</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="blog_snippet">Blog Snippet</SelectItem>
                  <SelectItem value="talking_points">Talking Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => generateAiTool('audience', '/api/affiliate/ai-audience-content', { niche: aiAudienceNiche, audienceDescription: aiAudienceDesc, contentType: aiAudienceType })} disabled={aiToolGenerating && aiToolActive === 'audience'} data-testid="button-ai-audience-generate">
            {aiToolGenerating && aiToolActive === 'audience' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Content
          </Button>
          {aiToolResult && aiToolActive === 'audience' && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted/40 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Generated Content:</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-ai-audience-content">{aiToolResult.content}</p>
                </div>
                {aiToolResult.painPoints?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pain Points Addressed:</p>
                    {aiToolResult.painPoints.map((pp: string, i: number) => (
                      <p key={i} className="text-xs ml-2">- {pp}</p>
                    ))}
                  </div>
                )}
                {aiToolResult.hooks?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Alternative Hooks:</p>
                    {aiToolResult.hooks.map((h: string, i: number) => (
                      <p key={i} className="text-xs ml-2 italic">"{h}"</p>
                    ))}
                  </div>
                )}
                {aiToolResult.hashtags?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">Hashtags:</span>
                    {aiToolResult.hashtags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyAiToolContent(aiToolResult.content)} data-testid="button-ai-audience-copy">
                  {aiToolCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {aiToolCopied ? 'Copied!' : 'Copy Content'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateAiTool('audience', '/api/affiliate/ai-audience-content', { niche: aiAudienceNiche, audienceDescription: aiAudienceDesc, contentType: aiAudienceType })} disabled={aiToolGenerating} data-testid="button-ai-audience-regenerate">
                  <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-pitch-customizer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            AI Pitch Customizer
          </CardTitle>
          <CardDescription>Create personalized pitches based on prospect information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Prospect Info</Label>
              <Input value={aiPitchProspect} onChange={e => setAiPitchProspect(e.target.value)} placeholder="e.g. Fitness coach with 10k followers..." className="mt-1" data-testid="input-ai-pitch-prospect" />
            </div>
            <div>
              <Label className="text-xs">Prospect Website/URL (optional)</Label>
              <Input value={aiPitchUrl} onChange={e => setAiPitchUrl(e.target.value)} placeholder="https://their-website.com" className="mt-1" data-testid="input-ai-pitch-url" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Relationship</Label>
            <Select value={aiPitchRelationship} onValueChange={setAiPitchRelationship}>
              <SelectTrigger className="mt-1 max-w-xs" data-testid="select-ai-pitch-relationship">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold">Cold (never met)</SelectItem>
                <SelectItem value="warm">Warm (mutual connection)</SelectItem>
                <SelectItem value="existing">Existing Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => generateAiTool('pitch', '/api/affiliate/ai-pitch-customizer', { prospectInfo: aiPitchProspect, prospectUrl: aiPitchUrl, relationship: aiPitchRelationship })} disabled={aiToolGenerating && aiToolActive === 'pitch'} data-testid="button-ai-pitch-generate">
            {aiToolGenerating && aiToolActive === 'pitch' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Pitch
          </Button>
          {aiToolResult && aiToolActive === 'pitch' && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted/40 space-y-3">
                {aiToolResult.subjectLine && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Subject Line:</p>
                    <p className="text-sm font-medium" data-testid="text-ai-pitch-subject">{aiToolResult.subjectLine}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pitch:</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-ai-pitch-body">{aiToolResult.pitch}</p>
                </div>
                {aiToolResult.keyPersonalization?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Personalization Points:</p>
                    {aiToolResult.keyPersonalization.map((kp: string, i: number) => (
                      <p key={i} className="text-xs ml-2">- {kp}</p>
                    ))}
                  </div>
                )}
                {aiToolResult.followUpSuggestion && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Follow-up if no response:</p>
                    <p className="text-xs italic" data-testid="text-ai-pitch-followup">{aiToolResult.followUpSuggestion}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyAiToolContent(`${aiToolResult.subjectLine ? `Subject: ${aiToolResult.subjectLine}\n\n` : ''}${aiToolResult.pitch}`)} data-testid="button-ai-pitch-copy">
                  {aiToolCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {aiToolCopied ? 'Copied!' : 'Copy Pitch'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateAiTool('pitch', '/api/affiliate/ai-pitch-customizer', { prospectInfo: aiPitchProspect, prospectUrl: aiPitchUrl, relationship: aiPitchRelationship })} disabled={aiToolGenerating} data-testid="button-ai-pitch-regenerate">
                  <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-objection-handler">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            AI Objection Handler
          </CardTitle>
          <CardDescription>Get smart responses to counter common objections from prospects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">The Objection</Label>
              <Input value={aiObjection} onChange={e => setAiObjection(e.target.value)} placeholder='e.g. "It is too expensive", "I already use X"' className="mt-1" data-testid="input-ai-objection" />
            </div>
            <div>
              <Label className="text-xs">Context (optional)</Label>
              <Input value={aiObjectionContext} onChange={e => setAiObjectionContext(e.target.value)} placeholder="e.g. DM conversation, in-person meeting..." className="mt-1" data-testid="input-ai-objection-context" />
            </div>
          </div>
          <Button onClick={() => generateAiTool('objection', '/api/affiliate/ai-objection-handler', { objection: aiObjection, context: aiObjectionContext })} disabled={aiToolGenerating && aiToolActive === 'objection'} data-testid="button-ai-objection-generate">
            {aiToolGenerating && aiToolActive === 'objection' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Get Responses
          </Button>
          {aiToolResult && aiToolActive === 'objection' && (
            <div className="space-y-3">
              {aiToolResult.responses?.map((r: any, i: number) => (
                <div key={i} className="p-3 rounded-md bg-muted/40 space-y-2" data-testid={`objection-response-${i}`}>
                  <Badge variant="secondary" className="text-xs">{r.approach}</Badge>
                  <p className="text-sm">{r.response}</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyAiToolContent(r.response)} data-testid={`button-copy-objection-${i}`}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              ))}
              {aiToolResult.alternativeFraming && (
                <div className="p-3 rounded-md bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground">Alternative Value Framing:</p>
                  <p className="text-sm" data-testid="text-ai-objection-framing">{aiToolResult.alternativeFraming}</p>
                </div>
              )}
              {aiToolResult.tips?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tips:</p>
                  {aiToolResult.tips.map((tip: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">- {tip}</p>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => generateAiTool('objection', '/api/affiliate/ai-objection-handler', { objection: aiObjection, context: aiObjectionContext })} disabled={aiToolGenerating} data-testid="button-ai-objection-regenerate">
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-promo-ideas">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Promotion Idea Generator
          </CardTitle>
          <CardDescription>Get creative, actionable promotion strategies tailored to your niche</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Your Niche</Label>
              <Input value={aiPromoNiche} onChange={e => setAiPromoNiche(e.target.value)} placeholder="e.g. personal finance, health & wellness..." className="mt-1" data-testid="input-ai-promo-niche" />
            </div>
            <div>
              <Label className="text-xs">Available Channels</Label>
              <Input value={aiPromoChannels} onChange={e => setAiPromoChannels(e.target.value)} placeholder="e.g. YouTube, email, blog..." className="mt-1" data-testid="input-ai-promo-channels" />
            </div>
            <div>
              <Label className="text-xs">Experience Level</Label>
              <Select value={aiPromoExperience} onValueChange={setAiPromoExperience}>
                <SelectTrigger className="mt-1" data-testid="select-ai-promo-experience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => generateAiTool('promo', '/api/affiliate/ai-promo-ideas', { niche: aiPromoNiche, channels: aiPromoChannels, experience: aiPromoExperience })} disabled={aiToolGenerating && aiToolActive === 'promo'} data-testid="button-ai-promo-generate">
            {aiToolGenerating && aiToolActive === 'promo' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Ideas
          </Button>
          {aiToolResult && aiToolActive === 'promo' && (
            <div className="space-y-3">
              {aiToolResult.ideas?.map((idea: any, i: number) => (
                <div key={i} className="p-3 rounded-md bg-muted/40 space-y-2" data-testid={`promo-idea-${i}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{idea.title}</p>
                    <Badge variant={idea.effort === 'low' ? 'secondary' : idea.effort === 'high' ? 'destructive' : 'outline'} className="text-[10px]">
                      Effort: {idea.effort}
                    </Badge>
                    <Badge variant={idea.impact === 'high' ? 'default' : idea.impact === 'low' ? 'outline' : 'secondary'} className="text-[10px]">
                      Impact: {idea.impact}
                    </Badge>
                  </div>
                  <p className="text-xs">{idea.description}</p>
                  {idea.steps?.length > 0 && (
                    <div className="pl-2 space-y-0.5">
                      {idea.steps.map((step: string, j: number) => (
                        <p key={j} className="text-xs text-muted-foreground">{j + 1}. {step}</p>
                      ))}
                    </div>
                  )}
                  {idea.channel && <p className="text-[10px] text-muted-foreground">Channel: {idea.channel} | Timeframe: {idea.timeframe || 'varies'}</p>}
                </div>
              ))}
              {aiToolResult.weeklyPlan && (
                <div className="p-3 rounded-md bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground">Suggested Weekly Plan:</p>
                  <p className="text-xs whitespace-pre-wrap" data-testid="text-ai-promo-plan">{aiToolResult.weeklyPlan}</p>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => generateAiTool('promo', '/api/affiliate/ai-promo-ideas', { niche: aiPromoNiche, channels: aiPromoChannels, experience: aiPromoExperience })} disabled={aiToolGenerating} data-testid="button-ai-promo-regenerate">
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-conversion-optimizer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Conversion Optimizer
          </CardTitle>
          <CardDescription>Get data-driven tips to improve your conversion rate and follow-up templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Scenario / Context (optional)</Label>
            <Input value={aiConversionScenario} onChange={e => setAiConversionScenario(e.target.value)} placeholder="e.g. lots of clicks but few signups, trying email outreach..." className="mt-1" data-testid="input-ai-conversion-scenario" />
          </div>
          <Button onClick={() => generateAiTool('conversion', '/api/affiliate/ai-conversion-optimizer', { scenario: aiConversionScenario })} disabled={aiToolGenerating && aiToolActive === 'conversion'} data-testid="button-ai-conversion-generate">
            {aiToolGenerating && aiToolActive === 'conversion' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Analyze & Optimize
          </Button>
          {aiToolResult && aiToolActive === 'conversion' && (
            <div className="space-y-3">
              {aiToolResult.currentStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold" data-testid="text-conv-clicks">{aiToolResult.currentStats.clicks}</p>
                    <p className="text-[10px] text-muted-foreground">Clicks</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold" data-testid="text-conv-signups">{aiToolResult.currentStats.signups}</p>
                    <p className="text-[10px] text-muted-foreground">Signups</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold" data-testid="text-conv-rate">{aiToolResult.currentStats.conversionRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Conv. Rate</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold" data-testid="text-conv-earnings">${aiToolResult.currentStats.earnings}</p>
                    <p className="text-[10px] text-muted-foreground">Earnings</p>
                  </div>
                </div>
              )}
              {aiToolResult.analysis && (
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground">Analysis:</p>
                  <p className="text-sm" data-testid="text-ai-conversion-analysis">{aiToolResult.analysis}</p>
                </div>
              )}
              {aiToolResult.optimizationTips?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Optimization Tips:</p>
                  {aiToolResult.optimizationTips.map((tip: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/40" data-testid={`optimization-tip-${i}`}>
                      <p className="text-sm font-medium">{tip.area}</p>
                      <p className="text-xs">{tip.suggestion}</p>
                      {tip.expectedImpact && <p className="text-[10px] text-muted-foreground">Expected: {tip.expectedImpact}</p>}
                    </div>
                  ))}
                </div>
              )}
              {aiToolResult.followUpTemplates?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Follow-up Templates:</p>
                  {aiToolResult.followUpTemplates.map((t: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/40 space-y-1" data-testid={`followup-template-${i}`}>
                      <p className="text-xs font-medium">{t.scenario}</p>
                      <p className="text-xs">{t.message}</p>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyAiToolContent(t.message)} data-testid={`button-copy-followup-${i}`}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {aiToolResult.talkingPoints?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Talking Points:</p>
                  {aiToolResult.talkingPoints.map((tp: string, i: number) => (
                    <p key={i} className="text-xs ml-2">- {tp}</p>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => generateAiTool('conversion', '/api/affiliate/ai-conversion-optimizer', { scenario: aiConversionScenario })} disabled={aiToolGenerating} data-testid="button-ai-conversion-regenerate">
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ai-onboarding-advisor">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            AI Onboarding Advisor
          </CardTitle>
          <CardDescription>Get a personalized first-week action plan based on your current progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => generateAiTool('onboarding', '/api/affiliate/ai-onboarding-advisor', {})} disabled={aiToolGenerating && aiToolActive === 'onboarding'} data-testid="button-ai-onboarding-generate">
            {aiToolGenerating && aiToolActive === 'onboarding' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Get My Action Plan
          </Button>
          {aiToolResult && aiToolActive === 'onboarding' && (
            <div className="space-y-3">
              {aiToolResult.greeting && (
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-sm" data-testid="text-ai-onboarding-greeting">{aiToolResult.greeting}</p>
                  {aiToolResult.currentPhase && (
                    <Badge variant="secondary" className="text-xs mt-2 capitalize">{aiToolResult.currentPhase.replace(/_/g, ' ')}</Badge>
                  )}
                </div>
              )}
              {aiToolResult.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold">{aiToolResult.stats.daysActive}</p>
                    <p className="text-[10px] text-muted-foreground">Days Active</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold">{aiToolResult.stats.clicks}</p>
                    <p className="text-[10px] text-muted-foreground">Clicks</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold">{aiToolResult.stats.signups}</p>
                    <p className="text-[10px] text-muted-foreground">Signups</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 text-center">
                    <p className="text-lg font-bold">${aiToolResult.stats.earnings}</p>
                    <p className="text-[10px] text-muted-foreground">Earnings</p>
                  </div>
                </div>
              )}
              {aiToolResult.quickWins?.length > 0 && (
                <div className="p-3 rounded-md bg-muted/20 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Quick Wins (do these now!):</p>
                  {aiToolResult.quickWins.map((qw: string, i: number) => (
                    <p key={i} className="text-xs ml-2" data-testid={`quick-win-${i}`}>- {qw}</p>
                  ))}
                </div>
              )}
              {aiToolResult.weekPlan?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Your Week Plan:</p>
                  {aiToolResult.weekPlan.map((day: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/40 flex items-start gap-3" data-testid={`week-plan-day-${i}`}>
                      <div className="shrink-0 w-12 text-center">
                        <p className="text-xs font-bold">Day {day.day}</p>
                        <Badge variant={day.priority === 'high' ? 'default' : day.priority === 'low' ? 'outline' : 'secondary'} className="text-[10px] mt-0.5">
                          {S(day.priority)}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{S(day.task)}</p>
                        {day.tip && <p className="text-xs text-muted-foreground mt-0.5">{S(day.tip)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {aiToolResult.resources?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Helpful Resources:</p>
                  {aiToolResult.resources.map((res: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/40" data-testid={`onboarding-resource-${i}`}>
                      <p className="text-sm font-medium">{res.title}</p>
                      <p className="text-xs text-muted-foreground">{res.description}</p>
                      {res.action && <p className="text-xs mt-1">{res.action}</p>}
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => generateAiTool('onboarding', '/api/affiliate/ai-onboarding-advisor', {})} disabled={aiToolGenerating} data-testid="button-ai-onboarding-regenerate">
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-webhooks">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </CardTitle>
          <CardDescription>Receive real-time notifications when events occur on your affiliate account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookSecret && (
            <div className="p-3 rounded-md bg-[hsl(var(--warning)/0.05)] dark:bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.2)] dark:border-[hsl(var(--warning)/0.3)] space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                <span className="text-sm font-medium text-[hsl(var(--warning))]">Signing Secret (copy now — shown only once)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input value={webhookSecret} readOnly className="font-mono text-xs" data-testid="input-webhook-secret" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookSecret); toast({ title: 'Copied!', description: 'Webhook secret copied.' }) }} data-testid="button-copy-webhook-secret">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setWebhookSecret(null)} data-testid="button-dismiss-secret">
                Dismiss
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Endpoint URL</Label>
              <Input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="mt-1 font-mono text-xs"
                data-testid="input-webhook-url"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Events to Subscribe</Label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_WEBHOOK_EVENTS.map(evt => (
                  <Badge
                    key={evt.value}
                    variant={webhookEvents.includes(evt.value) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleWebhookEvent(evt.value)}
                    data-testid={`badge-event-${evt.value}`}
                  >
                    {S(evt.label)}
                  </Badge>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={createWebhook} disabled={webhookCreating || !webhookUrl.trim()} data-testid="button-create-webhook">
              {webhookCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Webhook className="h-4 w-4 mr-2" />}
              Add Webhook
            </Button>
          </div>

          {webhooksLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length > 0 ? (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs text-muted-foreground">Your Webhooks</Label>
              {webhooks.map(wh => (
                <div key={wh.id} className="rounded-md bg-muted/40 p-3 space-y-2" data-testid={`webhook-${wh.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono truncate">{wh.url}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <Badge variant={wh.is_active ? 'secondary' : 'outline'} className="text-[10px]">
                          {wh.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                        {wh.failure_count > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {N(wh.failure_count)} failures
                          </Badge>
                        )}
                        {wh.events?.map((e: string) => (
                          <Badge key={e} variant="outline" className="text-[10px]">{e.replace('affiliate.', '')}</Badge>
                        ))}
                      </div>
                      {wh.last_triggered_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Last triggered: {new Date(wh.last_triggered_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testWebhook(wh.id)}
                        disabled={webhookTesting === wh.id}
                        data-testid={`button-test-webhook-${wh.id}`}
                      >
                        {webhookTesting === wh.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (webhookDeliveriesOpen === wh.id) {
                            setWebhookDeliveriesOpen(null)
                          } else {
                            setWebhookDeliveriesOpen(wh.id)
                            loadWebhookDeliveries(wh.id)
                          }
                        }}
                        data-testid={`button-deliveries-webhook-${wh.id}`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteWebhook(wh.id)}
                        data-testid={`button-delete-webhook-${wh.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {webhookDeliveriesOpen === wh.id && (
                    <div className="border-t pt-2 mt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Delivery Log</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => loadWebhookDeliveries(wh.id)} data-testid={`button-refresh-deliveries-${wh.id}`}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                        </Button>
                      </div>
                      {(webhookDeliveries[wh.id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No deliveries yet</p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {(webhookDeliveries[wh.id] || []).map((del: any) => (
                            <div key={del.id} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-background" data-testid={`delivery-${del.id}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${del.delivered_at ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--danger))]'}`} />
                                <span className="font-medium truncate">{del.event_type}</span>
                                <span className="text-muted-foreground">#{del.attempt}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {del.response_status ? (
                                  <Badge variant={del.delivered_at ? 'secondary' : 'destructive'} className="text-[10px]">
                                    {S(del.response_status)}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(del.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No webhooks configured yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Marketing Toolkit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LinkShortener />
        <QRCodeGenerator referralUrl={data?.link?.shareUrl || ''} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MediaKitPage />
        <CopyPasteCaptions referralCode={data?.link?.ref_code || ''} referralUrl={data?.link?.shareUrl || ''} />
      </div>
      <CommissionDisputes />
      <StarterKit />
      <PromotionQuizPanel />
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
                    <p className="text-sm font-medium">{S(n.title)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{S(n.message)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PromotionalCalendarPanel />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{userEmail}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Referral Code</Label>
              <p className="text-sm font-mono">{S(data?.link?.ref_code)}</p>
            </div>
          </div>
          {data?.tier?.current && (
            <div>
              <Label className="text-xs text-muted-foreground">Current Tier</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">{S(data?.tier?.current.name)}</Badge>
                <Badge variant="outline" className="text-xs">{S(data?.stats?.effectiveRate)}% commission</Badge>
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

      <Card data-testid="card-my-terms">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Terms
          </CardTitle>
          <CardDescription>Your affiliate contract and commission rate details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contractsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-6" data-testid="text-no-contracts">
              <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No contracts found.</p>
              {data?.terms && (
                <div className="mt-4 p-4 rounded-md bg-muted/40">
                  <p className="text-sm font-medium">Your Current Terms</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Commission Rate</span>
                      <p className="font-medium">{S(data?.terms.rate)}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Lock Duration</span>
                      <p className="font-medium">{S(data?.terms.durationMonths)} months</p>
                    </div>
                    {data?.terms.lockedAt && (
                      <div>
                        <span className="text-xs text-muted-foreground">Locked Since</span>
                        <p className="font-medium">{new Date(data?.terms.lockedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Your commission rate is locked and guaranteed for the duration shown above.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract, idx) => {
                const isActive = contract.status === 'active'
                const isDraft = contract.status === 'draft'
                const isExpanded = expandedContract === contract.id
                return (
                  <div key={contract.id} className={`rounded-md border ${isActive ? 'border-primary/30' : ''}`} data-testid={`contract-${contract.id}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{S(contract.title)}</span>
                            <Badge variant={isActive ? 'default' : isDraft ? 'secondary' : 'outline'} className="text-xs capitalize">
                              {S(contract.status)}
                            </Badge>
                            {idx === 0 && contracts.length > 1 && (
                              <Badge variant="outline" className="text-xs">Latest</Badge>
                            )}
                            {contract.version > 1 && (
                              <Badge variant="outline" className="text-[10px]">v{contract.version}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {contract.effective_date && (
                              <span>Effective: {new Date(contract.effective_date).toLocaleDateString()}</span>
                            )}
                            {contract.expiry_date && (
                              <span>Expires: {new Date(contract.expiry_date).toLocaleDateString()}</span>
                            )}
                            <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
                          </div>
                          {contract.signed_at && (
                            <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Signed on {new Date(contract.signed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isDraft && !contract.signed_at && (
                            <Button
                              size="sm"
                              onClick={() => signContract(contract.id)}
                              disabled={contractSigning === contract.id}
                              data-testid={`button-sign-contract-${contract.id}`}
                            >
                              {contractSigning === contract.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Sign
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedContract(isExpanded ? null : contract.id)}
                            data-testid={`button-toggle-contract-${contract.id}`}
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </Button>
                        </div>
                      </div>
                      {(contract.terms || contract.metadata?.commission_rate) && (() => {
                        const terms = contract.terms || contract.metadata || {}
                        const monthsRemaining = contract.expiry_date
                          ? Math.max(0, Math.ceil((new Date(contract.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)))
                          : null
                        return (
                          <div className="mt-3 p-3 rounded-md bg-muted/40" data-testid={`contract-terms-${contract.id}`}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-xs text-muted-foreground">Commission Rate</span>
                                <p className="font-medium">{terms.commission_rate}%</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Duration</span>
                                <p className="font-medium">{terms.duration_months} months</p>
                              </div>
                              {terms.cookie_duration_days != null && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Cookie Duration</span>
                                  <p className="font-medium">{terms.cookie_duration_days} days</p>
                                </div>
                              )}
                              {terms.min_payout_cents != null && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Min Payout</span>
                                  <p className="font-medium">${(terms.min_payout_cents / 100).toFixed(2)}</p>
                                </div>
                              )}
                            </div>
                            {monthsRemaining != null && isActive && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {monthsRemaining > 0 ? `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''} remaining` : 'Term expired'}
                              </p>
                            )}
                            {contract.metadata?.rate_lock_text && (
                              <p className="text-xs text-muted-foreground mt-1">{contract.metadata.rate_lock_text}</p>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    {isExpanded && contract.body && (
                      <div className="border-t px-4 py-3">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap" data-testid={`text-contract-body-${contract.id}`}>
                          {S(contract.body)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {contracts.length > 1 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing {contracts.length} contract version{contracts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
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
          <CardTitle className="text-base">Tax Information</CardTitle>
          <CardDescription>
            Required for payouts. Submit your W-9 (US) or W-8BEN (non-US) information.
            {taxInfo?.verified && (
              <Badge variant="default" className="ml-2 text-xs">Verified</Badge>
            )}
            {taxInfo && !taxInfo.verified && (
              <Badge variant="outline" className="ml-2 text-xs">Pending Verification</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxInfoLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs">Form Type</Label>
                <Select value={taxForm.form_type} onValueChange={v => setTaxForm(prev => ({ ...prev, form_type: v, tax_id_type: v === 'w9' ? 'ssn' : 'foreign_id' }))}>
                  <SelectTrigger className="mt-1" data-testid="select-tax-form-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w9">W-9 (US Person)</SelectItem>
                    <SelectItem value="w8ben">W-8BEN (Non-US Person)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Legal Name (as shown on tax return)</Label>
                <Input value={taxForm.legal_name} onChange={e => setTaxForm(prev => ({ ...prev, legal_name: e.target.value }))} placeholder="Full legal name" className="mt-1" data-testid="input-tax-legal-name" />
              </div>
              {taxForm.form_type === 'w9' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Tax ID Type</Label>
                    <Select value={taxForm.tax_id_type} onValueChange={v => setTaxForm(prev => ({ ...prev, tax_id_type: v }))}>
                      <SelectTrigger className="mt-1" data-testid="select-tax-id-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssn">SSN</SelectItem>
                        <SelectItem value="ein">EIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Last 4 Digits of {taxForm.tax_id_type === 'ein' ? 'EIN' : 'SSN'}</Label>
                    <Input value={taxForm.tax_id_last4} onChange={e => setTaxForm(prev => ({ ...prev, tax_id_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="XXXX" maxLength={4} className="mt-1" data-testid="input-tax-id-last4" />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={taxForm.address_line1} onChange={e => setTaxForm(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="Street address" className="mt-1" data-testid="input-tax-address" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={taxForm.address_city} onChange={e => setTaxForm(prev => ({ ...prev, address_city: e.target.value }))} className="mt-1" data-testid="input-tax-city" />
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Input value={taxForm.address_state} onChange={e => setTaxForm(prev => ({ ...prev, address_state: e.target.value }))} className="mt-1" data-testid="input-tax-state" />
                </div>
                <div>
                  <Label className="text-xs">ZIP / Postal Code</Label>
                  <Input value={taxForm.address_zip} onChange={e => setTaxForm(prev => ({ ...prev, address_zip: e.target.value }))} className="mt-1" data-testid="input-tax-zip" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Country</Label>
                <Input value={taxForm.address_country} onChange={e => setTaxForm(prev => ({ ...prev, address_country: e.target.value }))} className="mt-1" data-testid="input-tax-country" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveTaxInfo} disabled={taxInfoSaving} size="sm" data-testid="button-save-tax-info">
                  {taxInfoSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {taxInfo ? 'Update Tax Info' : 'Submit Tax Info'}
                </Button>
                {taxInfo && (
                  <span className="text-xs text-muted-foreground">
                    Submitted {new Date(taxInfo.submitted_at).toLocaleDateString()}
                    {taxInfo.verified && ` \u00b7 Verified ${new Date(taxInfo.verified_at).toLocaleDateString()}`}
                  </span>
                )}
              </div>
              {!taxInfo && (
                <p className="text-xs text-muted-foreground border-t pt-3">
                  Tax information is required before payouts can be processed. Please complete and submit this form.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TaxCenterPanel />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> API Keys
          </CardTitle>
          <CardDescription>Generate API keys to access your affiliate data programmatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Key Name</Label>
              <Input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g. My Integration"
                className="mt-1"
                data-testid="input-api-key-name"
              />
            </div>
            <Button
              onClick={generateNewApiKey}
              disabled={generatingKey}
              size="sm"
              data-testid="button-generate-api-key"
            >
              {generatingKey ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </div>

          {newlyGeneratedKey && (
            <div className="p-3 rounded-md bg-muted/50 border border-primary/20">
              <Label className="text-xs font-medium text-primary">New API Key (copy now, shown only once)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono flex-1 break-all" data-testid="text-new-api-key">{newlyGeneratedKey}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(newlyGeneratedKey)
                    setCopiedApiKey(true)
                    setTimeout(() => setCopiedApiKey(false), 2000)
                    toast({ title: 'Copied', description: 'API key copied to clipboard.' })
                  }}
                  data-testid="button-copy-api-key"
                >
                  {copiedApiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {apiKeysLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3" data-testid="text-no-api-keys">No API keys yet. Generate one to get started.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30" data-testid={`api-key-${k.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{k.name}</span>
                      <Badge variant={k.is_active ? 'secondary' : 'outline'} className="text-[10px]">
                        {k.is_active ? 'Active' : 'Revoked'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <code className="text-[10px] font-mono text-muted-foreground">{k.api_key_prefix}...</code>
                      <span className="text-[10px] text-muted-foreground">
                        Created {new Date(k.created_at).toLocaleDateString()}
                      </span>
                      {k.last_used_at && (
                        <span className="text-[10px] text-muted-foreground">
                          Last used {new Date(k.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {k.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revokeApiKey(k.id)}
                      data-testid={`button-revoke-key-${k.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t">
            <p className="text-[10px] text-muted-foreground mb-1">API Endpoints (use X-API-Key header):</p>
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono text-muted-foreground">GET /api/affiliate/v1/stats</p>
              <p className="text-[10px] font-mono text-muted-foreground">GET /api/affiliate/v1/referrals?page=1&limit=50</p>
              <p className="text-[10px] font-mono text-muted-foreground">GET /api/affiliate/v1/commissions?page=1&limit=50</p>
              <p className="text-[10px] font-mono text-muted-foreground">GET /api/affiliate/v1/earnings</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Rate limit: 100 requests/hour per key</p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-earned-badges">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Your Badges
          </CardTitle>
          <CardDescription>Verified earnings badges you can embed on your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {badgesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : earnedBadges.length > 0 ? (
            <div className="space-y-3">
              {earnedBadges.map(badge => {
                const label = badge.badge_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/partner/verify/${badge.verification_code}` : `/partner/verify/${badge.verification_code}`
                const embedCode = `<a href="${verifyUrl}" target="_blank" rel="noopener">${label} - Verified</a>`
                return (
                  <div key={badge.id} className="p-3 rounded-md bg-muted/40 space-y-2" data-testid={`badge-${badge.id}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">${(badge.threshold_cents / 100).toLocaleString()} earned</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Awarded {new Date(badge.awarded_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(embedCode); setCopiedEmbed(badge.id); setTimeout(() => setCopiedEmbed(null), 2000); toast({ title: 'Copied!', description: 'Embed code copied to clipboard.' }) }} data-testid={`button-copy-embed-${badge.id}`}>
                        {copiedEmbed === badge.id ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        Copy Embed
                      </Button>
                      <Button variant="ghost" size="sm" asChild data-testid={`link-verify-${badge.id}`}>
                        <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" /> Verify
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No badges earned yet. Keep growing your earnings!</p>
              {badgeTiers.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Badge Milestones:</p>
                  {badgeTiers.map(tier => (
                    <p key={tier.id} className="text-xs text-muted-foreground">{tier.name} — ${(tier.threshold_cents / 100).toLocaleString()}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {surveyData?.canTakeSurvey && (
        <Card data-testid="card-survey">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              How are we doing?
            </CardTitle>
            <CardDescription>Share your feedback about the affiliate program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Rating</Label>
              <div className="flex items-center gap-1" data-testid="survey-rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setSurveyRating(star)}
                    className={`text-2xl transition-colors ${star <= surveyRating ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground/30'}`}
                    data-testid={`button-star-${star}`}
                  >
                    &#9733;
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Feedback (optional)</Label>
              <textarea
                value={surveyFeedback}
                onChange={e => setSurveyFeedback(e.target.value)}
                placeholder="Tell us what you love or what we can improve..."
                className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="textarea-survey-feedback"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="testimonial-opt-in"
                checked={surveyTestimonialOptIn}
                onChange={e => setSurveyTestimonialOptIn(e.target.checked)}
                className="rounded"
                data-testid="checkbox-testimonial-optin"
              />
              <Label htmlFor="testimonial-opt-in" className="text-xs cursor-pointer">
                You may use my feedback as a testimonial
              </Label>
            </div>
            <Button onClick={submitSurvey} disabled={surveySubmitting || surveyRating === 0} size="sm" data-testid="button-submit-survey">
              {surveySubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports & Downloads</CardTitle>
          <CardDescription>Download your earnings data and tax documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-download-performance-report"
            onClick={() => {
              const csv = ['Date,Type,Amount,Status']
              data?.commissions?.forEach(c => {
                csv.push(`${new Date(c.created_at).toLocaleDateString()},commission,$${(c.commission_amount_cents / 100).toFixed(2)},${c.status}`)
              })
              data?.payouts?.forEach(p => {
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
                `Total Paid: $${((data?.stats?.paidEarnings || 0) / 100).toFixed(2)}`,
                `Total Pending: $${((data?.stats?.pendingEarnings || 0) / 100).toFixed(2)}`,
                `Total Approved: $${((data?.stats?.approvedEarnings || 0) / 100).toFixed(2)}`,
                `Total Earnings: $${((data?.stats?.totalEarnings || 0) / 100).toFixed(2)}`,
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

      <AffiliateDirectoryPreview />
    </div>
  )

  const renderMessages = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold" data-testid="text-messages-heading">Messages</h2>
        <Button variant="outline" size="sm" onClick={loadMessages} disabled={messagesLoading} data-testid="button-refresh-messages">
          <RefreshCw className={`h-4 w-4 mr-2 ${messagesLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation with Admin
          </CardTitle>
          <CardDescription>Send and receive messages from the program administrators</CardDescription>
        </CardHeader>
        <CardContent>
          {messagesLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground" data-testid="text-no-messages">
              No messages yet. Start a conversation by sending a message below.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-1" data-testid="container-messages-thread">
              {messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === 'affiliate' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-item-${msg.id}`}
                >
                  <div className={`max-w-[80%] rounded-md p-3 text-sm ${
                    msg.sender_role === 'affiliate'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{S(msg.body)}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_role === 'affiliate' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {msg.sender_role === 'admin' ? 'Admin' : 'You'} &middot; {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Type your message..."
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              disabled={messageSending}
              data-testid="input-message-body"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageBody.trim() || messageSending}
              data-testid="button-send-message"
            >
              {messageSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
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
              <p className="text-xs">Payouts are processed once your approved balance reaches the minimum threshold (${((data?.settings?.minPayoutCents || 0) / 100).toFixed(2)}). Payouts are reviewed and processed by our team.</p>
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

      <KnowledgeBasePanel />

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

  if (authChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-affiliate-dashboard">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data || (!data.link?.is_affiliate && !isAdminViewer)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-border">
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

  const tierProgress = data?.tier?.next
    ? ((data.stats.totalReferrals / data?.tier?.next.min_referrals) * 100)
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
    { id: 'first_referral', label: 'First Referral', icon: Users, description: 'Got your first referral signup', check: () => (data?.stats?.totalReferrals ?? 0) >= 1 },
    { id: 'first_commission', label: 'First Dollar', icon: DollarSign, description: 'Earned your first commission', check: () => (data?.stats?.totalEarnings ?? 0) > 0 },
    { id: 'five_referrals', label: 'Growing Network', icon: TrendingUp, description: 'Reached 5 referrals', check: () => (data?.stats?.totalReferrals ?? 0) >= 5 },
    { id: 'ten_referrals', label: 'Super Referrer', icon: Award, description: 'Reached 10 referrals', check: () => (data?.stats?.totalReferrals ?? 0) >= 10 },
    { id: 'first_payout', label: 'Payday', icon: Receipt, description: 'Received your first payout', check: () => Array.isArray(data?.payouts) && data.payouts.some((p: any) => p.status === 'completed') },
    { id: 'hundred_clicks', label: 'Traffic Driver', icon: MousePointerClick, description: '100+ clicks on your link', check: () => (data?.stats?.clicks ?? 0) >= 100 },
    { id: 'profile_complete', label: 'Profile Pro', icon: Settings, description: 'Completed your profile', check: () => !!(profile?.display_name && profile?.payout_method) },
  ]

  const renderAnalytics = () => {
    if (chartLoading && !chartData) {
      return (
        <div className="flex items-center justify-center py-12" data-testid="loading-analytics">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    const ts = chartData?.earningsTimeSeries || []
    const maxEarning = Math.max(...ts.map(d => d.amount), 1)
    const totalPeriodEarnings = ts.reduce((sum, d) => sum + d.amount, 0)

    const heatmap = chartData?.heatmapData || []
    const maxHeatVal = Math.max(...heatmap.map(d => d.amount), 1)

    const fd = chartData?.funnelData || { clicks: 0, signups: 0, conversions: 0, paid: 0 }
    const funnelSteps = [
      { label: 'Clicks', value: fd.clicks },
      { label: 'Signups', value: fd.signups },
      { label: 'Conversions', value: fd.conversions },
      { label: 'Paid', value: fd.paid },
    ]
    const maxFunnel = Math.max(fd.clicks, 1)

    const sources = chartData?.topSources || []
    const maxSourceEarnings = Math.max(...sources.map(s => s.earnings), 1)

    const bm = chartData?.benchmarks || { percentile: 50, avgEarnings: 0, avgReferrals: 0, yourEarnings: 0, yourReferrals: 0 }

    const heatmapColor = (amount: number) => {
      if (amount === 0) return 'bg-muted'
      const intensity = amount / maxHeatVal
      if (intensity > 0.75) return 'bg-primary/70 dark:bg-primary/60'
      if (intensity > 0.5) return 'bg-primary/50 dark:bg-primary/45'
      if (intensity > 0.25) return 'bg-primary/30 dark:bg-primary/25'
      return 'bg-primary/15 dark:bg-primary/10'
    }

    const weeks: { date: string; amount: number }[][] = []
    let currentWeek: { date: string; amount: number }[] = []
    heatmap.forEach((d, i) => {
      const dayOfWeek = new Date(d.date).getDay()
      if (i > 0 && dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(d)
    })
    if (currentWeek.length > 0) weeks.push(currentWeek)

    const monthLabels: { label: string; weekIndex: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      if (week.length > 0) {
        const m = new Date(week[0].date).getMonth()
        if (m !== lastMonth) {
          monthLabels.push({ label: new Date(week[0].date).toLocaleString('default', { month: 'short' }), weekIndex: wi })
          lastMonth = m
        }
      }
    })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-analytics-title">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d', '1y'] as const).map(p => (
              <Button
                key={p}
                variant={chartPeriod === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartPeriod(p)}
                data-testid={`button-chart-period-${p}`}
              >
                {p === '7d' ? '7D' : p === '30d' ? '30D' : p === '90d' ? '90D' : '1Y'}
              </Button>
            ))}
          </div>
        </div>

        <Card data-testid="card-earnings-line-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Earnings Over Time
            </CardTitle>
            <CardDescription>
              Total: ${(totalPeriodEarnings / 100).toFixed(2)} in selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-earnings-data">No earnings data for this period.</p>
            ) : (
              <div className="relative" data-testid="chart-earnings-line">
                <svg viewBox={`0 0 ${Math.max(ts.length * 12, 200)} 120`} className="w-full h-48" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.3" />
                      <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0 120 ${ts.map((d, i) => {
                      const x = (i / Math.max(ts.length - 1, 1)) * Math.max(ts.length * 12 - 10, 190)
                      const y = 115 - (d.amount / maxEarning) * 105
                      return `L ${x} ${y}`
                    }).join(' ')} L ${Math.max(ts.length * 12 - 10, 190)} 120 Z`}
                    fill="url(#earningsGrad)"
                  />
                  <polyline
                    points={ts.map((d, i) => {
                      const x = (i / Math.max(ts.length - 1, 1)) * Math.max(ts.length * 12 - 10, 190)
                      const y = 115 - (d.amount / maxEarning) * 105
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {ts.map((d, i) => {
                    if (d.amount === 0) return null
                    const x = (i / Math.max(ts.length - 1, 1)) * Math.max(ts.length * 12 - 10, 190)
                    const y = 115 - (d.amount / maxEarning) * 105
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2.5"
                        className="fill-primary"
                      >
                        <title>{`${d.date}: $${(d.amount / 100).toFixed(2)}`}</title>
                      </circle>
                    )
                  })}
                </svg>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                  <span>{ts[0]?.date}</span>
                  <span>{ts[ts.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-funnel-visual">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelSteps.map((step, i) => {
                const width = Math.max((step.value / maxFunnel) * 100, 4)
                const rate = i > 0 && funnelSteps[i - 1].value > 0
                  ? Math.round((step.value / funnelSteps[i - 1].value) * 100)
                  : 100
                const colors = [
                  'bg-[hsl(var(--chart-1))]',
                  'bg-[hsl(var(--chart-2))]',
                  'bg-[hsl(var(--chart-3))]',
                  'bg-[hsl(var(--chart-4))]',
                ]
                return (
                  <div key={step.label} data-testid={`funnel-step-${step.label.toLowerCase()}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{step.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{step.value}</span>
                        {i > 0 && (
                          <Badge variant="outline" className="text-[10px]">{rate}%</Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md ${colors[i]} transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-earnings-heatmap">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Earnings Heatmap
            </CardTitle>
            <CardDescription>Last 52 weeks of earnings activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="flex gap-0.5 mb-1 ml-8">
                  {monthLabels.map((ml, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-muted-foreground"
                      style={{ position: 'relative', left: `${ml.weekIndex * 11}px` }}
                    >
                      {S(ml.label)}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="h-[10px] text-[8px] text-muted-foreground leading-[10px] w-5 text-right pr-1">
                        {i % 2 === 1 ? day : ''}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {Array.from({ length: 7 }).map((_, di) => {
                          const cell = week.find(d => new Date(d.date).getDay() === di)
                          if (!cell) return <div key={di} className="w-[10px] h-[10px]" />
                          return (
                            <div
                              key={di}
                              className={`w-[10px] h-[10px] rounded-sm ${heatmapColor(cell.amount)}`}
                              title={`${cell.date}: $${(cell.amount / 100).toFixed(2)}`}
                              data-testid={`heatmap-cell-${cell.date}`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 ml-8">
                  <span className="text-[9px] text-muted-foreground mr-1">Less</span>
                  <div className="w-[10px] h-[10px] rounded-sm bg-muted" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-primary/15 dark:bg-primary/10" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-primary/30 dark:bg-primary/25" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-primary/50 dark:bg-primary/45" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-primary/70 dark:bg-primary/60" />
                  <span className="text-[9px] text-muted-foreground ml-1">More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card data-testid="card-performance-benchmarks">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Performance Benchmarks
              </CardTitle>
              <CardDescription>How you compare to the program average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-3">
                  <div className="relative inline-flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-28 h-28">
                      <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="8"
                        strokeDasharray={`${(bm.percentile / 100) * 264} 264`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-bold" data-testid="text-percentile">{bm.percentile}</span>
                      <span className="text-xs text-muted-foreground block">percentile</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Your Earnings</p>
                    <p className="text-sm font-bold" data-testid="text-your-earnings">${(bm.yourEarnings / 100).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Avg. Earnings</p>
                    <p className="text-sm font-bold" data-testid="text-avg-earnings">${(bm.avgEarnings / 100).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Your Referrals</p>
                    <p className="text-sm font-bold" data-testid="text-your-referrals">{bm.yourReferrals}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Avg. Referrals</p>
                    <p className="text-sm font-bold" data-testid="text-avg-referrals">{bm.avgReferrals}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-top-sources">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Top Sources
              </CardTitle>
              <CardDescription>Revenue by referral source</CardDescription>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-sources">No source data available yet. Use source tags on your links to track performance.</p>
              ) : (
                <div className="space-y-3">
                  {sources.map((s, i) => (
                    <div key={s.source} data-testid={`source-bar-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate max-w-[140px]">{s.source}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{s.count} refs</Badge>
                          <span className="text-sm font-bold">${(s.earnings / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-4 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md bg-primary/70 transition-all duration-500"
                          style={{ width: `${Math.max((s.earnings / maxSourceEarnings) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {chartLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Updating charts...</span>
          </div>
        )}

        {/* Expanded Analytics */}
        <ExpandedAnalyticsSection />

        {/* Flywheel Intelligence — Churn, Cohort, Revenue, AI */}
        <FlywheelAnalyticsSection />

        {/* Earnings Projections */}
        <EarningsProjectionsPanel />

        {/* Reports & Intelligence — Connected, Financial, Predictions */}
        <FlywheelReportsSection />

        <AudienceAnalyzerPanel />
      </div>
    )
  }

  const renderSection = () => {
    const wrap = (name: string, renderFn: () => React.ReactNode) => (
      <SectionErrorBoundary sectionName={name} key={name}>
        <LazySectionComponent renderFn={renderFn} />
      </SectionErrorBoundary>
    )
    switch (section) {
      case 'overview': return wrap('overview', renderOverview)
      case 'analytics': return wrap('analytics', renderAnalytics)
      case 'referrals': return wrap('referrals', renderReferrals)
      case 'earnings': return wrap('earnings', renderEarnings)
      case 'payouts': return wrap('payouts', renderPayouts)
      case 'assets': return wrap('assets', renderAssets)
      case 'tools': return wrap('tools', renderTools)
      case 'announcements': return wrap('announcements', renderAnnouncements)
      case 'messages': return wrap('messages', renderMessages)
      case 'account': return wrap('account', renderAccount)
      case 'support': return wrap('support', renderSupport)
      default: return wrap('overview', renderOverview)
    }
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-affiliate-dashboard">
      <SafeZone name="header">
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--danger))] rounded-full" />
                )}
              </button>
              <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
      </SafeZone>

      <div className="flex">
        <SafeZone name="sidebar">
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
                    {S(item.label)}
                    {item.key === 'announcements' && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">{N(unreadCount)}</Badge>
                    )}
                    {item.key === 'messages' && unreadMessages > 0 && (
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0" data-testid="badge-unread-messages">{N(unreadMessages)}</Badge>
                    )}
                  </button>
                )
              })}
            </nav>
          </aside>
        </SafeZone>

        {mobileNavOpen && (
          <div className="fixed inset-0 bg-black/30 z-10 lg:hidden" onClick={() => setMobileNavOpen(false)} />
        )}

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 max-w-4xl">
          {renderSection()}
        </main>
      </div>

      {showTour && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" data-testid="tour-overlay">
          <Card className="relative z-[101] w-full max-w-md mx-4 shadow-2xl border bg-[var(--card-bg)]">
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
