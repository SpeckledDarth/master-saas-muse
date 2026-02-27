'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Download, ChevronLeft, ChevronRight, CreditCard, AlertTriangle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 dark:text-green-400',
  trialing: 'bg-primary/10 text-primary',
  canceled: 'bg-muted text-muted-foreground',
  past_due: 'bg-destructive/10 text-destructive',
  incomplete: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface SubRow {
  id: string
  user_id: string
  user_name: string
  user_email: string
  product_name: string
  tier: string
  status: string
  amount_cents: number
  renewal_date: string | null
  cancel_at_period_end: boolean
  churn_risk: boolean
  created_at: string
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subs, setSubs] = useState<SubRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState({ totalActive: 0, mrr: 0, churnRiskCount: 0, tierBreakdown: {} as Record<string, { count: number; mrr: number }> })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [churnRisk, setChurnRisk] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (churnRisk) params.set('churnRisk', 'true')
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', '25')

      const res = await fetch(`/api/admin/subscriptions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubs(data.subscriptions || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setSummary(data.summary || { totalActive: 0, mrr: 0, churnRiskCount: 0, tierBreakdown: {} })
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, churnRisk, sort, page])

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300)
    return () => clearTimeout(debounce)
  }, [fetchData])

  async function exportCSV() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (churnRisk) params.set('churnRisk', 'true')
      params.set('sort', sort)
      params.set('page', '1')
      params.set('limit', '10000')

      const res = await fetch(`/api/admin/subscriptions?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const rows = data.subscriptions || []

      const headers = ['Person', 'Email', 'Product', 'Tier', 'Status', 'Amount', 'Renewal Date', 'Churn Risk']
      const csvRows = rows.map((s: SubRow) => [
        `"${s.user_name}"`,
        s.user_email,
        `"${s.product_name}"`,
        s.tier,
        s.status,
        formatCurrency(s.amount_cents),
        s.renewal_date || '',
        s.churn_risk ? 'Yes' : 'No',
      ])

      const csv = [headers.join(','), ...csvRows.map((r: string[]) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const startIdx = (page - 1) * 25 + 1
  const endIdx = Math.min(page * 25, total)

  return (
    <div className="p-[var(--section-spacing,1.5rem)]" data-testid="page-subscriptions">
      <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-subscriptions-title">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manage all active and past subscriptions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)]">
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-total-active">
          <p className="text-xs text-muted-foreground mb-1">Total Active</p>
          <p className="text-lg font-bold">{summary.totalActive}</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-mrr">
          <p className="text-xs text-muted-foreground mb-1">Monthly Recurring Revenue</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.mrr)}</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-churn-risk">
          <p className="text-xs text-muted-foreground mb-1">Churn Risk</p>
          <p className={`text-lg font-bold ${summary.churnRiskCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
            {summary.churnRiskCount}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)]">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={churnRisk ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setChurnRisk(!churnRisk); setPage(1) }}
          data-testid="button-churn-filter"
        >
          <AlertTriangle className="h-4 w-4 mr-1.5" />
          Churn Risk
        </Button>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]" data-testid="select-sort">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="amount">Highest Amount</SelectItem>
            <SelectItem value="renewal">Renewal Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground mb-2" data-testid="text-record-count">
        {total > 0 ? `Showing ${startIdx}-${endIdx} of ${total} subscriptions` : 'No subscriptions found'}
      </div>

      <div className="rounded-[var(--card-radius,0.75rem)] border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-subscriptions">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Person</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tier</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount/mo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Renewal</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Risk</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No subscriptions match your filters</p>
                  </td>
                </tr>
              ) : (
                subs.map(sub => (
                  <tr
                    key={sub.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/subscriptions/${sub.id}`)}
                    data-testid={`row-sub-${sub.id}`}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/crm/${sub.user_id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`link-person-${sub.id}`}
                      >
                        <span className="font-medium text-foreground">{sub.user_name}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{sub.user_email}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-foreground truncate max-w-[150px]">{sub.product_name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground capitalize">
                        {sub.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[sub.status] || 'bg-muted text-muted-foreground'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">{formatCurrency(sub.amount_cents)}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(sub.renewal_date)}</td>
                    <td className="py-3 px-4 text-center">
                      {sub.churn_risk && (
                        <AlertTriangle className="h-4 w-4 text-destructive mx-auto" data-testid={`icon-churn-risk-${sub.id}`} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground" data-testid="text-page-info">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
