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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2, Copy, Check, DollarSign, Users, TrendingUp, Share2,
  Award, MousePointerClick, FileImage, FileText,
  ExternalLink, Clock, CheckCircle, LogOut,
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
}

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
      const [dashRes, assetsRes] = await Promise.all([
        fetch('/api/affiliate/dashboard'),
        fetch('/api/affiliate/assets'),
      ])

      const [dashData, assetsData] = await Promise.all([
        dashRes.json(),
        assetsRes.json(),
      ])

      setData(dashData.affiliate)
      setAssets(assetsData.assets || [])
    } catch (err) {
      console.error('Failed to load affiliate data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authChecking) fetchData()
  }, [authChecking, fetchData])

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
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="referrals" data-testid="tabs-affiliate-dashboard">
            <TabsList>
              <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals ({data.referrals.length})</TabsTrigger>
              <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings ({data.commissions.length})</TabsTrigger>
              <TabsTrigger value="payouts" data-testid="tab-payouts">Payouts ({data.payouts.length})</TabsTrigger>
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
