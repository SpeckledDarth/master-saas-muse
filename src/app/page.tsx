'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AppName, AppTagline } from '@/components/branding/dynamic-branding'
import { useSettings } from '@/hooks/use-settings'
import { ArrowRight, Zap, Shield, Sparkles, Users, BarChart, Lock, Rocket, Heart, Star, Target, Award, Lightbulb, ChevronDown, Quote } from 'lucide-react'
import { useState } from 'react'
import { LogoMarquee } from '@/components/landing/logo-marquee'
import { AnimatedCounterSection } from '@/components/landing/animated-counter'
import { ProcessSteps } from '@/components/landing/process-steps'
import { GradientText } from '@/components/landing/gradient-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TestimonialCarousel } from '@/components/landing/testimonial-carousel'
import { ImageTextSection } from '@/components/landing/image-text-section'
import { SplitHero } from '@/components/landing/split-hero'
import { AnnouncementBar } from '@/components/landing/announcement-bar'
import { AnimatedWords } from '@/components/landing/animated-words'
import { CustomerStories } from '@/components/landing/customer-stories'

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-5 w-5 text-primary" />,
  Shield: <Shield className="h-5 w-5 text-primary" />,
  Sparkles: <Sparkles className="h-5 w-5 text-primary" />,
  Users: <Users className="h-5 w-5 text-primary" />,
  BarChart: <BarChart className="h-5 w-5 text-primary" />,
  Lock: <Lock className="h-5 w-5 text-primary" />,
  Rocket: <Rocket className="h-5 w-5 text-primary" />,
  Heart: <Heart className="h-5 w-5 text-primary" />,
  Star: <Star className="h-5 w-5 text-primary" />,
  Target: <Target className="h-5 w-5 text-primary" />,
  Award: <Award className="h-5 w-5 text-primary" />,
  Lightbulb: <Lightbulb className="h-5 w-5 text-primary" />,
}

