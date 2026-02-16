'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { ImageTextSection } from '@/components/landing/image-text-section'
import { BottomHeroCta } from '@/components/landing/bottom-hero-cta'

export default function FeatureSubPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="relative min-h-[400px] flex items-center justify-center bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <div className="h-12 w-64 mx-auto mb-6 bg-muted animate-pulse rounded" />
            <div className="h-6 w-96 mx-auto mb-8 bg-muted animate-pulse rounded" />
          </div>
        </section>
      </div>
    )
  }

  const featurePages = settings?.content?.featureSubPages || []
  const page = featurePages.find(p => p.slug === slug)

  if (!page) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center" data-testid="feature-page-not-found">
        <h1 className="text-2xl font-bold mb-4" data-testid="text-not-found-headline">Page not found</h1>
        <p className="text-muted-foreground mb-6" data-testid="text-not-found-message">The feature page you're looking for doesn't exist.</p>
        <Button asChild data-testid="button-back-home">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col" data-testid={`feature-page-${slug}`}>
      <section
        className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-hidden"
        data-testid="section-feature-hero"
      >
        {page.heroBackgroundImageUrl ? (
          <>
            <Image
              src={page.heroBackgroundImageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        )}

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1
            className={`text-3xl md:text-5xl font-bold mb-6 ${page.heroBackgroundImageUrl ? 'text-white' : ''}`}
            data-testid="text-feature-hero-headline"
          >
            {page.heroHeadline}
          </h1>
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto mb-8 ${page.heroBackgroundImageUrl ? 'text-white/80' : 'text-muted-foreground'}`}
            data-testid="text-feature-hero-subheadline"
          >
            {page.heroSubheadline}
          </p>
          {page.ctaText && page.ctaLink && (
            <Button
              size="lg"
              asChild
              data-testid="button-feature-hero-cta"
            >
              <Link href={page.ctaLink}>
                {page.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>

        {page.heroImageUrl && (
          <div className="relative z-10 container mx-auto px-4 mt-8">
            <div className="max-w-4xl mx-auto relative rounded-lg overflow-hidden shadow-2xl border border-border/50">
              <div className="relative aspect-[16/10]">
                <Image
                  src={page.heroImageUrl}
                  alt={page.title}
                  fill
                  className="object-cover object-top"
                  unoptimized
                  data-testid="img-feature-hero-screenshot"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {page.blocks && page.blocks.length > 0 && (
        <ImageTextSection blocks={page.blocks} />
      )}

      {page.ctaText && page.ctaLink && (
        <BottomHeroCta
          settings={{
            headline: page.heroHeadline,
            subheadline: page.heroSubheadline,
            buttonText: page.ctaText,
            buttonLink: page.ctaLink,
          }}
        />
      )}
    </div>
  )
}
