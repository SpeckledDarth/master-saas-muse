'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface SplitHeroProps {
  headline: string
  subheadline?: string
  imageUrl: string
  imageAlt?: string
  imagePosition?: 'left' | 'right'
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  className?: string
}

export function SplitHero({
  headline,
  subheadline,
  imageUrl,
  imageAlt = 'Hero image',
  imagePosition = 'right',
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  className = ''
}: SplitHeroProps) {
  const isImageLeft = imagePosition === 'left'

  return (
    <section className={`py-16 md:py-24 ${className}`} data-testid="section-split-hero">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${isImageLeft ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12 lg:gap-16`}>
          <div className="w-full md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {headline}
            </h1>
            
            {subheadline && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {subheadline}
              </p>
            )}
            
            {(primaryButtonText || secondaryButtonText) && (
              <div className="flex flex-wrap gap-4 pt-4">
                {primaryButtonText && primaryButtonLink && (
                  <Button size="lg" asChild data-testid="button-split-hero-primary">
                    <Link href={primaryButtonLink}>
                      {primaryButtonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {secondaryButtonText && secondaryButtonLink && (
                  <Button size="lg" variant="outline" asChild data-testid="button-split-hero-secondary">
                    <Link href={secondaryButtonLink}>
                      {secondaryButtonText}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="relative aspect-square md:aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-muted-foreground">Hero image</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
