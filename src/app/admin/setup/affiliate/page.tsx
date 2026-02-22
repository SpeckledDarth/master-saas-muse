'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Loader2, Save, DollarSign, Users, TrendingUp, AlertTriangle,
  Plus, Trash2, Pencil, Award, FileImage, FileText, Share2,
  CheckCircle, XCircle, Clock, Eye, Globe, UserPlus, Mail,
  Target, Send, BarChart3, Activity, Megaphone,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Settings {
  commission_rate: number
  commission_duration_months: number
  min_payout_cents: number
  cookie_duration_days: number
  program_active: boolean
  attribution_conflict_policy: string
}

interface Milestone {
  id: string
  name: string
  referral_threshold: number
  bonus_amount_cents: number
  description: string | null
  is_active: boolean
  sort_order: number
}

interface Broadcast {
  id: string
  subject: string
  body: string
  audience_filter: any
  sent_count: number
  opened_count: number
  clicked_count: number
  status: string
  sent_at: string | null
  created_at: string
}

interface HealthData {
  overview: { totalAffiliates: number; activeAffiliates: number; dormantAffiliates: number; suspended: number }
  revenue: { totalRevenue: number; totalCommissionsPaid: number; totalCommissionsPending: number; netROI: number }
  growth: { newAffiliatesThisMonth: number; referralsThisMonth: number; conversionsThisMonth: number; conversionRate: number }
  engagement: { avgReferralsPerAffiliate: number; avgEarningsPerAffiliate: number }
  topPerformers: Array<{ userId: string; referrals: number; earnings: number }>
  alerts: { flaggedReferrals: number; pendingPayoutAmount: number }
}

interface Tier {
  id: string
  name: string
  min_referrals: number
  commission_rate: number
  sort_order: number
}

interface Asset {
  id: string
  title: string
  description: string | null
  asset_type: string
  content: string | null
  file_url: string | null
  file_name: string | null
  sort_order: number
  active: boolean
}

interface AffiliateData {
  email: string
  ref_code: string
  signups: number
  clicks: number
  total_earnings_cents: number
  paid_earnings_cents: number
  pending_earnings_cents: number
  locked_commission_rate: number | null
  locked_duration_months: number | null
  locked_at: string | null
  is_affiliate: boolean
  user_id: string
}

interface AdminStats {
  totalAffiliates: number
  totalReferrals: number
  totalRevenue: number
  totalCommissions: number
  pendingPayouts: number
  flaggedCount: number
}

interface FlaggedReferral {
  id: string
  affiliate_user_id: string
  referred_user_id: string
  fraud_flags: string[]
  created_at: string
}

interface Application {
  id: string
  name: string
  email: string
  website_url: string | null
  promotion_method: string
  message: string | null
  status: string
  reviewer_notes: string | null
  reviewed_at: string | null
  created_at: string
}

interface NetworkSetting {
  id: string
  network_name: string
  network_slug: string
  is_active: boolean
  tracking_id: string | null
  postback_url: string | null
  api_key: string | null
  config: Record<string, any>
}

const ASSET_TYPES = [
  { value: 'banner', label: 'Banner Image' },
  { value: 'email_template', label: 'Email Template' },
  { value: 'social_post', label: 'Social Post Template' },
  { value: 'text_snippet', label: 'Text Snippet' },
]

const PROMOTION_LABELS: Record<string, string> = {
  blog: 'Blog / Website',
  youtube: 'YouTube',
  social_media: 'Social Media',
  newsletter: 'Newsletter / Email',
  podcast: 'Podcast',
  course: 'Online Course / Community',
  consulting: 'Consulting / Freelance',
  other: 'Other',
}

const FRAUD_FLAG_LABELS: Record<string, string> = {
  same_email_domain: 'Same email domain as affiliate',
  suspicious_ip_volume: 'High volume from same IP',
  self_referral: 'Self-referral attempt',
}

