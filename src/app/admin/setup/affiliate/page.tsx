'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
  CheckCircle, XCircle, Clock, Globe, UserPlus, Mail,
  Target, Send, BarChart3, Activity, Megaphone, Calendar, Package, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown, Search, Info, HelpCircle, ClipboardList, Trophy,
  MessageSquare, Star, Eye, Shield,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DetailModal, { DetailField } from '@/components/admin/DetailModal'
import HelpTooltip from '@/components/admin/HelpTooltip'
import SortableHeader from '@/components/admin/SortableHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkline } from '@/components/admin/sparkline'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'

interface Settings {
  commission_rate: number
  commission_duration_months: number
  min_payout_cents: number
  cookie_duration_days: number
  program_active: boolean
  attribution_conflict_policy: string
  leaderboard_enabled: boolean
  leaderboard_privacy_mode: string
  auto_batch_enabled: boolean
  payout_schedule_day: number
  auto_approve_threshold_cents: number
  reengagement_enabled: boolean
  dormancy_threshold_days: number
  max_reengagement_emails: number
  two_tier_enabled: boolean
  second_tier_commission_rate: number
  fraud_scoring_enabled: boolean
  fraud_auto_pause_threshold: number
  survey_interval_days: number
}

interface Milestone {
  id: string
  name: string
  referral_threshold: number
  bonus_amount_cents: number
  description: string | null
  is_active: boolean
  sort_order: number
  earned_count?: number
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

interface AffiliateMember {
  userId: string
  email: string
  name: string
  refCode: string
  isAffiliate: boolean
  status: string
  suspended: boolean
  suspensionReason: string | null
  fraudScore: number
  fraudScoreUpdatedAt: string | null
  tier: string
  referrals: number
  clicks: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  lockedRate: number | null
  lockedDuration: number | null
  joinedAt: string
  lastSignIn: string | null
  applicationStatus: string | null
  earningsTrend: number[]
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
  { value: 'video', label: 'Video' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'one_pager', label: 'One-Pager / PDF' },
  { value: 'swipe_file', label: 'Swipe File' },
  { value: 'landing_page', label: 'Landing Page Template' },
  { value: 'faq', label: 'FAQ' },
  { value: 'video_tutorial', label: 'Video Tutorial' },
  { value: 'best_practice', label: 'Best Practice Guide' },
  { value: 'guide', label: 'Getting Started Guide' },
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

function AdminMessagesTab() {
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/affiliate/messages')
      if (!res.ok) { setThreads([]); return }
      const data = await res.json()
      setThreads(data.threads || [])
    } catch { setThreads([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadThreads() }, [loadThreads])

  const openThread = async (affiliateId: string) => {
    setSelectedThread(affiliateId)
    try {
      const res = await fetch(`/api/admin/affiliate/messages/${affiliateId}`)
      if (res.ok) {
        const data = await res.json()
        setThreadMessages(data.messages || [])
        loadThreads()
      }
    } catch {}
  }

  const sendReply = async () => {
    if (!reply.trim() || !selectedThread) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/affiliate/messages/${selectedThread}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply })
      })
      if (res.ok) {
        setReply('')
        openThread(selectedThread)
        toast({ title: 'Message sent' })
      }
    } catch { toast({ title: 'Failed to send', variant: 'destructive' }) }
    finally { setSending(false) }
  }

  if (loading) return <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="grid gap-[var(--content-density-gap,1rem)] md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader><CardTitle className="text-base">Affiliate Threads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground p-[var(--card-padding,1.25rem)]">No messages yet.</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-auto">
              {threads.map((t: any) => (
                <button key={t.affiliate_user_id} onClick={() => openThread(t.affiliate_user_id)}
                  className={`w-full text-left p-[var(--card-padding,1.25rem)] hover:bg-muted/50 transition ${selectedThread === t.affiliate_user_id ? 'bg-muted' : ''}`}
                  data-testid={`thread-${t.affiliate_user_id}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{t.ref_code || t.affiliate_user_id.slice(0, 8)}</span>
                    {t.unread_count > 0 && <Badge variant="destructive" className="text-[10px]">{t.unread_count}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{t.last_message}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">{selectedThread ? 'Conversation' : 'Select a thread'}</CardTitle></CardHeader>
        <CardContent>
          {selectedThread ? (
            <>
              <div className="space-y-2 max-h-[400px] overflow-auto mb-[var(--content-density-gap,1rem)]">
                {threadMessages.map((m: any) => (
                  <div key={m.id} className={`p-2 rounded text-sm max-w-[80%] ${m.sender_role === 'admin' ? 'ml-auto bg-primary/10' : 'bg-muted'}`}>
                    <p>{m.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  data-testid="input-admin-reply" />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} data-testid="button-admin-send">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]">Select an affiliate thread to view messages.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminTestimonialsTab() {
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', quote: '', earnings_display: '', tier_name: '', avatar_url: '', is_featured: false })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadTestimonials = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/affiliate/testimonials')
      if (res.ok) { const data = await res.json(); setTestimonials(data.testimonials || []) }
      else setTestimonials([])
    } catch { setTestimonials([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadTestimonials() }, [loadTestimonials])

  const saveTestimonial = async () => {
    if (!form.name || !form.quote) { toast({ title: 'Name and quote required', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { ...form, id: editingId } : form
      const res = await fetch('/api/admin/affiliate/testimonials', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (res.ok) {
        toast({ title: editingId ? 'Testimonial updated' : 'Testimonial added' })
        setForm({ name: '', quote: '', earnings_display: '', tier_name: '', avatar_url: '', is_featured: false })
        setEditingId(null)
        loadTestimonials()
      }
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const deleteTestimonial = async (id: string) => {
    try {
      const res = await fetch('/api/admin/affiliate/testimonials', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
      })
      if (res.ok) { toast({ title: 'Testimonial deleted' }); loadTestimonials() }
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }) }
  }

  if (loading) return <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <Card>
        <CardHeader><CardTitle className="text-base">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-[var(--content-density-gap,1rem)] sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" data-testid="input-testimonial-name" />
            </div>
            <div>
              <Label>Earnings Display</Label>
              <Input value={form.earnings_display} onChange={e => setForm(f => ({ ...f, earnings_display: e.target.value }))} placeholder="$2,000+ earned" data-testid="input-testimonial-earnings" />
            </div>
          </div>
          <div>
            <Label>Quote</Label>
            <Textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} placeholder="I earned $2,000 in my first 3 months..." data-testid="input-testimonial-quote" />
          </div>
          <div className="grid gap-[var(--content-density-gap,1rem)] sm:grid-cols-2">
            <div>
              <Label>Tier Name</Label>
              <Input value={form.tier_name} onChange={e => setForm(f => ({ ...f, tier_name: e.target.value }))} placeholder="Gold" data-testid="input-testimonial-tier" />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." data-testid="input-testimonial-avatar" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} data-testid="switch-testimonial-featured" />
            <Label>Featured</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveTestimonial} disabled={saving} data-testid="button-save-testimonial">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {editingId ? 'Update' : 'Add'}
            </Button>
            {editingId && <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ name: '', quote: '', earnings_display: '', tier_name: '', avatar_url: '', is_featured: false }) }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      {testimonials.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Existing Testimonials ({testimonials.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {testimonials.map((t: any) => (
                <div key={t.id} className="p-[var(--card-padding,1.25rem)] flex items-start justify-between gap-[var(--content-density-gap,1rem)]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{t.name}</p>
                      {t.is_featured && <Badge variant="default" className="text-[10px]">Featured</Badge>}
                      {!t.is_active && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">"{t.quote}"</p>
                    {t.earnings_display && <p className="text-xs text-muted-foreground">{t.earnings_display}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(t.id); setForm({ name: t.name, quote: t.quote, earnings_display: t.earnings_display || '', tier_name: t.tier_name || '', avatar_url: t.avatar_url || '', is_featured: t.is_featured }) }} data-testid={`button-edit-testimonial-${t.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteTestimonial(t.id)} data-testid={`button-delete-testimonial-${t.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminRenewalsTab() {
  const [renewals, setRenewals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const { toast } = useToast()

  const loadRenewals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/renewals')
      if (res.ok) {
        const data = await res.json()
        setRenewals(data.renewals || [])
      } else {
        setRenewals([])
      }
    } catch { setRenewals([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadRenewals() }, [loadRenewals])

  const handleAction = async (id: string, status: 'approved' | 'denied') => {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/renewals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast({ title: status === 'approved' ? 'Renewal Approved' : 'Renewal Denied' })
        loadRenewals()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to process renewal.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to process renewal.', variant: 'destructive' })
    }
    setProcessingId(null)
  }

  if (loading) return <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-6 w-6 animate-spin" /></div>

  const filtered = filterStatus === 'all' ? renewals : renewals.filter(r => r.status === filterStatus)
  const pendingCount = renewals.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <Card data-testid="card-admin-renewals">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Commission Renewal Requests
                {pendingCount > 0 && <Badge variant="destructive" className="text-[10px]">{pendingCount} pending</Badge>}
              </CardTitle>
              <CardDescription>Review and approve/deny affiliate commission renewal requests</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-[120px]" data-testid="select-renewal-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-[var(--section-spacing,1.5rem)]" data-testid="text-no-admin-renewals">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {filterStatus === 'all' ? 'No renewal requests yet.' : `No ${filterStatus} renewal requests.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r: any) => (
                <div key={r.id} className="p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border space-y-2" data-testid={`admin-renewal-${r.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        Affiliate: <span className="font-mono">{r.affiliate_ref_code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Referral #{r.referral_id?.slice(0, 8)} · Submitted {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={r.status === 'approved' ? 'default' : r.status === 'denied' ? 'destructive' : 'outline'}
                      className="text-xs capitalize"
                      data-testid={`badge-admin-renewal-status-${r.id}`}
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Check-in Type: </span>
                      <span className="capitalize">{r.check_in_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Original End: </span>
                      <span>{r.original_end_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Renewed End: </span>
                      <span>{r.renewed_end_date}</span>
                    </div>
                  </div>
                  {r.check_in_notes && (
                    <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2 mt-1">{r.check_in_notes}</p>
                  )}
                  {r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAction(r.id, 'approved')}
                        disabled={processingId === r.id}
                        data-testid={`button-approve-renewal-${r.id}`}
                      >
                        {processingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(r.id, 'denied')}
                        disabled={processingId === r.id}
                        data-testid={`button-deny-renewal-${r.id}`}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                  {r.reviewed_at && (
                    <p className="text-[10px] text-muted-foreground">Reviewed {new Date(r.reviewed_at).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AffiliateCRMDrawer({
  member,
  open,
  onClose,
  onSuspend,
  onRecalcFraud,
  suspendingMember,
  recalcFraud: recalcFraudId,
}: {
  member: AffiliateMember | null
  open: boolean
  onClose: () => void
  onSuspend: (userId: string, email: string, suspend: boolean) => void
  onRecalcFraud: (userId: string, email: string) => void
  suspendingMember: string | null
  recalcFraud: string | null
}) {
  const [crmTab, setCrmTab] = useState('profile')
  const [tickets, setTickets] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [loadingCrm, setLoadingCrm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open || !member) return
    setCrmTab('profile')
    setLoadingCrm(true)
    const userId = member.userId

    Promise.all([
      fetch(`/api/admin/tickets?user_id=${userId}&limit=10`).then(r => r.ok ? r.json() : { tickets: [] }).catch(() => ({ tickets: [] })),
      fetch(`/api/activities?user_id=${userId}&limit=20`).then(r => r.ok ? r.json() : { activities: [] }).catch(() => ({ activities: [] })),
      fetch(`/api/activities?user_id=${userId}&activity_type=note&limit=50`).then(r => r.ok ? r.json() : { activities: [] }).catch(() => ({ activities: [] })),
      fetch(`/api/affiliate/payouts?affiliateId=${userId}`).then(r => r.ok ? r.json() : { payouts: [] }).catch(() => ({ payouts: [] })),
    ]).then(([ticketData, activityData, noteData, payoutData]) => {
      setTickets(ticketData.tickets || [])
      setActivities((activityData.activities || []).filter((a: any) => a.activity_type !== 'note'))
      setNotes(noteData.activities || [])
      setPayouts(payoutData.payouts || [])
    }).finally(() => setLoadingCrm(false))
  }, [open, member])

  const addNote = async () => {
    if (!noteText.trim() || !member) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note',
          subject: 'Admin Note',
          body: noteText.trim(),
          related_entity_type: 'affiliate',
          related_entity_id: member.userId,
          user_id: member.userId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes(prev => [data.activity, ...prev])
        setNoteText('')
        toast({ title: 'Note added' })
      } else {
        toast({ title: 'Failed to add note', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to add note', variant: 'destructive' })
    } finally {
      setSavingNote(false)
    }
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="dialog-crm-drawer">
        <DialogHeader>
          <DialogTitle className="text-lg" data-testid="text-crm-title">{member.name || member.email}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span>{member.email}</span>
            <Badge variant="outline" className="text-[10px]">{member.refCode}</Badge>
            <Badge
              variant={member.suspended ? 'destructive' : member.status === 'active' ? 'default' : 'secondary'}
              className="text-[10px]"
              data-testid="badge-crm-status"
            >
              {member.suspended ? 'Suspended' : member.status === 'active' ? 'Active' : member.status === 'pending_setup' ? 'Pending Setup' : 'Inactive'}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={crmTab} onValueChange={setCrmTab} className="flex-1 min-h-0">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile" data-testid="crm-tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="payouts" data-testid="crm-tab-payouts">Payouts</TabsTrigger>
            <TabsTrigger value="tickets" data-testid="crm-tab-tickets">Tickets</TabsTrigger>
            <TabsTrigger value="activity" data-testid="crm-tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="notes" data-testid="crm-tab-notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[55vh] mt-3">
            <TabsContent value="profile" className="space-y-[var(--content-density-gap,1rem)] mt-0 pr-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-y-1.5">
                    <span className="text-muted-foreground">Name</span>
                    <span data-testid="text-crm-name">{member.name || '—'}</span>
                    <span className="text-muted-foreground">Email</span>
                    <span data-testid="text-crm-email">{member.email}</span>
                    <span className="text-muted-foreground">Joined</span>
                    <span data-testid="text-crm-joined">{new Date(member.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="text-muted-foreground">Last Sign In</span>
                    <span>{member.lastSignIn ? new Date(member.lastSignIn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
                    <span className="text-muted-foreground">Tier</span>
                    <span data-testid="text-crm-tier">{member.tier}</span>
                    <span className="text-muted-foreground">Fraud Score</span>
                    <span>
                      <Badge variant={member.fraudScore >= 60 ? 'destructive' : member.fraudScore >= 30 ? 'secondary' : 'outline'} className="text-[10px]" data-testid="badge-crm-fraud">
                        {member.fraudScore || 0}{member.fraudScore >= 60 ? ' (High)' : member.fraudScore >= 30 ? ' (Medium)' : ''}
                      </Badge>
                    </span>
                    {member.lockedRate && (
                      <>
                        <span className="text-muted-foreground">Locked Rate</span>
                        <span>{member.lockedRate}%{member.lockedDuration ? ` for ${member.lockedDuration} months` : ''}</span>
                      </>
                    )}
                    {member.suspended && member.suspensionReason && (
                      <>
                        <span className="text-muted-foreground">Suspension</span>
                        <span className="text-destructive">{member.suspensionReason}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Earnings Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold tabular-nums" data-testid="text-crm-total-earnings">${((member.totalEarnings || 0) / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold tabular-nums" data-testid="text-crm-pending-earnings">${((member.pendingEarnings || 0) / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold tabular-nums" data-testid="text-crm-paid-earnings">${((member.paidEarnings || 0) / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Paid</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--content-density-gap,1rem)] mt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-crm-referrals">{member.referrals} referrals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-crm-clicks">{member.clicks} clicks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center flex-wrap gap-2 pt-1">
                <Button
                  variant={member.suspended ? 'default' : 'destructive'}
                  size="sm"
                  onClick={() => onSuspend(member.userId, member.email, !member.suspended)}
                  disabled={suspendingMember === member.userId}
                  data-testid="button-crm-suspend"
                >
                  {suspendingMember === member.userId ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : member.suspended ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
                  {member.suspended ? 'Unsuspend' : 'Suspend'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecalcFraud(member.userId, member.email)}
                  disabled={recalcFraudId === member.userId}
                  data-testid="button-crm-recalc-fraud"
                >
                  {recalcFraudId === member.userId ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                  Recalculate Fraud
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payouts" className="mt-0 pr-3">
              {loadingCrm ? (
                <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]" data-testid="text-crm-no-payouts">No payouts yet.</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-[var(--card-padding,1.25rem)] border rounded text-sm" data-testid={`crm-payout-${p.id}`}>
                      <div>
                        <p className="font-medium tabular-nums">${((p.amount_cents || 0) / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={p.status === 'paid' || p.status === 'completed' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tickets" className="mt-0 pr-3">
              {loadingCrm ? (
                <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]" data-testid="text-crm-no-tickets">No tickets found.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t: any) => (
                    <div key={t.id} className="p-[var(--card-padding,1.25rem)] border rounded text-sm" data-testid={`crm-ticket-${t.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate flex-1">{t.subject || `Ticket #${t.id?.slice(0, 8)}`}</p>
                        <Badge variant={t.status === 'open' ? 'destructive' : t.status === 'in_progress' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                          {t.status}
                        </Badge>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {t.priority && <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>}
                        <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0 pr-3">
              {loadingCrm ? (
                <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]" data-testid="text-crm-no-activity">No activity recorded.</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-[var(--content-density-gap,1rem)] p-[var(--card-padding,1.25rem)] border rounded text-sm" data-testid={`crm-activity-${a.id}`}>
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{a.activity_type}</Badge>
                          {a.subject && <span className="font-medium truncate">{a.subject}</span>}
                        </div>
                        {a.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-3 mt-0 pr-3">
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add an internal note..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote() } }}
                  data-testid="input-crm-note"
                />
                <Button onClick={addNote} disabled={savingNote || !noteText.trim()} data-testid="button-crm-add-note">
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              {loadingCrm ? (
                <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-crm-no-notes">No notes yet. Add the first note above.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n: any) => (
                    <div key={n.id} className="p-[var(--card-padding,1.25rem)] border rounded text-sm" data-testid={`crm-note-${n.id}`}>
                      <p className="whitespace-pre-wrap">{n.body || n.subject}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function AdminTaxInfoTab() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)
  const { toast } = useToast()

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/affiliate/tax-info')
      if (res.ok) { const data = await res.json(); setSubmissions(data.submissions || []) }
      else setSubmissions([])
    } catch { setSubmissions([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const verifyTax = async (id: string) => {
    setVerifying(id)
    try {
      const res = await fetch(`/api/admin/affiliate/tax-info/${id}/verify`, { method: 'PATCH' })
      if (res.ok) { toast({ title: 'Tax info verified' }); loadSubmissions() }
    } catch { toast({ title: 'Failed to verify', variant: 'destructive' }) }
    finally { setVerifying(null) }
  }

  if (loading) return <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Submissions ({submissions.length})</CardTitle>
        <CardDescription>Review and verify affiliate tax information before processing payouts.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]">No tax submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Affiliate</th>
                  <th className="py-2 px-2 font-medium">Legal Name</th>
                  <th className="py-2 px-2 font-medium">Form</th>
                  <th className="py-2 px-2 font-medium">Country</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                  <th className="py-2 px-2 font-medium">Submitted</th>
                  <th className="py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((s: any) => (
                  <tr key={s.id} data-testid={`tax-row-${s.id}`}>
                    <td className="py-2 px-2 text-xs">{s.ref_code || s.affiliate_user_id?.slice(0, 8)}</td>
                    <td className="py-2 px-2">{s.legal_name}</td>
                    <td className="py-2 px-2 uppercase">{s.form_type}</td>
                    <td className="py-2 px-2">{s.address_country}</td>
                    <td className="py-2 px-2">
                      {s.verified ? (
                        <Badge variant="default" className="text-[10px]"><CheckCircle className="h-3 w-3 mr-0.5" /> Verified</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]"><Clock className="h-3 w-3 mr-0.5" /> Pending</Badge>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString()}</td>
                    <td className="py-2 px-2">
                      {!s.verified && (
                        <Button variant="outline" size="sm" onClick={() => verifyTax(s.id)} disabled={verifying === s.id} data-testid={`button-verify-tax-${s.id}`}>
                          {verifying === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
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
    leaderboard_enabled: true,
    leaderboard_privacy_mode: 'initials',
    auto_batch_enabled: false,
    payout_schedule_day: 1,
    auto_approve_threshold_cents: 0,
    reengagement_enabled: false,
    dormancy_threshold_days: 30,
    max_reengagement_emails: 3,
    two_tier_enabled: false,
    second_tier_commission_rate: 5,
    fraud_scoring_enabled: false,
    fraud_auto_pause_threshold: 60,
    survey_interval_days: 90,
  })
  const [tiers, setTiers] = useState<Tier[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([])
  const [stats, setStats] = useState<AdminStats>({ totalAffiliates: 0, totalReferrals: 0, totalRevenue: 0, totalCommissions: 0, pendingPayouts: 0, flaggedCount: 0 })
  const [flaggedReferrals, setFlaggedReferrals] = useState<FlaggedReferral[]>([])

  const [tierDialog, setTierDialog] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [tierForm, setTierForm] = useState({ name: '', min_referrals: 0, commission_rate: 20, sort_order: 0, min_payout_cents: 0, perks: '' })

  const [assetDialog, setAssetDialog] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [assetForm, setAssetForm] = useState({ title: '', description: '', asset_type: 'banner', content: '', file_url: '' })

  const [applications, setApplications] = useState<Application[]>([])
  const [appFilter, setAppFilter] = useState('all')
  const [reviewingApp, setReviewingApp] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const [networks, setNetworks] = useState<NetworkSetting[]>([])
  const [networkEditDialog, setNetworkEditDialog] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<NetworkSetting | null>(null)
  const [networkForm, setNetworkForm] = useState({ tracking_id: '', postback_url: '', api_key: '' })

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [milestoneForm, setMilestoneForm] = useState({ name: '', referral_threshold: 10, bonus_amount_cents: 5000, description: '', is_active: true, sort_order: 0 })

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [broadcastDialog, setBroadcastDialog] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '', audience_type: 'all' })
  const [sendingBroadcast, setSendingBroadcast] = useState<string | null>(null)
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null)
  const [sendConfirmBroadcast, setSendConfirmBroadcast] = useState<Broadcast | null>(null)
  const [emailTemplates, setEmailTemplates] = useState<{ id: number; name: string; subject: string; body: string; category: string }[]>([])

  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [revenueAttribution, setRevenueAttribution] = useState<{
    totalRevenue: number; affiliateRevenue: number; directRevenue: number;
    affiliatePercentage: number; totalCommissionsPaid: number; totalCommissionsPending: number;
    invoiceCount: number; affiliateInvoiceCount: number;
  } | null>(null)

  const [contests, setContests] = useState<any[]>([])
  const [contestDialog, setContestDialog] = useState(false)
  const [editingContest, setEditingContest] = useState<any>(null)
  const [contestForm, setContestForm] = useState({
    name: '', description: '', metric: 'referrals', start_date: '', end_date: '',
    prize_description: '', prize_amount_cents: 10000
  })
  const [payoutBatches, setPayoutBatches] = useState<any[]>([])
  const [generatingBatch, setGeneratingBatch] = useState(false)
  const [processAllDialog, setProcessAllDialog] = useState(false)
  const [processAllSummary, setProcessAllSummary] = useState<{ batchId: string; affiliatesIncluded: number; totalAmountCents: number } | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)
  const [sendingReceipts, setSendingReceipts] = useState(false)
  const [receiptResult, setReceiptResult] = useState<{ sentCount: number; failedCount: number } | null>(null)

  const [members, setMembers] = useState<AffiliateMember[]>([])
  const [memberFilter, setMemberFilter] = useState('all')
  const [memberSort, setMemberSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'totalEarnings', dir: 'desc' })
  const [deletingMember, setDeletingMember] = useState<string | null>(null)
  const [suspendingMember, setSuspendingMember] = useState<string | null>(null)
  const [recalcFraud, setRecalcFraud] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [deletingApp, setDeletingApp] = useState<string | null>(null)

  const [detailItem, setDetailItem] = useState<any>(null)
  const [detailType, setDetailType] = useState<string>('')
  const [crmMember, setCrmMember] = useState<AffiliateMember | null>(null)

  const [tierSort, setTierSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'min_referrals', dir: 'asc' })
  const [milestoneSort, setMilestoneSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'referral_threshold', dir: 'asc' })
  const [milestoneFilter, setMilestoneFilter] = useState('all')
  const [assetSort, setAssetSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'title', dir: 'asc' })
  const [assetFilter, setAssetFilter] = useState('all')
  const [broadcastFilter, setBroadcastFilter] = useState('all')
  const [broadcastSort, setBroadcastSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' })
  const [contestFilter, setContestFilter] = useState('all')
  const [contestSort, setContestSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'start_date', dir: 'desc' })
  const [batchFilter, setBatchFilter] = useState('all')

  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('health')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) setActiveTab(tab)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, tiersRes, assetsRes, referralsRes, appsRes, networksRes, milestonesRes, broadcastsRes, healthRes, emailTplRes] = await Promise.all([
        fetch('/api/affiliate/settings'),
        fetch('/api/affiliate/tiers'),
        fetch('/api/affiliate/assets'),
        fetch('/api/affiliate/referrals?admin=true'),
        fetch('/api/affiliate/applications?status=all'),
        fetch('/api/affiliate/networks'),
        fetch('/api/affiliate/milestones?admin=true'),
        fetch('/api/admin/affiliate/broadcasts'),
        fetch('/api/admin/affiliate/health'),
        fetch('/api/admin/email-templates'),
      ])

      const [settingsData, tiersData, assetsData, referralsData, appsData, networksData, milestonesData, broadcastsData, healthResData, emailTplData] = await Promise.all([
        settingsRes.json(),
        tiersRes.json(),
        assetsRes.json(),
        referralsRes.json(),
        appsRes.json(),
        networksRes.json(),
        milestonesRes.json(),
        broadcastsRes.json(),
        healthRes.json(),
        emailTplRes.json(),
      ])

      if (settingsData.settings) setSettings(s => ({ ...s, ...settingsData.settings }))
      if (tiersData.tiers) setTiers((tiersData.tiers as any[]).map(t => ({
        ...t,
        perks: Array.isArray(t.perks) ? t.perks : typeof t.perks === 'string' && t.perks ? t.perks.split(',').map((s: string) => s.trim()) : [],
      })))
      if (assetsData.assets) setAssets(assetsData.assets)
      if (referralsData.affiliates) setAffiliates(referralsData.affiliates)
      if (referralsData.stats) setStats(referralsData.stats)
      if (referralsData.flaggedReferrals) setFlaggedReferrals(referralsData.flaggedReferrals)
      if (appsData.applications) setApplications(appsData.applications)
      if (networksData.networks) setNetworks(networksData.networks)
      if (milestonesData.milestones) setMilestones(milestonesData.milestones)
      if (broadcastsData.broadcasts) setBroadcasts(broadcastsData.broadcasts)
      if (healthResData.health) setHealthData(healthResData.health)
      if (emailTplData.templates) setEmailTemplates(emailTplData.templates)

      fetch('/api/affiliate/contests?admin=true').then(r => r.json()).then(d => setContests(d.contests || [])).catch(() => {})
      fetch('/api/affiliate/payout-batches').then(r => r.json()).then(d => setPayoutBatches(d.batches || [])).catch(() => {})
      fetch('/api/affiliate/members').then(r => r.json()).then(d => setMembers(d.members || [])).catch(() => {})
      fetch('/api/admin/revenue-attribution').then(r => r.json()).then(d => setRevenueAttribution(d.attribution || null)).catch(() => {})
    } catch (err) {
      console.error('Failed to load affiliate data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const [memberToDelete, setMemberToDelete] = useState<{ userId: string; email: string } | null>(null)
  const [appToDelete, setAppToDelete] = useState<{ appId: string; email: string } | null>(null)

  const handleDeleteMember = async (userId: string, email: string) => {
    setDeletingMember(userId)
    try {
      const res = await fetch(`/api/affiliate/members?userId=${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Affiliate deleted', description: `${email} has been removed from the affiliate program.` })
        setMembers(prev => prev.filter(m => m.userId !== userId))
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete affiliate', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete affiliate', variant: 'destructive' })
    } finally {
      setDeletingMember(null)
    }
  }

  const handleSuspendMember = async (userId: string, email: string, suspend: boolean) => {
    const actionLabel = suspend ? 'suspend' : 'unsuspend'
    const reason = suspend ? prompt(`Reason for suspending ${email}:`, 'Policy violation') : undefined
    if (suspend && reason === null) return

    setSuspendingMember(userId)
    try {
      const res = await fetch('/api/affiliate/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: suspend ? 'suspend' : 'unsuspend', reason }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: suspend ? 'Affiliate Suspended' : 'Affiliate Restored', description: `${email} has been ${actionLabel}ed.` })
        setMembers(prev => prev.map(m => m.userId === userId ? { ...m, suspended: suspend, suspensionReason: suspend ? (reason || 'Suspended by admin') : null } : m))
        if (detailItem?.userId === userId) {
          setDetailItem((prev: any) => ({ ...prev, suspended: suspend, suspensionReason: suspend ? (reason || 'Suspended by admin') : null }))
        }
        if (crmMember?.userId === userId) {
          setCrmMember(prev => prev ? { ...prev, suspended: suspend, suspensionReason: suspend ? (reason || 'Suspended by admin') : null } : null)
        }
      } else {
        toast({ title: 'Error', description: data.error || `Failed to ${actionLabel}`, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: `Failed to ${actionLabel}`, variant: 'destructive' })
    } finally {
      setSuspendingMember(null)
    }
  }

  const handleRecalcFraud = async (userId: string, email: string) => {
    setRecalcFraud(userId)
    try {
      const res = await fetch('/api/affiliate/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'recalculate_fraud' }),
      })
      const data = await res.json()
      if (res.ok && data.fraudScore) {
        toast({ title: 'Fraud Score Updated', description: `${email}: score is now ${data.fraudScore.score}. ${data.fraudScore.autoPaused ? 'Auto-paused due to high score.' : ''}` })
        setMembers(prev => prev.map(m => m.userId === userId ? { ...m, fraudScore: data.fraudScore.score, fraudScoreUpdatedAt: new Date().toISOString(), suspended: data.fraudScore.autoPaused ? true : m.suspended } : m))
        if (detailItem?.userId === userId) {
          setDetailItem((prev: any) => ({ ...prev, fraudScore: data.fraudScore.score, fraudScoreUpdatedAt: new Date().toISOString(), suspended: data.fraudScore.autoPaused ? true : prev.suspended }))
        }
        if (crmMember?.userId === userId) {
          setCrmMember(prev => prev ? { ...prev, fraudScore: data.fraudScore.score, fraudScoreUpdatedAt: new Date().toISOString(), suspended: data.fraudScore.autoPaused ? true : prev.suspended } : null)
        }
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to recalculate fraud score', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to recalculate fraud score', variant: 'destructive' })
    } finally {
      setRecalcFraud(null)
    }
  }

  const handleDeleteApplication = async (appId: string, email: string) => {
    setDeletingApp(appId)
    try {
      const res = await fetch(`/api/affiliate/applications?id=${appId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Application deleted', description: `Application from ${email} has been removed.` })
        setApplications(prev => prev.filter(a => a.id !== appId))
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete application', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete application', variant: 'destructive' })
    } finally {
      setDeletingApp(null)
    }
  }

  const sortedFilteredMembers = members
    .filter(m => {
      if (memberFilter === 'suspended' && !m.suspended) return false
      else if (memberFilter !== 'all' && memberFilter !== 'suspended' && m.status !== memberFilter) return false
      if (memberSearch) {
        const q = memberSearch.toLowerCase()
        return (m.email || '').toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      const key = memberSort.key as keyof AffiliateMember
      const aVal = a[key] ?? 0
      const bVal = b[key] ?? 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return memberSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return memberSort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })

  const toggleMemberSort = (key: string) => {
    setMemberSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const toggleTierSort = (key: string) => {
    setTierSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const toggleMilestoneSort = (key: string) => {
    setMilestoneSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const toggleAssetSort = (key: string) => {
    setAssetSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const toggleBroadcastSort = (key: string) => {
    setBroadcastSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const toggleContestSort = (key: string) => {
    setContestSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const sortedTiers = [...tiers].sort((a, b) => {
    const key = tierSort.key as keyof Tier
    const aVal = a[key] ?? 0
    const bVal = b[key] ?? 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return tierSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return tierSort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
  })

  const sortedFilteredMilestones = milestones
    .filter(ms => {
      if (milestoneFilter === 'active') return ms.is_active
      if (milestoneFilter === 'inactive') return !ms.is_active
      return true
    })
    .sort((a, b) => {
      const key = milestoneSort.key
      if (key === 'is_active') {
        const aVal = a.is_active ? 1 : 0
        const bVal = b.is_active ? 1 : 0
        return milestoneSort.dir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aVal = (a as any)[key] ?? 0
      const bVal = (b as any)[key] ?? 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return milestoneSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return milestoneSort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })

  const sortedFilteredAssets = assets
    .filter(a => assetFilter === 'all' || a.asset_type === assetFilter)
    .sort((a, b) => {
      const key = assetSort.key as keyof Asset
      const aVal = a[key] ?? ''
      const bVal = b[key] ?? ''
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return assetSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return assetSort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })

  const sortedFilteredBroadcasts = broadcasts
    .filter(bc => broadcastFilter === 'all' || bc.status === broadcastFilter)
    .sort((a, b) => {
      const key = broadcastSort.key
      const aVal = (a as any)[key] ?? ''
      const bVal = (b as any)[key] ?? ''
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return broadcastSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return broadcastSort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })

  const sortedFilteredContests = contests
    .filter(c => {
      if (contestFilter === 'all') return true
      return c.status === contestFilter
    })
    .sort((a, b) => {
      const key = contestSort.key
      const aVal = (a as any)[key] ?? ''
      const bVal = (b as any)[key] ?? ''
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return contestSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return contestSort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })

  const filteredBatches = payoutBatches.filter(b => batchFilter === 'all' || b.status === batchFilter)

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
      const tierPayload = { ...tierForm, perks: tierForm.perks ? tierForm.perks.split(',').map((s: string) => s.trim()).filter(Boolean) : [] }
      const body = editingTier ? { id: editingTier.id, ...tierPayload } : tierPayload
      const res = await fetch('/api/affiliate/tiers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: editingTier ? 'Tier updated' : 'Tier created' })
      setTierDialog(false)
      setEditingTier(null)
      setTierForm({ name: '', min_referrals: 0, commission_rate: 20, sort_order: 0, min_payout_cents: 0, perks: '' })
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
      const method = editingBroadcast ? 'PATCH' : 'POST'
      const payload = editingBroadcast
        ? { id: editingBroadcast.id, subject: broadcastForm.subject, body: broadcastForm.body, audience_filter: { type: broadcastForm.audience_type } }
        : { subject: broadcastForm.subject, body: broadcastForm.body, audience_filter: { type: broadcastForm.audience_type } }
      const res = await fetch('/api/admin/affiliate/broadcasts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: editingBroadcast ? 'Broadcast updated' : 'Broadcast draft created' })
      setBroadcastDialog(false)
      setEditingBroadcast(null)
      setBroadcastForm({ subject: '', body: '', audience_type: 'all' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: `Failed to ${editingBroadcast ? 'update' : 'create'} broadcast`, variant: 'destructive' })
    }
  }

  const sendBroadcast = async (bc: Broadcast) => {
    setSendingBroadcast(bc.id)
    try {
      const res = await fetch('/api/admin/affiliate/broadcasts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bc.id, send: true }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Broadcast sent', description: `"${bc.subject}" has been sent to affiliates.` })
      setSendConfirmBroadcast(null)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to send broadcast', variant: 'destructive' })
    } finally {
      setSendingBroadcast(null)
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

  const saveContest = async () => {
    try {
      const method = editingContest ? 'PUT' : 'POST'
      const body = editingContest ? { id: editingContest.id, ...contestForm } : contestForm
      const res = await fetch('/api/affiliate/contests', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save contest')
      }
      toast({ title: editingContest ? 'Contest updated' : 'Contest created' })
      setContestDialog(false)
      setEditingContest(null)
      setContestForm({ name: '', description: '', metric: 'referrals', start_date: '', end_date: '', prize_description: '', prize_amount_cents: 10000 })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save contest', variant: 'destructive' })
    }
  }

  const deleteContest = async (id: string) => {
    try {
      const res = await fetch(`/api/affiliate/contests?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Contest deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete contest', variant: 'destructive' })
    }
  }

  const generatePayoutBatch = async () => {
    setGeneratingBatch(true)
    try {
      const res = await fetch('/api/affiliate/payout-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed')
      }
      const d = await res.json()
      toast({ title: 'Payout batch generated', description: `${d.affiliates_included || 0} affiliates included` })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate payout batch', variant: 'destructive' })
    } finally {
      setGeneratingBatch(false)
    }
  }

  const processAll = async () => {
    setGeneratingBatch(true)
    setProcessAllSummary(null)
    setReceiptResult(null)
    try {
      const res = await fetch('/api/affiliate/payout-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate batch')
      }
      const d = await res.json()
      setProcessAllSummary({
        batchId: d.batch?.id,
        affiliatesIncluded: d.affiliates_included || 0,
        totalAmountCents: d.total_amount_cents || 0,
      })
      setProcessAllDialog(true)
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate payout batch', variant: 'destructive' })
    } finally {
      setGeneratingBatch(false)
    }
  }

  const approveAndSendReceipts = async () => {
    if (!processAllSummary?.batchId) return
    setApprovingAll(true)
    try {
      const res = await fetch('/api/affiliate/payout-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', batch_id: processAllSummary.batchId, status: 'approved' }),
      })
      if (!res.ok) throw new Error('Failed to approve batch')
      toast({ title: 'Batch approved' })
      fetchData()

      setSendingReceipts(true)
      try {
        const receiptRes = await fetch('/api/admin/affiliate/payout-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch_id: processAllSummary.batchId }),
        })
        if (receiptRes.ok) {
          const receiptData = await receiptRes.json()
          setReceiptResult({ sentCount: receiptData.sentCount || 0, failedCount: receiptData.failedCount || 0 })
          toast({ title: 'Receipt emails sent', description: `${receiptData.sentCount} emails sent successfully` })
        } else {
          toast({ title: 'Warning', description: 'Batch approved but receipt emails failed to send', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Warning', description: 'Batch approved but receipt emails failed to send', variant: 'destructive' })
      } finally {
        setSendingReceipts(false)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to approve batch', variant: 'destructive' })
    } finally {
      setApprovingAll(false)
    }
  }

  const approveBatch = async (batchId: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/affiliate/payout-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', batch_id: batchId, status: action }),
      })
      if (!res.ok) throw new Error('Failed')

      setPayoutBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: action } : b))
      toast({ title: `Batch ${action}` })

      if (action === 'approved') {
        try {
          const receiptRes = await fetch('/api/admin/affiliate/payout-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_id: batchId }),
          })
          if (receiptRes.ok) {
            const receiptData = await receiptRes.json()
            toast({ title: 'Receipt emails sent', description: `${receiptData.sentCount} emails sent` })
          }
        } catch {
          toast({ title: 'Note', description: 'Batch approved but receipt emails could not be sent' })
        }
      }

      fetchData()
    } catch {
      toast({ title: 'Error', description: `Failed to ${action} batch`, variant: 'destructive' })
    }
  }

  const sendReceiptsForBatch = async (batchId: string) => {
    setSendingReceipts(true)
    try {
      const res = await fetch('/api/admin/affiliate/payout-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Receipt emails sent', description: `${data.sentCount} sent, ${data.failedCount} failed` })
      } else {
        toast({ title: 'Error', description: 'Failed to send receipt emails', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send receipt emails', variant: 'destructive' })
    } finally {
      setSendingReceipts(false)
    }
  }

  const getHealthScore = (member: AffiliateMember): { color: 'green' | 'yellow' | 'red'; label: string } => {
    const now = new Date()
    const lastSignIn = member.lastSignIn ? new Date(member.lastSignIn) : null
    const joinedAt = new Date(member.joinedAt)
    const lastActivity = lastSignIn || joinedAt
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    const conversionRate = member.clicks > 0 ? (member.referrals / member.clicks) * 100 : 0
    const fraudScore = member.fraudScore || 0

    if (daysSinceActivity > 60 || conversionRate < 1 || fraudScore > 40) {
      return { color: 'red', label: 'At Risk' }
    }
    if (daysSinceActivity > 30 || (conversionRate >= 1 && conversionRate <= 5)) {
      return { color: 'yellow', label: 'Needs Attention' }
    }
    return { color: 'green', label: 'Healthy' }
  }

  const filteredApplications = applications.filter(a => appFilter === 'all' || a.status === appFilter)
  const pendingCount = applications.filter(a => a.status === 'pending').length

  const getDetailFields = (): DetailField[] => {
    if (!detailItem) return []
    switch (detailType) {
      case 'tier':
        return [
          { label: 'Name', value: detailItem.name },
          { label: 'Min Referrals', value: detailItem.min_referrals },
          { label: 'Commission Rate', value: detailItem.commission_rate, type: 'percentage' },
          { label: 'Min Payout', value: detailItem.min_payout_cents || 0, type: 'currency' },
          { label: 'Sort Order', value: detailItem.sort_order },
          { label: 'Perks', value: Array.isArray(detailItem.perks) ? detailItem.perks : [], type: 'badges' },
        ]
      case 'milestone':
        return [
          { label: 'Name', value: detailItem.name },
          { label: 'Referral Threshold', value: detailItem.referral_threshold },
          { label: 'Bonus Amount', value: detailItem.bonus_amount_cents, type: 'currency' },
          { label: 'Description', value: detailItem.description },
          { label: 'Active', value: detailItem.is_active },
          { label: 'Sort Order', value: detailItem.sort_order },
        ]
      case 'asset':
        return [
          { label: 'Title', value: detailItem.title },
          { label: 'Type', value: ASSET_TYPES.find(t => t.value === detailItem.asset_type)?.label || detailItem.asset_type, type: 'badge' },
          { label: 'Description', value: detailItem.description },
          { label: 'Content', value: detailItem.content, type: 'html' },
          { label: 'File URL', value: detailItem.file_url },
          { label: 'Active', value: detailItem.active },
        ]
      case 'broadcast':
        return [
          { label: 'Subject', value: detailItem.subject },
          { label: 'Status', value: detailItem.status, type: 'badge', badgeVariant: detailItem.status === 'sent' ? 'default' : 'outline' },
          { label: 'Audience', value: detailItem.audience_filter?.type || 'all' },
          { label: 'Body', value: detailItem.body, type: 'html' },
          { label: 'Sent Count', value: detailItem.sent_count },
          { label: 'Opened Count', value: detailItem.opened_count },
          { label: 'Clicked Count', value: detailItem.clicked_count },
          { label: 'Created', value: detailItem.created_at, type: 'date' },
          { label: 'Sent At', value: detailItem.sent_at, type: 'date' },
        ]
      case 'member': {
        return [
          { label: 'Name', value: detailItem.name },
          { label: 'Email', value: detailItem.email },
          { label: 'Ref Code', value: detailItem.refCode },
          { label: 'Status', value: detailItem.suspended ? 'Suspended' : detailItem.status === 'active' ? 'Active' : detailItem.status === 'pending_setup' ? 'Pending Setup' : 'Inactive', type: 'badge', badgeVariant: detailItem.suspended ? 'destructive' : detailItem.status === 'active' ? 'default' : 'outline' },
          ...(detailItem.suspended && detailItem.suspensionReason ? [{ label: 'Suspension Reason', value: detailItem.suspensionReason }] : []),
          { label: 'Fraud Score', value: `${detailItem.fraudScore || 0}${detailItem.fraudScore >= 60 ? ' (High Risk)' : detailItem.fraudScore >= 30 ? ' (Medium Risk)' : ''}`, type: 'badge' as const, badgeVariant: (detailItem.fraudScore >= 60 ? 'destructive' : detailItem.fraudScore >= 30 ? 'secondary' : 'outline') as any },
          { label: 'Tier', value: detailItem.tier },
          { label: 'Referrals', value: detailItem.referrals },
          { label: 'Clicks', value: detailItem.clicks },
          { label: 'Total Earnings', value: detailItem.totalEarnings, type: 'currency' },
          { label: 'Pending Earnings', value: detailItem.pendingEarnings, type: 'currency' },
          { label: 'Paid Earnings', value: detailItem.paidEarnings, type: 'currency' },
          { label: 'Locked Rate', value: detailItem.lockedRate, type: 'percentage' },
          { label: 'Locked Duration', value: detailItem.lockedDuration ? `${detailItem.lockedDuration} months` : null },
          { label: 'Joined', value: detailItem.joinedAt, type: 'date' },
          { label: 'Last Sign In', value: detailItem.lastSignIn, type: 'date' },
        ]
      }
      case 'application':
        return [
          { label: 'Name', value: detailItem.name },
          { label: 'Email', value: detailItem.email },
          { label: 'Website', value: detailItem.website_url },
          { label: 'Promotion Methods', value: (detailItem.promotion_method || '').split(',').filter(Boolean).map((m: string) => PROMOTION_LABELS[m.trim()] || m.trim()).join(', ') },
          { label: 'Message', value: detailItem.message, type: 'html' },
          { label: 'Status', value: detailItem.status, type: 'badge', badgeVariant: detailItem.status === 'approved' ? 'secondary' : detailItem.status === 'rejected' ? 'destructive' : 'outline' },
          { label: 'Reviewer Notes', value: detailItem.reviewer_notes },
          { label: 'Applied', value: detailItem.created_at, type: 'date' },
          { label: 'Reviewed', value: detailItem.reviewed_at, type: 'date' },
        ]
      case 'network':
        return [
          { label: 'Network Name', value: detailItem.network_name },
          { label: 'Slug', value: detailItem.network_slug },
          { label: 'Active', value: detailItem.is_active },
          { label: 'Tracking ID', value: detailItem.tracking_id },
          { label: 'Postback URL', value: detailItem.postback_url },
        ]
      case 'contest':
        return [
          { label: 'Name', value: detailItem.name },
          { label: 'Description', value: detailItem.description },
          { label: 'Status', value: detailItem.status, type: 'badge', badgeVariant: detailItem.status === 'active' ? 'default' : detailItem.status === 'completed' ? 'secondary' : 'outline' },
          { label: 'Metric', value: detailItem.metric },
          { label: 'Prize Amount', value: detailItem.prize_amount_cents, type: 'currency' },
          { label: 'Prize Description', value: detailItem.prize_description },
          { label: 'Start Date', value: detailItem.start_date, type: 'date' },
          { label: 'End Date', value: detailItem.end_date, type: 'date' },
          ...(detailItem.status === 'completed' && detailItem.winner_user_id ? [{ label: 'Winner', value: members.find(m => m.userId === detailItem.winner_user_id)?.name || members.find(m => m.userId === detailItem.winner_user_id)?.email || detailItem.winner || detailItem.winner_user_id, type: 'link' as const, href: `/admin/crm/${detailItem.winner_user_id}` }] : []),
        ]
      case 'payout_batch':
        return [
          { label: 'Status', value: detailItem.status, type: 'badge' as const, badgeVariant: (detailItem.status === 'approved' || detailItem.status === 'completed' ? 'default' : detailItem.status === 'rejected' ? 'destructive' : 'outline') as any },
          { label: 'Total Amount', value: detailItem.total_amount_cents || 0, type: 'currency' },
          { label: 'Payout Count', value: detailItem.payout_count || 0 },
          { label: 'Batch Date', value: detailItem.batch_date || detailItem.created_at, type: 'date' },
          { label: 'Notes', value: detailItem.notes },
        ]
      case 'flagged_referral':
        return [
          { label: 'Affiliate User ID', value: detailItem.affiliate_user_id },
          { label: 'Referred User ID', value: detailItem.referred_user_id },
          { label: 'Fraud Flags', value: (Array.isArray(detailItem.fraud_flags) ? detailItem.fraud_flags : []).map((f: string) => FRAUD_FLAG_LABELS[f] || f), type: 'badges' },
          { label: 'Created', value: detailItem.created_at, type: 'date' },
        ]
      case 'top_performer': {
        const memberInfo = members.find(m => m.userId === detailItem.userId)
        return [
          { label: 'Name', value: memberInfo?.name || memberInfo?.email || detailItem.userId },
          { label: 'User ID', value: detailItem.userId },
          { label: 'Referrals', value: detailItem.referrals },
          { label: 'Earnings', value: detailItem.earnings, type: 'currency' },
        ]
      }
      default:
        return []
    }
  }

  const getDetailTitle = (): string => {
    if (!detailItem) return ''
    switch (detailType) {
      case 'tier': return detailItem.name || 'Tier Details'
      case 'milestone': return detailItem.name || 'Milestone Details'
      case 'asset': return detailItem.title || 'Asset Details'
      case 'broadcast': return detailItem.subject || 'Broadcast Details'
      case 'member': return detailItem.name || detailItem.email || 'Member Details'
      case 'application': return detailItem.name || 'Application Details'
      case 'network': return detailItem.network_name || 'Network Details'
      case 'contest': return detailItem.name || 'Contest Details'
      case 'payout_batch': return 'Payout Batch Details'
      case 'flagged_referral': return 'Flagged Referral Details'
      case 'top_performer': {
        const mi = members.find(m => m.userId === detailItem.userId)
        return mi?.name || mi?.email || 'Top Performer Details'
      }
      default: return 'Details'
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
    <div className="space-y-[var(--content-density-gap,1rem)]" data-testid="page-affiliate-admin">
      <div>
        <h2 className="text-xl font-semibold" data-testid="text-affiliate-title">Affiliate Program</h2>
        <p className="text-sm text-muted-foreground">Manage your referral program, commission rates, tiers, and marketing assets.</p>
      </div>

      <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
        <Card className="border-[hsl(var(--warning)/0.5)]" data-testid="card-fraud-alerts">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
              Fraud Alerts ({stats.flaggedCount})
              <HelpTooltip text="Referrals automatically flagged by our fraud detection system. Common flags include self-referrals (affiliate referred themselves), same email domain (referred user shares the affiliate's email domain), and suspicious IP volume (many clicks from the same IP address). Review each flag and take action if needed." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flaggedReferrals.slice(0, 5).map(ref => (
                <div key={ref.id} className="flex items-center gap-2 p-2 rounded border text-sm cursor-pointer" data-testid={`fraud-alert-${ref.id}`} onClick={() => { setDetailItem(ref); setDetailType('flagged_referral') }}>
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))] shrink-0" />
                  <div className="flex-1">
                    {(Array.isArray(ref.fraud_flags) ? ref.fraud_flags : []).map(f => FRAUD_FLAG_LABELS[f] || f).join(', ')}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); window.history.replaceState(null, '', `?tab=${value}`) }} data-testid="tabs-affiliate-admin">
        <TabsList className="flex overflow-x-auto scrollbar-hide w-full justify-start">
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
          <TabsTrigger value="affiliates" data-testid="tab-affiliates">Members</TabsTrigger>
          <TabsTrigger value="networks" data-testid="tab-networks">Networks</TabsTrigger>
          <TabsTrigger value="contests" data-testid="tab-contests">
            <Calendar className="h-3.5 w-3.5 mr-1" /> Contests
          </TabsTrigger>
          <TabsTrigger value="payout-batches" data-testid="tab-payout-batches">
            <Package className="h-3.5 w-3.5 mr-1" /> Payout Runs
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <ClipboardList className="h-3.5 w-3.5 mr-1" /> Audit Log
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Messages
          </TabsTrigger>
          <TabsTrigger value="testimonials" data-testid="tab-testimonials">
            <Star className="h-3.5 w-3.5 mr-1" /> Testimonials
          </TabsTrigger>
          <TabsTrigger value="tax-info" data-testid="tab-tax-info">
            <FileText className="h-3.5 w-3.5 mr-1" /> Tax Info
          </TabsTrigger>
          <TabsTrigger value="renewals" data-testid="tab-renewals">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renewals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          {healthData ? (
            <>
              <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card data-testid="health-active-affiliates">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[hsl(var(--success))]" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{healthData.overview.activeAffiliates}</p>
                    <p className="text-xs text-muted-foreground">of {healthData.overview.totalAffiliates} total</p>
                  </CardContent>
                </Card>
                <Card data-testid="health-dormant-affiliates">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />
                      <span className="text-sm text-muted-foreground">Dormant</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{healthData.overview.dormantAffiliates}</p>
                    <p className="text-xs text-muted-foreground">no activity in 30 days</p>
                  </CardContent>
                </Card>
                <Card data-testid="health-net-roi">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
                      <span className="text-sm text-muted-foreground">Net ROI</span>
                      <HelpTooltip text="Total revenue from referred customers minus all commissions paid and pending. This is your net profit from the affiliate program." />
                    </div>
                    <p className="text-2xl font-bold mt-1">${(healthData.revenue.netROI / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">revenue minus commissions</p>
                  </CardContent>
                </Card>
                <Card data-testid="health-conversion-rate">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[hsl(var(--info))]" />
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <HelpTooltip text="The percentage of referral clicks that result in a paid customer signup." />
                    </div>
                    <p className="text-2xl font-bold mt-1">{healthData.growth.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">{healthData.growth.conversionsThisMonth} this month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-[var(--content-density-gap,1rem)] lg:grid-cols-3">
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
                      <span className="font-medium text-[hsl(var(--danger))]">-${(healthData.revenue.totalCommissionsPaid / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Commissions pending</span>
                      <span className="font-medium text-[hsl(var(--warning))]">-${(healthData.revenue.totalCommissionsPending / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Net profit from affiliates</span>
                      <span className="font-bold text-[hsl(var(--success))]">${(healthData.revenue.netROI / 100).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="health-growth-metrics">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Growth Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">New affiliates this month</span>
                      <span className="font-medium">{healthData.growth.newAffiliatesThisMonth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Referrals this month</span>
                      <span className="font-medium">{healthData.growth.referralsThisMonth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversions this month</span>
                      <span className="font-medium">{healthData.growth.conversionsThisMonth}</span>
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
                      <div className="flex justify-between text-sm text-[hsl(var(--warning))] border-t pt-2">
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

              {revenueAttribution && (
                <Card data-testid="health-revenue-attribution">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Revenue Attribution
                      <HelpTooltip text="Breakdown of total revenue by source. Affiliate revenue comes from customers referred by affiliates. Direct revenue is everything else." />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-[var(--content-density-gap,1rem)]">
                      <div className="text-center p-[var(--card-padding,1.25rem)] rounded border" data-testid="attr-total-revenue">
                        <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-xl font-bold">${(revenueAttribution.totalRevenue / 100).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{revenueAttribution.invoiceCount} invoices</p>
                      </div>
                      <div className="text-center p-[var(--card-padding,1.25rem)] rounded border" data-testid="attr-affiliate-revenue">
                        <p className="text-xs text-muted-foreground mb-1">Affiliate Revenue</p>
                        <p className="text-xl font-bold text-[hsl(var(--success))]">${(revenueAttribution.affiliateRevenue / 100).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{revenueAttribution.affiliatePercentage}% of total</p>
                      </div>
                      <div className="text-center p-[var(--card-padding,1.25rem)] rounded border" data-testid="attr-direct-revenue">
                        <p className="text-xs text-muted-foreground mb-1">Direct Revenue</p>
                        <p className="text-xl font-bold">${(revenueAttribution.directRevenue / 100).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{100 - revenueAttribution.affiliatePercentage}% of total</p>
                      </div>
                      <div className="text-center p-[var(--card-padding,1.25rem)] rounded border" data-testid="attr-commissions">
                        <p className="text-xs text-muted-foreground mb-1">Commissions</p>
                        <p className="text-xl font-bold">${(revenueAttribution.totalCommissionsPaid / 100).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">${(revenueAttribution.totalCommissionsPending / 100).toFixed(2)} pending</p>
                      </div>
                    </div>
                    {revenueAttribution.totalRevenue > 0 && (
                      <div className="space-y-2" data-testid="attr-bar-chart">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>Revenue Split</span>
                        </div>
                        <div className="w-full h-6 rounded-[var(--card-radius,0.75rem)] overflow-hidden flex bg-muted">
                          <div
                            className="bg-[hsl(var(--success))] h-full flex items-center justify-center text-[10px] font-medium text-white transition-all"
                            style={{ width: `${Math.max(revenueAttribution.affiliatePercentage, 2)}%` }}
                            data-testid="attr-bar-affiliate"
                          >
                            {revenueAttribution.affiliatePercentage > 8 ? `${revenueAttribution.affiliatePercentage}%` : ''}
                          </div>
                          <div
                            className="bg-[hsl(var(--info))] h-full flex items-center justify-center text-[10px] font-medium text-white transition-all"
                            style={{ width: `${Math.max(100 - revenueAttribution.affiliatePercentage, 2)}%` }}
                            data-testid="attr-bar-direct"
                          >
                            {(100 - revenueAttribution.affiliatePercentage) > 8 ? `${100 - revenueAttribution.affiliatePercentage}%` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-[var(--content-density-gap,1rem)] text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[hsl(var(--success))]" />
                            <span className="text-muted-foreground">Affiliate</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[hsl(var(--info))]" />
                            <span className="text-muted-foreground">Direct</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card data-testid="health-top-performers">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    Top Performers
                    <HelpTooltip text="Your highest-earning affiliates ranked by total commission earnings. Click any row for full details." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {healthData.topPerformers.length > 0 ? (
                    <div className="space-y-2">
                      {healthData.topPerformers.map((tp, i) => {
                        const memberInfo = members.find(m => m.userId === tp.userId)
                        const displayName = memberInfo?.name || memberInfo?.email || `${tp.userId.slice(0, 8)}...`
                        return (
                          <div key={tp.userId} className="flex items-center justify-between p-2 rounded border text-sm cursor-pointer" onClick={() => { setDetailItem(tp); setDetailType('top_performer') }}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                              <span className="text-sm truncate max-w-[180px]">{displayName}</span>
                              <span className="text-xs text-muted-foreground">{tp.referrals} referrals</span>
                            </div>
                            <span className="font-medium">${(tp.earnings / 100).toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-performers">No performer data yet</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-[var(--section-spacing,1.5rem)] text-center">
                <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Program health data will appear here once you have affiliates and referral activity.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-[var(--content-density-gap,1rem)] mt-4">
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
                    <div key={app.id} className="p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`application-${app.id}`} onClick={() => { setDetailItem(app); setDetailType('application') }}>
                      <div className="flex items-start justify-between gap-[var(--content-density-gap,1rem)]">
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
                            <a href={`mailto:${app.email}`} className="hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Mail className="h-3 w-3" /> {app.email}
                            </a>
                            {app.website_url && (
                              <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Globe className="h-3 w-3" /> {app.website_url.replace(/^https?:\/\//, '').slice(0, 30)}
                              </a>
                            )}
                            <span>{(app.promotion_method || '').split(',').filter(Boolean).map(m => PROMOTION_LABELS[m.trim()] || m.trim()).join(', ')}</span>
                            <span>{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          {app.message && (
                            <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded p-2 italic">"{app.message}"</p>
                          )}
                          {app.reviewer_notes && (
                            <p className="text-xs text-muted-foreground mt-1">Notes: {app.reviewer_notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {app.status === 'pending' && (
                            <>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); reviewApplication(app.id, 'approve') }}
                                  disabled={reviewingApp === app.id}
                                  data-testid={`button-approve-${app.id}`}
                                >
                                  {reviewingApp === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); reviewApplication(app.id, 'reject') }}
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
                                onClick={e => e.stopPropagation()}
                              />
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setAppToDelete({ appId: app.id, email: app.email }) }}
                            disabled={deletingApp === app.id}
                            data-testid={`button-delete-app-${app.id}`}
                          >
                            {deletingApp === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-commission-settings">
            <CardHeader>
              <CardTitle className="text-base">Commission Settings</CardTitle>
              <CardDescription>Changes only apply to new affiliates. Existing affiliates keep their locked-in terms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-[var(--content-density-gap,1rem)]">
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
              <div className="grid gap-[var(--content-density-gap,1rem)] sm:grid-cols-2">
                <div>
                  <Label htmlFor="commission-rate" className="flex items-center gap-1">
                    Commission Rate (%)
                    <HelpTooltip text="The percentage of each payment from referred customers that goes to the affiliate. Changes only apply to new affiliates — existing affiliates keep their locked-in rate." />
                  </Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.commission_rate || ''}
                    onChange={(e) => setSettings(s => ({ ...s, commission_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
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
                    value={settings.commission_duration_months || ''}
                    onChange={(e) => setSettings(s => ({ ...s, commission_duration_months: e.target.value === '' ? 0 : parseInt(e.target.value) }))}
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
                    value={settings.min_payout_cents ? settings.min_payout_cents / 100 : ''}
                    onChange={(e) => setSettings(s => ({ ...s, min_payout_cents: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) }))}
                    data-testid="input-min-payout"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum balance before payout is available</p>
                </div>
                <div>
                  <Label htmlFor="cookie-days" className="flex items-center gap-1">
                    Cookie Duration (days)
                    <HelpTooltip text="How many days after clicking a referral link the affiliate gets credit for a signup. Longer durations are more affiliate-friendly." />
                  </Label>
                  <Input
                    id="cookie-days"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.cookie_duration_days || ''}
                    onChange={(e) => setSettings(s => ({ ...s, cookie_duration_days: e.target.value === '' ? 0 : parseInt(e.target.value) }))}
                    data-testid="input-cookie-days"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How long the referral cookie lasts after a click</p>
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label htmlFor="attribution-policy" className="flex items-center gap-1">
                  Attribution Conflict Policy
                  <HelpTooltip text="When a customer clicks one affiliate's referral link but uses a different affiliate's discount code, this policy decides who earns the commission." />
                </Label>
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

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Leaderboard Settings</h4>
                <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
                  <div>
                    <Label>Leaderboard Enabled</Label>
                    <p className="text-xs text-muted-foreground">Show a ranked leaderboard on the affiliate dashboard</p>
                  </div>
                  <Switch
                    checked={settings.leaderboard_enabled}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, leaderboard_enabled: v }))}
                    data-testid="switch-leaderboard-enabled"
                  />
                </div>
                {settings.leaderboard_enabled && (
                  <div>
                    <Label>Privacy Mode</Label>
                    <p className="text-xs text-muted-foreground mb-2">How affiliate names appear on the leaderboard</p>
                    <Select value={settings.leaderboard_privacy_mode} onValueChange={v => setSettings(s => ({ ...s, leaderboard_privacy_mode: v }))}>
                      <SelectTrigger className="w-full sm:w-64" data-testid="select-leaderboard-privacy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initials">Initials Only (e.g., J.S.)</SelectItem>
                        <SelectItem value="full_name">Full Name (opt-in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                  Re-Engagement Settings
                  <HelpTooltip text="Automated emails sent to dormant affiliates encouraging them to start promoting again." />
                </h4>
                <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
                  <div>
                    <Label>Re-Engagement Emails</Label>
                    <p className="text-xs text-muted-foreground">Automatically email dormant affiliates to re-activate them</p>
                  </div>
                  <Switch
                    checked={settings.reengagement_enabled}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, reengagement_enabled: v }))}
                    data-testid="switch-reengagement-enabled"
                  />
                </div>
                {settings.reengagement_enabled && (
                  <div className="grid gap-[var(--content-density-gap,1rem)] sm:grid-cols-2">
                    <div>
                      <Label className="flex items-center gap-1">
                        Dormancy Threshold (days)
                        <HelpTooltip text="Number of days without any referral activity before an affiliate is considered dormant and eligible for re-engagement emails." />
                      </Label>
                      <Input type="number" min="7" max="180" value={settings.dormancy_threshold_days || ''} onChange={e => setSettings(s => ({ ...s, dormancy_threshold_days: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-dormancy-days" />
                      <p className="text-xs text-muted-foreground mt-1">Days of inactivity before sending re-engagement</p>
                    </div>
                    <div>
                      <Label>Max Re-Engagement Emails</Label>
                      <Input type="number" min="1" max="10" value={settings.max_reengagement_emails || ''} onChange={e => setSettings(s => ({ ...s, max_reengagement_emails: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-max-reengagement" />
                      <p className="text-xs text-muted-foreground mt-1">Maximum emails to send per dormant affiliate</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Payout Automation</h4>
                <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
                  <div>
                    <Label>Automatic Batch Generation</Label>
                    <p className="text-xs text-muted-foreground">Auto-generate payout batches on a schedule</p>
                  </div>
                  <Switch
                    checked={settings.auto_batch_enabled}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, auto_batch_enabled: v }))}
                    data-testid="switch-auto-batch"
                  />
                </div>
                {settings.auto_batch_enabled && (
                  <div className="grid gap-[var(--content-density-gap,1rem)] sm:grid-cols-2">
                    <div>
                      <Label>Schedule Day of Month</Label>
                      <Input type="number" min="1" max="28" value={settings.payout_schedule_day || ''} onChange={e => setSettings(s => ({ ...s, payout_schedule_day: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-payout-schedule-day" />
                      <p className="text-xs text-muted-foreground mt-1">Day of month to auto-generate batches</p>
                    </div>
                    <div>
                      <Label>Auto-Approve Threshold ($)</Label>
                      <Input type="number" min="0" step="50" value={settings.auto_approve_threshold_cents ? settings.auto_approve_threshold_cents / 100 : ''} onChange={e => setSettings(s => ({ ...s, auto_approve_threshold_cents: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) }))} data-testid="input-auto-approve-threshold" />
                      <p className="text-xs text-muted-foreground mt-1">Batches under this amount auto-approve (0 = manual only)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Two-Tier Referrals</h4>
                <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
                  <div>
                    <Label>Enable Two-Tier Commissions</Label>
                    <p className="text-xs text-muted-foreground">Affiliates earn a percentage when their recruited affiliates make sales</p>
                  </div>
                  <Switch
                    checked={settings.two_tier_enabled}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, two_tier_enabled: v }))}
                    data-testid="switch-two-tier-enabled"
                  />
                </div>
                {settings.two_tier_enabled && (
                  <div>
                    <Label>Second-Tier Commission Rate (%)</Label>
                    <Input type="number" min="0" max="50" step="0.5" value={settings.second_tier_commission_rate || ''} onChange={e => setSettings(s => ({ ...s, second_tier_commission_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) }))} data-testid="input-second-tier-rate" className="w-full sm:w-32" />
                    <p className="text-xs text-muted-foreground mt-1">Percentage of recruited affiliate's commission paid to recruiter</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Fraud Detection</h4>
                <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
                  <div>
                    <Label>Enable Fraud Scoring</Label>
                    <p className="text-xs text-muted-foreground">Automatically score affiliates for suspicious behavior</p>
                  </div>
                  <Switch
                    checked={settings.fraud_scoring_enabled}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, fraud_scoring_enabled: v }))}
                    data-testid="switch-fraud-scoring"
                  />
                </div>
                {settings.fraud_scoring_enabled && (
                  <div>
                    <Label>Auto-Pause Threshold (0-100)</Label>
                    <Input type="number" min="0" max="100" value={settings.fraud_auto_pause_threshold || ''} onChange={e => setSettings(s => ({ ...s, fraud_auto_pause_threshold: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-fraud-threshold" className="w-full sm:w-32" />
                    <p className="text-xs text-muted-foreground mt-1">Affiliates with fraud score above this are auto-paused (default: 60)</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Surveys</h4>
                <div>
                  <Label>Survey Interval (days)</Label>
                  <Input type="number" min="30" max="365" value={settings.survey_interval_days || ''} onChange={e => setSettings(s => ({ ...s, survey_interval_days: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-survey-interval" className="w-full sm:w-32" />
                  <p className="text-xs text-muted-foreground mt-1">How often affiliates are prompted to complete a satisfaction survey</p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4 sticky bottom-0 bg-background pb-2">
                <Button onClick={saveSettings} disabled={saving} data-testid="button-save-settings" className="w-full sm:w-auto">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-tiers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Performance Tiers</CardTitle>
                <CardDescription>Reward top affiliates with higher commission rates</CardDescription>
              </div>
              <Dialog open={tierDialog} onOpenChange={(open) => { setTierDialog(open); if (!open) { setEditingTier(null); setTierForm({ name: '', min_referrals: 0, commission_rate: 20, sort_order: 0, min_payout_cents: 0, perks: '' }) } }}>
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
                      <Input type="number" min="0" value={tierForm.min_referrals || ''} onChange={e => setTierForm(f => ({ ...f, min_referrals: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-tier-min-referrals" />
                    </div>
                    <div>
                      <Label>Commission Rate (%)</Label>
                      <Input type="number" min="0" max="100" step="0.5" value={tierForm.commission_rate || ''} onChange={e => setTierForm(f => ({ ...f, commission_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) }))} data-testid="input-tier-rate" />
                    </div>
                    <div>
                      <Label>Sort Order</Label>
                      <Input type="number" min="0" value={tierForm.sort_order || ''} onChange={e => setTierForm(f => ({ ...f, sort_order: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-tier-sort" />
                    </div>
                    <div>
                      <Label>Min Payout Override ($)</Label>
                      <Input type="number" min="0" step="5" value={tierForm.min_payout_cents ? tierForm.min_payout_cents / 100 : ''} onChange={e => setTierForm(f => ({ ...f, min_payout_cents: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) }))} data-testid="input-tier-min-payout" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1">
                        Perks (comma-separated)
                        <HelpTooltip text="Perks are benefits you offer to affiliates at each tier level. Examples: priority support, early access to features, custom banners, higher cookie duration. Affiliates see their tier perks on their dashboard as motivation to grow." />
                      </Label>
                      <Input value={tierForm.perks} onChange={e => setTierForm(f => ({ ...f, perks: e.target.value }))} placeholder="e.g., Priority support, Early access, Custom banners" data-testid="input-tier-perks" />
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
                <>
                  <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-3 text-xs">
                    <SortableHeader label="Name" sortKey="name" currentSort={tierSort} onSort={toggleTierSort} />
                    <SortableHeader label="Min Referrals" sortKey="min_referrals" currentSort={tierSort} onSort={toggleTierSort} />
                    <SortableHeader label="Commission Rate" sortKey="commission_rate" currentSort={tierSort} onSort={toggleTierSort} />
                  </div>
                  <div className="space-y-2">
                    {sortedTiers.map(tier => (
                      <div key={tier.id} className="flex items-center justify-between p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`tier-${tier.id}`} onClick={() => { setDetailItem(tier); setDetailType('tier') }}>
                        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{tier.name}</p>
                            <p className="text-xs text-muted-foreground">{tier.min_referrals}+ referrals = {tier.commission_rate}% commission</p>
                            {Array.isArray((tier as any).perks) && (tier as any).perks.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {((tier as any).perks as string[]).map((perk: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">{perk}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingTier(tier); setTierForm({ name: tier.name, min_referrals: tier.min_referrals, commission_rate: tier.commission_rate, sort_order: tier.sort_order, min_payout_cents: (tier as any).min_payout_cents || 0, perks: Array.isArray((tier as any).perks) ? (tier as any).perks.join(', ') : (tier as any).perks || '' }); setTierDialog(true) }} data-testid={`button-edit-tier-${tier.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteTier(tier.id) }} data-testid={`button-delete-tier-${tier.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-assets">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Marketing Assets</CardTitle>
                <CardDescription>Upload banners, email templates, and social post templates for affiliates</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-asset-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ASSET_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      {(['email_template', 'social_post', 'text_snippet', 'swipe_file', 'landing_page', 'faq', 'best_practice', 'guide'].includes(assetForm.asset_type)) && (
                        <div>
                          <Label>Content</Label>
                          <Textarea value={assetForm.content} onChange={e => setAssetForm(f => ({ ...f, content: e.target.value }))} placeholder="Paste your template content here..." rows={6} data-testid="input-asset-content" />
                        </div>
                      )}
                      {(['banner', 'video', 'video_tutorial', 'case_study', 'one_pager'].includes(assetForm.asset_type)) && (
                        <div>
                          <Label>{(assetForm.asset_type === 'video' || assetForm.asset_type === 'video_tutorial') ? 'Video URL' : assetForm.asset_type === 'banner' ? 'Image URL' : 'File URL'}</Label>
                          <Input value={assetForm.file_url} onChange={e => setAssetForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." data-testid="input-asset-file-url" />
                        </div>
                      )}
                      <Button onClick={saveAsset} className="w-full" data-testid="button-save-asset">
                        {editingAsset ? 'Update Asset' : 'Create Asset'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-assets">No assets yet. Add banners, email templates, or social post templates.</p>
              ) : sortedFilteredAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assets match the selected filter.</p>
              ) : (
                <>
                  <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-3 text-xs">
                    <SortableHeader label="Title" sortKey="title" currentSort={assetSort} onSort={toggleAssetSort} />
                    <SortableHeader label="Type" sortKey="asset_type" currentSort={assetSort} onSort={toggleAssetSort} />
                  </div>
                  <div className="space-y-2">
                    {sortedFilteredAssets.map(asset => {
                      const typeIcon = asset.asset_type === 'banner' ? FileImage : FileText
                      const TypeIcon = typeIcon
                      return (
                        <div key={asset.id} className="flex items-center justify-between p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`asset-${asset.id}`} onClick={() => { setDetailItem(asset); setDetailType('asset') }}>
                          <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{asset.title}</p>
                              <p className="text-xs text-muted-foreground">{ASSET_TYPES.find(t => t.value === asset.asset_type)?.label || asset.asset_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setAssetForm({ title: asset.title, description: asset.description || '', asset_type: asset.asset_type, content: asset.content || '', file_url: asset.file_url || '' }); setAssetDialog(true) }} data-testid={`button-edit-asset-${asset.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id) }} data-testid={`button-delete-asset-${asset.id}`}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-affiliates-list">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-[var(--content-density-gap,1rem)]">
                <div>
                  <CardTitle className="text-base">Affiliate Members ({members.length})</CardTitle>
                  <CardDescription>Manage all affiliates — view stats, filter by status, and remove records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="pl-8 w-[220px] h-9"
                      data-testid="input-member-search"
                    />
                  </div>
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger className="w-[140px] h-9" data-testid="select-member-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending_setup">Pending Setup</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]" data-testid="text-no-members">No affiliates yet. Approve applications to add affiliates.</p>
              ) : sortedFilteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-[var(--section-spacing,1.5rem)]">No affiliates match your current filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-3 font-medium">
                          <button onClick={() => toggleMemberSort('name')} className="flex items-center gap-1 hover:text-foreground text-muted-foreground" data-testid="sort-name">
                            Affiliate
                            {memberSort.key === 'name' ? (memberSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                        <th className="pb-2 px-3 font-medium">
                          <span className="flex items-center gap-1">
                            Status
                            <HelpTooltip text="Active = logged in and generating referrals. Pending Setup = approved but hasn't completed their profile. Inactive = no activity for an extended period." />
                          </span>
                        </th>
                        <th className="pb-2 px-3 font-medium">
                          <button onClick={() => toggleMemberSort('tier')} className="flex items-center gap-1 hover:text-foreground text-muted-foreground" data-testid="sort-tier">
                            Tier
                            {memberSort.key === 'tier' ? (memberSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                        <th className="pb-2 px-3 font-medium text-right">
                          <button onClick={() => toggleMemberSort('referrals')} className="flex items-center gap-1 hover:text-foreground text-muted-foreground ml-auto" data-testid="sort-referrals">
                            Referrals
                            {memberSort.key === 'referrals' ? (memberSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                        <th className="pb-2 px-3 font-medium text-right">
                          <button onClick={() => toggleMemberSort('totalEarnings')} className="flex items-center gap-1 hover:text-foreground text-muted-foreground ml-auto" data-testid="sort-earnings">
                            Earnings
                            {memberSort.key === 'totalEarnings' ? (memberSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                        <th className="pb-2 px-3 font-medium text-center hidden lg:table-cell">
                          <span className="text-muted-foreground">30d Trend</span>
                        </th>
                        <th className="pb-2 px-3 font-medium text-right">
                          <button onClick={() => toggleMemberSort('joinedAt')} className="flex items-center gap-1 hover:text-foreground text-muted-foreground ml-auto" data-testid="sort-joined">
                            Joined
                            {memberSort.key === 'joinedAt' ? (memberSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                        <th className="pb-2 pl-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFilteredMembers.map(m => {
                        const health = getHealthScore(m)
                        return (
                        <tr key={m.userId} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" data-testid={`member-row-${m.userId}`} onClick={() => setCrmMember(m)}>
                          <td className="py-3 pr-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link href={`/admin/crm/${m.userId}`} className="font-medium truncate text-primary hover:underline" onClick={(e) => e.stopPropagation()} data-testid={`link-member-crm-${m.userId}`}>{m.name || m.email}</Link>
                                <span
                                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${health.color === 'green' ? 'bg-[hsl(var(--success))]' : health.color === 'yellow' ? 'bg-[hsl(var(--warning))]' : 'bg-[hsl(var(--danger))]'}`}
                                  title={health.label}
                                  data-testid={`health-indicator-${m.userId}`}
                                />
                              </div>
                              {m.name && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.refCode}</Badge>
                                {m.lockedRate && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.lockedRate}% locked</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={m.suspended ? 'destructive' : m.status === 'active' ? 'default' : m.status === 'pending_setup' ? 'secondary' : 'outline'}
                                className="text-xs"
                                data-testid={`status-${m.userId}`}
                              >
                                {m.suspended ? 'Suspended' : m.status === 'active' ? 'Active' : m.status === 'pending_setup' ? 'Pending Setup' : 'Inactive'}
                              </Badge>
                              {(m.fraudScore || 0) >= 30 && (
                                <Badge variant={m.fraudScore >= 60 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0" data-testid={`fraud-score-${m.userId}`}>
                                  Fraud: {m.fraudScore}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs">{m.tier}</span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            <p className="font-medium">{m.referrals}</p>
                            <p className="text-xs text-muted-foreground">{m.clicks} clicks</p>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            {(m.totalEarnings || 0) > 0 ? (
                              <p className="font-medium">${((m.totalEarnings || 0) / 100).toFixed(2)}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">$0.00</p>
                            )}
                            {(m.pendingEarnings || 0) > 0 && (
                              <p className="text-xs text-muted-foreground">${((m.pendingEarnings || 0) / 100).toFixed(2)} pending</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center hidden lg:table-cell">
                            {m.earningsTrend && m.earningsTrend.some((v: number) => v > 0) ? (
                              <Sparkline data={m.earningsTrend} width={60} height={16} color="hsl(var(--success))" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <p className="text-xs text-muted-foreground">{new Date(m.joinedAt).toLocaleDateString()}</p>
                            {m.lastSignIn && (
                              <p className="text-[10px] text-muted-foreground">Last: {new Date(m.lastSignIn).toLocaleDateString()}</p>
                            )}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleSuspendMember(m.userId, m.email, !m.suspended) }}
                                disabled={suspendingMember === m.userId}
                                data-testid={`button-suspend-member-${m.userId}`}
                                title={m.suspended ? 'Unsuspend' : 'Suspend'}
                              >
                                {suspendingMember === m.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : m.suspended ? <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" /> : <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleRecalcFraud(m.userId, m.email) }}
                                disabled={recalcFraud === m.userId}
                                data-testid={`button-recalc-fraud-${m.userId}`}
                                title="Recalculate Fraud Score"
                              >
                                {recalcFraud === m.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={(e) => { e.stopPropagation(); setMemberToDelete({ userId: m.userId, email: m.email }) }}
                                disabled={deletingMember === m.userId}
                                data-testid={`button-delete-member-${m.userId}`}
                              >
                                {deletingMember === m.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
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

        <TabsContent value="milestones" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-milestones">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-1">
                  Milestone Bonuses
                  <HelpTooltip text="One-time cash bonuses awarded when an affiliate reaches specific referral count milestones. Great for motivating early growth." />
                </CardTitle>
                <CardDescription>One-time bonuses when affiliates hit referral count thresholds</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="select-milestone-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                        <Input type="number" min="1" value={milestoneForm.referral_threshold || ''} onChange={e => setMilestoneForm(f => ({ ...f, referral_threshold: e.target.value === '' ? 0 : parseInt(e.target.value) }))} data-testid="input-milestone-threshold" />
                      </div>
                      <div>
                        <Label>Bonus Amount ($)</Label>
                        <Input type="number" min="0" step="5" value={milestoneForm.bonus_amount_cents ? milestoneForm.bonus_amount_cents / 100 : ''} onChange={e => setMilestoneForm(f => ({ ...f, bonus_amount_cents: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) }))} data-testid="input-milestone-bonus" />
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
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-milestones">
                  No milestones configured. Add milestones to motivate affiliates with bonus payouts at specific referral counts.
                </p>
              ) : sortedFilteredMilestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No milestones match the selected filter.</p>
              ) : (
                <>
                  <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-3 text-xs">
                    <SortableHeader label="Name" sortKey="name" currentSort={milestoneSort} onSort={toggleMilestoneSort} />
                    <SortableHeader label="Threshold" sortKey="referral_threshold" currentSort={milestoneSort} onSort={toggleMilestoneSort} />
                    <SortableHeader label="Bonus Amount" sortKey="bonus_amount_cents" currentSort={milestoneSort} onSort={toggleMilestoneSort} />
                    <SortableHeader label="Status" sortKey="is_active" currentSort={milestoneSort} onSort={toggleMilestoneSort} />
                  </div>
                  <div className="space-y-2">
                    {sortedFilteredMilestones.map(ms => (
                      <div key={ms.id} className="flex items-center justify-between p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`milestone-${ms.id}`} onClick={() => { setDetailItem(ms); setDetailType('milestone') }}>
                        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{ms.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ms.referral_threshold} referrals = ${(ms.bonus_amount_cents / 100).toFixed(2)} bonus
                            </p>
                            {ms.description && <p className="text-xs text-muted-foreground italic">{ms.description}</p>}
                            <p className={`text-xs mt-0.5 ${(ms.earned_count || 0) > 0 ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`} data-testid={`text-milestone-earned-${ms.id}`}>
                              {ms.earned_count || 0} affiliate{(ms.earned_count || 0) !== 1 ? 's' : ''} earned
                            </p>
                          </div>
                          <Badge variant={ms.is_active ? 'default' : 'outline'} className={ms.is_active ? 'text-xs bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]' : 'text-xs'}>{ms.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation()
                            setEditingMilestone(ms)
                            setMilestoneForm({ name: ms.name, referral_threshold: ms.referral_threshold, bonus_amount_cents: ms.bonus_amount_cents, description: ms.description || '', is_active: ms.is_active, sort_order: ms.sort_order })
                            setMilestoneDialog(true)
                          }} data-testid={`button-edit-milestone-${ms.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteMilestone(ms.id) }} data-testid={`button-delete-milestone-${ms.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-broadcasts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Affiliate Broadcasts
                </CardTitle>
                <CardDescription>Send announcements and updates to your affiliates</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={broadcastFilter} onValueChange={setBroadcastFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="select-broadcast-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => { setEditingBroadcast(null); setBroadcastForm({ subject: '', body: '', audience_type: 'all' }); setBroadcastDialog(true) }} data-testid="button-add-broadcast">
                  <Plus className="h-4 w-4 mr-1" /> New Broadcast
                </Button>
              </div>
              <Dialog open={broadcastDialog} onOpenChange={(open) => {
                setBroadcastDialog(open)
                if (!open) { setEditingBroadcast(null); setBroadcastForm({ subject: '', body: '', audience_type: 'all' }) }
              }}>
                <DialogContent className="max-w-lg" data-testid="dialog-broadcast-form">
                  <DialogHeader>
                    <DialogTitle>{editingBroadcast ? 'Edit Broadcast' : 'Create Broadcast'}</DialogTitle>
                    <DialogDescription>Compose an email to send to your affiliates.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {emailTemplates.length > 0 && !editingBroadcast && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Load from Email Template</Label>
                        <Select onValueChange={v => {
                          const tpl = emailTemplates.find(t => String(t.id) === v)
                          if (tpl) setBroadcastForm(f => ({ ...f, subject: tpl.subject, body: tpl.body }))
                        }}>
                          <SelectTrigger data-testid="select-broadcast-template" className="h-9">
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {emailTemplates.map(t => (
                              <SelectItem key={t.id} value={String(t.id)}>{t.name}{t.category && t.category !== 'general' ? ` (${t.category})` : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Manage templates in <a href="/admin/email-templates" className="underline">Email Templates</a>
                        </p>
                      </div>
                    )}
                    <div>
                      <Label>Broadcast Name</Label>
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
                      {editingBroadcast ? 'Update Broadcast' : 'Save as Draft'}
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
              ) : sortedFilteredBroadcasts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No broadcasts match the selected filter.</p>
              ) : (
                <>
                  <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-3 text-xs">
                    <SortableHeader label="Date" sortKey="created_at" currentSort={broadcastSort} onSort={toggleBroadcastSort} />
                  </div>
                  <div className="space-y-2">
                    {sortedFilteredBroadcasts.map(bc => (
                      <div key={bc.id} className="flex items-center justify-between p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`broadcast-${bc.id}`} onClick={() => { setDetailItem(bc); setDetailType('broadcast') }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{bc.subject}</p>
                            <Badge variant={bc.status === 'sent' ? 'default' : 'outline'} className="text-xs capitalize">
                              {bc.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-[var(--content-density-gap,1rem)] mt-1 text-xs text-muted-foreground">
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
                            <>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingBroadcast(bc); setBroadcastForm({ subject: bc.subject, body: bc.body, audience_type: bc.audience_filter?.type || 'all' }); setBroadcastDialog(true) }} data-testid={`button-edit-broadcast-${bc.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSendConfirmBroadcast(bc) }} disabled={sendingBroadcast === bc.id} data-testid={`button-send-broadcast-${bc.id}`}>
                                {sendingBroadcast === bc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteBroadcast(bc.id) }} data-testid={`button-delete-broadcast-${bc.id}`}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!sendConfirmBroadcast} onOpenChange={(open) => { if (!open) setSendConfirmBroadcast(null) }}>
            <DialogContent data-testid="dialog-send-confirm">
              <DialogHeader>
                <DialogTitle>Send Broadcast</DialogTitle>
                <DialogDescription>
                  Are you sure you want to send &ldquo;{sendConfirmBroadcast?.subject}&rdquo; to your affiliates? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSendConfirmBroadcast(null)} data-testid="button-cancel-send">Cancel</Button>
                <Button onClick={() => sendConfirmBroadcast && sendBroadcast(sendConfirmBroadcast)} disabled={!!sendingBroadcast} data-testid="button-confirm-send">
                  {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Send Now
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="networks" className="space-y-[var(--content-density-gap,1rem)] mt-4">
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
                <div className="space-y-[var(--content-density-gap,1rem)]">
                  {networks.map(network => (
                    <div key={network.id} className="p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`network-${network.network_slug}`} onClick={() => { setEditingNetwork(network); setNetworkForm({ tracking_id: network.tracking_id || '', postback_url: network.postback_url || '', api_key: network.api_key || '' }); setNetworkEditDialog(true) }}>
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
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      {network.is_active && (
                        <div className="grid gap-[var(--content-density-gap,1rem)] sm:grid-cols-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Tracking ID</Label>
                            <p className="text-xs mt-0.5 truncate" data-testid={`text-tracking-${network.network_slug}`}>
                              {network.tracking_id || <span className="text-muted-foreground italic">Not set</span>}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Postback URL</Label>
                            <p className="text-xs mt-0.5 truncate" data-testid={`text-postback-${network.network_slug}`}>
                              {network.postback_url || <span className="text-muted-foreground italic">Not set</span>}
                            </p>
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

        <Dialog open={networkEditDialog} onOpenChange={setNetworkEditDialog}>
          <DialogContent className="max-w-md" data-testid="dialog-network-edit">
            <DialogHeader>
              <DialogTitle>{editingNetwork?.network_name || 'Network'} Settings</DialogTitle>
              <DialogDescription>Configure tracking and integration settings for this affiliate network.</DialogDescription>
            </DialogHeader>
            <div className="space-y-[var(--content-density-gap,1rem)] py-2">
              <div>
                <Label>Tracking ID</Label>
                <Input
                  value={networkForm.tracking_id}
                  onChange={e => setNetworkForm(f => ({ ...f, tracking_id: e.target.value }))}
                  placeholder="Your tracking/publisher ID"
                  className="mt-1"
                  data-testid="input-network-tracking-id"
                />
              </div>
              <div>
                <Label>Postback URL</Label>
                <Input
                  value={networkForm.postback_url}
                  onChange={e => setNetworkForm(f => ({ ...f, postback_url: e.target.value }))}
                  placeholder="https://network.example.com/postback?click_id={click_id}"
                  className="mt-1"
                  data-testid="input-network-postback-url"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Server-to-server postback URL for conversion tracking</p>
              </div>
              <div>
                <Label>API Key</Label>
                <Input
                  value={networkForm.api_key}
                  onChange={e => setNetworkForm(f => ({ ...f, api_key: e.target.value }))}
                  placeholder="Optional API key for this network"
                  className="mt-1"
                  type="password"
                  data-testid="input-network-api-key"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setNetworkEditDialog(false)} data-testid="button-network-cancel">Cancel</Button>
              <Button
                onClick={async () => {
                  if (!editingNetwork) return
                  await saveNetwork(editingNetwork, {
                    tracking_id: networkForm.tracking_id || null,
                    postback_url: networkForm.postback_url || null,
                    api_key: networkForm.api_key || null,
                  })
                  setNetworkEditDialog(false)
                  fetchData()
                }}
                data-testid="button-network-save"
              >
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <TabsContent value="contests" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-contests">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Quarterly Contests</CardTitle>
                <CardDescription>Create competitions to motivate affiliates</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={contestFilter} onValueChange={setContestFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-contest-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => { setEditingContest(null); setContestForm({ name: '', description: '', metric: 'referrals', start_date: '', end_date: '', prize_description: '', prize_amount_cents: 10000 }); setContestDialog(true) }} data-testid="button-add-contest">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Contest
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-contests">No contests created yet.</p>
              ) : sortedFilteredContests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No contests match the selected filter.</p>
              ) : (
                <>
                  <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-3 text-xs">
                    <SortableHeader label="Date" sortKey="start_date" currentSort={contestSort} onSort={toggleContestSort} />
                  </div>
                  <div className="space-y-3">
                    {sortedFilteredContests.map(c => (
                      <div key={c.id} className="p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`contest-${c.id}`} onClick={() => { setDetailItem(c); setDetailType('contest') }}>
                        <div className="flex items-start justify-between gap-[var(--content-density-gap,1rem)]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{c.name}</p>
                              <Badge variant={c.status === 'active' ? 'default' : c.status === 'completed' ? 'secondary' : 'outline'} className="text-xs capitalize">
                                {c.status}
                              </Badge>
                            </div>
                            {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                            <div className="flex items-center gap-[var(--content-density-gap,1rem)] mt-1 text-xs text-muted-foreground">
                              <span>Metric: {c.metric}</span>
                              <span>Prize: ${(c.prize_amount_cents / 100).toFixed(2)}</span>
                              <span>{new Date(c.start_date).toLocaleDateString()} — {new Date(c.end_date).toLocaleDateString()}</span>
                            </div>
                            {c.status === 'completed' && c.winner_user_id && (
                              <div className="flex items-center gap-1 mt-1" data-testid={`text-contest-winner-${c.id}`}>
                                <Trophy className="h-3 w-3 text-[hsl(var(--warning))]" />
                                <Link href={`/admin/crm/${c.winner_user_id}`} className="text-xs font-medium text-[hsl(var(--warning))] hover:underline" onClick={(e) => e.stopPropagation()} data-testid={`link-contest-winner-${c.id}`}>
                                  Winner: {members.find(m => m.userId === c.winner_user_id)?.name || members.find(m => m.userId === c.winner_user_id)?.email || c.winner_user_id}
                                </Link>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {c.status !== 'completed' && (
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingContest(c); setContestForm({ name: c.name, description: c.description || '', metric: c.metric || 'referrals', start_date: c.start_date?.split('T')[0] || '', end_date: c.end_date?.split('T')[0] || '', prize_description: c.prize_description || '', prize_amount_cents: c.prize_amount_cents || 0 }); setContestDialog(true) }} data-testid={`button-edit-contest-${c.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); deleteContest(c.id) }} data-testid={`button-delete-contest-${c.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={contestDialog} onOpenChange={setContestDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingContest ? 'Edit Contest' : 'Create Contest'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={contestForm.name} onChange={e => setContestForm(f => ({ ...f, name: e.target.value }))} data-testid="input-contest-name" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={contestForm.description} onChange={e => setContestForm(f => ({ ...f, description: e.target.value }))} data-testid="input-contest-description" />
                </div>
                <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-1 sm:grid-cols-2">
                  <div>
                    <Label>Metric</Label>
                    <Select value={contestForm.metric} onValueChange={v => setContestForm(f => ({ ...f, metric: v }))}>
                      <SelectTrigger data-testid="select-contest-metric"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="referrals">Referrals</SelectItem>
                        <SelectItem value="earnings">Earnings</SelectItem>
                        <SelectItem value="clicks">Clicks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prize Amount ($)</Label>
                    <Input type="number" min="0" step="10" value={contestForm.prize_amount_cents ? contestForm.prize_amount_cents / 100 : ''} onChange={e => setContestForm(f => ({ ...f, prize_amount_cents: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) }))} data-testid="input-contest-prize" />
                  </div>
                </div>
                <div>
                  <Label>Prize Description</Label>
                  <Input value={contestForm.prize_description} onChange={e => setContestForm(f => ({ ...f, prize_description: e.target.value }))} placeholder="e.g. Cash bonus + featured spotlight" data-testid="input-contest-prize-desc" />
                </div>
                <div className="grid gap-[var(--content-density-gap,1rem)] grid-cols-1 sm:grid-cols-2">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={contestForm.start_date} onChange={e => setContestForm(f => ({ ...f, start_date: e.target.value }))} data-testid="input-contest-start" />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={contestForm.end_date} onChange={e => setContestForm(f => ({ ...f, end_date: e.target.value }))} data-testid="input-contest-end" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setContestDialog(false)}>Cancel</Button>
                  <Button onClick={saveContest} data-testid="button-save-contest">{editingContest ? 'Update' : 'Create'} Contest</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payout-batches" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-payout-batches">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Scheduled Payout Runs</CardTitle>
                <CardDescription>Generate and approve batched payout runs</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-batch-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={generatePayoutBatch} disabled={generatingBatch} data-testid="button-generate-batch">
                  {generatingBatch ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                  Generate Batch
                </Button>
                <Button size="sm" onClick={processAll} disabled={generatingBatch} data-testid="button-process-all">
                  {generatingBatch ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <DollarSign className="h-3.5 w-3.5 mr-1" />}
                  Process All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payoutBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-batches">No payout batches yet. Generate one or use Process All to get started.</p>
              ) : filteredBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No batches match the selected filter.</p>
              ) : (
                <div className="space-y-3">
                  {filteredBatches.map(b => (
                    <div key={b.id} className="p-[var(--card-padding,1.25rem)] rounded-[var(--card-radius,0.75rem)] border cursor-pointer" data-testid={`batch-${b.id}`} onClick={() => { setDetailItem(b); setDetailType('payout_batch') }}>
                      <div className="flex items-start justify-between gap-[var(--content-density-gap,1rem)]">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={b.status === 'pending' ? 'outline' : b.status === 'rejected' ? 'destructive' : 'default'} className={`text-xs capitalize ${b.status === 'approved' || b.status === 'completed' ? 'bg-[hsl(var(--success))]' : ''}`}>
                              {b.status}
                            </Badge>
                            <span className="text-sm font-medium">${((b.total_amount_cents || 0) / 100).toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">{b.total_affiliates || b.payout_count || 0} affiliates</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>Batch: {new Date(b.batch_date || b.created_at).toLocaleDateString()}</span>
                            {b.notes && <span>{b.notes}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 flex-wrap">
                          {b.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); approveBatch(b.id, 'approved') }} data-testid={`button-approve-batch-${b.id}`}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); approveBatch(b.id, 'rejected') }} data-testid={`button-reject-batch-${b.id}`}>
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {(b.status === 'approved' || b.status === 'completed') && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); sendReceiptsForBatch(b.id) }} disabled={sendingReceipts} data-testid={`button-send-receipts-${b.id}`}>
                              {sendingReceipts ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Mail className="h-3.5 w-3.5 mr-1" />}
                              Send Receipts
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={processAllDialog} onOpenChange={(open) => { if (!open) { setProcessAllDialog(false); setProcessAllSummary(null); setReceiptResult(null) } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process All Payouts</DialogTitle>
                <DialogDescription>Review the batch summary and approve to process all payouts at once.</DialogDescription>
              </DialogHeader>
              {processAllSummary ? (
                <div className="space-y-[var(--content-density-gap,1rem)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--content-density-gap,1rem)]">
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Affiliates</span>
                        </div>
                        <p className="text-2xl font-bold mt-1" data-testid="text-process-all-affiliates">{processAllSummary.affiliatesIncluded}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Total Amount</span>
                        </div>
                        <p className="text-2xl font-bold mt-1" data-testid="text-process-all-amount">${(processAllSummary.totalAmountCents / 100).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {receiptResult && (
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-[hsl(var(--success))]" />
                          <span className="text-sm font-medium">Receipt Emails Sent</span>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid="text-receipt-result">
                          {receiptResult.sentCount} sent successfully{receiptResult.failedCount > 0 ? `, ${receiptResult.failedCount} failed` : ''}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="flex gap-2 justify-end">
                    {!receiptResult && (
                      <Button onClick={approveAndSendReceipts} disabled={approvingAll || sendingReceipts} data-testid="button-approve-and-send">
                        {approvingAll ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Approving...</>
                        ) : sendingReceipts ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Sending Receipts...</>
                        ) : (
                          <><CheckCircle className="h-4 w-4 mr-1" /> Approve &amp; Send Receipts</>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => { setProcessAllDialog(false); setProcessAllSummary(null); setReceiptResult(null) }} data-testid="button-close-process-all">
                      {receiptResult ? 'Done' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-[var(--section-spacing,1.5rem)]"><Loader2 className="h-6 w-6 animate-spin" /></div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="audit" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <Card data-testid="card-audit-log">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Audit Log
              </CardTitle>
              <CardDescription>
                All affiliate admin actions are tracked in the centralized audit log.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-[var(--content-density-gap,1rem)]">
                Every change to tiers, milestones, assets, broadcasts, applications, contests, settings, networks, and payouts is automatically recorded with the admin who made it.
              </p>
              <Button asChild data-testid="button-view-audit-logs">
                <a href="/admin/audit-logs?category=affiliate">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View Affiliate Audit Logs
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="messages" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <AdminMessagesTab />
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <AdminTestimonialsTab />
        </TabsContent>

        <TabsContent value="tax-info" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <AdminTaxInfoTab />
        </TabsContent>

        <TabsContent value="renewals" className="space-y-[var(--content-density-gap,1rem)] mt-4">
          <AdminRenewalsTab />
        </TabsContent>

      </Tabs>

      <DetailModal
        open={!!detailItem && detailType !== 'member'}
        onOpenChange={(open) => { if (!open) { setDetailItem(null); setDetailType('') } }}
        title={getDetailTitle()}
        fields={getDetailFields()}
      />

      <AffiliateCRMDrawer
        member={crmMember}
        open={!!crmMember}
        onClose={() => setCrmMember(null)}
        onSuspend={handleSuspendMember}
        onRecalcFraud={handleRecalcFraud}
        suspendingMember={suspendingMember}
        recalcFraud={recalcFraud}
      />

      <ConfirmDialog
        open={!!memberToDelete}
        onOpenChange={(open) => { if (!open) setMemberToDelete(null) }}
        title="Delete Affiliate"
        description={`Are you sure you want to delete the affiliate record for ${memberToDelete?.email}? This will remove their referral link, commissions, referrals, and application data. This cannot be undone.`}
        confirmLabel="Delete Affiliate"
        variant="destructive"
        onConfirm={() => { if (memberToDelete) handleDeleteMember(memberToDelete.userId, memberToDelete.email) }}
      />

      <ConfirmDialog
        open={!!appToDelete}
        onOpenChange={(open) => { if (!open) setAppToDelete(null) }}
        title="Delete Application"
        description={`Delete the application from ${appToDelete?.email}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (appToDelete) handleDeleteApplication(appToDelete.appId, appToDelete.email) }}
      />
    </div>
  )
}
