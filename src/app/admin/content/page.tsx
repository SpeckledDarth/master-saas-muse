'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, Megaphone } from 'lucide-react'

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

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
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
        body: JSON.stringify({
          id: editingPost?.id,
          ...form,
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      })
      
      if (res.ok) {
        toast({ title: editingPost ? 'Post updated' : 'Post created' })
        setDialogOpen(false)
        fetchPosts()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save post', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(postId: number) {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`, { method: 'DELETE' })
      
      if (res.ok) {
        toast({ title: 'Post deleted' })
        fetchPosts()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' })
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
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
              <CardContent className="py-12 text-center text-muted-foreground">
                No blog posts yet. Create your first one!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <Card key={post.id} data-testid={`post-${post.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        /blog/{post.slug} • {new Date(post.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => togglePublish(post)}>
                        {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEditPost(post)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
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
              <CardContent className="py-12 text-center text-muted-foreground">
                No changelog entries yet. Document your first update!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {changelogPosts.map((post) => (
                <Card key={post.id} data-testid={`post-${post.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        {post.title}
                      </CardTitle>
                      <CardDescription>
                        {new Date(post.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => togglePublish(post)}>
                        {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEditPost(post)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          
          <div className="space-y-4 py-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Brief summary..."
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
                rows={10}
                className="font-mono text-sm"
                data-testid="input-post-content"
              />
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-post">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
