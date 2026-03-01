'use client'

import { useEffect, useState } from 'react'
import { DSCard as Card, DSCardContent as CardContent, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, MessageSquare, Sparkles, Loader2, AlertCircle, Clock } from 'lucide-react'

interface ApprovalPost {
  id: string
  platform: string
  content: string
  status: string
  scheduledAt: string | null
}

interface PostState extends ApprovalPost {
  actionTaken?: 'approve' | 'reject' | 'request_changes'
  showCommentField?: boolean
  comment?: string
  loading?: boolean
  message?: string
  messageType?: 'success' | 'error'
}

export default function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('')
  const [posts, setPosts] = useState<PostState[]>([])
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      fetchApprovalData(p.token)
    })
  }, [params])

  async function fetchApprovalData(t: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/social/collaboration/approval-portal?token=${encodeURIComponent(t)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load approval data')
        return
      }

      setPosts(data.posts.map((p: ApprovalPost) => ({ ...p, comment: '' })))
      setExpiresAt(data.expiresAt)
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(postId: string, action: 'approve' | 'reject' | 'request_changes') {
    const post = posts.find(p => p.id === postId)
    if (!post) return

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, loading: true, message: '' } : p))

    try {
      const res = await fetch('/api/social/collaboration/approval-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          postId,
          action,
          comment: post.comment || '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, loading: false, message: data.error || 'Action failed', messageType: 'error' as const } : p))
        return
      }

      const statusLabels: Record<string, string> = {
        approve: 'Approved',
        reject: 'Rejected',
        request_changes: 'Changes Requested',
      }

      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
              ...p,
              loading: false,
              actionTaken: action,
              status: data.newStatus || p.status,
              message: `${statusLabels[action]} successfully`,
              messageType: 'success' as const,
              showCommentField: false,
            }
          : p
      ))
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, loading: false, message: 'Network error', messageType: 'error' as const } : p))
    }
  }

  function toggleCommentField(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showCommentField: !p.showCommentField } : p))
  }

  function updateComment(postId: string, comment: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment } : p))
  }

  function getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      twitter: 'bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]',
      x: 'bg-muted text-muted-foreground',
      facebook: 'bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]',
      instagram: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
      linkedin: 'bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]',
      tiktok: 'bg-muted text-muted-foreground',
      threads: 'bg-muted text-muted-foreground',
    }
    return colors[platform.toLowerCase()] || 'bg-muted text-muted-foreground'
  }

  function getStatusBadge(post: PostState) {
    if (post.actionTaken === 'approve') return <Badge data-testid={`badge-status-${post.id}`} className="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] no-default-hover-elevate no-default-active-elevate">Approved</Badge>
    if (post.actionTaken === 'reject') return <Badge data-testid={`badge-status-${post.id}`} className="bg-destructive/10 text-destructive no-default-hover-elevate no-default-active-elevate">Rejected</Badge>
    if (post.actionTaken === 'request_changes') return <Badge data-testid={`badge-status-${post.id}`} className="bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] no-default-hover-elevate no-default-active-elevate">Changes Requested</Badge>
    if (post.status === 'scheduled') return <Badge data-testid={`badge-status-${post.id}`} variant="secondary"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>
    if (post.status === 'draft') return <Badge data-testid={`badge-status-${post.id}`} variant="secondary">Draft</Badge>
    if (post.status === 'pending_approval') return <Badge data-testid={`badge-status-${post.id}`} variant="outline">Pending</Badge>
    return <Badge data-testid={`badge-status-${post.id}`} variant="secondary">{post.status}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="loading-state">
        <div className="text-center space-y-[var(--content-density-gap,1rem)]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading approval portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="error-state">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-[var(--content-density-gap,1rem)]">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="text-lg font-semibold" data-testid="text-error-title">Unable to Load</h2>
              <p className="text-muted-foreground" data-testid="text-error-message">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" data-testid="approval-page">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-[var(--card-padding,1.25rem)] py-[var(--card-padding,1.25rem)] flex items-center justify-between gap-[var(--content-density-gap,1rem)] flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg" data-testid="text-brand-name">PassivePost</span>
          </div>
          {expiresAt && (
            <p className="text-xs text-muted-foreground" data-testid="text-expires">
              Link expires {new Date(expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-[var(--card-padding,1.25rem)] py-[var(--section-spacing,3.5rem)] space-y-[var(--content-density-gap,1rem)]">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Content Approval</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Review and approve the following posts. Your feedback helps us publish on time.
          </p>
        </div>

        {posts.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground" data-testid="text-no-posts">No posts found for this approval link.</p>
            </CardContent>
          </Card>
        )}

        {posts.map((post) => (
          <Card key={post.id} data-testid={`card-post-${post.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getPlatformColor(post.platform)} no-default-hover-elevate no-default-active-elevate`} data-testid={`badge-platform-${post.id}`}>
                  {post.platform}
                </Badge>
                {getStatusBadge(post)}
              </div>
              {post.scheduledAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-scheduled-${post.id}`}>
                  <Clock className="w-3 h-3" />
                  {new Date(post.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-[var(--content-density-gap,1rem)]">
              <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
                {post.content}
              </p>

              {post.message && (
                <div
                  className={`text-sm px-3 py-2 rounded-[var(--card-radius,0.75rem)] ${post.messageType === 'success' ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]' : 'bg-destructive/10 text-destructive'}`}
                  data-testid={`text-message-${post.id}`}
                >
                  {post.message}
                </div>
              )}

              {!post.actionTaken && (
                <div className="space-y-3">
                  {post.showCommentField && (
                    <Textarea
                      placeholder="Add a comment or note about changes needed..."
                      value={post.comment || ''}
                      onChange={(e) => updateComment(post.id, e.target.value)}
                      className="text-sm"
                      data-testid={`input-comment-${post.id}`}
                    />
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleAction(post.id, 'approve')}
                      disabled={post.loading}
                      className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))] text-white border-[hsl(var(--success))]"
                      data-testid={`button-approve-${post.id}`}
                    >
                      {post.loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(post.id, 'reject')}
                      disabled={post.loading}
                      data-testid={`button-reject-${post.id}`}
                    >
                      {post.loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (post.showCommentField && post.comment) {
                          handleAction(post.id, 'request_changes')
                        } else {
                          toggleCommentField(post.id)
                        }
                      }}
                      disabled={post.loading}
                      className="border-[hsl(var(--warning)/0.5)] text-[hsl(var(--warning))]"
                      data-testid={`button-request-changes-${post.id}`}
                    >
                      {post.loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MessageSquare className="w-4 h-4 mr-1" />}
                      {post.showCommentField ? 'Submit Changes' : 'Request Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-3xl mx-auto px-[var(--card-padding,1.25rem)] py-[var(--card-padding,1.25rem)] text-center text-xs text-muted-foreground">
          Powered by PassivePost
        </div>
      </footer>
    </div>
  )
}
