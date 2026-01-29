'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, ExternalLink } from 'lucide-react'

interface Feedback {
  id: number
  message: string
  email: string
  page_url: string
  status: 'new' | 'reviewed' | 'resolved'
  created_at: string
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const newCount = feedback.filter(f => f.status === 'new').length

  return (
    <div className="p-6 space-y-6">
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

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No feedback yet. The feedback widget will collect user submissions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id} data-testid={`feedback-${item.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {item.email || 'Anonymous'}
                    {getStatusBadge(item.status)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {new Date(item.created_at).toLocaleString()}
                    {item.page_url && (
                      <>
                        <span>•</span>
                        <a 
                          href={item.page_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          {item.page_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </CardDescription>
                </div>
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
