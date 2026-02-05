'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, Megaphone, ExternalLink, Loader2, Code } from 'lucide-react'

interface Post {
  id: number
  type: 'blog' | 'changelog'
  title: string
  slug: string
  excerpt: string
  content: string
  published: boolean
  published_at: string | null
  created_at: string
}

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    let processed = content
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, '<br />')
    return `<p class="my-2">${processed}</p>`
  }, [content])

  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit')
  const { toast } = useToast()
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    type: 'blog' as 'blog' | 'changelog',
    published: false,
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch('/api/admin/posts?admin=true')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  function openNewPost(type: 'blog' | 'changelog') {
    setEditingPost(null)
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      type,
      published: false,
    })
    setPreviewTab('edit')
    setDialogOpen(true)
  }

  function openEditPost(post: Post) {
    setEditingPost(post)
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      type: post.type,
      published: post.published,
    })
    setPreviewTab('edit')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.content) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingPost?.id,
          ...form,
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({ title: editingPost ? 'Post updated' : 'Post created' })
        setDialogOpen(false)
        fetchPosts()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save post', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(postId: number, postTitle: string) {
    if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) return
    
    setDeleting(postId)
    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`, { method: 'DELETE' })
      
      if (res.ok) {
        toast({ title: 'Post deleted' })
        fetchPosts()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  async function togglePublish(post: Post) {
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          published: !post.published,
        }),
      })
      
      if (res.ok) {
        toast({ title: post.published ? 'Post unpublished' : 'Post published' })
        fetchPosts()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update post', variant: 'destructive' })
    }
  }

  const blogPosts = posts.filter(p => p.type === 'blog')
  const changelogPosts = posts.filter(p => p.type === 'changelog')

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  function PostCard({ post }: { post: Post }) {
    return (
      <Card data-testid={`post-${post.id}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div 
            className="cursor-pointer hover:opacity-80 min-w-0 flex-1"
            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
            data-testid={`link-view-post-${post.id}`}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {post.type === 'changelog' && <Megaphone className="h-4 w-4 shrink-0" />}
              <span className="truncate">{post.title}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </CardTitle>
            <CardDescription>
              {post.type === 'blog' && <span>/blog/{post.slug} • </span>}
              {new Date(post.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={post.published ? 'default' : 'secondary'}>
              {post.published ? 'Published' : 'Draft'}
            </Badge>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => togglePublish(post)} 
              title={post.published ? 'Unpublish' : 'Publish'}
              data-testid={`button-toggle-publish-${post.id}`}
            >
              {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => openEditPost(post)} 
              title="Edit"
              data-testid={`button-edit-${post.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => handleDelete(post.id, post.title)} 
              title="Delete"
              disabled={deleting === post.id}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-${post.id}`}
            >
              {deleting === post.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {post.excerpt && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div data-testid="blog-header">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Content Management
        </h1>
        <p className="text-muted-foreground">Manage your blog posts and changelog</p>
      </div>

      <Tabs defaultValue="blog">
        <TabsList>
          <TabsTrigger value="blog" data-testid="tab-blog">
            Blog ({blogPosts.length})
          </TabsTrigger>
          <TabsTrigger value="changelog" data-testid="tab-changelog">
            Changelog ({changelogPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNewPost('blog')} data-testid="button-new-blog">
              <Plus className="h-4 w-4 mr-2" />
              New Blog Post
            </Button>
          </div>
          
          {blogPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No blog posts yet</p>
                <p className="text-muted-foreground">Create your first blog post to share with your audience.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="changelog" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNewPost('changelog')} data-testid="button-new-changelog">
              <Plus className="h-4 w-4 mr-2" />
              New Changelog Entry
            </Button>
          </div>
          
          {changelogPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No changelog entries yet</p>
                <p className="text-muted-foreground">Document your first product update or feature release.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {changelogPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Edit' : 'New'} {form.type === 'blog' ? 'Blog Post' : 'Changelog Entry'}
            </DialogTitle>
            <DialogDescription>
              {form.type === 'blog' 
                ? 'Write a blog post for your audience'
                : 'Document a product update or feature release'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2" data-testid="tab-edit">
                <Code className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2" data-testid="tab-preview">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="flex-1 overflow-auto space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter title..."
                    data-testid="input-post-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                    data-testid="input-post-slug"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief summary for SEO and previews..."
                  rows={2}
                  data-testid="input-post-excerpt"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your content in markdown..."
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="input-post-content"
                />
                <p className="text-xs text-muted-foreground">
                  Supports: **bold**, *italic*, `code`, # headings, - lists, [links](url)
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                  data-testid="switch-published"
                />
                <Label htmlFor="published">Publish immediately</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 overflow-auto mt-4" data-testid="markdown-preview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{form.title || 'Untitled'}</CardTitle>
                  {form.excerpt && (
                    <CardDescription className="text-base">{form.excerpt}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {form.content ? (
                    <MarkdownPreview content={form.content} />
                  ) : (
                    <p className="text-muted-foreground italic">No content yet...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-post">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving} data-testid="button-save-post">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
