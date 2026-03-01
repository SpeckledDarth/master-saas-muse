'use client'

import { useState, useEffect, type ElementType } from 'react'
import Link from 'next/link'
import { FileText, CreditCard, MessageSquare, Users, DollarSign, Loader2 } from 'lucide-react'

interface RelatedRecord {
  type: string
  id: string
  title: string
  subtitle: string
  href: string
}

interface RelatedGroup {
  label: string
  records: RelatedRecord[]
}

const TYPE_ICONS: Record<string, ElementType> = {
  invoice: FileText,
  subscription: CreditCard,
  ticket: MessageSquare,
  commission: DollarSign,
  payout: DollarSign,
  referral: Users,
}

interface RelatedRecordsProps {
  entityType: string
  entityId: string
  userId: string
}

export function RelatedRecords({ entityType, entityId, userId }: RelatedRecordsProps) {
  const [groups, setGroups] = useState<RelatedGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelated() {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const params = new URLSearchParams({ entityType, entityId, userId })
        const res = await fetch(`/api/admin/related?${params}`)
        if (res.ok) {
          const data = await res.json()
          setGroups(data.groups || [])
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRelated()
  }, [entityType, entityId, userId])

  if (loading) {
    return (
      <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="related-records-loading">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading related records...
        </div>
      </div>
    )
  }

  if (groups.length === 0) return null

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]" data-testid="related-records">
      <h3 className="text-sm font-medium">Related Records</h3>
      {groups.map((group, gi) => (
        <div key={gi} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] overflow-hidden" data-testid={`related-group-${gi}`}>
          <div className="px-3 py-2 bg-muted/30 border-b">
            <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
          </div>
          <div className="divide-y">
            {group.records.map((record, ri) => {
              const Icon = TYPE_ICONS[record.type] || FileText
              return (
                <Link
                  key={ri}
                  href={record.href}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors"
                  data-testid={`related-record-${gi}-${ri}`}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{record.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{record.subtitle}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
