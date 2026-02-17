'use client'

import Image from 'next/image'

interface ImageCollageSectionProps {
  images: string[]
  headline?: string
  subheadline?: string
}

export function ImageCollageSection({ images, headline, subheadline }: ImageCollageSectionProps) {
  if (!images || images.length === 0) return null

  const rotations = [-6, -3, 0, 3, 6]
  const displayImages = images.slice(0, 5)

  return (
    <section className="py-16 md:py-24 overflow-hidden" data-testid="section-image-collage">
      <style>{`
        .collage-card {
          --rotation: 0deg;
          transform: rotate(var(--rotation));
          transition: transform 0.5s ease-out, box-shadow 0.5s ease-out, z-index 0s;
        }
        .collage-card:hover {
          transform: rotate(0deg) scale(1.1) translateY(-8px);
          z-index: 20 !important;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        .collage-card img {
          transition: transform 0.5s ease-out;
        }
        .collage-card:hover img {
          transform: scale(1.05);
        }
      `}</style>
      <div className="container mx-auto px-4">
        {(headline || subheadline) && (
          <div className="text-center mb-12">
            {headline && <h2 className="text-2xl md:text-3xl font-bold mb-3">{headline}</h2>}
            {subheadline && <p className="text-muted-foreground max-w-2xl mx-auto">{subheadline}</p>}
          </div>
        )}
        <div className="flex items-center justify-center">
          {displayImages.map((url, i) => {
            const rotation = rotations[i] ?? 0
            const zIndex = i === Math.floor(displayImages.length / 2) ? 10 : 5 - Math.abs(i - Math.floor(displayImages.length / 2))
            return (
              <div
                key={i}
                className="collage-card relative w-40 h-52 md:w-52 md:h-64 lg:w-60 lg:h-72 rounded-xl overflow-hidden shadow-lg cursor-pointer flex-shrink-0"
                style={{
                  '--rotation': `${rotation}deg`,
                  zIndex,
                  marginLeft: i > 0 ? '-2rem' : '0',
                } as React.CSSProperties}
                data-testid={`img-collage-${i}`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
