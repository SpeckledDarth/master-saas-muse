'use client'

import Image from 'next/image'

export interface ProductShowcaseSettings {
  headline: string
  subheadline?: string
  screenshotUrl: string
  screenshotPositionX?: number
  screenshotPositionY?: number
  backgroundImageUrl?: string
  backgroundPositionX?: number
  backgroundPositionY?: number
  backgroundGradient?: boolean
}

interface ProductShowcaseProps {
  settings: ProductShowcaseSettings
  className?: string
}

export function ProductShowcase({ settings, className = '' }: ProductShowcaseProps) {
  if (!settings.screenshotUrl) return null

  return (
    <section className={`py-16 md:py-24 ${className}`} data-testid="section-product-showcase">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" data-testid="text-showcase-headline">
          {settings.headline}
        </h2>
        {settings.subheadline && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto" data-testid="text-showcase-subheadline">
            {settings.subheadline}
          </p>
        )}

        <div className="relative max-w-5xl mx-auto">
          {settings.backgroundImageUrl && (
            <div className="absolute inset-0 -inset-x-8 -inset-y-8 rounded-2xl overflow-hidden">
              <Image
                src={settings.backgroundImageUrl}
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: `${settings.backgroundPositionX ?? 50}% ${settings.backgroundPositionY ?? 50}%` }}
                unoptimized
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}

          {!settings.backgroundImageUrl && settings.backgroundGradient !== false && (
            <div className="absolute inset-0 -inset-x-8 -inset-y-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10" />
          )}

          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-2xl border border-border/50">
              <div className="relative aspect-[16/10]">
                <Image
                  src={settings.screenshotUrl}
                  alt="Product screenshot"
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${settings.screenshotPositionX ?? 50}% ${settings.screenshotPositionY ?? 0}%` }}
                  unoptimized
                  data-testid="img-product-screenshot"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
