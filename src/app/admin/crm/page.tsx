'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Download, ChevronLeft, ChevronRight, Users } from 'lucide-react'

interface Contact {
  id: string
  email: string
  name: string
  avatar_url: string | null
  types: string[]
  plan: string
  total_revenue: number
  status: 'active' | 'inactive'
  last_active: string | null
  health_score: number
  tags: { tag: string; color: string }[]
  member_since: string
}

const TYPE_COLORS: Record<string, string> = {
  Subscriber: 'bg-primary/10 text-primary',
  Affiliate: 'bg-green-500/10 text-green-600 dark:text-green-400',
  Team: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

const TAG_COLORS: Record<string, string> = {
  gray: 'bg-muted text-muted-foreground',
  blue: 'bg-primary/10 text-primary',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  red: 'bg-destructive/10 text-destructive',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function healthColor(score: number) {
  if (score >= 60) return 'text-green-600 dark:text-green-400'
  if (score >= 30) return 'text-amber-600 dark:text-amber-400'
  return 'text-destructive'
}

function healthDot(score: number) {
  if (score >= 60) return 'bg-green-500'
  if (score >= 30) return 'bg-amber-500'
  return 'bg-destructive'
}

export default function CRMPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (planFilter && planFilter !== 'all') params.set('plan', planFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', '25')

      const res = await fetch(`/api/admin/crm?${params}`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, planFilter, statusFilter, sort, page])

  useEffect(() => {
    const debounce = setTimeout(fetchContacts, 300)
    return () => clearTimeout(debounce)
  }, [fetchContacts])

  async function exportCSV() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (planFilter && planFilter !== 'all') params.set('plan', planFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('sort', sort)
      params.set('page', '1')
      params.set('limit', '10000')

      const res = await fetch(`/api/admin/crm?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const rows = data.contacts || []

      const headers = ['Name', 'Email', 'Types', 'Plan', 'Total Revenue', 'Status', 'Last Active', 'Health Score', 'Tags', 'Member Since']
      const csvRows = rows.map((c: Contact) => [
        `"${c.name}"`,
        c.email,
        `"${c.types.join(', ')}"`,
        c.plan,
        formatCurrency(c.total_revenue),
        c.status,
        c.last_active || 'Never',
        c.health_score,
        `"${c.tags.map(t => t.tag).join(', ')}"`,
        new Date(c.member_since).toISOString().split('T')[0],
      ])

      const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crm-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const startIdx = (page - 1) * 25 + 1
  const endIdx = Math.min(page * 25, total)

  return (
    <div className="p-6" data-testid="page-crm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-crm-title">CRM</h1>
          <p className="text-sm text-muted-foreground">Manage all contacts and customers</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
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
            <SelectItem value="subscriber">Subscriber</SelectItem>
            <SelectItem value="affiliate">Affiliate</SelectItem>
            <SelectItem value="team">Team</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]" data-testid="select-sort">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="revenue">Highest Revenue</SelectItem>
            <SelectItem value="health">Health Score</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground mb-2" data-testid="text-record-count">
        {total > 0 ? `Showing ${startIdx}-${endIdx} of ${total} contacts` : 'No contacts found'}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-crm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plan</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Active</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Health</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tags</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No contacts match your filters</p>
                  </td>
                </tr>
              ) : (
                contacts.map(contact => (
                  <tr
                    key={contact.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/crm/${contact.id}`)}
                    data-testid={`row-contact-${contact.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {contact.avatar_url ? (
                          <img
                            src={contact.avatar_url}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-foreground truncate max-w-[150px]" data-testid={`text-name-${contact.id}`}>
                          {contact.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground truncate max-w-[180px]">{contact.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.types.map(type => (
                          <span
                            key={type}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground capitalize">
                        {contact.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">{formatCurrency(contact.total_revenue)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${contact.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatRelativeTime(contact.last_active)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`inline-block h-2 w-2 rounded-full ${healthDot(contact.health_score)}`} />
                        <span className={`text-xs font-medium ${healthColor(contact.health_score)}`}>
                          {contact.health_score}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map(t => (
                          <span
                            key={t.tag}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${TAG_COLORS[t.color] || TAG_COLORS.gray}`}
                          >
                            {t.tag}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{contact.tags.length - 3}</span>
                        )}
                      </div>
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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground" data-testid="text-page-info">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            data-testid="button-next-page"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
