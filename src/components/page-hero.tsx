'use client'

import Image from 'next/image'

interface PageHeroProps {
  headline: string
  subheadline?: string
  imageUrl?: string | null
  positionX?: number
  positionY?: number
  testId?: string
}

export function PageHero({ headline, subheadline, imageUrl, positionX = 50, positionY = 50, testId }: PageHeroProps) {
  if (!imageUrl) {
    return (
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid={testId ? `${testId}-headline` : undefined}>
          {headline}
        </h1>
        {subheadline && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid={testId ? `${testId}-subheadline` : undefined}>
            {subheadline}
          </p>
        )}
      </div>
    )
  }

  const objectPosition = `${positionX}% ${positionY}%`

  return (
    <section className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-hidden">
      <Image
        src={imageUrl}
        alt=""
        fill
        priority
        unoptimized
        className="absolute inset-0"
        style={{
          objectFit: 'cover',
          objectPosition,
        }}
        data-testid={testId ? `${testId}-image` : undefined}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg"
          data-testid={testId ? `${testId}-headline` : undefined}
        >
          {headline}
        </h1>
        {subheadline && (
          <p 
            className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-md"
            data-testid={testId ? `${testId}-subheadline` : undefined}
          >
            {subheadline}
          </p>
        )}
      </div>
    </section>
  )
}
