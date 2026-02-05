import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, FileText } from 'lucide-react'

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  return data?.settings || {}
}

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest news, updates, and insights',
}

export default async function BlogPage() {
  const supabase = await createClient()
  const settings = await getSettings()
  const appName = settings?.branding?.appName || 'Our'
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('type', 'blog')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <FileText className="h-3 w-3 mr-1" />
            Blog
          </Badge>
          <h1 className="text-4xl font-bold mb-4">{appName} Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Latest news, updates, and insights from our team. Stay up to date with 
            what we're building and learning.
          </p>
        </div>

        {!posts || posts.length === 0 ? (
          <Card className="text-center">
            <CardContent className="py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Check back soon for our first blog post!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="hover-elevate transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {post.published_at 
                          ? new Date(post.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Draft'}
                      </span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                      {post.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                  </CardHeader>
                  {post.excerpt && (
                    <CardContent>
                      <CardDescription className="text-base">
                        {post.excerpt}
                      </CardDescription>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
