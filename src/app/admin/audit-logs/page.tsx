'use client'

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, RefreshCw } from 'lucide-react'
import { AdminDataTable, ColumnDef } from '@/components/admin/data-table'
import { TableToolbar, FilterDef } from '@/components/admin/table-toolbar'
import { RelativeTime } from '@/lib/format-relative-time'

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

function AuditLogsContent() {
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

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

  const columns: ColumnDef<AuditLog>[] = useMemo(() => [
    {
      id: 'time',
      header: 'Time',
      accessorFn: (row) => (
        <RelativeTime date={row.created_at} className="text-sm text-muted-foreground whitespace-nowrap" />
      ),
    },
    {
      id: 'user',
      header: 'User',
      accessorFn: (row) => <span className="text-sm">{row.userEmail}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorFn: (row) => {
        const label = getCategoryLabel(row.action)
        return label ? <Badge variant="outline" className="text-xs">{label}</Badge> : null
      },
      hideOnMobile: true,
    },
    {
      id: 'action',
      header: 'Action',
      accessorFn: (row) => (
        <Badge variant={getActionBadgeVariant(row.action)} className="capitalize">
          {formatAction(row.action)}
        </Badge>
      ),
    },
    {
      id: 'details',
      header: 'Details',
      accessorFn: (row) => (
        <span className="text-sm text-muted-foreground max-w-[400px] truncate block">
          {formatDetails(row)}
        </span>
      ),
      hideOnMobile: true,
    },
  ], [])

  const filters: FilterDef[] = useMemo(() => {
    const result: FilterDef[] = [
      {
        id: 'category',
        label: 'Categories',
        options: [
          { label: 'Affiliate', value: 'affiliate' },
          { label: 'Users', value: 'user' },
          { label: 'Settings', value: 'settings' },
        ],
        value: categoryFilter,
        onChange: handleCategoryChange,
      },
    ]
    if (categoryFilter === 'all') {
      result.push({
        id: 'action',
        label: 'Actions',
        options: [
          { label: 'Settings Updated', value: 'settings_updated' },
          { label: 'Impersonation Started', value: 'user_impersonation_started' },
          { label: 'Impersonation Ended', value: 'user_impersonation_ended' },
          { label: 'Role Changed', value: 'user_role_changed' },
          { label: 'User Invited', value: 'user_invited' },
          { label: 'User Removed', value: 'user_removed' },
        ],
        value: actionFilter,
        onChange: setActionFilter,
      })
    }
    return result
  }, [categoryFilter, actionFilter, handleCategoryChange])

  const renderMetadataValue = (value: unknown, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>
    if (typeof value === 'boolean') return <Badge variant={value ? 'default' : 'outline'}>{value ? 'Yes' : 'No'}</Badge>
    if (typeof value === 'number') return <span>{value}</span>
    if (typeof value === 'string') return <span className="break-all">{value}</span>
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>)}
        </div>
      )
    }
    if (typeof value === 'object' && depth < 2) {
      return (
        <div className="space-y-1 pl-2 border-l">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="font-medium text-muted-foreground">{k.replace(/_/g, ' ')}:</span>{' '}
              {renderMetadataValue(v, depth + 1)}
            </div>
          ))}
        </div>
      )
    }
    return <span>{JSON.stringify(value)}</span>
  }

  return (
    <div className="py-[var(--section-spacing,1.5rem)] px-[var(--section-spacing,1.5rem)]">
      <div className="space-y-[var(--content-density-gap,1rem)]">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-audit-logs-title">Audit Logs</h1>
          <p className="text-muted-foreground" data-testid="text-audit-logs-description">Track all administrative actions and changes across the platform</p>
        </div>

        <TableToolbar
          filters={filters}
          actions={
            <Button
              variant="outline"
              size="icon"
              onClick={fetchLogs}
              disabled={loading}
              data-testid="button-refresh-audit"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          }
          data-testid="toolbar-audit-logs"
        />

        <AdminDataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No audit logs found"
          emptyDescription="No activity has been recorded yet."
          onRowClick={(log) => setSelectedLog(log)}
          getRowId={(log) => log.id}
          pageSize={50}
          data-testid="table-audit-logs"
        />

        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between gap-2">
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
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null) }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-audit-detail">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-[var(--content-density-gap,1rem)]">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="font-medium text-muted-foreground">Time</span>
                <RelativeTime date={selectedLog.created_at} />

                <span className="font-medium text-muted-foreground">User</span>
                <span>{selectedLog.userEmail}</span>

                <span className="font-medium text-muted-foreground">Category</span>
                <span>{getCategoryLabel(selectedLog.action) || 'General'}</span>

                <span className="font-medium text-muted-foreground">Action</span>
                <Badge variant={getActionBadgeVariant(selectedLog.action)} className="capitalize w-fit">
                  {formatAction(selectedLog.action)}
                </Badge>

                <span className="font-medium text-muted-foreground">Raw Action</span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded-[var(--badge-radius,0.25rem)] break-all">{selectedLog.action}</code>

                {selectedLog.target_type && (
                  <>
                    <span className="font-medium text-muted-foreground">Target Type</span>
                    <span>{selectedLog.target_type}</span>
                  </>
                )}

                {selectedLog.target_id && (
                  <>
                    <span className="font-medium text-muted-foreground">Target ID</span>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded-[var(--badge-radius,0.25rem)] break-all">{selectedLog.target_id}</code>
                  </>
                )}
              </div>

              {(selectedLog.metadata || selectedLog.details) && (
                <div className="border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Metadata</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries((selectedLog.metadata || selectedLog.details) as Record<string, unknown>).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-muted-foreground text-xs">{key.replace(/_/g, ' ')}</span>
                        <div className="mt-0.5">{renderMetadataValue(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AuditLogsPage() {
  return (
    <Suspense fallback={
      <div className="py-[var(--section-spacing,1.5rem)] px-[var(--section-spacing,1.5rem)]">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    }>
      <AuditLogsContent />
    </Suspense>
  )
}
