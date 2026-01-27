'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppName, AppTagline, useHeroImageUrl } from '@/components/branding/dynamic-branding'
import { ArrowRight, Check } from 'lucide-react'

export default function HomePage() {
  const { url: heroImageUrl, loading } = useHeroImageUrl()

  return (
    <div className="flex flex-col">
      <section 
        className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
        data-testid="section-hero"
      >
        {heroImageUrl && (
          <>
            <img
              src={heroImageUrl}
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="img-hero"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        )}
        
        {!heroImageUrl && !loading && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        )}

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${heroImageUrl ? 'text-white' : ''}`}>
            <AppName />
          </h1>
          <p className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto ${heroImageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
            <AppTagline />
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className={heroImageUrl ? 'bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20' : ''} data-testid="button-view-pricing">
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50" data-testid="section-features">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Easy Setup"
              description="Get started in minutes with our intuitive setup wizard."
            />
            <FeatureCard
              title="Secure & Reliable"
              description="Built with enterprise-grade security and 99.9% uptime."
            />
            <FeatureCard
              title="Scale with Confidence"
              description="From startup to enterprise, we grow with you."
            />
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-cta">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who trust us with their business.
          </p>
          <Button size="lg" asChild data-testid="button-start-free-trial">
            <Link href="/signup">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card" data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Check className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
