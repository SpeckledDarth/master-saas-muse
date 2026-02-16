'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export interface BottomHeroCtaSettings {
  headline: string
  subheadline: string
  tagline?: string
  buttonText: string
  buttonLink: string
  backgroundImageUrl?: string
}

interface BottomHeroCtaProps {
  settings: BottomHeroCtaSettings
  className?: string
}

export function BottomHeroCta({ settings, className = '' }: BottomHeroCtaProps) {
  return (
    <section
      className={`relative py-20 md:py-32 overflow-hidden ${className}`}
      data-testid="section-bottom-hero-cta"
    >
      {settings.backgroundImageUrl ? (
        <>
          <Image
            src={settings.backgroundImageUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
            data-testid="img-bottom-hero-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20" />
      )}

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h2
          className={`text-3xl md:text-5xl font-bold mb-4 ${settings.backgroundImageUrl ? 'text-white' : ''}`}
          data-testid="text-bottom-hero-headline"
        >
          {settings.headline}
        </h2>
        <p
          className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${settings.backgroundImageUrl ? 'text-white/80' : 'text-muted-foreground'}`}
          data-testid="text-bottom-hero-subheadline"
        >
          {settings.subheadline}
        </p>

        <Button
          size="lg"
          asChild
          data-testid="button-bottom-hero-cta"
        >
          <Link href={settings.buttonLink}>
            {settings.buttonText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>

        {settings.tagline && (
          <p
            className={`mt-8 text-sm ${settings.backgroundImageUrl ? 'text-white/60' : 'text-muted-foreground'}`}
            data-testid="text-bottom-hero-tagline"
          >
            {settings.tagline}
          </p>
        )}
      </div>
    </section>
  )
}
