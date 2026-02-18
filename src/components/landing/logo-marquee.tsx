'use client'

import { useSettings } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'

interface Logo {
  id: string
  name: string
  imageUrl?: string
  imagePositionX?: number
  imagePositionY?: number
}

export function LogoMarquee() {
  const { settings } = useSettings()
  const logos = settings?.content?.trustedLogos || []
  const headline = settings?.content?.trustedByHeadline || 'Trusted by industry leaders'
  const useGrayscale = settings?.content?.logoMarqueeGrayscale !== false
  const logoHeight = settings?.content?.logoMarqueeHeight ?? 32
  const sectionBgColor = settings?.content?.sectionColors?.trustedBy

  if (logos.length === 0) {
    return null
  }

  const duplicatedLogos = [...logos, ...logos]

  const fadeStyle = (direction: 'right' | 'left'): React.CSSProperties => {
    if (sectionBgColor) {
      return {
        background: `linear-gradient(to ${direction}, ${sectionBgColor}, transparent)`
      }
    }
    return {}
  }

  return (
    <section className="py-12" data-testid="section-logo-marquee">
      <div className="container mx-auto px-4 md:px-8 mb-8">
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {headline}
        </p>
      </div>
      <div className="container mx-auto px-4 md:px-8 overflow-hidden">
        <div className="relative">
          <div
            className={cn("absolute left-0 top-0 bottom-0 w-24 z-10", !sectionBgColor && "bg-gradient-to-r from-background to-transparent")}
            style={fadeStyle('right')}
          />
          <div
            className={cn("absolute right-0 top-0 bottom-0 w-24 z-10", !sectionBgColor && "bg-gradient-to-l from-background to-transparent")}
            style={fadeStyle('left')}
          />
          <div className="flex animate-marquee w-max">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.id}-${index}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
                style={{ height: logoHeight + 16 }}
                data-testid={`logo-${logo.id}`}
              >
                {logo.imageUrl ? (
                  <img
                    src={logo.imageUrl}
                    alt={logo.name}
                    className={cn(
                      "w-auto object-cover opacity-60 hover:opacity-100 transition-opacity",
                      useGrayscale && "grayscale hover:grayscale-0"
                    )}
                    style={{
                      height: logoHeight,
                      objectPosition: `${logo.imagePositionX ?? 50}% ${logo.imagePositionY ?? 50}%`
                    }}
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
      </div>
    </section>
  )
}
