'use client'

import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface DetailField {
  label: string
  value: string | number | boolean | null | undefined
  type?: 'text' | 'badge' | 'currency' | 'date' | 'badges' | 'percentage' | 'html' | 'link'
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  href?: string
}

interface DetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: DetailField[]
  children?: React.ReactNode
}

function formatValue(field: DetailField): React.ReactNode {
  const { value, type, badgeVariant, href } = field
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic text-xs">Not set</span>
  }

  switch (type) {
    case 'badge':
      return (
        <Badge variant={badgeVariant || 'secondary'} className="text-xs capitalize">
          {String(value)}
        </Badge>
      )
    case 'badges':
      if (Array.isArray(value)) {
        return value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.map((v, i) => (
              <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
            ))}
          </div>
        ) : <span className="text-muted-foreground italic text-xs">None</span>
      }
      return String(value).split(',').filter(Boolean).map((v, i) => (
        <Badge key={i} variant="outline" className="text-xs mr-1">{v.trim()}</Badge>
      ))
    case 'currency':
      return <span className="font-medium tabular-nums">${(Number(value) / 100).toFixed(2)}</span>
    case 'date':
      return <span className="text-sm">{new Date(String(value)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    case 'percentage':
      return <span className="font-medium tabular-nums">{value}%</span>
    case 'html':
      return <div className="text-sm bg-muted/50 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">{String(value)}</div>
    case 'link':
      return href ? (
        <Link href={href} className="text-sm text-primary hover:underline break-words" data-testid={`link-detail-${field.label.toLowerCase().replace(/\s+/g, '-')}`}>
          {String(value)}
        </Link>
      ) : <span className="text-sm break-words">{String(value)}</span>
    default:
      if (typeof value === 'boolean') {
        return <Badge variant={value ? 'default' : 'outline'} className="text-xs">{value ? 'Yes' : 'No'}</Badge>
      }
      return <span className="text-sm break-words">{String(value)}</span>
  }
}

export default function DetailModal({ open, onOpenChange, title, description, fields, children }: DetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg" data-testid="dialog-detail-modal">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {fields.map((field, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr] gap-2 items-start" data-testid={`detail-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">{field.label}</span>
                <div>{formatValue(field)}</div>
              </div>
            ))}
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
