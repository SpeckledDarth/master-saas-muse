import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Props {
  params: Promise<{ slug: string }>
}

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  return data?.settings || {}
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const settings = await getSettings()
  const appName = settings?.branding?.appName || 'Blog'
  
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on ${appName}`,
  }
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const settings = await getSettings()
  const appName = settings?.branding?.appName || 'Blog'
  
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('type', 'blog')
    .eq('published', true)
    .single()

  if (!post) {
    notFound()
  }

  const readTime = estimateReadTime(post.content || '')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/blog">
          <Button variant="ghost" className="mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to {appName} Blog
          </Button>
        </Link>

        <article>
          <header className="mb-8 pb-8 border-b">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
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
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            )}
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:text-primary-500 dark:hover:prose-a:text-primary-300 prose-img:rounded-lg">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <footer className="mt-12 pt-8 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground">
                Thanks for reading! Stay tuned for more updates.
              </p>
              <Link href="/blog">
                <Button variant="outline">
                  More articles
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}