export default function AffiliateSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    commission_rate: 20,
    commission_duration_months: 12,
    min_payout_cents: 5000,
    cookie_duration_days: 30,
    program_active: true,
    attribution_conflict_policy: 'cookie_wins',
  })
  const [tiers, setTiers] = useState<Tier[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([])
  const [stats, setStats] = useState<AdminStats>({ totalAffiliates: 0, totalReferrals: 0, totalRevenue: 0, totalCommissions: 0, pendingPayouts: 0, flaggedCount: 0 })
  const [flaggedReferrals, setFlaggedReferrals] = useState<FlaggedReferral[]>([])

  const [tierDialog, setTierDialog] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [tierForm, setTierForm] = useState({ name: '', min_referrals: 0, commission_rate: 20, sort_order: 0 })

  const [assetDialog, setAssetDialog] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [assetForm, setAssetForm] = useState({ title: '', description: '', asset_type: 'banner', content: '', file_url: '' })

  const [applications, setApplications] = useState<Application[]>([])
  const [appFilter, setAppFilter] = useState('pending')
  const [reviewingApp, setReviewingApp] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const [networks, setNetworks] = useState<NetworkSetting[]>([])

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [milestoneForm, setMilestoneForm] = useState({ name: '', referral_threshold: 10, bonus_amount_cents: 5000, description: '', is_active: true, sort_order: 0 })

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [broadcastDialog, setBroadcastDialog] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '', audience_type: 'all' })
  const [sendingBroadcast, setSendingBroadcast] = useState<string | null>(null)

  const [healthData, setHealthData] = useState<HealthData | null>(null)

  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, tiersRes, assetsRes, referralsRes, appsRes, networksRes, milestonesRes, broadcastsRes, healthRes] = await Promise.all([
        fetch('/api/affiliate/settings'),
        fetch('/api/affiliate/tiers'),
        fetch('/api/affiliate/assets'),
        fetch('/api/affiliate/referrals?admin=true'),
        fetch('/api/affiliate/applications?status=all'),
        fetch('/api/affiliate/networks'),
        fetch('/api/affiliate/milestones?admin=true'),
        fetch('/api/admin/affiliate/broadcasts'),
        fetch('/api/admin/affiliate/health'),
      ])

      const [settingsData, tiersData, assetsData, referralsData, appsData, networksData, milestonesData, broadcastsData, healthResData] = await Promise.all([
        settingsRes.json(),
        tiersRes.json(),
        assetsRes.json(),
        referralsRes.json(),
        appsRes.json(),
        networksRes.json(),
        milestonesRes.json(),
        broadcastsRes.json(),
        healthRes.json(),
      ])

      if (settingsData.settings) setSettings(s => ({ ...s, ...settingsData.settings }))
      if (tiersData.tiers) setTiers(tiersData.tiers)
      if (assetsData.assets) setAssets(assetsData.assets)
      if (referralsData.affiliates) setAffiliates(referralsData.affiliates)
      if (referralsData.stats) setStats(referralsData.stats)
      if (referralsData.flaggedReferrals) setFlaggedReferrals(referralsData.flaggedReferrals)
      if (appsData.applications) setApplications(appsData.applications)
      if (networksData.networks) setNetworks(networksData.networks)
      if (milestonesData.milestones) setMilestones(milestonesData.milestones)
      if (broadcastsData.broadcasts) setBroadcasts(broadcastsData.broadcasts)
      if (healthResData.health) setHealthData(healthResData.health)
    } catch (err) {
      console.error('Failed to load affiliate data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/affiliate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Settings saved', description: 'Affiliate program settings updated. Existing affiliates keep their locked-in terms.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const saveTier = async () => {
    try {
      const method = editingTier ? 'PUT' : 'POST'
      const body = editingTier ? { id: editingTier.id, ...tierForm } : tierForm
      const res = await fetch('/api/affiliate/tiers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: editingTier ? 'Tier updated' : 'Tier created' })
      setTierDialog(false)
      setEditingTier(null)
      setTierForm({ name: '', min_referrals: 0, commission_rate: 20, sort_order: 0 })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to save tier', variant: 'destructive' })
    }
  }

  const deleteTier = async (id: string) => {
    try {
      const res = await fetch(`/api/affiliate/tiers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Tier deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete tier', variant: 'destructive' })
    }
  }

  const saveAsset = async () => {
    try {
      const method = editingAsset ? 'PUT' : 'POST'
      const body = editingAsset ? { id: editingAsset.id, ...assetForm } : assetForm
      const res = await fetch('/api/affiliate/assets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: editingAsset ? 'Asset updated' : 'Asset created' })
      setAssetDialog(false)
      setEditingAsset(null)
      setAssetForm({ title: '', description: '', asset_type: 'banner', content: '', file_url: '' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to save asset', variant: 'destructive' })
    }
  }

  const deleteAsset = async (id: string) => {
    try {
      const res = await fetch(`/api/affiliate/assets?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Asset deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete asset', variant: 'destructive' })
    }
  }

  const reviewApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    setReviewingApp(applicationId)
    try {
      const res = await fetch('/api/affiliate/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, action, reviewer_notes: reviewNotes }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast({ title: action === 'approve' ? 'Application Approved' : 'Application Rejected', description: action === 'approve' ? 'Affiliate account created with referral link.' : 'Applicant has been notified.' })
      setReviewNotes('')
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to review application', variant: 'destructive' })
    } finally {
      setReviewingApp(null)
    }
  }

  const toggleNetwork = async (network: NetworkSetting) => {
    try {
      const res = await fetch('/api/affiliate/networks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: network.id, is_active: !network.is_active }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: `${network.network_name} ${!network.is_active ? 'enabled' : 'disabled'}` })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to update network', variant: 'destructive' })
    }
  }

  const saveNetwork = async (network: NetworkSetting, updates: Partial<NetworkSetting>) => {
    try {
      const res = await fetch('/api/affiliate/networks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: network.id, ...updates }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Network settings saved' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to save network settings', variant: 'destructive' })
    }
  }

  const saveMilestone = async () => {
    try {
      const method = editingMilestone ? 'PUT' : 'POST'
      const body = editingMilestone ? { id: editingMilestone.id, ...milestoneForm } : milestoneForm
      const res = await fetch('/api/affiliate/milestones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: editingMilestone ? 'Milestone updated' : 'Milestone created' })
      setMilestoneDialog(false)
      setEditingMilestone(null)
      setMilestoneForm({ name: '', referral_threshold: 10, bonus_amount_cents: 5000, description: '', is_active: true, sort_order: 0 })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to save milestone', variant: 'destructive' })
    }
  }

  const deleteMilestone = async (id: string) => {
    try {
      const res = await fetch(`/api/affiliate/milestones?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Milestone deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete milestone', variant: 'destructive' })
    }
  }

  const saveBroadcast = async () => {
    if (!broadcastForm.subject || !broadcastForm.body) {
      toast({ title: 'Missing fields', description: 'Subject and body are required', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/affiliate/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastForm.subject,
          body: broadcastForm.body,
          audience_filter: { type: broadcastForm.audience_type },
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Broadcast draft created' })
      setBroadcastDialog(false)
      setBroadcastForm({ subject: '', body: '', audience_type: 'all' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to create broadcast', variant: 'destructive' })
    }
  }

  const deleteBroadcast = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/broadcasts?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Broadcast deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete broadcast', variant: 'destructive' })
    }
  }

  const filteredApplications = applications.filter(a => appFilter === 'all' || a.status === appFilter)
  const pendingCount = applications.filter(a => a.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-affiliate">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="page-affiliate-admin">
      <div>
        <h2 className="text-xl font-semibold" data-testid="text-affiliate-title">Affiliate Program</h2>
        <p className="text-sm text-muted-foreground">Manage your referral program, commission rates, tiers, and marketing assets.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card data-testid="stat-total-affiliates">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Affiliates</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalAffiliates}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-referrals">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Referrals</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalReferrals}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-revenue">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Referred Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-1">${(stats.totalRevenue / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-commissions">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Commissions Owed</span>
            </div>
            <p className="text-2xl font-bold mt-1">${(stats.totalCommissions / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {stats.flaggedCount > 0 && (
        <Card className="border-amber-500/50" data-testid="card-fraud-alerts">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Fraud Alerts ({stats.flaggedCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flaggedReferrals.slice(0, 5).map(ref => (
                <div key={ref.id} className="flex items-center gap-2 p-2 rounded border text-sm" data-testid={`fraud-alert-${ref.id}`}>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    {(ref.fraud_flags || []).map(f => FRAUD_FLAG_LABELS[f] || f).join(', ')}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="health" data-testid="tabs-affiliate-admin">
        <TabsList className="flex-wrap">
          <TabsTrigger value="health" data-testid="tab-health">
            <Activity className="h-3.5 w-3.5 mr-1" /> Health
          </TabsTrigger>
          <TabsTrigger value="applications" data-testid="tab-applications">
            Applications {pendingCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          <TabsTrigger value="tiers" data-testid="tab-tiers">Tiers</TabsTrigger>
          <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets">Marketing Assets</TabsTrigger>
          <TabsTrigger value="broadcasts" data-testid="tab-broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="affiliates" data-testid="tab-affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="networks" data-testid="tab-networks">Networks</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4 mt-4">
          {healthData ? (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card data-testid="health-active-affiliates">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{healthData.overview.activeAffiliates}</p>
                    <p className="text-xs text-muted-foreground">of {healthData.overview.totalAffiliates} total</p>
                  </CardContent>
                </Card>
                <Card data-testid="health-dormant-affiliates">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">Dormant</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{healthData.overview.dormantAffiliates}</p>
                    <p className="text-xs text-muted-foreground">no activity in 30 days</p>
                  </CardContent>
                </Card>
                <Card data-testid="health-net-roi">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Net ROI</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">${(healthData.revenue.netROI / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">revenue minus commissions</p>
                  </CardContent>
                </Card>
                <Card data-testid="health-conversion-rate">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{healthData.growth.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">{healthData.growth.conversionsThisMonth} this month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card data-testid="health-revenue-breakdown">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Revenue Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total referred revenue</span>
                      <span className="font-medium">${(healthData.revenue.totalRevenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Commissions paid</span>
                      <span className="font-medium text-red-500">-${(healthData.revenue.totalCommissionsPaid / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Commissions pending</span>
                      <span className="font-medium text-amber-500">-${(healthData.revenue.totalCommissionsPending / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Net profit from affiliates</span>
                      <span className="font-bold text-green-600">${(healthData.revenue.netROI / 100).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="health-engagement">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Program Engagement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg referrals per affiliate</span>
                      <span className="font-medium">{healthData.engagement.avgReferralsPerAffiliate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg earnings per affiliate</span>
                      <span className="font-medium">${(healthData.engagement.avgEarningsPerAffiliate / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">New referrals this month</span>
                      <span className="font-medium">{healthData.growth.referralsThisMonth}</span>
                    </div>
                    {healthData.alerts.flaggedReferrals > 0 && (
                      <div className="flex justify-between text-sm text-amber-500 border-t pt-2">
                        <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Flagged referrals</span>
                        <span className="font-medium">{healthData.alerts.flaggedReferrals}</span>
                      </div>
                    )}
                    {healthData.alerts.pendingPayoutAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending payouts</span>
                        <span className="font-medium">${(healthData.alerts.pendingPayoutAmount / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {healthData.topPerformers.length > 0 && (
                <Card data-testid="health-top-performers">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {healthData.topPerformers.map((tp, i) => (
                        <div key={tp.userId} className="flex items-center justify-between p-2 rounded border text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                            <span className="font-mono text-xs truncate max-w-[120px]">{tp.userId.slice(0, 8)}...</span>
                            <span className="text-xs text-muted-foreground">{tp.referrals} referrals</span>
                          </div>
                          <span className="font-medium">${(tp.earnings / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Program health data will appear here once you have affiliates and referral activity.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4 mt-4">
          <Card data-testid="card-applications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Affiliate Applications ({filteredApplications.length})
                </CardTitle>
                <CardDescription>Review and approve affiliate program applications</CardDescription>
              </div>
              <Select value={appFilter} onValueChange={setAppFilter}>
                <SelectTrigger className="w-36" data-testid="select-app-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-applications">
                  No {appFilter !== 'all' ? appFilter : ''} applications.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredApplications.map(app => (
                    <div key={app.id} className="p-4 rounded-md border" data-testid={`application-${app.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{app.name}</p>
                            <Badge
                              variant={app.status === 'pending' ? 'outline' : app.status === 'approved' ? 'secondary' : 'destructive'}
                              className="text-xs capitalize"
                            >
                              {app.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <a href={`mailto:${app.email}`} className="hover:underline flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {app.email}
                            </a>
                            {app.website_url && (
                              <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                <Globe className="h-3 w-3" /> {app.website_url.replace(/^https?:\/\//, '').slice(0, 30)}
                              </a>
                            )}
                            <span>{app.promotion_method.split(',').map(m => PROMOTION_LABELS[m.trim()] || m.trim()).join(', ')}</span>
                            <span>{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          {app.message && (
                            <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded p-2 italic">"{app.message}"</p>
                          )}
                          {app.reviewer_notes && (
                            <p className="text-xs text-muted-foreground mt-1">Notes: {app.reviewer_notes}</p>
                          )}
                        </div>
                        {app.status === 'pending' && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => reviewApplication(app.id, 'approve')}
                                disabled={reviewingApp === app.id}
                                data-testid={`button-approve-${app.id}`}
                              >
                                {reviewingApp === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reviewApplication(app.id, 'reject')}
                                disabled={reviewingApp === app.id}
                                data-testid={`button-reject-${app.id}`}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                            <Input
                              placeholder="Reviewer notes (optional)"
                              value={reviewNotes}
                              onChange={e => setReviewNotes(e.target.value)}
                              className="text-xs h-7"
                              data-testid={`input-review-notes-${app.id}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card data-testid="card-commission-settings">
            <CardHeader>
              <CardTitle className="text-base">Commission Settings</CardTitle>
              <CardDescription>Changes only apply to new affiliates. Existing affiliates keep their locked-in terms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Program Active</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable the affiliate program</p>
                </div>
                <Switch
                  checked={settings.program_active}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, program_active: v }))}
                  data-testid="switch-program-active"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.commission_rate}
                    onChange={(e) => setSettings(s => ({ ...s, commission_rate: parseFloat(e.target.value) || 0 }))}
                    data-testid="input-commission-rate"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentage of each referred payment</p>
                </div>
                <div>
                  <Label htmlFor="duration">Commission Duration (months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="120"
                    value={settings.commission_duration_months}
                    onChange={(e) => setSettings(s => ({ ...s, commission_duration_months: parseInt(e.target.value) || 12 }))}
                    data-testid="input-duration"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How long commissions are earned per referral</p>
                </div>
                <div>
                  <Label htmlFor="min-payout">Minimum Payout ($)</Label>
                  <Input
                    id="min-payout"
                    type="number"
                    min="0"
                    step="5"
                    value={settings.min_payout_cents / 100}
                    onChange={(e) => setSettings(s => ({ ...s, min_payout_cents: Math.round((parseFloat(e.target.value) || 0) * 100) }))}
                    data-testid="input-min-payout"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum balance before payout is available</p>
                </div>
                <div>
                  <Label htmlFor="cookie-days">Cookie Duration (days)</Label>
                  <Input
                    id="cookie-days"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.cookie_duration_days}
                    onChange={(e) => setSettings(s => ({ ...s, cookie_duration_days: parseInt(e.target.value) || 30 }))}
                    data-testid="input-cookie-days"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How long the referral cookie lasts after a click</p>
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label htmlFor="attribution-policy">Attribution Conflict Policy</Label>
                <p className="text-xs text-muted-foreground mb-2">When both a referral cookie and a discount code point to different affiliates, who gets the commission?</p>
                <Select value={settings.attribution_conflict_policy || 'cookie_wins'} onValueChange={v => setSettings(s => ({ ...s, attribution_conflict_policy: v }))}>
                  <SelectTrigger className="w-full sm:w-64" data-testid="select-attribution-policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cookie_wins">Cookie Wins (default)</SelectItem>
                    <SelectItem value="code_wins">Discount Code Wins</SelectItem>
                    <SelectItem value="first_touch">First Touch Wins</SelectItem>
                    <SelectItem value="split">Split Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={saveSettings} disabled={saving} data-testid="button-save-settings">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4 mt-4">
          <Card data-testid="card-tiers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Performance Tiers</CardTitle>
                <CardDescription>Reward top affiliates with higher commission rates</CardDescription>
              </div>
              <Dialog open={tierDialog} onOpenChange={(open) => { setTierDialog(open); if (!open) { setEditingTier(null); setTierForm({ name: '', min_referrals: 0, commission_rate: 20, sort_order: 0 }) } }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-tier">
                    <Plus className="h-4 w-4 mr-1" /> Add Tier
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-tier-form">
                  <DialogHeader>
                    <DialogTitle>{editingTier ? 'Edit Tier' : 'Add Tier'}</DialogTitle>
                    <DialogDescription>Set the name, minimum referrals, and commission rate for this tier.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Tier Name</Label>
                      <Input value={tierForm.name} onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Gold" data-testid="input-tier-name" />
                    </div>
                    <div>
                      <Label>Minimum Referrals</Label>
                      <Input type="number" min="0" value={tierForm.min_referrals} onChange={e => setTierForm(f => ({ ...f, min_referrals: parseInt(e.target.value) || 0 }))} data-testid="input-tier-min-referrals" />
                    </div>
                    <div>
                      <Label>Commission Rate (%)</Label>
                      <Input type="number" min="0" max="100" step="0.5" value={tierForm.commission_rate} onChange={e => setTierForm(f => ({ ...f, commission_rate: parseFloat(e.target.value) || 0 }))} data-testid="input-tier-rate" />
                    </div>
                    <div>
                      <Label>Sort Order</Label>
                      <Input type="number" min="0" value={tierForm.sort_order} onChange={e => setTierForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} data-testid="input-tier-sort" />
                    </div>
                    <Button onClick={saveTier} className="w-full" data-testid="button-save-tier">
                      {editingTier ? 'Update Tier' : 'Create Tier'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tiers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-tiers">No tiers configured. Add tiers to reward top affiliates.</p>
              ) : (
                <div className="space-y-2">
                  {tiers.map(tier => (
                    <div key={tier.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`tier-${tier.id}`}>
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{tier.name}</p>
                          <p className="text-xs text-muted-foreground">{tier.min_referrals}+ referrals = {tier.commission_rate}% commission</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTier(tier); setTierForm({ name: tier.name, min_referrals: tier.min_referrals, commission_rate: tier.commission_rate, sort_order: tier.sort_order }); setTierDialog(true) }} data-testid={`button-edit-tier-${tier.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTier(tier.id)} data-testid={`button-delete-tier-${tier.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4 mt-4">
          <Card data-testid="card-assets">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Marketing Assets</CardTitle>
                <CardDescription>Upload banners, email templates, and social post templates for affiliates</CardDescription>
              </div>
              <Dialog open={assetDialog} onOpenChange={(open) => { setAssetDialog(open); if (!open) { setEditingAsset(null); setAssetForm({ title: '', description: '', asset_type: 'banner', content: '', file_url: '' }) } }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-asset">
                    <Plus className="h-4 w-4 mr-1" /> Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg" data-testid="dialog-asset-form">
                  <DialogHeader>
                    <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
                    <DialogDescription>Create a marketing asset for affiliates to use.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={assetForm.title} onChange={e => setAssetForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Twitter Banner 1200x600" data-testid="input-asset-title" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={assetForm.asset_type} onValueChange={v => setAssetForm(f => ({ ...f, asset_type: v }))}>
                        <SelectTrigger data-testid="select-asset-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={assetForm.description} onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of this asset" data-testid="input-asset-description" />
                    </div>
                    {(assetForm.asset_type === 'email_template' || assetForm.asset_type === 'social_post' || assetForm.asset_type === 'text_snippet') && (
                      <div>
                        <Label>Content</Label>
                        <Textarea value={assetForm.content} onChange={e => setAssetForm(f => ({ ...f, content: e.target.value }))} placeholder="Paste your template content here..." rows={6} data-testid="input-asset-content" />
                      </div>
                    )}
                    {assetForm.asset_type === 'banner' && (
                      <div>
                        <Label>Image URL</Label>
                        <Input value={assetForm.file_url} onChange={e => setAssetForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." data-testid="input-asset-file-url" />
                      </div>
                    )}
                    <Button onClick={saveAsset} className="w-full" data-testid="button-save-asset">
                      {editingAsset ? 'Update Asset' : 'Create Asset'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-assets">No assets yet. Add banners, email templates, or social post templates.</p>
              ) : (
                <div className="space-y-2">
                  {assets.map(asset => {
                    const typeIcon = asset.asset_type === 'banner' ? FileImage : FileText
                    const TypeIcon = typeIcon
                    return (
                      <div key={asset.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`asset-${asset.id}`}>
                        <div className="flex items-center gap-3">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{asset.title}</p>
                            <p className="text-xs text-muted-foreground">{ASSET_TYPES.find(t => t.value === asset.asset_type)?.label || asset.asset_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingAsset(asset); setAssetForm({ title: asset.title, description: asset.description || '', asset_type: asset.asset_type, content: asset.content || '', file_url: asset.file_url || '' }); setAssetDialog(true) }} data-testid={`button-edit-asset-${asset.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteAsset(asset.id)} data-testid={`button-delete-asset-${asset.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4 mt-4">
          <Card data-testid="card-affiliates-list">
            <CardHeader>
              <CardTitle className="text-base">Affiliates ({affiliates.length})</CardTitle>
              <CardDescription>All active affiliates, ranked by total earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {affiliates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-affiliates">No affiliates yet. Users become affiliates when they activate in their dashboard.</p>
              ) : (
                <div className="space-y-2">
                  {affiliates.map(aff => (
                    <div key={aff.user_id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`affiliate-${aff.user_id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{aff.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{aff.ref_code}</Badge>
                          <span className="text-xs text-muted-foreground">{aff.signups} referrals</span>
                          <span className="text-xs text-muted-foreground">{aff.clicks} clicks</span>
                          {aff.locked_commission_rate && (
                            <Badge variant="secondary" className="text-xs">{aff.locked_commission_rate}% for {aff.locked_duration_months}mo</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold">${((aff.total_earnings_cents || 0) / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${((aff.pending_earnings_cents || 0) / 100).toFixed(2)} pending
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {stats.pendingPayouts > 0 && (
            <Card data-testid="card-pending-payouts">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Payouts ({stats.pendingPayouts})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  There are {stats.pendingPayouts} payout requests waiting for review. Process them from the individual affiliate view.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4 mt-4">
          <Card data-testid="card-milestones">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Milestone Bonuses</CardTitle>
                <CardDescription>One-time bonuses when affiliates hit referral count thresholds</CardDescription>
              </div>
              <Dialog open={milestoneDialog} onOpenChange={(open) => {
                setMilestoneDialog(open)
                if (!open) { setEditingMilestone(null); setMilestoneForm({ name: '', referral_threshold: 10, bonus_amount_cents: 5000, description: '', is_active: true, sort_order: 0 }) }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-milestone">
                    <Plus className="h-4 w-4 mr-1" /> Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-milestone-form">
                  <DialogHeader>
                    <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
                    <DialogDescription>Set a bonus that affiliates earn when they reach a referral count.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={milestoneForm.name} onChange={e => setMilestoneForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., First 10 Referrals" data-testid="input-milestone-name" />
                    </div>
                    <div>
                      <Label>Referral Threshold</Label>
                      <Input type="number" min="1" value={milestoneForm.referral_threshold} onChange={e => setMilestoneForm(f => ({ ...f, referral_threshold: parseInt(e.target.value) || 0 }))} data-testid="input-milestone-threshold" />
                    </div>
                    <div>
                      <Label>Bonus Amount ($)</Label>
                      <Input type="number" min="0" step="5" value={milestoneForm.bonus_amount_cents / 100} onChange={e => setMilestoneForm(f => ({ ...f, bonus_amount_cents: Math.round((parseFloat(e.target.value) || 0) * 100) }))} data-testid="input-milestone-bonus" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={milestoneForm.description} onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))} placeholder="Shown to affiliates on their dashboard" data-testid="input-milestone-description" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active</Label>
                      <Switch checked={milestoneForm.is_active} onCheckedChange={v => setMilestoneForm(f => ({ ...f, is_active: v }))} data-testid="switch-milestone-active" />
                    </div>
                    <Button onClick={saveMilestone} className="w-full" data-testid="button-save-milestone">
                      {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-milestones">
                  No milestones configured. Add milestones to motivate affiliates with bonus payouts at specific referral counts.
                </p>
              ) : (
                <div className="space-y-2">
                  {milestones.map(ms => (
                    <div key={ms.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`milestone-${ms.id}`}>
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{ms.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ms.referral_threshold} referrals = ${(ms.bonus_amount_cents / 100).toFixed(2)} bonus
                          </p>
                          {ms.description && <p className="text-xs text-muted-foreground italic">{ms.description}</p>}
                        </div>
                        {!ms.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingMilestone(ms)
                          setMilestoneForm({ name: ms.name, referral_threshold: ms.referral_threshold, bonus_amount_cents: ms.bonus_amount_cents, description: ms.description || '', is_active: ms.is_active, sort_order: ms.sort_order })
                          setMilestoneDialog(true)
                        }} data-testid={`button-edit-milestone-${ms.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMilestone(ms.id)} data-testid={`button-delete-milestone-${ms.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-4 mt-4">
          <Card data-testid="card-broadcasts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Affiliate Broadcasts
                </CardTitle>
                <CardDescription>Send announcements and updates to your affiliates</CardDescription>
              </div>
              <Dialog open={broadcastDialog} onOpenChange={(open) => {
                setBroadcastDialog(open)
                if (!open) setBroadcastForm({ subject: '', body: '', audience_type: 'all' })
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-broadcast">
                    <Plus className="h-4 w-4 mr-1" /> New Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg" data-testid="dialog-broadcast-form">
                  <DialogHeader>
                    <DialogTitle>Create Broadcast</DialogTitle>
                    <DialogDescription>Compose an email to send to your affiliates.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Subject</Label>
                      <Input value={broadcastForm.subject} onChange={e => setBroadcastForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g., New commission rate increase!" data-testid="input-broadcast-subject" />
                    </div>
                    <div>
                      <Label>Audience</Label>
                      <Select value={broadcastForm.audience_type} onValueChange={v => setBroadcastForm(f => ({ ...f, audience_type: v }))}>
                        <SelectTrigger data-testid="select-broadcast-audience">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Active Affiliates</SelectItem>
                          <SelectItem value="top_performers">Top Performers</SelectItem>
                          <SelectItem value="dormant">Dormant Affiliates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea value={broadcastForm.body} onChange={e => setBroadcastForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your message here..." rows={6} data-testid="input-broadcast-body" />
                    </div>
                    <Button onClick={saveBroadcast} className="w-full" data-testid="button-save-broadcast">
                      Save as Draft
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {broadcasts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-broadcasts">
                  No broadcasts yet. Create one to communicate with your affiliates.
                </p>
              ) : (
                <div className="space-y-2">
                  {broadcasts.map(bc => (
                    <div key={bc.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`broadcast-${bc.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{bc.subject}</p>
                          <Badge variant={bc.status === 'sent' ? 'default' : 'outline'} className="text-xs capitalize">
                            {bc.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(bc.created_at).toLocaleDateString()}</span>
                          {bc.status === 'sent' && (
                            <>
                              <span>Sent: {bc.sent_count}</span>
                              <span>Opened: {bc.opened_count}</span>
                              <span>Clicked: {bc.clicked_count}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        {bc.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => deleteBroadcast(bc.id)} data-testid={`button-delete-broadcast-${bc.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="networks" className="space-y-4 mt-4">
          <Card data-testid="card-networks">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Affiliate Networks
              </CardTitle>
              <CardDescription>Connect to external affiliate networks for broader reach. Configure tracking IDs and postback URLs for server-side conversion tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              {networks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-networks">
                  No affiliate networks configured yet. Networks will appear here once the database migration is run.
                </p>
              ) : (
                <div className="space-y-4">
                  {networks.map(network => (
                    <div key={network.id} className="p-4 rounded-md border" data-testid={`network-${network.network_slug}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{network.network_name}</h4>
                          <Badge variant={network.is_active ? 'secondary' : 'outline'} className="text-xs">
                            {network.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <Switch
                          checked={network.is_active}
                          onCheckedChange={() => toggleNetwork(network)}
                          data-testid={`switch-network-${network.network_slug}`}
                        />
                      </div>
                      {network.is_active && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs">Tracking ID</Label>
                            <Input
                              defaultValue={network.tracking_id || ''}
                              placeholder="Your network tracking ID"
                              onBlur={e => {
                                if (e.target.value !== (network.tracking_id || '')) {
                                  saveNetwork(network, { tracking_id: e.target.value || null })
                                }
                              }}
                              className="text-xs h-8"
                              data-testid={`input-tracking-${network.network_slug}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Postback URL</Label>
                            <Input
                              defaultValue={network.postback_url || ''}
                              placeholder="https://network.com/postback?..."
                              onBlur={e => {
                                if (e.target.value !== (network.postback_url || '')) {
                                  saveNetwork(network, { postback_url: e.target.value || null })
                                }
                              }}
                              className="text-xs h-8"
                              data-testid={`input-postback-${network.network_slug}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
