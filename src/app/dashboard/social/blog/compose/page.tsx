'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Send, ArrowLeft, Search, Eye, Tag, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { BlogConnection, BlogPlatform } from '@/lib/social/types'
import { BLOG_PLATFORM_CONFIG } from '@/lib/social/types'

function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const displayTitle = title || 'Your Blog Post Title'
  const displayDesc = description || 'A description of your blog post will appear here. Write a compelling meta description to improve click-through rates from search results.'
  const displayUrl = `yourblog.com/${slug || 'your-post-slug'}`

  return (
    <Card data-testid="card-seo-preview">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4" /> SEO Preview
          <HelpTooltip text="This is how your article will appear in Google search results. Optimize title and description for better click-through rates." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-4 bg-white dark:bg-gray-950 space-y-1">
          <p className="text-xs text-green-700 dark:text-green-400 truncate" data-testid="text-seo-url">{displayUrl}</p>
          <p className="text-lg text-blue-700 dark:text-blue-400 font-medium leading-tight line-clamp-1 hover:underline cursor-pointer" data-testid="text-seo-title">
            {displayTitle.length > 60 ? displayTitle.slice(0, 60) + '...' : displayTitle}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" data-testid="text-seo-description">
            {displayDesc.length > 160 ? displayDesc.slice(0, 160) + '...' : displayDesc}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span data-testid="text-title-length">Title: {title.length}/60</span>
          <span data-testid="text-desc-length">Description: {description.length}/160</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BlogComposePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
      <BlogComposePage />
    </Suspense>
  )
}

function BlogComposePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [slug, setSlug] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [tags, setTags] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<BlogPlatform>>(new Set())
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  const [connections, setConnections] = useState<BlogConnection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingPost, setLoadingPost] = useState(!!editId)
  const [showSeoPanel, setShowSeoPanel] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch('/api/social/blog/connections')
        if (res.ok) {
          const data = await res.json()
          setConnections(data.connections || [])
        }
      } catch {} finally {
        setLoadingConnections(false)
      }
    }
    loadConnections()
  }, [])

  useEffect(() => {
    if (!editId) return
    async function loadPost() {
      try {
        const res = await fetch(`/api/social/blog/posts/${editId}`)
        if (!res.ok) throw new Error('Post not found')
        const data = await res.json()
        const post = data.post
        setTitle(post.title || '')
        setContent(post.content || '')
        setExcerpt(post.excerpt || '')
        setSlug(post.slug || '')
        setCoverImageUrl(post.cover_image_url || '')
        setSeoTitle(post.seo_title || '')
        setSeoDescription(post.seo_description || '')
        setTags((post.tags || []).join(', '))
        setSeriesName(post.series_name || '')
        setSelectedPlatforms(new Set(post.platforms || []))
        if (post.scheduled_at) {
          setScheduleEnabled(true)
          setScheduledAt(new Date(post.scheduled_at).toISOString().slice(0, 16))
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Could not load post for editing', variant: 'destructive' })
      } finally {
        setLoadingPost(false)
      }
    }
    loadPost()
  }, [editId, toast])

  const autoSlug = useMemo(() => {
    if (slug) return slug
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }, [title, slug])

  const togglePlatform = (platform: BlogPlatform) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }

  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const body: Record<string, unknown> = {
        title: title.trim(),
        content,
        excerpt: excerpt || undefined,
        slug: autoSlug || undefined,
        coverImageUrl: coverImageUrl || undefined,
        platforms: Array.from(selectedPlatforms),
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        tags: tagList.length > 0 ? tagList : undefined,
        seriesName: seriesName || undefined,
      }

      if (scheduleEnabled && scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString()
      }

      let res: Response
      if (editId) {
        res = await fetch(`/api/social/blog/posts/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/social/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      const data = await res.json()
      toast({ title: editId ? 'Updated' : 'Saved', description: `Article ${editId ? 'updated' : 'saved'} as ${scheduleEnabled ? 'scheduled' : 'draft'}` })
      router.push('/dashboard/social/blog/posts')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 250))

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-blog-compose">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/social/blog">
            <Button variant="ghost" size="icon" data-testid="button-back-blog">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-compose-title">
              {editId ? 'Edit Article' : 'Write Article'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {wordCount} words &middot; {readTime} min read
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSeoPanel(!showSeoPanel)} data-testid="button-toggle-seo">
            <Eye className="mr-2 h-4 w-4" /> {showSeoPanel ? 'Hide' : 'Show'} SEO
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving || !title.trim()} data-testid="button-save-draft-blog">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {editId ? 'Update' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Article title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-xl font-bold h-12 border-none shadow-none focus-visible:ring-0 px-0"
              data-testid="input-blog-title"
            />
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Start writing your article content here...

You can use Markdown formatting:
# Heading 1
## Heading 2
**bold text**
*italic text*
- bullet points
1. numbered lists
> blockquotes"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[400px] resize-y font-mono text-sm"
              data-testid="input-blog-content"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-excerpt">Excerpt</Label>
            <Textarea
              id="blog-excerpt"
              placeholder="A short summary of your article (used in previews and social sharing)"
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              className="resize-none min-h-[80px]"
              data-testid="input-blog-excerpt"
            />
          </div>

          {showSeoPanel && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seo-title">SEO Title</Label>
                  <Input
                    id="seo-title"
                    placeholder={title || 'Custom title for search engines'}
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    data-testid="input-seo-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-slug">URL Slug</Label>
                  <Input
                    id="blog-slug"
                    placeholder={autoSlug || 'your-post-slug'}
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    data-testid="input-blog-slug"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  placeholder="Write a compelling description for search engines (recommended: 120-160 characters)"
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  className="resize-none min-h-[60px]"
                  data-testid="input-seo-description"
                />
              </div>
              <SeoPreview
                title={seoTitle || title}
                description={seoDescription || excerpt}
                slug={slug || autoSlug}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card data-testid="card-publish-settings">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Publish To</CardTitle>
              <CardDescription className="text-xs">Select which platforms to publish this article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingConnections ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No platforms connected yet</p>
                  <Link href="/dashboard/social/blog">
                    <Button variant="outline" size="sm" data-testid="button-connect-platforms">Connect Platforms</Button>
                  </Link>
                </div>
              ) : (
                connections.map(conn => {
                  const config = BLOG_PLATFORM_CONFIG[conn.platform]
                  const isSelected = selectedPlatforms.has(conn.platform)
                  return (
                    <div
                      key={conn.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => togglePlatform(conn.platform)}
                      data-testid={`toggle-platform-${conn.platform}`}
                    >
                      <div className="flex items-center gap-2">
                        <Switch checked={isSelected} onCheckedChange={() => togglePlatform(conn.platform)} />
                        <span className="text-sm font-medium">{config?.name || conn.platform}</span>
                      </div>
                      {conn.is_valid ? (
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 text-[10px]">Ready</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Error</Badge>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-article-settings">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Article Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cover-image">Cover Image URL</Label>
                <Input
                  id="cover-image"
                  placeholder="https://..."
                  value={coverImageUrl}
                  onChange={e => setCoverImageUrl(e.target.value)}
                  data-testid="input-cover-image"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-tags" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </Label>
                <Input
                  id="blog-tags"
                  placeholder="react, nextjs, webdev"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  data-testid="input-blog-tags"
                />
                <p className="text-[11px] text-muted-foreground">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="series-name">Series Name (optional)</Label>
                <Input
                  id="series-name"
                  placeholder="My Tutorial Series"
                  value={seriesName}
                  onChange={e => setSeriesName(e.target.value)}
                  data-testid="input-series-name"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="schedule-blog"
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                  data-testid="switch-schedule-blog"
                />
                <Label htmlFor="schedule-blog">Schedule for later</Label>
              </div>
              {scheduleEnabled && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  data-testid="input-blog-scheduled-at"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
