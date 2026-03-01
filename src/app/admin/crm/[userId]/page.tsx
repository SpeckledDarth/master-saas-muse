'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, ExternalLink, Mail, UserCog, X, Plus, Tag, CreditCard, Activity, MessageSquare, FileText, ScrollText, DollarSign, Send, LayoutGrid, ChevronDown, Megaphone, Phone, MapPin, Globe, Trash2, Star, Pencil, Link2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs'
import { Timeline, type TimelineEvent } from '@/components/admin/timeline'
import { EntityNotes } from '@/components/admin/entity-notes'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const TYPE_COLORS: Record<string, string> = {
  Subscriber: 'bg-primary/10 text-primary',
  Affiliate: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  Team: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
}

const TAG_COLORS: Record<string, string> = {
  gray: 'bg-muted text-muted-foreground',
  blue: 'bg-primary/10 text-primary',
  green: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  red: 'bg-destructive/10 text-destructive',
  amber: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
  purple: 'bg-primary/10 text-primary',
}

const TAG_COLOR_OPTIONS = ['gray', 'blue', 'green', 'red', 'amber', 'purple']

const TX_TYPE_COLORS: Record<string, string> = {
  invoice: 'bg-primary/10 text-primary',
  payment: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  commission: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
  payout: 'bg-primary/10 text-primary',
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  open: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
  pending: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
  failed: 'bg-destructive/10 text-destructive',
  void: 'bg-muted text-muted-foreground',
  uncollectible: 'bg-destructive/10 text-destructive',
  approved: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  closed: 'bg-muted text-muted-foreground',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function healthColor(score: number) {
  if (score >= 60) return 'text-[hsl(var(--success))]'
  if (score >= 30) return 'text-[hsl(var(--warning))]'
  return 'text-destructive'
}

function healthDot(score: number) {
  if (score >= 60) return 'bg-[hsl(var(--success))]'
  if (score >= 30) return 'bg-[hsl(var(--warning))]'
  return 'bg-destructive'
}

const TABS = [
  { id: 'summary', label: 'Summary', icon: LayoutGrid },
  { id: 'profile', label: 'Profile', icon: UserCog },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
]

export default function CRMDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const validTabs = TABS.map(t => t.id)
  const tabFromUrl = searchParams.get('tab')
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'summary'

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTabState] = useState(initialTab)

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }, [])

  const [tags, setTags] = useState<any[]>([])
  const [newTag, setNewTag] = useState('')
  const [newTagColor, setNewTagColor] = useState('gray')
  const [addingTag, setAddingTag] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)

  const [profileForm, setProfileForm] = useState<Record<string, string>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  const [phones, setPhones] = useState<any[]>([])
  const [emails, setEmails] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [socialLinks, setSocialLinks] = useState<any[]>([])
  const [contactLoading, setContactLoading] = useState(false)
  const [showAddPhone, setShowAddPhone] = useState(false)
  const [showAddEmail, setShowAddEmail] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showAddSocial, setShowAddSocial] = useState(false)
  const [editingContact, setEditingContact] = useState<{ type: string; item: any } | null>(null)
  const [deleteContact, setDeleteContact] = useState<{ type: string; id: string; label: string } | null>(null)
  const [contactForm, setContactForm] = useState<Record<string, any>>({})
  const [savingContact, setSavingContact] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/crm/${userId}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
        setTags(result.tags || [])
        if (result.profile) {
          setProfileForm({
            display_name: result.profile.display_name || result.user?.name || '',
            phone: result.profile.phone || '',
            bio: result.profile.bio || '',
            timezone: result.profile.timezone || '',
            address_line1: result.profile.address_line1 || '',
            city: result.profile.city || '',
            state: result.profile.state || '',
            postal_code: result.profile.postal_code || '',
            country: result.profile.country || '',
            first_name: result.profile.first_name || '',
            last_name: result.profile.last_name || '',
            company: result.profile.company || '',
            job_title: result.profile.job_title || '',
            website: result.profile.website || '',
          })
        } else {
          setProfileForm({
            display_name: result.user?.name || '',
            phone: '',
            bio: '',
            timezone: '',
            address_line1: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            first_name: '',
            last_name: '',
            company: '',
            job_title: '',
            website: '',
          })
        }
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function addTag() {
    if (!newTag.trim()) return
    setAddingTag(true)
    try {
      const res = await fetch(`/api/admin/crm/${userId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim(), color: newTagColor }),
      })
      if (res.ok) {
        const result = await res.json()
        setTags(prev => [...prev, result.tag])
        setNewTag('')
        setShowTagInput(false)
      }
    } catch {
    } finally {
      setAddingTag(false)
    }
  }

  async function removeTag(tagName: string) {
    try {
      const res = await fetch(`/api/admin/crm/${userId}/tags?tag=${encodeURIComponent(tagName)}`, { method: 'DELETE' })
      if (res.ok) {
        setTags(prev => prev.filter(t => t.tag !== tagName))
      }
    } catch {}
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      if (res.ok) {
        setSavedProfile(true)
        setTimeout(() => setSavedProfile(false), 2000)
      }
    } catch {
    } finally {
      setSavingProfile(false)
    }
  }

  const fetchContacts = useCallback(async () => {
    setContactLoading(true)
    try {
      const [phonesRes, emailsRes, addressesRes, socialRes] = await Promise.all([
        fetch(`/api/admin/crm/${userId}/phones`),
        fetch(`/api/admin/crm/${userId}/emails`),
        fetch(`/api/admin/crm/${userId}/addresses`),
        fetch(`/api/admin/crm/${userId}/social-links`),
      ])
      if (phonesRes.ok) { const d = await phonesRes.json(); setPhones(d.phones || []) }
      if (emailsRes.ok) { const d = await emailsRes.json(); setEmails(d.emails || []) }
      if (addressesRes.ok) { const d = await addressesRes.json(); setAddresses(d.addresses || []) }
      if (socialRes.ok) { const d = await socialRes.json(); setSocialLinks(d.socialLinks || []) }
    } catch {} finally { setContactLoading(false) }
  }, [userId])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  async function saveContact(type: string, method: 'POST' | 'PUT') {
    setSavingContact(true)
    try {
      const endpoint = type === 'social-links' ? 'social-links' : type
      const res = await fetch(`/api/admin/crm/${userId}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        setShowAddPhone(false)
        setShowAddEmail(false)
        setShowAddAddress(false)
        setShowAddSocial(false)
        setEditingContact(null)
        setContactForm({})
        fetchContacts()
      }
    } catch {} finally { setSavingContact(false) }
  }

  async function handleDeleteContact() {
    if (!deleteContact) return
    try {
      const endpoint = deleteContact.type === 'social-links' ? 'social-links' : deleteContact.type
      const res = await fetch(`/api/admin/crm/${userId}/${endpoint}?id=${deleteContact.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteContact(null)
        fetchContacts()
      }
    } catch {}
  }

  async function togglePrimary(type: string, id: string) {
    try {
      const endpoint = type === 'social-links' ? 'social-links' : type
      await fetch(`/api/admin/crm/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_primary: true }),
      })
      fetchContacts()
    } catch {}
  }

  async function handleImpersonate() {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        window.location.href = '/dashboard/social/overview'
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-crm-detail">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="p-[var(--section-spacing,1.5rem)] text-center" data-testid="error-user-not-found">
        <p className="text-muted-foreground mb-[var(--content-density-gap,1rem)]">User not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/crm')}>Back to CRM</Button>
      </div>
    )
  }

  const { user, transactions, activities, tickets, contracts, affiliateSummary } = data

  const timelineEvents: TimelineEvent[] = (activities || []).map((a: any) => ({
    id: a.id,
    type: a.action_type || a.type || 'default',
    title: a.title || a.action_type || 'Activity',
    description: a.description || a.details || '',
    timestamp: a.created_at,
  }))

  return (
    <div className="p-[var(--section-spacing,1.5rem)]" data-testid="page-crm-detail">
      <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)]">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/crm')} data-testid="button-back-crm" aria-label="Back to CRM">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-[var(--content-density-gap,1rem)] flex-1 min-w-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate" data-testid="text-user-name">{user.name}</h1>
            <p className="text-sm text-muted-foreground truncate" data-testid="text-user-email">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-1 ml-2">
            {user.types.map((type: string) => (
              <span key={type} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
                {type}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleImpersonate} data-testid="button-impersonate">
            <UserCog className="h-4 w-4 mr-1.5" />
            Impersonate
          </Button>
          <Button variant="outline" size="sm" asChild data-testid="button-email-user">
            <a href={`mailto:${user.email}`}>
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </a>
          </Button>
          {user.stripeCustomerId && (
            <Button variant="outline" size="sm" asChild data-testid="button-view-stripe">
              <a href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Stripe
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-[var(--content-density-gap,1rem)] items-center" data-testid="tags-container">
        {tags.map((t: any) => (
          <span key={t.tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[t.color] || TAG_COLORS.gray}`}>
            {t.tag}
            <button onClick={() => removeTag(t.tag)} className="hover:opacity-70" data-testid={`button-remove-tag-${t.tag}`} aria-label={`Remove tag ${t.tag}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {showTagInput ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Tag name"
              className="h-7 w-24 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              data-testid="input-new-tag"
            />
            <select
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="h-7 rounded border text-xs px-1 bg-background"
              data-testid="select-tag-color"
            >
              {TAG_COLOR_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Button size="icon" className="h-7 w-7" onClick={addTag} disabled={addingTag} data-testid="button-add-tag-confirm">
              {addingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowTagInput(false); setNewTag('') }} data-testid="button-cancel-tag" aria-label="Cancel">
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowTagInput(true)} data-testid="button-add-tag">
            <Tag className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)]">
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-total-revenue">
          <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-lg font-bold">{formatCurrency(user.totalRevenue)}</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-plan">
          <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
          <p className="text-lg font-bold capitalize">{user.plan}</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-health">
          <p className="text-xs text-muted-foreground mb-1">Health Score</p>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthDot(user.healthScore)}`} />
            <p className={`text-lg font-bold ${healthColor(user.healthScore)}`}>{user.healthScore}</p>
          </div>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-member-since">
          <p className="text-xs text-muted-foreground mb-1">Member Since</p>
          <p className="text-lg font-bold">{formatDate(user.created_at)}</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-last-login">
          <p className="text-xs text-muted-foreground mb-1">Days Since Login</p>
          <p className="text-lg font-bold">{user.daysSinceLogin > 900 ? 'Never' : user.daysSinceLogin}</p>
        </div>
      </div>

      {affiliateSummary && (
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] mb-[var(--content-density-gap,1rem)]" data-testid="card-affiliate-summary">
          <h3 className="text-sm font-medium mb-3">Affiliate Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-[var(--content-density-gap,1rem)] text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Referrals</p>
              <p className="font-bold">{affiliateSummary.referralCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Commissions</p>
              <p className="font-bold">{formatCurrency(affiliateSummary.totalCommissions)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Tier</p>
              <p className="font-bold capitalize">{affiliateSummary.currentTier}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
              <p className="font-bold">{affiliateSummary.conversionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Payouts</p>
              <p className="font-bold">{formatCurrency(affiliateSummary.totalPayouts)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-b mb-[var(--content-density-gap,1rem)]">
        <nav className="flex gap-0 overflow-x-auto" data-testid="nav-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'summary' && (
        <div data-testid="tab-content-summary">
          <Accordion type="multiple" defaultValue={['transactions', 'support', 'activity']} className="space-y-2">
            <AccordionItem value="transactions" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-transactions">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Revenue & Transactions</span>
                  <span className="text-xs text-muted-foreground ml-1">({transactions.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No transactions found</p>
                ) : (
                  <div className="overflow-hidden rounded-[var(--card-radius,0.75rem)] border">
                    <table className="w-full text-sm" data-testid="summary-table-transactions">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Type</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Description</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Amount</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Status</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 10).map((tx: any, i: number) => {
                          const txHref = tx._type === 'invoice' ? `/admin/revenue/${tx.id}` : null
                          return (
                            <tr key={`${tx._type}-${tx.id || i}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${TX_TYPE_COLORS[tx._type] || 'bg-muted text-muted-foreground'}`}>
                                  {tx._type}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {txHref ? (
                                  <Link href={txHref} className="text-primary hover:underline text-sm" data-testid={`link-tx-${i}`}>
                                    {tx._type === 'invoice' && `Invoice ${tx.stripe_invoice_id || tx.invoice_number || ''}`}
                                  </Link>
                                ) : (
                                  <span className="text-sm">
                                    {tx._type === 'payment' && `Payment ${tx.stripe_payment_intent_id || ''}`}
                                    {tx._type === 'commission' && 'Commission'}
                                    {tx._type === 'payout' && 'Payout'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-medium tabular-nums text-sm">{formatCurrency(tx._amount)}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[tx.status] || 'bg-muted text-muted-foreground'}`}>
                                  {tx.status || 'unknown'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground text-xs">{formatDate(tx._date)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {transactions.length > 10 && (
                      <div className="p-2 text-center border-t">
                        <button onClick={() => setActiveTab('transactions')} className="text-xs text-primary hover:underline" data-testid="link-view-all-transactions">
                          View all {transactions.length} transactions
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {affiliateSummary && (
              <AccordionItem value="affiliate" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
                <AccordionTrigger className="py-3" data-testid="accordion-affiliate">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Affiliate Activity</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--content-density-gap,1rem)] py-2">
                    <div className="rounded-[var(--card-radius,0.75rem)] border p-3 text-center">
                      <p className="text-lg font-bold tabular-nums">{affiliateSummary.referrals ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Referrals</p>
                    </div>
                    <div className="rounded-[var(--card-radius,0.75rem)] border p-3 text-center">
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(affiliateSummary.totalEarnings ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">Total Earnings</p>
                    </div>
                    <div className="rounded-[var(--card-radius,0.75rem)] border p-3 text-center">
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(affiliateSummary.pendingEarnings ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="rounded-[var(--card-radius,0.75rem)] border p-3 text-center">
                      <p className="text-lg font-bold tabular-nums">{affiliateSummary.tier ?? 'Standard'}</p>
                      <p className="text-xs text-muted-foreground">Tier</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="support" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-support">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Support Tickets</span>
                  <span className="text-xs text-muted-foreground ml-1">({tickets.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No support tickets</p>
                ) : (
                  <div className="space-y-2 py-1">
                    {tickets.slice(0, 5).map((ticket: any) => (
                      <Link
                        key={ticket.id}
                        href={`/admin/feedback/${ticket.id}`}
                        className="flex items-start justify-between gap-2 rounded-[var(--card-radius,0.75rem)] border p-3 hover:bg-muted/30 transition-colors"
                        data-testid={`link-ticket-${ticket.id}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary hover:underline truncate">{ticket.subject || ticket.title || 'Untitled Ticket'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ticket.created_at)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize shrink-0 ${STATUS_COLORS[ticket.status] || 'bg-muted text-muted-foreground'}`}>
                          {ticket.status}
                        </span>
                      </Link>
                    ))}
                    {tickets.length > 5 && (
                      <button onClick={() => setActiveTab('support')} className="text-xs text-primary hover:underline w-full text-center py-1" data-testid="link-view-all-tickets">
                        View all {tickets.length} tickets
                      </button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="activity" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-activity">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Activity Timeline</span>
                  <span className="text-xs text-muted-foreground ml-1">({timelineEvents.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Timeline events={timelineEvents.slice(0, 10)} emptyMessage="No activity recorded" />
                {timelineEvents.length > 10 && (
                  <button onClick={() => setActiveTab('activity')} className="text-xs text-primary hover:underline w-full text-center py-1 mt-2" data-testid="link-view-all-activity">
                    View all {timelineEvents.length} events
                  </button>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contracts" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-contracts">
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contracts</span>
                  <span className="text-xs text-muted-foreground ml-1">({contracts.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No contracts</p>
                ) : (
                  <div className="space-y-2 py-1">
                    {contracts.map((contract: any) => (
                      <div key={contract.id} className="flex items-start justify-between gap-2 rounded-[var(--card-radius,0.75rem)] border p-3" data-testid={`summary-contract-${contract.id}`}>
                        <div>
                          <p className="text-sm font-medium">{contract.title || 'Untitled Contract'}</p>
                          <div className="flex gap-[var(--content-density-gap,1rem)] mt-1 text-xs text-muted-foreground">
                            {contract.type && <span className="capitalize">{contract.type}</span>}
                            {contract.signed_at && <span>Signed: {formatDate(contract.signed_at)}</span>}
                            {contract.expires_at && <span>Expires: {formatDate(contract.expires_at)}</span>}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize shrink-0 ${STATUS_COLORS[contract.status] || 'bg-muted text-muted-foreground'}`}>
                          {contract.status || 'draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-notes">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Notes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <EntityNotes entityType="user" entityId={userId} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="phones" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-phones">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone Numbers</span>
                  <span className="text-xs text-muted-foreground ml-1">({phones.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {contactLoading ? (
                  <div className="flex justify-center py-[var(--card-padding,1.25rem)]"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  <div className="space-y-2 py-1">
                    {phones.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-[var(--card-radius,0.75rem)] border p-3" data-testid={`contact-phone-${p.id}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {p.is_primary && <Star className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))] shrink-0" />}
                          <span className="text-xs font-medium text-muted-foreground shrink-0">{p.label}</span>
                          <span className="text-sm truncate">{p.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!p.is_primary && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePrimary('phones', p.id)} data-testid={`button-primary-phone-${p.id}`} title="Set as primary">
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact({ type: 'phones', item: p }); setContactForm({ id: p.id, label: p.label, phone_number: p.phone_number, is_primary: p.is_primary }) }} data-testid={`button-edit-phone-${p.id}`}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteContact({ type: 'phones', id: p.id, label: p.phone_number })} data-testid={`button-delete-phone-${p.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {phones.length === 0 && !showAddPhone && (
                      <p className="text-sm text-muted-foreground py-2">No phone numbers</p>
                    )}
                    {(showAddPhone || editingContact?.type === 'phones') && (
                      <div className="rounded-[var(--card-radius,0.75rem)] border p-3 space-y-2" data-testid="form-add-phone">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Select value={contactForm.label || 'Mobile'} onValueChange={v => setContactForm(f => ({ ...f, label: v }))}>
                              <SelectTrigger data-testid="select-phone-label"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mobile">Mobile</SelectItem>
                                <SelectItem value="Home">Home</SelectItem>
                                <SelectItem value="Work">Work</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Phone Number</Label>
                            <Input value={contactForm.phone_number || ''} onChange={e => setContactForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+1 (555) 123-4567" data-testid="input-phone-number" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveContact('phones', editingContact?.type === 'phones' ? 'PUT' : 'POST')} disabled={savingContact} data-testid="button-save-phone">
                            {savingContact && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {editingContact?.type === 'phones' ? 'Update' : 'Add'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowAddPhone(false); setEditingContact(null); setContactForm({}) }} data-testid="button-cancel-phone">Cancel</Button>
                        </div>
                      </div>
                    )}
                    {!showAddPhone && editingContact?.type !== 'phones' && (
                      <Button size="sm" variant="outline" onClick={() => { setShowAddPhone(true); setContactForm({ label: 'Mobile' }) }} data-testid="button-add-phone">
                        <Plus className="h-3 w-3 mr-1" /> Add Phone
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="emails" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-emails">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email Addresses</span>
                  <span className="text-xs text-muted-foreground ml-1">({emails.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {contactLoading ? (
                  <div className="flex justify-center py-[var(--card-padding,1.25rem)]"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  <div className="space-y-2 py-1">
                    {emails.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between gap-2 rounded-[var(--card-radius,0.75rem)] border p-3" data-testid={`contact-email-${e.id}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {e.is_primary && <Star className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))] shrink-0" />}
                          <span className="text-xs font-medium text-muted-foreground shrink-0">{e.label}</span>
                          <span className="text-sm truncate">{e.email}</span>
                          {e.is_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">Verified</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!e.is_primary && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePrimary('emails', e.id)} data-testid={`button-primary-email-${e.id}`} title="Set as primary">
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact({ type: 'emails', item: e }); setContactForm({ id: e.id, label: e.label, email: e.email, is_primary: e.is_primary }) }} data-testid={`button-edit-email-${e.id}`}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteContact({ type: 'emails', id: e.id, label: e.email })} data-testid={`button-delete-email-${e.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {emails.length === 0 && !showAddEmail && (
                      <p className="text-sm text-muted-foreground py-2">No additional email addresses</p>
                    )}
                    {(showAddEmail || editingContact?.type === 'emails') && (
                      <div className="rounded-[var(--card-radius,0.75rem)] border p-3 space-y-2" data-testid="form-add-email">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Select value={contactForm.label || 'Personal'} onValueChange={v => setContactForm(f => ({ ...f, label: v }))}>
                              <SelectTrigger data-testid="select-email-label"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Personal">Personal</SelectItem>
                                <SelectItem value="Work">Work</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Email</Label>
                            <Input type="email" value={contactForm.email || ''} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" data-testid="input-email-address" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveContact('emails', editingContact?.type === 'emails' ? 'PUT' : 'POST')} disabled={savingContact} data-testid="button-save-email">
                            {savingContact && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {editingContact?.type === 'emails' ? 'Update' : 'Add'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowAddEmail(false); setEditingContact(null); setContactForm({}) }} data-testid="button-cancel-email">Cancel</Button>
                        </div>
                      </div>
                    )}
                    {!showAddEmail && editingContact?.type !== 'emails' && (
                      <Button size="sm" variant="outline" onClick={() => { setShowAddEmail(true); setContactForm({ label: 'Personal' }) }} data-testid="button-add-email">
                        <Plus className="h-3 w-3 mr-1" /> Add Email
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="addresses" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-addresses">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Addresses</span>
                  <span className="text-xs text-muted-foreground ml-1">({addresses.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {contactLoading ? (
                  <div className="flex justify-center py-[var(--card-padding,1.25rem)]"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  <div className="space-y-2 py-1">
                    {addresses.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between gap-2 rounded-[var(--card-radius,0.75rem)] border p-3" data-testid={`contact-address-${a.id}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {a.is_primary && <Star className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))] shrink-0" />}
                          <span className="text-xs font-medium text-muted-foreground shrink-0">{a.label}</span>
                          <span className="text-sm truncate">{[a.street, a.city, a.state, a.zip, a.country].filter(Boolean).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!a.is_primary && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePrimary('addresses', a.id)} data-testid={`button-primary-address-${a.id}`} title="Set as primary">
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact({ type: 'addresses', item: a }); setContactForm({ id: a.id, label: a.label, street: a.street, city: a.city, state: a.state, zip: a.zip, country: a.country, is_primary: a.is_primary }) }} data-testid={`button-edit-address-${a.id}`}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteContact({ type: 'addresses', id: a.id, label: a.label })} data-testid={`button-delete-address-${a.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {addresses.length === 0 && !showAddAddress && (
                      <p className="text-sm text-muted-foreground py-2">No addresses</p>
                    )}
                    {(showAddAddress || editingContact?.type === 'addresses') && (
                      <div className="rounded-[var(--card-radius,0.75rem)] border p-3 space-y-2" data-testid="form-add-address">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Select value={contactForm.label || 'Home'} onValueChange={v => setContactForm(f => ({ ...f, label: v }))}>
                            <SelectTrigger data-testid="select-address-label"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Shipping">Shipping</SelectItem>
                              <SelectItem value="Billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Street</Label>
                          <Input value={contactForm.street || ''} onChange={e => setContactForm(f => ({ ...f, street: e.target.value }))} placeholder="123 Main St" data-testid="input-address-street" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">City</Label>
                            <Input value={contactForm.city || ''} onChange={e => setContactForm(f => ({ ...f, city: e.target.value }))} data-testid="input-address-city" />
                          </div>
                          <div>
                            <Label className="text-xs">State</Label>
                            <Input value={contactForm.state || ''} onChange={e => setContactForm(f => ({ ...f, state: e.target.value }))} data-testid="input-address-state" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">ZIP</Label>
                            <Input value={contactForm.zip || ''} onChange={e => setContactForm(f => ({ ...f, zip: e.target.value }))} data-testid="input-address-zip" />
                          </div>
                          <div>
                            <Label className="text-xs">Country</Label>
                            <Input value={contactForm.country || 'US'} onChange={e => setContactForm(f => ({ ...f, country: e.target.value }))} data-testid="input-address-country" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveContact('addresses', editingContact?.type === 'addresses' ? 'PUT' : 'POST')} disabled={savingContact} data-testid="button-save-address">
                            {savingContact && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {editingContact?.type === 'addresses' ? 'Update' : 'Add'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowAddAddress(false); setEditingContact(null); setContactForm({}) }} data-testid="button-cancel-address">Cancel</Button>
                        </div>
                      </div>
                    )}
                    {!showAddAddress && editingContact?.type !== 'addresses' && (
                      <Button size="sm" variant="outline" onClick={() => { setShowAddAddress(true); setContactForm({ label: 'Home', country: 'US' }) }} data-testid="button-add-address">
                        <Plus className="h-3 w-3 mr-1" /> Add Address
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="social-links" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] px-[var(--card-padding,1.25rem)]">
              <AccordionTrigger className="py-3" data-testid="accordion-social-links">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Social Links</span>
                  <span className="text-xs text-muted-foreground ml-1">({socialLinks.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {contactLoading ? (
                  <div className="flex justify-center py-[var(--card-padding,1.25rem)]"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  <div className="space-y-2 py-1">
                    {socialLinks.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-[var(--card-radius,0.75rem)] border p-3" data-testid={`contact-social-${s.id}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground shrink-0 capitalize">{s.platform}</span>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{s.url}</a>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact({ type: 'social-links', item: s }); setContactForm({ id: s.id, platform: s.platform, url: s.url }) }} data-testid={`button-edit-social-${s.id}`}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteContact({ type: 'social-links', id: s.id, label: s.platform })} data-testid={`button-delete-social-${s.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {socialLinks.length === 0 && !showAddSocial && (
                      <p className="text-sm text-muted-foreground py-2">No social links</p>
                    )}
                    {(showAddSocial || editingContact?.type === 'social-links') && (
                      <div className="rounded-[var(--card-radius,0.75rem)] border p-3 space-y-2" data-testid="form-add-social">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Platform</Label>
                            <Select value={contactForm.platform || 'twitter'} onValueChange={v => setContactForm(f => ({ ...f, platform: v }))}>
                              <SelectTrigger data-testid="select-social-platform"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="twitter">Twitter / X</SelectItem>
                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
                                <SelectItem value="tiktok">TikTok</SelectItem>
                                <SelectItem value="github">GitHub</SelectItem>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">URL</Label>
                            <Input value={contactForm.url || ''} onChange={e => setContactForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." data-testid="input-social-url" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveContact('social-links', editingContact?.type === 'social-links' ? 'PUT' : 'POST')} disabled={savingContact} data-testid="button-save-social">
                            {savingContact && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            {editingContact?.type === 'social-links' ? 'Update' : 'Add'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowAddSocial(false); setEditingContact(null); setContactForm({}) }} data-testid="button-cancel-social">Cancel</Button>
                        </div>
                      </div>
                    )}
                    {!showAddSocial && editingContact?.type !== 'social-links' && (
                      <Button size="sm" variant="outline" onClick={() => { setShowAddSocial(true); setContactForm({ platform: 'twitter' }) }} data-testid="button-add-social">
                        <Plus className="h-3 w-3 mr-1" /> Add Social Link
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-[var(--content-density-gap,1rem)]" data-testid="tab-content-profile">
          <div className="grid grid-cols-2 gap-[var(--content-density-gap,1rem)]">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name</label>
              <Input
                value={profileForm.first_name || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name</label>
              <Input
                value={profileForm.last_name || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                data-testid="input-last-name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[var(--content-density-gap,1rem)]">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
              <Input
                value={profileForm.display_name || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                data-testid="input-display-name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <Input
                value={profileForm.phone || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="input-phone"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[var(--content-density-gap,1rem)]">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
              <Input
                value={profileForm.company || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                data-testid="input-company"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title</label>
              <Input
                value={profileForm.job_title || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, job_title: e.target.value }))}
                data-testid="input-job-title"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
            <Input
              value={profileForm.website || ''}
              onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
              data-testid="input-website"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
            <Textarea
              value={profileForm.bio || ''}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              className="min-h-[80px] resize-none"
              data-testid="input-bio"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Timezone</label>
            <Input
              value={profileForm.timezone || ''}
              onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
              data-testid="input-timezone"
            />
          </div>
          <div className="grid grid-cols-2 gap-[var(--content-density-gap,1rem)]">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
              <Input
                value={profileForm.address_line1 || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, address_line1: e.target.value }))}
                data-testid="input-address"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
              <Input
                value={profileForm.city || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                data-testid="input-city"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[var(--content-density-gap,1rem)]">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
              <Input
                value={profileForm.state || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                data-testid="input-state"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Postal Code</label>
              <Input
                value={profileForm.postal_code || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, postal_code: e.target.value }))}
                data-testid="input-postal-code"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
              <Input
                value={profileForm.country || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                data-testid="input-country"
              />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={savingProfile} data-testid="button-save-profile">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {savedProfile ? 'Saved!' : 'Save Profile'}
          </Button>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div data-testid="tab-content-transactions">
          {transactions.length === 0 ? (
            <div className="text-center py-[var(--section-spacing,3.5rem)] text-muted-foreground" data-testid="empty-transactions">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] overflow-hidden">
              <table className="w-full text-sm" data-testid="table-transactions">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any, i: number) => (
                    <tr key={`${tx._type}-${tx.id || i}`} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-tx-${i}`}>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${TX_TYPE_COLORS[tx._type] || 'bg-muted text-muted-foreground'}`}>
                          {tx._type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {tx._type === 'invoice' && `Invoice ${tx.stripe_invoice_id || tx.invoice_number || ''}`}
                        {tx._type === 'payment' && `Payment ${tx.stripe_payment_intent_id || ''}`}
                        {tx._type === 'commission' && `Commission`}
                        {tx._type === 'payout' && `Payout`}
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums">{formatCurrency(tx._amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[tx.status] || 'bg-muted text-muted-foreground'}`}>
                          {tx.status || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(tx._date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div data-testid="tab-content-activity">
          <Timeline events={timelineEvents} emptyMessage="No activity recorded for this user" />
        </div>
      )}

      {activeTab === 'support' && (
        <div data-testid="tab-content-support">
          {tickets.length === 0 ? (
            <div className="text-center py-[var(--section-spacing,3.5rem)] text-muted-foreground" data-testid="empty-tickets">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No support tickets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket: any) => (
                <div key={ticket.id} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid={`ticket-${ticket.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground">{ticket.subject || ticket.title || 'Untitled Ticket'}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.description || ticket.body || ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.priority && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                          ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                          ticket.priority === 'medium' ? 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {ticket.priority}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[ticket.status] || 'bg-muted text-muted-foreground'}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(ticket.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div data-testid="tab-content-notes">
          <EntityNotes entityType="user" entityId={userId} />
        </div>
      )}

      {activeTab === 'contracts' && (
        <div data-testid="tab-content-contracts">
          {contracts.length === 0 ? (
            <div className="text-center py-[var(--section-spacing,3.5rem)] text-muted-foreground" data-testid="empty-contracts">
              <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No contracts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract: any) => (
                <div key={contract.id} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid={`contract-${contract.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground">{contract.title || 'Untitled Contract'}</h4>
                      {contract.type && <p className="text-xs text-muted-foreground mt-0.5 capitalize">{contract.type}</p>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[contract.status] || 'bg-muted text-muted-foreground'}`}>
                      {contract.status || 'draft'}
                    </span>
                  </div>
                  <div className="flex gap-[var(--content-density-gap,1rem)] mt-2 text-xs text-muted-foreground">
                    {contract.signed_at && <span>Signed: {formatDate(contract.signed_at)}</span>}
                    {contract.expires_at && <span>Expires: {formatDate(contract.expires_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteContact}
        onOpenChange={(open) => { if (!open) setDeleteContact(null) }}
        title="Delete Contact Record"
        description={`Delete "${deleteContact?.label || ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteContact}
      />
    </div>
  )
}
