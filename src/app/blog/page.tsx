import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest news, updates, and insights',
}

export default async function BlogPage() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('type', 'blog')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-muted-foreground mb-8">
          Latest news, updates, and insights from our team.
        </p>

        {!posts || posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No blog posts yet. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="hover-elevate transition-all cursor-pointer">
                  <CardHeader>
                    <CardDescription>
                      {post.published_at 
                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Draft'}
                    </CardDescription>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                  </CardHeader>
                  {post.excerpt && (
                    <CardContent>
                      <p className="text-muted-foreground">{post.excerpt}</p>
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
