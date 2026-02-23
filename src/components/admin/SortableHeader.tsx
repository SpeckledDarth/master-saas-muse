'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSort: { key: string; dir: 'asc' | 'desc' }
  onSort: (key: string) => void
  className?: string
}

export default function SortableHeader({ label, sortKey, currentSort, onSort, className }: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors ${className || ''}`}
      data-testid={`sort-${sortKey}`}
    >
      {label}
      {isActive ? (
        currentSort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}
