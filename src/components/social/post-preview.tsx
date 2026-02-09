'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Heart, MessageCircle, Repeat2, Share, ThumbsUp, Send, Globe, MoreHorizontal } from 'lucide-react'

interface PostPreviewProps {
  content: string
  platform: 'twitter' | 'linkedin' | 'facebook'
  mediaUrls?: string[]
  userName?: string
}

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
}

function getCharColor(length: number, limit: number): string {
  const ratio = length / limit
  if (ratio >= 1) return 'text-destructive'
  if (ratio >= 0.9) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-muted-foreground'
}

function TwitterPreview({ content, userName }: { content: string; userName: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm font-bold">{userName}</span>
            <span className="text-sm text-muted-foreground">@{userName.toLowerCase().replace(/\s/g, '')}</span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words" data-testid="text-preview-content">
            {content || <span className="text-muted-foreground italic">Your post will appear here...</span>}
          </p>
          <span className="text-xs text-muted-foreground mt-1 block">Just now</span>
          <div className="flex items-center justify-between mt-3 max-w-[300px]">
            <button className="flex items-center gap-1 text-muted-foreground" data-testid="preview-action-reply">
              <MessageCircle className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-muted-foreground" data-testid="preview-action-retweet">
              <Repeat2 className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-muted-foreground" data-testid="preview-action-like">
              <Heart className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-muted-foreground" data-testid="preview-action-share">
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkedInPreview({ content, userName }: { content: string; userName: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold block">{userName}</span>
          <span className="text-xs text-muted-foreground block">Professional Title</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Just now <Globe className="h-3 w-3" />
          </span>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
      <p className="text-sm whitespace-pre-wrap break-words" data-testid="text-preview-content">
        {content || <span className="text-muted-foreground italic">Your post will appear here...</span>}
      </p>
      <div className="border-t pt-2">
        <div className="flex items-center justify-between gap-2">
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-like">
            <ThumbsUp className="h-4 w-4" /> Like
          </button>
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-comment">
            <MessageCircle className="h-4 w-4" /> Comment
          </button>
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-repost">
            <Repeat2 className="h-4 w-4" /> Repost
          </button>
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-send">
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}

function FacebookPreview({ content, userName, mediaUrls }: { content: string; userName: string; mediaUrls?: string[] }) {
  const hasLink = mediaUrls && mediaUrls.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold block">{userName}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Just now <Globe className="h-3 w-3" />
          </span>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
      <p className="text-sm whitespace-pre-wrap break-words" data-testid="text-preview-content">
        {content || <span className="text-muted-foreground italic">Your post will appear here...</span>}
      </p>
      {hasLink && (() => {
        let hostname = 'link'
        try { hostname = new URL(mediaUrls[0]).hostname } catch {}
        return (
          <div className="border rounded-md p-3 bg-muted/50" data-testid="preview-link-card">
            <span className="text-xs text-muted-foreground uppercase">{hostname}</span>
            <p className="text-sm font-medium mt-1">Link Preview</p>
          </div>
        )
      })()}
      <div className="border-t pt-2">
        <div className="flex items-center justify-between gap-2">
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-react">
            <ThumbsUp className="h-4 w-4" /> Like
          </button>
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-comment">
            <MessageCircle className="h-4 w-4" /> Comment
          </button>
          <button className="flex items-center gap-1 text-xs text-muted-foreground flex-1 justify-center" data-testid="preview-action-share">
            <Share className="h-4 w-4" /> Share
          </button>
        </div>
      </div>
    </div>
  )
}

export function PostPreview({ content, platform, mediaUrls, userName = 'User' }: PostPreviewProps) {
  const limit = CHAR_LIMITS[platform] || 280
  const charColor = getCharColor(content.length, limit)

  const platformLabel = platform === 'twitter' ? 'X / Twitter' : platform === 'linkedin' ? 'LinkedIn' : 'Facebook'

  return (
    <Card data-testid={`post-preview-${platform}`}>
      <CardContent className="pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {platformLabel} Preview
          </span>
          <span className={`text-xs font-mono ${charColor}`} data-testid="text-preview-char-count">
            {content.length} / {limit}
          </span>
        </div>
        <div className="border rounded-md p-4">
          {platform === 'twitter' && <TwitterPreview content={content} userName={userName} />}
          {platform === 'linkedin' && <LinkedInPreview content={content} userName={userName} />}
          {platform === 'facebook' && <FacebookPreview content={content} userName={userName} mediaUrls={mediaUrls} />}
        </div>
      </CardContent>
    </Card>
  )
}
