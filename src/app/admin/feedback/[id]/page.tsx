'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Send,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  description: string | null
  status: string
  priority: string
  category: string | null
  ticket_number: string | null
  user_id: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string | null
  resolved_at: string | null
  closed_at: string | null
}

interface Comment {
  id: string
  ticket_id: string
  user_id: string
  body: string
  is_internal: boolean
  created_at: string
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'open':
    case 'pending':
      return <Clock className="h-4 w-4" />
    case 'in_progress':
      return <Eye className="h-4 w-4" />
    case 'resolved':
      return <CheckCircle2 className="h-4 w-4" />
    case 'closed':
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'open':
    case 'pending':
      return 'default'
    case 'in_progress':
      return 'secondary'
    case 'resolved':
      return 'outline'
    case 'closed':
      return 'outline'
    default:
      return 'default'
  }
}

function getPriorityVariant(priority: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'destructive'
    case 'medium':
      return 'secondary'
    case 'low':
      return 'outline'
    default:
      return 'outline'
  }
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  async function fetchTicket() {
    try {
      const res = await fetch(`/api/admin/feedback/${ticketId}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast({ title: 'Ticket not found', variant: 'destructive' })
          router.push('/admin/feedback')
          return
        }
        throw new Error('Failed to load ticket')
      }
      const data = await res.json()
      setTicket(data.ticket)
      setComments(data.comments || [])
      setUserName(data.userName || null)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load ticket details', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(status: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/feedback/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setTicket(data.ticket)
        toast({ title: `Status updated to ${status}` })
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  async function handlePriorityChange(priority: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/feedback/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })
      if (res.ok) {
        const data = await res.json()
        setTicket(data.ticket)
        toast({ title: `Priority updated to ${priority}` })
      } else {
        toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  async function handleReply() {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/feedback/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply, is_internal: isInternal }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setReply('')
        setIsInternal(false)
        toast({ title: isInternal ? 'Internal note added' : 'Reply sent' })
      } else {
        toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-[var(--section-spacing,1.5rem)]">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-ticket-detail" />
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-[var(--section-spacing,1.5rem)]">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket not found</p>
          <Button variant="outline" onClick={() => router.push('/admin/feedback')} className="mt-4" data-testid="button-back-to-feedback">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/feedback')} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" data-testid="text-ticket-subject">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-ticket-number">
            {ticket.ticket_number ? `#${ticket.ticket_number}` : `ID: ${ticket.id}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
        <div className="lg:col-span-2 space-y-[var(--content-density-gap,1rem)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                <Clock className="h-3 w-3" />
                Created {new Date(ticket.created_at).toLocaleString()}
                {ticket.updated_at && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    Updated {new Date(ticket.updated_at).toLocaleString()}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap" data-testid="text-ticket-description">
                {ticket.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
                {comments.length > 0 && (
                  <Badge variant="secondary">{comments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-comments">
                  No messages yet. Add a reply below.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-md p-3 border ${comment.is_internal ? 'border-dashed bg-muted/50' : ''}`}
                      data-testid={`comment-${comment.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{comment.user_id?.slice(0, 8)}...</span>
                          {comment.is_internal && (
                            <Badge variant="outline" className="text-xs">Internal</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder="Write a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-reply"
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="internal"
                      checked={isInternal}
                      onCheckedChange={(checked) => setIsInternal(checked === true)}
                      data-testid="checkbox-internal"
                    />
                    <Label htmlFor="internal" className="text-sm text-muted-foreground cursor-pointer">
                      Internal note (not visible to user)
                    </Label>
                  </div>
                  <Button
                    onClick={handleReply}
                    disabled={!reply.trim() || sending}
                    data-testid="button-send-reply"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isInternal ? 'Add Note' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-[var(--content-density-gap,1rem)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger data-testid="select-ticket-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select
                  value={ticket.priority || 'medium'}
                  onValueChange={handlePriorityChange}
                  disabled={updating}
                >
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

              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="text-sm" data-testid="text-ticket-category">{ticket.category || 'Uncategorized'}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Submitted By</Label>
                {ticket.user_id ? (
                  <a
                    href={`/admin/crm/${ticket.user_id}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    data-testid="link-ticket-user"
                  >
                    <User className="h-3 w-3" />
                    {userName || ticket.user_id.slice(0, 8) + '...'}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-ticket-user">Anonymous</p>
                )}
              </div>

              {ticket.resolved_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Resolved At</Label>
                  <p className="text-sm" data-testid="text-resolved-at">
                    {new Date(ticket.resolved_at).toLocaleString()}
                  </p>
                </div>
              )}

              {ticket.closed_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Closed At</Label>
                  <p className="text-sm" data-testid="text-closed-at">
                    {new Date(ticket.closed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticket.status !== 'resolved' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange('resolved')}
                  disabled={updating}
                  data-testid="button-resolve-ticket"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
              {ticket.status !== 'closed' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange('closed')}
                  disabled={updating}
                  data-testid="button-close-ticket"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Ticket
                </Button>
              )}
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange('open')}
                  disabled={updating}
                  data-testid="button-reopen-ticket"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reopen Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
