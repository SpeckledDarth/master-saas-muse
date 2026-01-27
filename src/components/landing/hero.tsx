'use client'

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AppName, AppTagline } from "@/components/branding/dynamic-branding"
import { useSettings } from "@/hooks/use-settings"

export function Hero() {
  const { settings, loading } = useSettings()
  const heroImageUrl = settings?.branding?.heroImageUrl
  const heroImagePositionX = settings?.branding?.heroImagePositionX ?? 50
  const heroImagePositionY = settings?.branding?.heroImagePositionY ?? 50
  const heroImageSize = settings?.branding?.heroImageSize || 'cover'
  
  // Use percentage-based positioning for precise control
  const heroImagePosition = `${heroImagePositionX}% ${heroImagePositionY}%`

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {heroImageUrl && (
        <>
          <Image
            src={heroImageUrl}
            alt="Hero background"
            fill
            priority
            unoptimized
            className="absolute inset-0"
            style={{
              objectFit: heroImageSize as 'cover' | 'contain',
              objectPosition: heroImagePosition,
            }}
            data-testid="img-hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </>
      )}
      
      {!heroImageUrl && !loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
      )}

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className={`text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6 ${heroImageUrl ? 'text-white' : ''}`}>
          <AppName />
        </h1>
        <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 ${heroImageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
          <AppTagline />
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild data-testid="button-hero-cta">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            asChild 
            className={heroImageUrl ? 'bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20' : ''}
            data-testid="button-hero-pricing"
          >
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
