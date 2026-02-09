'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, X as XIcon, Edit2, Send, Clock, Sparkles, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SocialUpgradeBanner } from '@/components/social-upgrade-banner'
import Link from 'next/link'

interface QueuePost {
  id: string
  platform: string
  content: string
  status: string
  ai_generated: boolean
  brand_voice: string | null
  trend_source: string | null
  niche_triggered: string | null
  scheduled_at: string | null
  created_at: string
}

const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  snapchat: 'Snapchat',
  discord: 'Discord',
}

export default function ApprovalQueuePage() {
  const [posts, setPosts] = useState<QueuePost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?status=draft&limit=50')
      if (!res.ok) throw new Error('Failed to fetch queue')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      setError('Could not load approval queue. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleAction = async (postId: string, action: 'approve' | 'reject' | 'edit') => {
    setActionLoading(postId)
    try {
      if (action === 'reject') {
        const res = await fetch(`/api/social/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ignored' }),
        })
        if (!res.ok) throw new Error('Failed to reject post')
        setPosts(prev => prev.filter(p => p.id !== postId))
        toast({ title: 'Post rejected', description: 'The post has been removed from the queue.' })
      } else if (action === 'approve') {
        const res = await fetch(`/api/social/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'scheduled' }),
        })
        if (!res.ok) throw new Error('Failed to approve post')
        setPosts(prev => prev.filter(p => p.id !== postId))
        toast({ title: 'Post approved', description: 'The post has been scheduled for publishing.' })
      } else if (action === 'edit') {
        if (editingId === postId) {
          const res = await fetch(`/api/social/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
          })
          if (!res.ok) throw new Error('Failed to update post')
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p))
          setEditingId(null)
          setEditContent('')
          toast({ title: 'Post updated', description: 'Content has been saved.' })
        } else {
          const post = posts.find(p => p.id === postId)
          if (post) {
            setEditingId(postId)
            setEditContent(post.content)
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card data-testid="error-state-queue">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchQueue() }} data-testid="button-retry-queue">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
    <SocialUpgradeBanner />
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review AI-generated posts before they go live. Approve, edit, or reject each one.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card data-testid="empty-state-queue">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium" data-testid="text-empty-queue">Queue is empty</h3>
            <p className="text-muted-foreground mt-1">
              No posts waiting for review. AI-generated posts will appear here when approval is required.
            </p>
            <Button className="mt-4" asChild data-testid="button-generate-post-queue">
              <Link href="/dashboard/social/posts">Create a Post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground" data-testid="text-queue-count">
            {posts.length} post{posts.length !== 1 ? 's' : ''} waiting for review
          </p>
          {posts.map(post => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" data-testid={`badge-platform-${post.id}`}>
                      {PLATFORM_NAMES[post.platform] || post.platform}
                    </Badge>
                    {post.ai_generated && (
                      <Badge variant="secondary" data-testid={`badge-ai-${post.id}`}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                    {post.trend_source && (
                      <Badge variant="secondary" data-testid={`badge-trend-${post.id}`}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {post.trend_source}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid={`text-date-${post.id}`}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === post.id ? (
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="resize-none"
                    rows={5}
                    data-testid={`textarea-edit-${post.id}`}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
                    {post.content}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => handleAction(post.id, 'approve')}
                    disabled={actionLoading === post.id || editingId === post.id}
                    data-testid={`button-approve-${post.id}`}
                  >
                    {actionLoading === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve & Schedule
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleAction(post.id, 'edit')}
                    disabled={actionLoading === post.id}
                    data-testid={`button-edit-${post.id}`}
                  >
                    {editingId === post.id ? (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save Edit
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => handleAction(post.id, 'reject')}
                    disabled={actionLoading === post.id || editingId === post.id}
                    data-testid={`button-reject-${post.id}`}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Reject
                  </Button>

                  {editingId === post.id && (
                    <Button
                      variant="ghost"
                      onClick={() => { setEditingId(null); setEditContent('') }}
                      data-testid={`button-cancel-edit-${post.id}`}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
