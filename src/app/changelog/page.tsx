import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Product updates and new features',
}

export default async function ChangelogPage() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('type', 'changelog')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Changelog</h1>
        <p className="text-muted-foreground mb-8">
          Stay up to date with the latest improvements and features.
        </p>

        {!posts || posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No changelog entries yet. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Card key={post.id} className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 dark:bg-primary-400 rounded-l-lg" />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">
                      {post.published_at 
                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Draft'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
