'use client'

interface PageHeroProps {
  headline: string
  subheadline?: string
  imageUrl?: string | null
  testId?: string
}

export function PageHero({ headline, subheadline, imageUrl, testId }: PageHeroProps) {
  if (!imageUrl) {
    return (
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" data-testid={testId ? `${testId}-headline` : undefined}>
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

  return (
    <div className="relative -mx-4 mb-12 overflow-hidden">
      <div className="relative h-[300px] md:h-[400px]">
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          data-testid={testId ? `${testId}-image` : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg"
            data-testid={testId ? `${testId}-headline` : undefined}
          >
            {headline}
          </h1>
          {subheadline && (
            <p 
              className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md"
              data-testid={testId ? `${testId}-subheadline` : undefined}
            >
              {subheadline}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
