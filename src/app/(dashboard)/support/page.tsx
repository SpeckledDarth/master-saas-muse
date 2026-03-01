'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DSCard, DSCardContent, DSCardDescription, DSCardHeader, DSCardTitle } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Loader2,
  Plus,
  MessageSquare,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Ticket {
  id: string
  subject: string
  description: string | null
  status: string
  priority: string
  category: string | null
  created_at: string
  updated_at: string | null
  resolved_at: string | null
  closed_at: string | null
}

interface TicketComment {
  id: string
  ticket_id: string
  user_id: string
  body: string
  is_internal: boolean
  created_at: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  open: { label: 'Open', variant: 'default', icon: AlertCircle },
  in_progress: { label: 'In Progress', variant: 'outline', icon: Clock },
  resolved: { label: 'Resolved', variant: 'secondary', icon: CheckCircle2 },
  closed: { label: 'Closed', variant: 'secondary', icon: XCircle },
}

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'outline' },
  high: { label: 'High', variant: 'default' },
  urgent: { label: 'Urgent', variant: 'destructive' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TicketDetail({
  ticket,
  onBack,
  onStatusChange,
}: {
  ticket: Ticket
  onBack: () => void
  onStatusChange: () => void
}) {
  const [comments, setComments] = useState<TicketComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [ticket.id])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment.trim() }),
      })
      if (res.ok) {
        setNewComment('')
        fetchComments()
        toast({ title: 'Comment added' })
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to add comment', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (res.ok) {
        toast({ title: 'Ticket closed' })
        onStatusChange()
        onBack()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to close ticket', variant: 'destructive' })
    }
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-tickets">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate" data-testid="text-ticket-subject">{ticket.subject}</h2>
          <p className="text-sm text-muted-foreground">Created {formatDate(ticket.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={status.variant} data-testid="badge-ticket-status">
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          <Badge variant={priority.variant} data-testid="badge-ticket-priority">
            {priority.label}
          </Badge>
        </div>
      </div>

      {ticket.description && (
        <DSCard data-testid="card-ticket-description">
          <DSCardContent className="pt-6">
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </DSCardContent>
        </DSCard>
      )}

      <DSCard data-testid="card-ticket-comments">
        <DSCardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <DSCardTitle className="text-lg">Comments</DSCardTitle>
            <DSCardDescription>{comments.length} comment{comments.length !== 1 ? 's' : ''}</DSCardDescription>
          </div>
          {ticket.status !== 'closed' && (
            <Button variant="outline" size="sm" onClick={handleClose} data-testid="button-close-ticket">
              <XCircle className="h-4 w-4 mr-2" />
              Close Ticket
            </Button>
          )}
        </DSCardHeader>
        <DSCardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md border p-3 space-y-1"
                  data-testid={`comment-${comment.id}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          {ticket.status !== 'closed' && (
            <div className="flex gap-2 pt-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none text-sm"
                rows={2}
                data-testid="input-comment"
              />
              <Button
                size="icon"
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                data-testid="button-submit-comment"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </DSCardContent>
      </DSCard>
    </div>
  )
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newCategory, setNewCategory] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/tickets?${params}`)
      if (res.status === 401) {
        router.push('/login?redirect=/support')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        setTotal(data.total || 0)
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, router])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleCreate = async () => {
    if (!newSubject.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          description: newDescription.trim() || null,
          priority: newPriority,
          category: newCategory || null,
        }),
      })
      if (res.ok) {
        setShowNewDialog(false)
        setNewSubject('')
        setNewDescription('')
        setNewPriority('medium')
        setNewCategory('')
        fetchTickets()
        toast({ title: 'Ticket created', description: 'Your support ticket has been submitted.' })
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create ticket', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create ticket', variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  if (selectedTicket) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TicketDetail
          ticket={selectedTicket}
          onBack={() => {
            setSelectedTicket(null)
            fetchTickets()
          }}
          onStatusChange={fetchTickets}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-support-title">Support</h1>
          <p className="text-muted-foreground mt-1">View and manage your support tickets</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-ticket">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Describe your issue and we&apos;ll get back to you as soon as possible.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input
                  id="ticket-subject"
                  placeholder="Brief summary of your issue"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  data-testid="input-ticket-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-description">Description</Label>
                <Textarea
                  id="ticket-description"
                  placeholder="Describe your issue in detail..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                  data-testid="input-ticket-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger data-testid="select-ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger data-testid="select-ticket-category">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={isCreating || !newSubject.trim()}
                data-testid="button-submit-ticket"
              >
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(s)
              setIsLoading(true)
            }}
            data-testid={`filter-${s}`}
          >
            {s === 'all' ? 'All' : (statusConfig[s]?.label || s)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-tickets" />
        </div>
      ) : tickets.length === 0 ? (
        <DSCard>
          <DSCardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1" data-testid="text-no-tickets">No tickets found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' ? "You haven't submitted any support tickets yet." : `No ${statusConfig[statusFilter]?.label?.toLowerCase() || statusFilter} tickets.`}
            </p>
          </DSCardContent>
        </DSCard>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const s = statusConfig[ticket.status] || statusConfig.open
            const p = priorityConfig[ticket.priority] || priorityConfig.medium
            const SIcon = s.icon
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedTicket(ticket)}
                data-testid={`ticket-${ticket.id}`}
              >
                <DSCardContent className="py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-ticket-subject-${ticket.id}`}>{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ticket.created_at)}
                      {ticket.category && ` · ${ticket.category}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={p.variant} data-testid={`badge-priority-${ticket.id}`}>{p.label}</Badge>
                    <Badge variant={s.variant} data-testid={`badge-status-${ticket.id}`}>
                      <SIcon className="h-3 w-3 mr-1" />
                      {s.label}
                    </Badge>
                  </div>
                </DSCardContent>
              </DSCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