export default function HomePage() {
  const { settings, loading } = useSettings()
  const heroImageUrl = settings?.branding?.heroImageUrl
  const heroImagePositionX = settings?.branding?.heroImagePositionX ?? 50
  const heroImagePositionY = settings?.branding?.heroImagePositionY ?? 50
  const heroImageSize = settings?.branding?.heroImageSize || 'cover'
  const heroImagePosition = `${heroImagePositionX}% ${heroImagePositionY}%`

  const content = settings?.content
  const featuresEnabled = content?.featuresEnabled ?? true
  const testimonialsEnabled = content?.testimonialsEnabled ?? true
  const faqEnabled = content?.faqEnabled ?? true
  const ctaEnabled = content?.ctaEnabled ?? true
  const trustedByEnabled = content?.trustedByEnabled ?? false
  const metricsEnabled = content?.metricsEnabled ?? false
  const processEnabled = content?.processEnabled ?? false
  const testimonialStyle = content?.testimonialStyle ?? 'cards'
  const imageTextEnabled = content?.imageTextEnabled ?? false
  const heroStyle = content?.heroStyle ?? 'fullWidth'

  // Show loading skeleton to prevent flash of default content
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-muted/50">
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="h-16 w-64 mx-auto mb-6 bg-muted animate-pulse rounded" />
            <div className="h-8 w-96 mx-auto mb-8 bg-muted animate-pulse rounded" />
            <div className="flex gap-4 justify-center">
              <div className="h-12 w-36 bg-muted animate-pulse rounded" />
              <div className="h-12 w-36 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const splitHeroImageUrl = content?.splitHeroImageUrl
  const splitHeroImagePosition = content?.splitHeroImagePosition ?? 'right'
  const appName = settings?.branding?.appName || 'My SaaS'
  const appTagline = settings?.branding?.tagline || 'Build something amazing'
  const heroVideoUrl = settings?.branding?.heroVideoUrl
  const heroPatternUrl = settings?.branding?.heroPatternUrl
  const heroPatternOpacity = settings?.branding?.heroPatternOpacity ?? 20
  const heroFloatingImageUrl = settings?.branding?.heroFloatingImageUrl

  const customerStoriesEnabled = content?.customerStoriesEnabled ?? false
  const heroAnimatedWords = content?.heroAnimatedWords || []

  const getSectionBg = (section: 'features' | 'testimonials' | 'faq' | 'cta' | 'customerStories') => {
    const style = content?.sectionBackgrounds?.[section] ?? 'default'
    if (style === 'muted') return 'bg-muted/50'
    if (style === 'gradient') return 'bg-gradient-to-br from-primary/5 via-background to-accent/5'
    if (style === 'mesh') return 'bg-mesh'
    return ''
  }

  const renderHeroContent = (isDark: boolean) => (
    <div className="relative z-10 container mx-auto px-4 text-center">
      <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : ''}`}>
        {heroAnimatedWords.length > 0 ? (
          <AnimatedWords words={heroAnimatedWords} className="text-primary" />
        ) : (
          <AppName />
        )}
      </h1>
      <p className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto ${isDark ? 'text-white/90' : 'text-muted-foreground'}`}>
        <AppTagline />
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild data-testid="button-get-started">
          <Link href="/signup">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className={isDark ? 'bg-white/10 backdrop-blur-sm border-white/30 text-white' : ''} data-testid="button-view-pricing">
          <Link href="/pricing">
            View Pricing
          </Link>
        </Button>
      </div>
    </div>
  )

  const renderHero = () => {
    if (heroStyle === 'split' && splitHeroImageUrl) {
      const splitHeroBackground = settings?.content?.splitHeroBackground || 'transparent'
      const splitHeroGap = settings?.content?.splitHeroGap ?? 12
      const splitHeroImageHeight = settings?.content?.splitHeroImageHeight ?? 400
      return (
        <SplitHero
          headline={appName}
          subheadline={appTagline}
          imageUrl={splitHeroImageUrl}
          imagePosition={splitHeroImagePosition}
          primaryButtonText="Get Started Free"
          primaryButtonLink="/signup"
          secondaryButtonText="View Pricing"
          secondaryButtonLink="/pricing"
          animatedWords={heroAnimatedWords}
          background={splitHeroBackground}
          gap={splitHeroGap}
          imageHeight={splitHeroImageHeight}
        />
      )
    }

    if (heroStyle === 'video' && heroVideoUrl) {
      const isYoutube = heroVideoUrl.includes('youtube.com') || heroVideoUrl.includes('youtu.be')
      const isVimeo = heroVideoUrl.includes('vimeo.com')
      
      const getVideoSrc = () => {
        if (isYoutube) {
          let videoId = ''
          if (heroVideoUrl.includes('youtu.be/')) {
            videoId = heroVideoUrl.split('youtu.be/')[1]?.split('?')[0] || ''
          } else if (heroVideoUrl.includes('watch?v=')) {
            videoId = heroVideoUrl.split('watch?v=')[1]?.split('&')[0] || ''
          } else if (heroVideoUrl.includes('/embed/')) {
            videoId = heroVideoUrl.split('/embed/')[1]?.split('?')[0] || ''
          }
          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&playlist=${videoId}`
          }
          return heroVideoUrl
        }
        if (isVimeo) {
          const vimeoId = heroVideoUrl.split('/').pop()?.split('?')[0] || ''
          if (vimeoId) {
            return `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&muted=1&loop=1`
          }
          return heroVideoUrl
        }
        return heroVideoUrl
      }
      
      return (
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="section-hero-video">
          <div className="absolute inset-0">
            {isYoutube || isVimeo ? (
              <iframe
                src={getVideoSrc()}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scale(1.5)' }}
                allow="autoplay; fullscreen"
                frameBorder="0"
              />
            ) : (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={heroVideoUrl} type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
          </div>
          {renderHeroContent(true)}
        </section>
      )
    }

    if (heroStyle === 'pattern') {
      return (
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="section-hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/30" />
          {heroPatternUrl && (
            <div 
              className="absolute inset-0 bg-repeat"
              style={{ 
                backgroundImage: `url(${heroPatternUrl})`,
                opacity: heroPatternOpacity / 100 
              }}
            />
          )}
          {renderHeroContent(false)}
        </section>
      )
    }

    if (heroStyle === 'floating' && heroFloatingImageUrl) {
      const floatingGap = settings?.content?.floatingHeroGap ?? 8
      const floatingImageHeight = settings?.content?.floatingHeroImageHeight ?? 400
      return (
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="section-hero-floating">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
          <div className="relative z-10 container mx-auto px-4 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-[auto_auto] items-center" style={{ gap: `${floatingGap * 4}px` }}>
              <div className="text-left space-y-6 max-w-lg">
                <h1 className="text-4xl md:text-6xl font-bold">
                  {heroAnimatedWords.length > 0 ? (
                    <AnimatedWords words={heroAnimatedWords} className="text-primary" />
                  ) : (
                    <AppName />
                  )}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  <AppTagline />
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild data-testid="button-get-started">
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild data-testid="button-view-pricing">
                    <Link href="/pricing">
                      View Pricing
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="relative animate-float" style={{ height: `${floatingImageHeight}px`, aspectRatio: '4/3' }}>
                  <Image
                    src={heroFloatingImageUrl}
                    alt="Product mockup"
                    fill
                    className="object-contain drop-shadow-2xl"
                    unoptimized
                    data-testid="img-hero-floating"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section 
        className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
        data-testid="section-hero"
      >
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

        {renderHeroContent(!!heroImageUrl)}
      </section>
    )
  }

  return (
    <div className="flex flex-col">
      <AnnouncementBar />
      {renderHero()}

      {trustedByEnabled && <LogoMarquee />}

      {metricsEnabled && (content?.metrics?.length ?? 0) > 0 && (
        <AnimatedCounterSection 
          metrics={content?.metrics || []}
          headline={content?.metricsHeadline}
        />
      )}

      {featuresEnabled && (content?.featureCards?.length ?? 0) > 0 && (
        <section className={`py-20 ${getSectionBg('features') || 'bg-muted/50'}`} data-testid="section-features">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">
              {content?.featuresHeadline || 'Everything you need'}
            </h2>
            {content?.featuresSubheadline && (
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                {content.featuresSubheadline}
              </p>
            )}
            <div className="grid md:grid-cols-3 gap-8">
              {content?.featureCards?.map((card) => (
                <FeatureCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonialsEnabled && (content?.testimonials?.length ?? 0) > 0 && (
        testimonialStyle === 'carousel' ? (
          <TestimonialCarousel 
            testimonials={content?.testimonials || []}
            headline={content?.testimonialsHeadline}
          />
        ) : (
          <section className={`py-20 ${getSectionBg('testimonials')}`} data-testid="section-testimonials">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                {content?.testimonialsHeadline || 'What our customers say'}
              </h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {content?.testimonials?.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    name={testimonial.name}
                    role={testimonial.role}
                    company={testimonial.company}
                    quote={testimonial.quote}
                    avatarUrl={testimonial.avatarUrl}
                    companyLogoUrl={testimonial.companyLogoUrl}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      )}

      {imageTextEnabled && (content?.imageTextBlocks?.length ?? 0) > 0 && (
        <ImageTextSection blocks={content?.imageTextBlocks || []} />
      )}

      {processEnabled && <ProcessSteps />}

      {customerStoriesEnabled && (content?.customerStories?.length ?? 0) > 0 && (
        <CustomerStories 
          stories={content?.customerStories}
          headline={content?.customerStoriesHeadline}
          className={getSectionBg('customerStories')}
        />
      )}

      {faqEnabled && (content?.faqItems?.length ?? 0) > 0 && (
        <section className={`py-20 ${getSectionBg('faq') || 'bg-muted/50'}`} data-testid="section-faq">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              {content?.faqHeadline || 'Frequently asked questions'}
            </h2>
            <div className="space-y-4">
              {content?.faqItems?.map((faq) => (
                <FAQItem
                  key={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {ctaEnabled && (
        <section className={`py-20 ${getSectionBg('cta')}`} data-testid="section-cta">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              {content?.cta?.headline || 'Ready to get started?'}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {content?.cta?.description || 'Join thousands of users who trust us with their business.'}
            </p>
            <Button size="lg" asChild data-testid="button-start-free-trial">
              <Link href={content?.cta?.buttonLink || '/signup'}>
                {content?.cta?.buttonText || 'Start Your Free Trial'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card" data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {iconMap[icon] || <Zap className="h-5 w-5 text-primary" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function TestimonialCard({ name, role, company, quote, avatarUrl, companyLogoUrl }: { name: string; role: string; company: string; quote: string; avatarUrl?: string; companyLogoUrl?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  
  return (
    <div className="p-6 rounded-lg border bg-card relative" data-testid={`card-testimonial-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
      <p className="text-muted-foreground mb-6 italic leading-relaxed">&quot;{quote}&quot;</p>
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{role}, {company}</p>
        </div>
        {companyLogoUrl && (
          <img src={companyLogoUrl} alt={company} className="h-6 w-auto opacity-60" />
        )}
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div 
      className="border rounded-lg bg-card overflow-hidden"
      data-testid={`faq-item-${question.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`}
    >
      <Button
        variant="ghost"
        className="w-full px-6 py-4 h-auto text-left flex items-center justify-between gap-2 rounded-none"
        onClick={() => setIsOpen(!isOpen)}
        data-testid={`button-faq-toggle-${question.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`}
      >
        <span className="font-medium">{question}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      <div 
        className={`px-6 text-muted-foreground transition-all duration-200 overflow-hidden ${isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
      >
        {answer}
      </div>
    </div>
  )
}
