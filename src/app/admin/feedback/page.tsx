'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, ExternalLink, Trash2, Loader2, Filter } from 'lucide-react'

interface Feedback {
  id: number
  message: string
  email: string
  page_url: string
  status: 'new' | 'reviewed' | 'resolved'
  created_at: string
  nps_score: number | null
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()

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

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this feedback?')) return

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
    }
  }

  function getStatusBadge(status: string) {
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

  const filteredFeedback = statusFilter === 'all' 
    ? feedback 
    : feedback.filter(f => f.status === statusFilter)

  const newCount = feedback.filter(f => f.status === 'new').length
  const reviewedCount = feedback.filter(f => f.status === 'reviewed').length
  const resolvedCount = feedback.filter(f => f.status === 'resolved').length

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap" data-testid="feedback-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Feedback
            {newCount > 0 && (
              <Badge variant="destructive">{newCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">User feedback and suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({feedback.length})</SelectItem>
              <SelectItem value="new">New ({newCount})</SelectItem>
              <SelectItem value="reviewed">Reviewed ({reviewedCount})</SelectItem>
              <SelectItem value="resolved">Resolved ({resolvedCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No feedback yet</p>
            <p className="text-muted-foreground">The feedback widget will collect user submissions.</p>
          </CardContent>
        </Card>
      ) : filteredFeedback.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No feedback matches the selected filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <Card key={item.id} data-testid={`feedback-${item.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1 min-w-0 flex-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2 flex-wrap">
                    {item.email || 'Anonymous'}
                    {getStatusBadge(item.status)}
                    {item.nps_score !== null && item.nps_score !== undefined && (
                      <Badge
                        variant="outline"
                        className={
                          item.nps_score >= 9
                            ? 'border-green-500 text-green-600 dark:text-green-400'
                            : item.nps_score >= 7
                              ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                              : 'border-red-500 text-red-600 dark:text-red-400'
                        }
                        data-testid={`badge-nps-${item.id}`}
                      >
                        NPS: {item.nps_score}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    {new Date(item.created_at).toLocaleString()}
                    {item.page_url && (
                      <>
                        <span>•</span>
                        <a 
                          href={item.page_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline truncate max-w-xs"
                          data-testid={`link-page-url-${item.id}`}
                        >
                          {item.page_url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={item.status}
                    onValueChange={(value) => updateStatus(item.id, value)}
                  >
                    <SelectTrigger className="w-32" data-testid={`select-status-${item.id}`}>
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
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-feedback-${item.id}`}
                  >
                    {deleting === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
