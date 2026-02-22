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
import {
  Loader2, Save, DollarSign, Users, TrendingUp, AlertTriangle,
  Plus, Trash2, Pencil, Award, FileImage, FileText, Share2,
  CheckCircle, XCircle, Clock, Eye,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Settings {
  commission_rate: number
  commission_duration_months: number
  min_payout_cents: number
  cookie_duration_days: number
  program_active: boolean
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

const ASSET_TYPES = [
  { value: 'banner', label: 'Banner Image' },
  { value: 'email_template', label: 'Email Template' },
  { value: 'social_post', label: 'Social Post Template' },
  { value: 'text_snippet', label: 'Text Snippet' },
]

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

  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, tiersRes, assetsRes, referralsRes] = await Promise.all([
        fetch('/api/affiliate/settings'),
        fetch('/api/affiliate/tiers'),
        fetch('/api/affiliate/assets'),
        fetch('/api/affiliate/referrals?admin=true'),
      ])

      const [settingsData, tiersData, assetsData, referralsData] = await Promise.all([
        settingsRes.json(),
        tiersRes.json(),
        assetsRes.json(),
        referralsRes.json(),
      ])

      if (settingsData.settings) setSettings(settingsData.settings)
      if (tiersData.tiers) setTiers(tiersData.tiers)
      if (assetsData.assets) setAssets(assetsData.assets)
      if (referralsData.affiliates) setAffiliates(referralsData.affiliates)
      if (referralsData.stats) setStats(referralsData.stats)
      if (referralsData.flaggedReferrals) setFlaggedReferrals(referralsData.flaggedReferrals)
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

      <Tabs defaultValue="settings" data-testid="tabs-affiliate-admin">
        <TabsList>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          <TabsTrigger value="tiers" data-testid="tab-tiers">Tiers</TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets">Marketing Assets</TabsTrigger>
          <TabsTrigger value="affiliates" data-testid="tab-affiliates">Affiliates</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  )
}
