'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, RefreshCw } from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  details: Record<string, unknown> | null
  created_at: string
  userEmail: string
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  page: number
  totalPages: number
}

function formatAction(action: string): string {
  return action
    .replace(/^affiliate_\w+_/, '')
    .replace(/_/g, ' ')
}

function formatDetails(log: AuditLog): string {
  const meta = log.metadata || log.details
  if (!meta) return '-'
  const parts: string[] = []
  if (meta.entity_name) parts.push(String(meta.entity_name))
  if (meta.admin_email) parts.push(`by ${meta.admin_email}`)
  if (meta.details && typeof meta.details === 'object') {
    const d = meta.details as Record<string, unknown>
    const keys = Object.keys(d).slice(0, 3)
    keys.forEach(k => {
      const v = d[k]
      if (typeof v === 'string' || typeof v === 'number') parts.push(`${k.replace(/_/g, ' ')}: ${v}`)
    })
  }
  if (parts.length === 0) {
    const entries = Object.entries(meta).filter(([k]) => k !== 'details' && k !== 'admin_email' && k !== 'entity_name')
    entries.slice(0, 3).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ')
      if (typeof value === 'object' && value !== null) return
      parts.push(`${label}: ${value}`)
    })
  }
  return parts.join(' · ') || '-'
}

function getCategoryLabel(action: string): string | null {
  if (action.startsWith('affiliate_')) return 'Affiliate'
  if (action.startsWith('user_')) return 'Users'
  if (action.startsWith('settings_')) return 'Settings'
  return null
}

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.includes('delete') || action.includes('remove') || action.includes('reject')) return 'destructive'
  if (action.includes('create') || action.includes('approve') || action.includes('invite')) return 'default'
  if (action.includes('update') || action.includes('change')) return 'secondary'
  return 'outline'
}

export default function AuditLogsPage() {
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) {
      setCategoryFilter(cat)
      setActionFilter('all')
    }
  }, [searchParams])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (actionFilter && actionFilter !== 'all') {
        params.set('action', actionFilter)
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.set('category', categoryFilter)
      }
      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data: AuditLogsResponse = await response.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, categoryFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [actionFilter, categoryFilter])

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setActionFilter('all')
  }

  return (
    <div className="py-8 px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-audit-logs-title">Audit Logs</h1>
          <p className="text-muted-foreground" data-testid="text-audit-logs-description">Track all administrative actions and changes across the platform</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle>Activity Log</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
                {categoryFilter === 'all' && (
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-action-filter">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="settings_updated">Settings Updated</SelectItem>
                      <SelectItem value="user_impersonation_started">Impersonation Started</SelectItem>
                      <SelectItem value="user_impersonation_ended">Impersonation Ended</SelectItem>
                      <SelectItem value="user_role_changed">Role Changed</SelectItem>
                      <SelectItem value="user_invited">User Invited</SelectItem>
                      <SelectItem value="user_removed">User Removed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading} data-testid="button-refresh-audit">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12" data-testid="loading-audit-logs">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-audit-logs">
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <>
                <Table data-testid="table-audit-logs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log.id} data-testid={`row-audit-log-${log.id}`}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap" data-testid={`text-time-${log.id}`}>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-user-${log.id}`}>
                          {log.userEmail}
                        </TableCell>
                        <TableCell data-testid={`text-category-${log.id}`}>
                          {getCategoryLabel(log.action) && (
                            <Badge variant="outline" className="text-xs">{getCategoryLabel(log.action)}</Badge>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-action-${log.id}`}>
                          <Badge variant={getActionBadgeVariant(log.action)} className="capitalize">
                            {formatAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[400px] truncate" data-testid={`text-details-${log.id}`}>
                          {formatDetails(log)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between gap-2 mt-4">
                  <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      data-testid="button-previous-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
