'use client'

import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface FounderLetterSettings {
  headline: string
  body: string
  founderName: string
  founderTitle: string
  founderImageUrl?: string
  signatureImageUrl?: string
  backgroundImageUrl?: string
}

interface FounderLetterProps {
  settings: FounderLetterSettings
  className?: string
}

export function FounderLetter({ settings, className = '' }: FounderLetterProps) {
  const initials = settings.founderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <section className={`py-16 md:py-24 ${className}`} data-testid="section-founder-letter">
      <div className="container mx-auto px-4">
        {settings.backgroundImageUrl && (
          <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-10">
            <Image
              src={settings.backgroundImageUrl}
              alt="Team photo"
              fill
              className="object-cover"
              unoptimized
              data-testid="img-founder-letter-bg"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl md:text-2xl font-bold mb-8" data-testid="text-founder-letter-headline">
            {settings.headline}
          </h3>

          <div className="space-y-4 text-muted-foreground leading-relaxed" data-testid="text-founder-letter-body">
            {settings.body.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4">
            {settings.signatureImageUrl ? (
              <div className="flex flex-col gap-4">
                <p className="text-muted-foreground">Sincerely,</p>
                <div className="relative h-12 w-40">
                  <Image
                    src={settings.signatureImageUrl}
                    alt={`${settings.founderName}'s signature`}
                    fill
                    className="object-contain object-left"
                    unoptimized
                    data-testid="img-founder-signature"
                  />
                </div>
                <div>
                  <p className="font-semibold" data-testid="text-founder-name">{settings.founderName}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-founder-title">{settings.founderTitle}</p>
                </div>
              </div>
            ) : (
              <>
                <Avatar className="h-14 w-14">
                  {settings.founderImageUrl && (
                    <AvatarImage src={settings.founderImageUrl} alt={settings.founderName} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold" data-testid="text-founder-name">{settings.founderName}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-founder-title">{settings.founderTitle}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
