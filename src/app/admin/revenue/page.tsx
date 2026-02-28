'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Download, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react'
import { Sparkline } from '@/components/admin/sparkline'

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
  processing: 'bg-primary/10 text-primary',
  completed: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Transaction {
  id: string
  type: string
  description: string
  user_id: string
  user_name: string
  user_email: string
  amount_cents: number
  status: string
  date: string
}

export default function RevenuePage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState({ totalRevenue: 0, pendingCommissions: 0, outstandingPayouts: 0, dailyTrend: [] as number[] })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('date_desc')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', '25')

      const res = await fetch(`/api/admin/revenue?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setSummary(data.summary || { totalRevenue: 0, pendingCommissions: 0, outstandingPayouts: 0, dailyTrend: [] })
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, dateFrom, dateTo, sort, page])

  useEffect(() => {
    const debounce = setTimeout(fetchData, 300)
    return () => clearTimeout(debounce)
  }, [fetchData])

  async function exportCSV() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      params.set('sort', sort)
      params.set('page', '1')
      params.set('limit', '10000')

      const res = await fetch(`/api/admin/revenue?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const rows = data.transactions || []

      const headers = ['Type', 'Description', 'Person', 'Email', 'Amount', 'Status', 'Date']
      const csvRows = rows.map((t: Transaction) => [
        t.type,
        `"${t.description}"`,
        `"${t.user_name}"`,
        t.user_email,
        formatCurrency(t.amount_cents),
        t.status,
        formatDate(t.date),
      ])

      const csv = [headers.join(','), ...csvRows.map((r: string[]) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const startIdx = (page - 1) * 25 + 1
  const endIdx = Math.min(page * 25, total)

  return (
    <div className="p-[var(--section-spacing,1.5rem)]" data-testid="page-revenue">
      <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)]">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-revenue-title">Revenue</h1>
          <p className="text-sm text-muted-foreground">All financial transactions across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)]">
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-total-revenue">
          <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-[hsl(var(--success))]">{formatCurrency(summary.totalRevenue)}</p>
            {summary.dailyTrend.length >= 2 && (
              <Sparkline data={summary.dailyTrend} width={80} height={20} color="hsl(var(--success))" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">30-day trend</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-pending-commissions">
          <p className="text-xs text-muted-foreground mb-1">Pending Commissions</p>
          <p className="text-lg font-bold text-[hsl(var(--warning))]">{formatCurrency(summary.pendingCommissions)}</p>
        </div>
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-card p-[var(--card-padding,1.25rem)]" data-testid="card-outstanding-payouts">
          <p className="text-xs text-muted-foreground mb-1">Outstanding Payouts</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(summary.outstandingPayouts)}</p>
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
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
            <SelectItem value="payout">Payout</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]" data-testid="select-sort">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="amount_desc">Highest Amount</SelectItem>
            <SelectItem value="amount_asc">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="w-[150px]"
          data-testid="input-date-from"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="w-[150px]"
          data-testid="input-date-to"
        />
      </div>

      <div className="text-xs text-muted-foreground mb-2" data-testid="text-record-count">
        {total > 0 ? `Showing ${startIdx}-${endIdx} of ${total} transactions` : 'No transactions found'}
      </div>

      <div className="rounded-[var(--card-radius,0.75rem)] border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-revenue">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Person</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions match your filters</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, i) => (
                  <tr
                    key={`${tx.type}-${tx.id}`}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/revenue/${tx.id}`)}
                    data-testid={`row-tx-${tx.id}`}
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${TX_TYPE_COLORS[tx.type] || 'bg-muted text-muted-foreground'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground truncate max-w-[200px]">{tx.description}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/crm/${tx.user_id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`link-person-${tx.id}`}
                      >
                        <span className="font-medium text-foreground">{tx.user_name}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{tx.user_email}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">{formatCurrency(tx.amount_cents)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[tx.status] || 'bg-muted text-muted-foreground'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(tx.date)}</td>
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
