'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PlatformIconCircle, getPlatformName } from '@/components/social/platform-icon'
import { Clock, Sparkles, Heart, MessageCircle, Share2, MousePointerClick, Calendar, AlertCircle } from 'lucide-react'

export interface PostDetailData {
  id: string
  platform: string
  content: string
  status: string
  scheduled_at?: string | null
  posted_at?: string | null
  created_at?: string
  ai_generated?: boolean
  error_message?: string | null
  engagement_likes?: number
  engagement_shares?: number
  engagement_comments?: number
  engagement_clicks?: number
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'posted') return 'default'
  if (status === 'scheduled') return 'secondary'
  if (status === 'failed') return 'destructive'
  return 'outline'
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PostDetailDialog({
  post,
  open,
  onOpenChange,
}: {
  post: PostDetailData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!post) return null

  const hasEngagement =
    typeof post.engagement_likes === 'number' ||
    typeof post.engagement_shares === 'number' ||
    typeof post.engagement_comments === 'number' ||
    typeof post.engagement_clicks === 'number'

  const totalEngagement =
    (post.engagement_likes || 0) +
    (post.engagement_shares || 0) +
    (post.engagement_comments || 0) +
    (post.engagement_clicks || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-post-detail">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <PlatformIconCircle platform={post.platform} size="lg" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base" data-testid="text-detail-platform">
                {getPlatformName(post.platform)} Post
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={getStatusVariant(post.status)} data-testid="badge-detail-status">
                  {post.status}
                </Badge>
                {post.ai_generated && (
                  <Badge variant="outline" data-testid="badge-detail-ai">
                    <Sparkles className="mr-1 h-3 w-3" /> AI Generated
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-md border p-4" data-testid="section-detail-content">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          {hasEngagement && (
            <Card data-testid="card-detail-engagement">
              <CardContent className="py-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Engagement</p>
                <div className="grid grid-cols-2 gap-3">
                  {typeof post.engagement_likes === 'number' && (
                    <div className="flex items-center gap-2" data-testid="detail-likes">
                      <Heart className="h-4 w-4 text-chart-1" />
                      <div>
                        <p className="text-sm font-medium">{post.engagement_likes.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                    </div>
                  )}
                  {typeof post.engagement_comments === 'number' && (
                    <div className="flex items-center gap-2" data-testid="detail-comments">
                      <MessageCircle className="h-4 w-4 text-chart-2" />
                      <div>
                        <p className="text-sm font-medium">{post.engagement_comments.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                    </div>
                  )}
                  {typeof post.engagement_shares === 'number' && (
                    <div className="flex items-center gap-2" data-testid="detail-shares">
                      <Share2 className="h-4 w-4 text-chart-3" />
                      <div>
                        <p className="text-sm font-medium">{post.engagement_shares.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  )}
                  {typeof post.engagement_clicks === 'number' && (
                    <div className="flex items-center gap-2" data-testid="detail-clicks">
                      <MousePointerClick className="h-4 w-4 text-chart-4" />
                      <div>
                        <p className="text-sm font-medium">{post.engagement_clicks.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                    </div>
                  )}
                </div>
                {totalEngagement > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Total Engagement</span>
                    <span className="text-sm font-bold" data-testid="text-detail-total-engagement">{totalEngagement.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2 text-sm" data-testid="section-detail-timestamps">
            {post.created_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Created {formatDateTime(post.created_at)}</span>
              </div>
            )}
            {post.scheduled_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Scheduled for {formatDateTime(post.scheduled_at)}</span>
              </div>
            )}
            {post.posted_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Posted {formatDateTime(post.posted_at)}</span>
              </div>
            )}
            {post.error_message && (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{post.error_message}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
