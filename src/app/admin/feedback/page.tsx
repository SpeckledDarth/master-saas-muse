'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Trash2, Loader2 } from 'lucide-react'
import { AdminDataTable, type ColumnDef } from '@/components/admin/data-table'
import { TableToolbar, type FilterDef } from '@/components/admin/table-toolbar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/format-relative-time'

interface Feedback {
  id: number
  message: string
  email: string
  page_url: string
  status: 'new' | 'reviewed' | 'resolved'
  created_at: string
  nps_score: number | null
}

function NpsBadge({ score, id }: { score: number | null; id: number }) {
  if (score === null || score === undefined) return null
  const colorClass =
    score >= 9
      ? 'border-[hsl(var(--success))] text-[hsl(var(--success))]'
      : score >= 7
        ? 'border-[hsl(var(--warning))] text-[hsl(var(--warning))]'
        : 'border-[hsl(var(--danger))] text-[hsl(var(--danger))]'
  return (
    <Badge variant="outline" className={colorClass} data-testid={`badge-nps-${id}`}>
      NPS: {score}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'new':
      return <Badge variant="default">New</Badge>
    case 'reviewed':
      return <Badge variant="secondary">Reviewed</Badge>
    case 'resolved':
      return <Badge variant="outline">Resolved</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      setFeedback(data.feedback || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (res.ok) {
        toast({ title: 'Status updated' })
        fetchFeedback()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleting(id)
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        toast({ title: 'Feedback deleted' })
        fetchFeedback()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete feedback', variant: 'destructive' })
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  const filteredData = useMemo(() => {
    let result = feedback
    if (statusFilter !== 'all') {
      result = result.filter(f => f.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(f =>
        (f.email || '').toLowerCase().includes(q) ||
        (f.message || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [feedback, statusFilter, search])

  const handleRowClick = useCallback((row: Feedback) => {
    router.push(`/admin/feedback/${row.id}`)
  }, [router])

  const filters: FilterDef[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Resolved', value: 'resolved' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ], [statusFilter])

  const columns: ColumnDef<Feedback>[] = useMemo(() => [
    {
      id: 'email',
      header: 'Email',
      sortable: true,
      sortValue: (row) => row.email || '',
      accessorFn: (row) => (
        <span className="font-medium" data-testid={`text-email-${row.id}`}>
          {row.email || 'Anonymous'}
        </span>
      ),
    },
    {
      id: 'message',
      header: 'Message',
      accessorFn: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-[300px] block" data-testid={`text-message-${row.id}`}>
          {row.message.length > 80 ? row.message.slice(0, 80) + '...' : row.message}
        </span>
      ),
    },
    {
      id: 'nps',
      header: 'NPS',
      sortable: true,
      sortValue: (row) => row.nps_score ?? -1,
      hideOnMobile: true,
      accessorFn: (row) => <NpsBadge score={row.nps_score} id={row.id} />,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => row.status,
      accessorFn: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'page_url',
      header: 'Page URL',
      hideOnMobile: true,
      accessorFn: (row) =>
        row.page_url ? (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block" data-testid={`text-page-url-${row.id}`}>
            {row.page_url}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (row) => new Date(row.created_at).getTime(),
      hideOnMobile: true,
      accessorFn: (row) => (
        <span className="text-sm text-muted-foreground" title={formatAbsoluteTime(row.created_at)}>
          {formatRelativeTime(row.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessorFn: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={row.status}
            onValueChange={(value) => updateStatus(row.id, value)}
          >
            <SelectTrigger className="w-32" data-testid={`select-status-${row.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteTarget(row)}
            className="text-destructive"
            data-testid={`button-delete-feedback-${row.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  const newCount = feedback.filter(f => f.status === 'new').length

  return (
    <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] flex-wrap" data-testid="feedback-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            <MessageSquare className="h-6 w-6" />
            Feedback
            {newCount > 0 && (
              <Badge variant="destructive" data-testid="badge-new-count">{newCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">User feedback and suggestions</p>
        </div>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email or message..."
        filters={filters}
        csvExport={{
          filename: 'feedback-export',
          headers: ['Email', 'Message', 'NPS Score', 'Status', 'Page URL', 'Date'],
          getRows: () =>
            filteredData.map(f => [
              f.email || 'Anonymous',
              f.message,
              f.nps_score,
              f.status,
              f.page_url || '',
              f.created_at,
            ]),
        }}
        data-testid="feedback-toolbar"
      />

      <AdminDataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        emptyMessage="No feedback yet"
        emptyDescription="The feedback widget will collect user submissions."
        onRowClick={handleRowClick}
        getRowId={(row) => String(row.id)}
        data-testid="feedback-table"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Feedback"
        description={`Are you sure you want to delete this feedback from ${deleteTarget?.email || 'Anonymous'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting !== null}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
