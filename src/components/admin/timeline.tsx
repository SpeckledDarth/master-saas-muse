'use client'

import { type ElementType } from 'react'
import { cn } from '@/lib/utils'
import {
  UserPlus,
  DollarSign,
  LogIn,
  MessageSquare,
  Award,
  Settings,
  Shield,
  FileText,
  CreditCard,
  ArrowRightLeft,
  Bell,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

export interface TimelineEvent {
  id: string
  type: 'signup' | 'payment' | 'login' | 'ticket' | 'commission' | 'payout' | 'role_change' | 'setting' | 'milestone' | 'invoice' | 'transfer' | 'notification' | 'other'
  title: string
  description?: string
  timestamp: string
  href?: string
  metadata?: Record<string, string | number | boolean>
}

const EVENT_ICONS: Record<TimelineEvent['type'], ElementType> = {
  signup: UserPlus,
  payment: DollarSign,
  login: LogIn,
  ticket: MessageSquare,
  commission: DollarSign,
  payout: ArrowRightLeft,
  role_change: Shield,
  setting: Settings,
  milestone: Award,
  invoice: FileText,
  transfer: CreditCard,
  notification: Bell,
  other: Activity,
}

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  signup: 'text-primary bg-primary/10',
  payment: 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)]',
  login: 'text-muted-foreground bg-muted',
  ticket: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)]',
  commission: 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)]',
  payout: 'text-primary bg-primary/10',
  role_change: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)]',
  setting: 'text-muted-foreground bg-muted',
  milestone: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)]',
  invoice: 'text-primary bg-primary/10',
  transfer: 'text-primary bg-primary/10',
  notification: 'text-muted-foreground bg-muted',
  other: 'text-muted-foreground bg-muted',
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface TimelineProps {
  events: TimelineEvent[]
  loading?: boolean
  emptyMessage?: string
  maxItems?: number
  compact?: boolean
  className?: string
}

function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-[var(--content-density-gap,1rem)]" data-testid="timeline-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-[var(--content-density-gap,1rem)] animate-pulse">
          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Timeline({ events, loading, emptyMessage, maxItems, compact, className }: TimelineProps) {
  if (loading) {
    return <TimelineSkeleton count={maxItems || 5} />
  }

  const displayEvents = maxItems ? events.slice(0, maxItems) : events

  if (displayEvents.length === 0) {
    return (
      <div className="flex items-center justify-center py-[var(--section-spacing,3.5rem)] text-sm text-muted-foreground" data-testid="timeline-empty">
        <Activity className="h-4 w-4 mr-2 opacity-50" />
        {emptyMessage || 'No activity yet'}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} data-testid="timeline">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

      <div className="space-y-1">
        {displayEvents.map((event) => {
          const Icon = EVENT_ICONS[event.type] || EVENT_ICONS.other
          const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.other

          const content = (
            <div
              className={cn(
                'flex gap-[var(--content-density-gap,1rem)] relative group',
                compact ? 'py-1.5' : 'py-2.5',
                event.href && 'cursor-pointer'
              )}
              data-testid={`timeline-event-${event.id}`}
            >
              <div className={cn(
                'flex items-center justify-center rounded-full shrink-0 z-10',
                compact ? 'h-6 w-6' : 'h-8 w-8',
                colorClass
              )}>
                <Icon className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'font-medium truncate',
                    compact ? 'text-xs' : 'text-sm',
                    event.href && 'group-hover:text-primary transition-colors'
                  )}>
                    {event.title}
                  </p>
                  <span className={cn(
                    'text-muted-foreground shrink-0',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}>
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className={cn(
                    'text-muted-foreground truncate',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}>
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          )

          if (event.href) {
            return (
              <Link key={event.id} href={event.href} className="block hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors">
                {content}
              </Link>
            )
          }

          return <div key={event.id} className="px-1 -mx-1">{content}</div>
        })}
      </div>
    </div>
  )
}
