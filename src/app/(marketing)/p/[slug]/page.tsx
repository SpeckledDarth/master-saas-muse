'use client'

import { useSettings } from '@/hooks/use-settings'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

  return (
    <div className="container mx-auto px-4 py-16">
      <PageHero
        headline={page.headline}
        subheadline={page.subheadline}
        imageUrl={page.heroImageUrl}
        testId={`custom-${page.slug}`}
      />

      <div className="max-w-4xl mx-auto">
        {page.sections && page.sections.length > 0 ? (
          <div className="space-y-12">
            {page.sections.map((section) => (
              <section key={section.id} className="space-y-4">
                {section.type === 'text' && (
                  <Card>
                    <CardContent className="p-8">
                      {section.headline && (
                        <h2 className="text-2xl font-semibold mb-4">{section.headline}</h2>
                      )}
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(section.type === 'image-left' || section.type === 'image-right') && (
                  <div className={`grid md:grid-cols-2 gap-8 items-center ${section.type === 'image-right' ? 'md:flex-row-reverse' : ''}`}>
                    {section.imageUrl && (
                      <div className={section.type === 'image-right' ? 'md:order-2' : ''}>
                        <img
                          src={section.imageUrl}
                          alt={section.headline || ''}
                          className="rounded-lg w-full object-cover"
                        />
                      </div>
                    )}
                    <div className={section.type === 'image-right' ? 'md:order-1' : ''}>
                      {section.headline && (
                        <h2 className="text-2xl font-semibold mb-4">{section.headline}</h2>
                      )}
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </div>
                  </div>
                )}
                {section.type === 'cards' && section.cards && section.cards.length > 0 && (
                  <div>
                    {section.headline && (
                      <h2 className="text-2xl font-semibold mb-6 text-center">{section.headline}</h2>
                    )}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {section.cards.map((card) => (
                        <Card key={card.id} className="hover-elevate">
                          <CardContent className="p-6">
                            <h3 className="font-semibold mb-2">{card.title}</h3>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
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
  )
}
