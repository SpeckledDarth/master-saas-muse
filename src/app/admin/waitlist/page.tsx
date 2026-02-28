'use client'

import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Mail, Trash2 } from 'lucide-react'
import { AdminDataTable, ColumnDef } from '@/components/admin/data-table'
import { TableToolbar, FilterDef } from '@/components/admin/table-toolbar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/format-relative-time'

interface WaitlistEntry {
  id: number
  email: string
  name: string | null
  referral_source: string | null
  created_at: string
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<WaitlistEntry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    try {
      const res = await fetch('/api/waitlist')
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching waitlist:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/waitlist?id=${deleteTarget.id}`, { method: 'DELETE' })

      if (res.ok) {
        toast({ title: 'Entry removed' })
        fetchEntries()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete entry', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const sourceOptions = useMemo(() => {
    const sources = new Set<string>()
    entries.forEach(e => {
      if (e.referral_source) sources.add(e.referral_source)
    })
    return Array.from(sources).sort().map(s => ({ label: s, value: s }))
  }, [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch =
        !searchTerm ||
        entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSource =
        sourceFilter === 'all' || entry.referral_source === sourceFilter

      return matchesSearch && matchesSource
    })
  }, [entries, searchTerm, sourceFilter])

  const columns: ColumnDef<WaitlistEntry>[] = [
    {
      id: 'email',
      header: 'Email',
      accessorFn: (row) => <span className="truncate font-medium">{row.email}</span>,
      sortable: true,
      sortValue: (row) => row.email,
    },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => <span className="text-muted-foreground">{row.name || '-'}</span>,
      sortable: true,
      sortValue: (row) => row.name || '',
      hideOnMobile: true,
    },
    {
      id: 'source',
      header: 'Source',
      accessorFn: (row) => <span className="text-muted-foreground">{row.referral_source || '-'}</span>,
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Signed Up',
      accessorFn: (row) => (
        <span className="text-muted-foreground" title={formatAbsoluteTime(row.created_at)}>
          {formatRelativeTime(row.created_at)}
        </span>
      ),
      sortable: true,
      sortValue: (row) => new Date(row.created_at).getTime(),
      hideOnMobile: true,
    },
    {
      id: 'actions',
      header: '',
      accessorFn: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="text-destructive hover:text-destructive/80 p-1"
            data-testid={`button-delete-entry-${row.id}`}
            aria-label={`Remove ${row.email}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-[60px]',
    },
  ]

  const filters: FilterDef[] = sourceOptions.length > 0
    ? [
        {
          id: 'source',
          label: 'Source',
          options: sourceOptions,
          value: sourceFilter,
          onChange: setSourceFilter,
        },
      ]
    : []

  return (
    <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] flex-wrap" data-testid="waitlist-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Waitlist
          </h1>
          <p className="text-muted-foreground">
            {entries.length} people waiting for launch
          </p>
        </div>
      </div>

      <TableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by email or name..."
        filters={filters}
        csvExport={
          entries.length > 0
            ? {
                filename: `waitlist-${new Date().toISOString().split('T')[0]}`,
                headers: ['Email', 'Name', 'Referral Source', 'Date'],
                getRows: () =>
                  entries.map(e => [
                    e.email,
                    e.name || '',
                    e.referral_source || '',
                    new Date(e.created_at).toLocaleDateString(),
                  ]),
              }
            : undefined
        }
        data-testid="waitlist-toolbar"
      />

      <AdminDataTable
        columns={columns}
        data={filteredEntries}
        loading={loading}
        emptyMessage="No waitlist signups yet"
        emptyDescription="Enable waitlist mode in settings to start collecting emails."
        getRowId={(row) => String(row.id)}
        data-testid="waitlist-table"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Remove from waitlist"
        description={`Are you sure you want to remove "${deleteTarget?.email}" from the waitlist? This action cannot be undone.`}
        confirmLabel="Remove"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
