'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { AnimatedWords } from './animated-words'

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
  animatedWords?: string[]
  background?: 'transparent' | 'muted' | 'gradient' | 'accent'
  gap?: number
  imageHeight?: number
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
  className = '',
  animatedWords = [],
  background = 'transparent',
  gap = 12,
  imageHeight = 400
}: SplitHeroProps) {
  const isImageLeft = imagePosition === 'left'

  const bgClasses = {
    transparent: '',
    muted: 'bg-muted/50',
    gradient: 'bg-gradient-to-br from-primary/10 via-background to-accent/20',
    accent: 'bg-accent/20'
  }

  // Convert gap number to pixels for consistent sizing
  // 0 = 0px, 12 = 48px, 24 = 96px (for visible difference)
  const gapPx = gap * 4
  
  return (
    <section className={`py-16 md:py-24 ${bgClasses[background]} ${className}`} data-testid="section-split-hero">
      <div className="container mx-auto px-4">
        <div 
          className={`grid grid-cols-1 md:grid-cols-[auto_1fr] items-center ${isImageLeft ? 'md:grid-cols-[1fr_auto] [&>*:first-child]:md:order-2' : ''}`}
          style={{ gap: `${gapPx}px` }}
          data-gap={gap}
        >
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {animatedWords.length > 0 ? (
                <AnimatedWords words={animatedWords} className="text-primary" />
              ) : (
                headline
              )}
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
          
          <div>
            <div 
              className="relative rounded-xl overflow-hidden shadow-2xl"
              style={{ height: `${imageHeight}px`, width: 'auto', aspectRatio: '4/3' }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
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
