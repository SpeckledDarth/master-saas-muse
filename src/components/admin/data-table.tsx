'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface ColumnDef<T> {
  id: string
  header: string
  accessorFn: (row: T) => React.ReactNode
  sortable?: boolean
  sortValue?: (row: T) => string | number | Date
  className?: string
  hideOnMobile?: boolean
}

interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  getRowId?: (row: T) => string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  pageSize?: number
  'data-testid'?: string
}

type SortDirection = 'asc' | 'desc'

interface SortState {
  columnId: string
  direction: SortDirection
}

export function AdminDataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No results found',
  emptyDescription,
  onRowClick,
  getRowId,
  selectable = false,
  selectedIds,
  onSelectionChange,
  pageSize = 20,
  ...props
}: AdminDataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = useCallback((columnId: string) => {
    setSort(prev => {
      if (prev?.columnId === columnId) {
        if (prev.direction === 'asc') return { columnId, direction: 'desc' as SortDirection }
        return null
      }
      return { columnId, direction: 'asc' as SortDirection }
    })
    setCurrentPage(1)
  }, [])

  const sortedData = useMemo(() => {
    if (!sort) return data
    const col = columns.find(c => c.id === sort.columnId)
    if (!col?.sortValue) return data
    const sorted = [...data].sort((a, b) => {
      const aVal = col.sortValue!(a)
      const bVal = col.sortValue!(b)
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [data, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  const canSelect = selectable && !!getRowId && !!selectedIds && !!onSelectionChange

  const allRowIds = useMemo(() => {
    if (!getRowId) return new Set<string>()
    return new Set(data.map(row => getRowId(row)))
  }, [data, getRowId])

  const allSelected = canSelect && selectedIds && allRowIds.size > 0 && allRowIds.size === selectedIds.size

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange || !getRowId) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(allRowIds))
    }
  }, [allSelected, allRowIds, onSelectionChange, getRowId])

  const handleSelectRow = useCallback((rowId: string) => {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(rowId)) {
      next.delete(rowId)
    } else {
      next.add(rowId)
    }
    onSelectionChange(next)
  }, [selectedIds, onSelectionChange])

  const testId = props['data-testid'] || 'admin-data-table'

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-[var(--card-radius,0.75rem)]',
          'border-[length:var(--card-border-width,1px)] border-[var(--card-border-style,solid)] border-border',
          'bg-card'
        )}
        data-testid={`${testId}-loading`}
      >
        <div className="p-[var(--card-padding,1.25rem)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-[var(--content-density-gap,1rem)] py-3">
              {columns.map((col) => (
                <Skeleton key={col.id} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'rounded-[var(--card-radius,0.75rem)]',
          'border-[length:var(--card-border-width,1px)] border-[var(--card-border-style,solid)] border-border',
          'bg-card',
          'p-[var(--card-padding,1.25rem)]',
          'flex flex-col items-center justify-center py-16 text-center'
        )}
        data-testid={`${testId}-empty`}
      >
        <p className="text-lg font-medium text-foreground" data-testid={`${testId}-empty-title`}>
          {emptyMessage}
        </p>
        {emptyDescription && (
          <p className="mt-2 text-sm text-muted-foreground max-w-md" data-testid={`${testId}-empty-description`}>
            {emptyDescription}
          </p>
        )}
      </div>
    )
  }

  return (
    <div data-testid={testId}>
      <div
        className={cn(
          'rounded-[var(--card-radius,0.75rem)]',
          'border-[length:var(--card-border-width,1px)] border-[var(--card-border-style,solid)] border-border',
          'bg-card overflow-hidden'
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {canSelect && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                    data-testid={`${testId}-select-all`}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                  data-testid={`${testId}-header-${col.id}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sort?.columnId === col.id && (
                      sort.direction === 'asc'
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => {
              const rowId = getRowId ? getRowId(row) : String(rowIndex)
              const isSelected = selectedIds?.has(rowId)
              return (
                <TableRow
                  key={rowId}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-muted'
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  data-state={isSelected ? 'selected' : undefined}
                  data-testid={`${testId}-row-${rowId}`}
                >
                  {canSelect && (
                    <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(rowId)}
                        aria-label={`Select row ${rowId}`}
                        data-testid={`${testId}-select-${rowId}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        col.hideOnMobile && 'hidden md:table-cell',
                        col.className
                      )}
                      data-testid={`${testId}-cell-${col.id}-${rowId}`}
                    >
                      {col.accessorFn(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {sortedData.length > pageSize && (
        <div
          className="flex items-center justify-between mt-3 px-1"
          data-testid={`${testId}-pagination`}
        >
          <p className="text-sm text-muted-foreground" data-testid={`${testId}-pagination-info`}>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="rounded-[var(--btn-radius,0.375rem)]"
              data-testid={`${testId}-pagination-prev`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {safeCurrentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="rounded-[var(--btn-radius,0.375rem)]"
              data-testid={`${testId}-pagination-next`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
