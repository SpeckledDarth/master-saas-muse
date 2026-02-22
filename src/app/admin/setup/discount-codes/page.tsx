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
import {
  Loader2, Plus, Trash2, Pencil, Copy, Check, Tag,
  Percent, DollarSign, TicketPercent, Pause, Play, Archive,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DiscountCode {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  duration: string
  duration_months: number | null
  max_uses: number | null
  max_uses_per_user: number
  min_plan: string | null
  stackable: boolean
  expires_at: string | null
  affiliate_user_id: string | null
  stripe_coupon_id: string | null
  stripe_promotion_code_id: string | null
  status: string
  total_uses: number
  total_discount_cents: number
  created_at: string
  updated_at: string
}

interface Stats {
  totalCodes: number
  activeCodes: number
  totalRedemptions: number
  totalDiscountGiven: number
}

const STATUS_BADGES: Record<string, string> = {
  active: 'default',
  paused: 'secondary',
  expired: 'outline',
  archived: 'destructive',
}

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  duration: 'once',
  duration_months: 3,
  max_uses: '',
  max_uses_per_user: 1,
  min_plan: '',
  stackable: false,
  expires_at: '',
  affiliate_user_id: '',
}

export default function DiscountCodesPage() {
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [stats, setStats] = useState<Stats>({ totalCodes: 0, activeCodes: 0, totalRedemptions: 0, totalDiscountGiven: 0 })
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountCode | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/discount-codes?${params}`)
      const data = await res.json()

      setCodes(data.codes || [])
      if (data.stats) setStats(data.stats)
    } catch (err) {
      console.error('Failed to load discount codes:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount_value) {
      toast({ title: 'Missing fields', description: 'Code and discount value are required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, any> = {
        code: form.code,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        duration: form.duration,
        duration_months: form.duration === 'repeating' ? form.duration_months : null,
        max_uses: form.max_uses ? parseInt(form.max_uses as string) : null,
        max_uses_per_user: form.max_uses_per_user,
        min_plan: form.min_plan || null,
        stackable: form.stackable,
        expires_at: form.expires_at || null,
        affiliate_user_id: form.affiliate_user_id || null,
      }

      if (editing) {
        payload.id = editing.id
        const res = await fetch('/api/admin/discount-codes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update')
        }
        toast({ title: 'Code updated' })
      } else {
        const res = await fetch('/api/admin/discount-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create')
        }
        toast({ title: 'Discount code created' })
      }

      setDialogOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (code: DiscountCode, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/discount-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: `Code ${newStatus}` })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/discount-codes?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Code archived' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to archive code', variant: 'destructive' })
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const openEdit = (code: DiscountCode) => {
    setEditing(code)
    setForm({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      duration: code.duration,
      duration_months: code.duration_months || 3,
      max_uses: code.max_uses?.toString() || '',
      max_uses_per_user: code.max_uses_per_user,
      min_plan: code.min_plan || '',
      stackable: code.stackable,
      expires_at: code.expires_at ? code.expires_at.split('T')[0] : '',
      affiliate_user_id: code.affiliate_user_id || '',
    })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-discount-codes">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="page-discount-codes">
      <div>
        <h2 className="text-xl font-semibold" data-testid="text-discount-codes-title">Discount Codes</h2>
        <p className="text-sm text-muted-foreground">Create and manage promotional discount codes for your checkout.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card data-testid="stat-total-codes">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Codes</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalCodes}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-active-codes">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TicketPercent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeCodes}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-redemptions">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Redemptions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalRedemptions}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-discount">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Discount Given</span>
            </div>
            <p className="text-2xl font-bold mt-1">${(stats.totalDiscountGiven / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-discount-codes">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <CardTitle className="text-base">Codes</CardTitle>
              <CardDescription>Manage your discount and promotional codes</CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Input
                placeholder="Search codes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-40 h-8 text-sm"
                data-testid="input-search-codes"
              />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-28 h-8" data-testid="select-code-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) { setEditing(null); setForm(EMPTY_FORM) }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-4" data-testid="button-add-code">
                <Plus className="h-4 w-4 mr-1" /> New Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-code-form">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Discount Code' : 'Create Discount Code'}</DialogTitle>
                <DialogDescription>
                  {editing ? 'Update this discount code.' : 'Create a new promotional code for your checkout.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., LAUNCH20"
                    disabled={!!editing}
                    data-testid="input-code"
                  />
                </div>
                <div>
                  <Label>Description (internal)</Label>
                  <Input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g., Launch promotion 20% off"
                    data-testid="input-code-description"
                  />
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label>Discount Type</Label>
                    <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                      <SelectTrigger data-testid="select-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{form.discount_type === 'percentage' ? 'Percentage' : 'Amount (cents)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      max={form.discount_type === 'percentage' ? 100 : undefined}
                      value={form.discount_value}
                      onChange={e => setForm(f => ({ ...f, discount_value: parseInt(e.target.value) || 0 }))}
                      data-testid="input-discount-value"
                    />
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label>Duration</Label>
                    <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">First payment only</SelectItem>
                        <SelectItem value="repeating">Repeating (X months)</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.duration === 'repeating' && (
                    <div>
                      <Label>Duration (months)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="36"
                        value={form.duration_months}
                        onChange={e => setForm(f => ({ ...f, duration_months: parseInt(e.target.value) || 3 }))}
                        data-testid="input-duration-months"
                      />
                    </div>
                  )}
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label>Max Total Uses</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.max_uses}
                      onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                      placeholder="Unlimited"
                      data-testid="input-max-uses"
                    />
                  </div>
                  <div>
                    <Label>Max Uses Per User</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.max_uses_per_user}
                      onChange={e => setForm(f => ({ ...f, max_uses_per_user: parseInt(e.target.value) || 1 }))}
                      data-testid="input-max-per-user"
                    />
                  </div>
                </div>
                <div>
                  <Label>Expires At</Label>
                  <Input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    data-testid="input-expires-at"
                  />
                </div>
                <div>
                  <Label>Affiliate User ID (optional — for dual-attribution)</Label>
                  <Input
                    value={form.affiliate_user_id}
                    onChange={e => setForm(f => ({ ...f, affiliate_user_id: e.target.value }))}
                    placeholder="UUID of affiliate user"
                    data-testid="input-affiliate-id"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link this code to an affiliate for commission attribution when no referral cookie exists.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stackable</Label>
                    <p className="text-xs text-muted-foreground">Can combine with other codes</p>
                  </div>
                  <Switch
                    checked={form.stackable}
                    onCheckedChange={v => setForm(f => ({ ...f, stackable: v }))}
                    data-testid="switch-stackable"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" data-testid="button-save-code">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editing ? 'Update Code' : 'Create Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-codes">
              No discount codes yet. Create your first one above.
            </p>
          ) : (
            <div className="space-y-2">
              {codes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-3 rounded-md border" data-testid={`code-${code.id}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">{code.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopy(code.code)}
                        data-testid={`button-copy-${code.id}`}
                      >
                        {copied === code.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <Badge variant={STATUS_BADGES[code.status] as any || 'outline'} className="text-xs capitalize">
                      {code.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {code.discount_type === 'percentage'
                        ? `${code.discount_value}% off`
                        : `$${(code.discount_value / 100).toFixed(2)} off`
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {code.total_uses}{code.max_uses ? `/${code.max_uses}` : ''} uses
                    </span>
                    {code.affiliate_user_id && (
                      <Badge variant="outline" className="text-xs">
                        Affiliate-linked
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {code.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(code, 'paused')} title="Pause" data-testid={`button-pause-${code.id}`}>
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {code.status === 'paused' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(code, 'active')} title="Activate" data-testid={`button-activate-${code.id}`}>
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(code)} data-testid={`button-edit-${code.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(code.id)} data-testid={`button-archive-${code.id}`}>
                      <Archive className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
