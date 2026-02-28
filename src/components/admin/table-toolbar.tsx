'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { X, Download, Search } from 'lucide-react'
import { exportToCsv } from '@/lib/csv-export'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterDef {
  id: string
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

interface CsvExportConfig {
  filename: string
  headers: string[]
  getRows: () => (string | number | boolean | null | undefined)[][]
}

interface TableToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterDef[]
  csvExport?: CsvExportConfig
  actions?: React.ReactNode
  'data-testid'?: string
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  csvExport,
  actions,
  ...props
}: TableToolbarProps) {
  const testId = props['data-testid'] || 'table-toolbar'

  const hasActiveFilters = filters.some(f => f.value && f.value !== 'all')
  const hasActiveSearch = search && search.length > 0

  const handleClearAll = useCallback(() => {
    if (onSearchChange) onSearchChange('')
    filters.forEach(f => f.onChange('all'))
  }, [onSearchChange, filters])

  const handleExport = useCallback(() => {
    if (!csvExport) return
    exportToCsv({
      filename: csvExport.filename,
      headers: csvExport.headers,
      rows: csvExport.getRows(),
    })
  }, [csvExport])

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-[var(--content-density-gap,1rem)]'
      )}
      data-testid={testId}
    >
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'pl-9 pr-8',
              'rounded-[var(--input-radius,0.5rem)]'
            )}
            data-testid={`${testId}-search`}
          />
          {hasActiveSearch && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
              data-testid={`${testId}-search-clear`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {filters.map((filter) => (
        <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger
            className={cn(
              'w-[160px]',
              'rounded-[var(--btn-radius,0.375rem)]'
            )}
            data-testid={`${testId}-filter-${filter.id}`}
          >
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {(hasActiveFilters || hasActiveSearch) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-foreground"
          data-testid={`${testId}-clear-all`}
        >
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {csvExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="rounded-[var(--btn-radius,0.375rem)]"
            data-testid={`${testId}-csv-export`}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
