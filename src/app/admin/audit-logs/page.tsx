'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2 } from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string
  action: string
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

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '-'
  const entries = Object.entries(details)
  if (entries.length === 0) return '-'
  return entries
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ')
      if (typeof value === 'object' && value !== null) {
        return `${label}: ${JSON.stringify(value)}`
      }
      return `${label}: ${value}`
    })
    .join(', ')
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (actionFilter && actionFilter !== 'all') {
        params.set('action', actionFilter)
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
  }, [page, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [actionFilter])

  return (
    <div className="py-8 px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-audit-logs-title">Audit Logs</h1>
          <p className="text-muted-foreground" data-testid="text-audit-logs-description">Track administrative actions and changes</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle>Activity Log</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-action-filter">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="settings_updated">Settings Updated</SelectItem>
                    <SelectItem value="user_impersonation_started">Impersonation Started</SelectItem>
                    <SelectItem value="user_impersonation_ended">Impersonation Ended</SelectItem>
                    <SelectItem value="user_role_changed">Role Changed</SelectItem>
                    <SelectItem value="user_invited">User Invited</SelectItem>
                    <SelectItem value="user_removed">User Removed</SelectItem>
                  </SelectContent>
                </Select>
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
                        <TableCell data-testid={`text-action-${log.id}`}>
                          <Badge variant="secondary">{log.action.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" data-testid={`text-details-${log.id}`}>
                          {formatDetails(log.details as Record<string, unknown> | null)}
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
