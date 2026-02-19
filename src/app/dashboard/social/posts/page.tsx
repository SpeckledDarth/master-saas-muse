'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Send, Clock, Sparkles, Twitter, Linkedin, Facebook, Trash2, Edit, FileText, AlertCircle, Heart, MessageCircle, Share2, MousePointerClick } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PostPreview } from '@/components/social/post-preview'
import { BulkImport } from '@/components/social/bulk-import'
import { PlatformIconCircle } from '@/components/social/platform-icon'
import { PostDetailDialog, PostDetailData } from '@/components/social/post-detail-dialog'
import { DEMO_POSTS } from '@/lib/social/demo-data'

type PostStatus = 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed'

interface SocialPost {
  id: string
  user_id: string
  platform: string
  content: string
  media_urls: string[]
  status: PostStatus
  scheduled_at: string | null
  posted_at: string | null
  platform_post_id: string | null
  error_message: string | null
  ai_generated: boolean
  created_at: string
  engagement_likes?: number
  engagement_shares?: number
  engagement_comments?: number
  engagement_clicks?: number
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Posted', value: 'posted' },
  { label: 'Failed', value: 'failed' },
]

function getStatusVariant(status: PostStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'posted': return 'default'
    case 'scheduled': return 'secondary'
    case 'failed': return 'destructive'
    case 'posting': return 'outline'
    default: return 'outline'
  }
}

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [moduleDisabled, setModuleDisabled] = useState(false)
  const { toast } = useToast()

  const [platform, setPlatform] = useState('twitter')
  const [content, setContent] = useState('')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPlatform, setAiPlatform] = useState('twitter')
  const [aiTopic, setAiTopic] = useState('')
  const [aiBrandVoice, setAiBrandVoice] = useState('')
  const [aiStyle, setAiStyle] = useState('professional')
  const [aiHashtags, setAiHashtags] = useState(true)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState('')

  const [deleting, setDeleting] = useState<string | null>(null)
  const [detailPost, setDetailPost] = useState<PostDetailData | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      const res = await fetch(`/api/social/posts?${params.toString()}`)
      if (res.status === 403) {
        setModuleDisabled(true)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setPosts(DEMO_POSTS as unknown as SocialPost[])
        setLoading(false)
        return
      }
      let data
      try { data = await res.json() } catch { data = {} }
      const realPosts = data.posts || []
      setPosts(realPosts.length > 0 ? realPosts : DEMO_POSTS as unknown as SocialPost[])
    } catch {
      setPosts(DEMO_POSTS as unknown as SocialPost[])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    setLoading(true)
    fetchPosts()
  }, [fetchPosts])

  const handleCreatePost = async (postNow: boolean) => {
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Content is required', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { platform, content: content.trim() }
      if (scheduleEnabled && scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString()
      }

      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create post')
      }

      const data = await res.json()
      setPosts(prev => [data.post, ...prev])
      setContent('')
      setScheduleEnabled(false)
      setScheduledAt('')
      toast({ title: 'Post Created', description: scheduleEnabled ? 'Post has been scheduled' : 'Post saved as draft' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    setDeleting(postId)
    try {
      const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete post')
      }
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast({ title: 'Deleted', description: 'Post has been deleted' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const openEditDialog = (post: SocialPost) => {
    setEditingPost(post)
    setEditContent(post.content)
    setEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingPost) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/social/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update post')
      }
      const data = await res.json()
      setPosts(prev => prev.map(p => (p.id === editingPost.id ? data.post : p)))
      setEditDialogOpen(false)
      setEditingPost(null)
      toast({ title: 'Updated', description: 'Post has been updated' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast({ title: 'Error', description: 'Topic is required', variant: 'destructive' })
      return
    }
    setAiGenerating(true)
    setAiResult('')
    try {
      const res = await fetch('/api/social/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: aiPlatform,
          topic: aiTopic.trim(),
          brandVoice: aiBrandVoice.trim() || undefined,
          style: aiStyle,
          includeHashtags: aiHashtags,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate post')
      }
      const data = await res.json()
      setAiResult(data.content || '')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setAiGenerating(false)
    }
  }

  const handleUseAiPost = () => {
    setPlatform(aiPlatform)
    setContent(aiResult)
    setAiDialogOpen(false)
    setAiResult('')
    setAiTopic('')
    setAiBrandVoice('')
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const charLimit = PLATFORM_LIMITS[platform] || 280

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-social-posts">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card data-testid="error-state-posts">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchPosts() }} data-testid="button-retry-posts">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (moduleDisabled) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-social-disabled-title">Social Module Not Enabled</CardTitle>
            <CardDescription data-testid="text-social-disabled-description">
              The social media module is not enabled. Please contact your administrator to enable it in the admin settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-posts-title">Social Posts</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-posts-description">
            Create, schedule, and manage your social media posts
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <BulkImport onImported={() => { setLoading(true); fetchPosts() }} />
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-generate-ai">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg" data-testid="dialog-ai-generate">
            <DialogHeader>
              <DialogTitle data-testid="text-ai-dialog-title">Generate Post with AI</DialogTitle>
              <DialogDescription data-testid="text-ai-dialog-description">
                Describe your topic and style, and AI will generate a post for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-platform">Platform</Label>
                <Select value={aiPlatform} onValueChange={setAiPlatform}>
                  <SelectTrigger data-testid="select-ai-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-topic">Topic</Label>
                <Input
                  id="ai-topic"
                  placeholder="What should the post be about?"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  data-testid="input-ai-topic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-brand-voice">Brand Voice (optional)</Label>
                <Textarea
                  id="ai-brand-voice"
                  placeholder="Describe your brand's tone..."
                  value={aiBrandVoice}
                  onChange={e => setAiBrandVoice(e.target.value)}
                  className="resize-none"
                  data-testid="input-ai-brand-voice"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-style">Style</Label>
                <Select value={aiStyle} onValueChange={setAiStyle}>
                  <SelectTrigger data-testid="select-ai-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="ai-hashtags"
                  checked={aiHashtags}
                  onCheckedChange={setAiHashtags}
                  data-testid="switch-ai-hashtags"
                />
                <Label htmlFor="ai-hashtags">Include Hashtags</Label>
              </div>

              {aiResult && (
                <Card data-testid="card-ai-result">
                  <CardContent className="pt-4">
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-ai-result">{aiResult}</p>
                    <div className="flex justify-end mt-3">
                      <Button onClick={handleUseAiPost} data-testid="button-use-ai-post">
                        Use This Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAiDialogOpen(false)}
                  data-testid="button-ai-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiTopic.trim()}
                  data-testid="button-ai-generate-submit"
                >
                  {aiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6" data-testid="card-create-post">
        <CardHeader>
          <CardTitle className="text-lg">Create Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-platform">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger data-testid="select-post-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label htmlFor="post-content">Content</Label>
              <span
                className={`text-xs ${content.length > charLimit ? 'text-destructive' : 'text-muted-foreground'}`}
                data-testid="text-char-count"
              >
                {content.length} / {charLimit}
              </span>
            </div>
            <Textarea
              id="post-content"
              placeholder="Write your post..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="input-post-content"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="schedule-toggle"
              checked={scheduleEnabled}
              onCheckedChange={setScheduleEnabled}
              data-testid="switch-schedule"
            />
            <Label htmlFor="schedule-toggle">Schedule for later</Label>
          </div>
          {scheduleEnabled && (
            <div className="space-y-2">
              <Label htmlFor="scheduled-at">Date & Time</Label>
              <Input
                id="scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                data-testid="input-scheduled-at"
              />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleCreatePost(false)}
              disabled={submitting || !content.trim()}
              variant={scheduleEnabled ? 'outline' : 'default'}
              data-testid="button-save-draft"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {scheduleEnabled ? 'Schedule' : 'Save as Draft'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {content.trim() && (
        <div className="mb-6" data-testid="section-post-preview">
          <PostPreview
            content={content}
            platform={platform as 'twitter' | 'linkedin' | 'facebook'}
          />
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
            data-testid={`button-tab-${tab.value}`}
            className="toggle-elevate"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {posts.length === 0 ? (
        <Card data-testid="empty-state-posts">
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4" data-testid="empty-icon-composition">
              <Twitter className="h-8 w-8 text-muted-foreground/40" />
              <FileText className="h-12 w-12 text-muted-foreground" />
              <Linkedin className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium" data-testid="text-no-posts">No posts yet</h3>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'all'
                ? 'Create your first social media post using the form above.'
                : `No ${activeTab} posts found. Try a different filter or create a new post.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className="cursor-pointer hover-elevate active-elevate-2" onClick={() => setDetailPost(post)} data-testid={`card-post-${post.id}`}>
              <CardContent className="py-4">
                <div className="flex flex-row items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <PlatformIconCircle platform={post.platform} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm line-clamp-2"
                        data-testid={`text-post-content-${post.id}`}
                      >
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
                        <Badge variant={getStatusVariant(post.status)} data-testid={`badge-status-${post.id}`}>
                          {post.status}
                        </Badge>
                        {post.scheduled_at && (
                          <span className="flex items-center gap-1" data-testid={`text-scheduled-${post.id}`}>
                            <Clock className="h-3 w-3" />
                            {formatDate(post.scheduled_at)}
                          </span>
                        )}
                        {post.posted_at && (
                          <span data-testid={`text-posted-at-${post.id}`}>
                            Posted: {formatDate(post.posted_at)}
                          </span>
                        )}
                        {post.ai_generated && (
                          <Badge variant="outline" data-testid={`badge-ai-${post.id}`}>
                            <Sparkles className="mr-1 h-3 w-3" /> AI
                          </Badge>
                        )}
                      </div>
                      {post.error_message && (
                        <p className="text-xs text-destructive mt-1" data-testid={`text-error-${post.id}`}>
                          {post.error_message}
                        </p>
                      )}
                      {post.status === 'posted' && (post.engagement_likes || post.engagement_shares || post.engagement_comments || post.engagement_clicks) && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground" data-testid={`engagement-${post.id}`}>
                          {typeof post.engagement_likes === 'number' && (
                            <span className="flex items-center gap-1" data-testid={`likes-${post.id}`}>
                              <Heart className="h-3 w-3" /> {post.engagement_likes.toLocaleString()}
                            </span>
                          )}
                          {typeof post.engagement_comments === 'number' && (
                            <span className="flex items-center gap-1" data-testid={`comments-${post.id}`}>
                              <MessageCircle className="h-3 w-3" /> {post.engagement_comments.toLocaleString()}
                            </span>
                          )}
                          {typeof post.engagement_shares === 'number' && (
                            <span className="flex items-center gap-1" data-testid={`shares-${post.id}`}>
                              <Share2 className="h-3 w-3" /> {post.engagement_shares.toLocaleString()}
                            </span>
                          )}
                          {typeof post.engagement_clicks === 'number' && (
                            <span className="flex items-center gap-1" data-testid={`clicks-${post.id}`}>
                              <MousePointerClick className="h-3 w-3" /> {post.engagement_clicks.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {(post.status === 'draft' || post.status === 'scheduled') && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openEditDialog(post) }}
                        data-testid={`button-edit-${post.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(post.id) }}
                        disabled={deleting === post.id}
                        data-testid={`button-delete-${post.id}`}
                      >
                        {deleting === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-post">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-dialog-title">Edit Post</DialogTitle>
            <DialogDescription>Update your post content below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="min-h-[120px] resize-none"
              data-testid="input-edit-content"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-edit-cancel">
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={editSaving} data-testid="button-edit-save">
                {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostDetailDialog
        post={detailPost}
        open={!!detailPost}
        onOpenChange={(open) => { if (!open) setDetailPost(null) }}
      />
    </div>
  )
}
