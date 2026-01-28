'use client'

import { useSettings } from '@/hooks/use-settings'

interface Logo {
  id: string
  name: string
  imageUrl?: string
}

export function LogoMarquee() {
  const { settings } = useSettings()
  const logos = settings?.content?.trustedLogos || []
  const headline = settings?.content?.trustedByHeadline || 'Trusted by industry leaders'

  if (logos.length === 0) {
    return null
  }

  const duplicatedLogos = [...logos, ...logos]

  return (
    <section className="py-12 overflow-hidden" data-testid="section-logo-marquee">
      <div className="container mx-auto px-4 mb-8">
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {headline}
        </p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className="flex-shrink-0 mx-8 flex items-center justify-center h-12"
              data-testid={`logo-${logo.id}`}
            >
              {logo.imageUrl ? (
                <img
                  src={logo.imageUrl}
                  alt={logo.name}
                  className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors whitespace-nowrap">
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
