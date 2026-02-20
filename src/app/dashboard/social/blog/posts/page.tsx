'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Pen, Trash2, FileText, ArrowLeft, Clock, CheckCircle, XCircle, Repeat, ExternalLink, AlertCircle, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'
import Link from 'next/link'
import type { BlogPost, BlogPostStatus } from '@/lib/social/types'
import { BLOG_PLATFORM_CONFIG, BlogPlatform } from '@/lib/social/types'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
  { label: 'Failed', value: 'failed' },
]

function getStatusIcon(status: BlogPostStatus) {
  switch (status) {
    case 'published': return <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
    case 'scheduled': return <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
    case 'failed': return <XCircle className="h-3.5 w-3.5 text-destructive" />
    case 'publishing': return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
    default: return <FileText className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function getStatusVariant(status: BlogPostStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'published': return 'default'
    case 'scheduled': return 'secondary'
    case 'failed': return 'destructive'
    default: return 'outline'
  }
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      const res = await fetch(`/api/social/blog/posts?${params.toString()}`)
      if (!res.ok) { setPosts([]); return }
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    setLoading(true)
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (postId: string) => {
    setDeleting(postId)
    try {
      const res = await fetch(`/api/social/blog/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast({ title: 'Deleted', description: 'Blog post deleted' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  const filteredPosts = searchQuery
    ? posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    : posts

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-blog-posts">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/social/blog">
            <Button variant="ghost" size="icon" data-testid="button-back-blog-posts">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-blog-posts-title">
              Blog Posts <HelpTooltip text="View and manage all your blog articles. Edit, delete, or check their publishing status." />
            </h1>
            <p className="text-muted-foreground mt-1">
              {posts.length} article{posts.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <Link href="/dashboard/social/blog/compose">
          <Button data-testid="button-new-article">
            <Pen className="mr-2 h-4 w-4" /> New Article
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.value)}
              className="toggle-elevate"
              data-testid={`button-blog-tab-${tab.value}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background px-8 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="input-search-blog-posts"
          />
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <Card data-testid="empty-state-blog-posts">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No articles yet</h3>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'all'
                ? 'Write your first blog article to get started.'
                : `No ${activeTab} articles found.`}
            </p>
            <Link href="/dashboard/social/blog/compose">
              <Button className="mt-4" data-testid="button-write-first-article">Write Your First Article</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <Card key={post.id} className="hover-elevate" data-testid={`card-blog-post-${post.id}`}>
              <CardContent className="py-4">
                <div className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(post.status)}
                      <Link
                        href={`/dashboard/social/blog/compose?edit=${post.id}`}
                        className="font-medium hover:underline line-clamp-1"
                        data-testid={`link-blog-post-${post.id}`}
                      >
                        {post.title}
                      </Link>
                    </div>

                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2" data-testid={`text-blog-excerpt-${post.id}`}>
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      <Badge variant={getStatusVariant(post.status)} data-testid={`badge-blog-status-${post.id}`}>
                        {post.status}
                      </Badge>

                      {(post.platforms || []).map(p => (
                        <Badge key={p} variant="outline" className="text-[10px]" data-testid={`badge-blog-platform-${post.id}-${p}`}>
                          {BLOG_PLATFORM_CONFIG[p as BlogPlatform]?.name || p}
                        </Badge>
                      ))}

                      {post.tags && post.tags.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          {post.tags.slice(0, 3).map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                          {post.tags.length > 3 && <span>+{post.tags.length - 3}</span>}
                        </span>
                      )}

                      {post.series_name && (
                        <span className="italic">Series: {post.series_name}</span>
                      )}

                      {post.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(post.scheduled_at)}
                        </span>
                      )}

                      {post.published_at && (
                        <span>Published: {formatDate(post.published_at)}</span>
                      )}

                      {post.repurposed && (
                        <Badge variant="outline" className="text-[10px]">
                          <Repeat className="mr-0.5 h-2.5 w-2.5" /> {post.repurpose_count} snippets
                        </Badge>
                      )}
                    </div>

                    {post.published_urls && Object.keys(post.published_urls).length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {Object.entries(post.published_urls).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> {BLOG_PLATFORM_CONFIG[platform as BlogPlatform]?.name || platform}
                          </a>
                        ))}
                      </div>
                    )}

                    {post.error_message && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" /> {post.error_message}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/dashboard/social/blog/compose?edit=${post.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-blog-${post.id}`}>
                        <Pen className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      data-testid={`button-delete-blog-${post.id}`}
                    >
                      {deleting === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
