'use client'

import { useSettings } from '@/hooks/use-settings'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

export default function CustomPage() {
  const { settings, loading } = useSettings()
  const params = useParams()
  const slug = params.slug as string

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-custom-page" />
      </div>
    )
  }

  const customPages = settings?.pages?.customPages || []
  const page = customPages.find(p => p.slug === slug && p.enabled)

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been disabled.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const hasContent = page.content && page.content.trim().length > 0

  return (
    <div className="flex flex-col">
      <PageHero
        headline={page.headline}
        subheadline={page.subheadline}
        imageUrl={page.heroImageUrl}
        positionX={page.heroImagePositionX ?? 50}
        positionY={page.heroImagePositionY ?? 50}
        testId={`custom-${page.slug}`}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {hasContent ? (
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none" data-testid={`content-custom-${page.slug}`}>
                  <ReactMarkdown>
                    {page.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  This page is being set up. Content coming soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
