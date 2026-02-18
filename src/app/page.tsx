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
import { FounderLetter } from '@/components/landing/founder-letter'
import { ComparisonBars } from '@/components/landing/comparison-bars'
import { BottomHeroCta } from '@/components/landing/bottom-hero-cta'
import { ProductShowcase } from '@/components/landing/product-showcase'
import { ImageCollageSection } from '@/components/landing/image-collage-section'

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Shield: <Shield className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Sparkles: <Sparkles className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Users: <Users className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  BarChart: <BarChart className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Lock: <Lock className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Rocket: <Rocket className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Heart: <Heart className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Star: <Star className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Target: <Target className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Award: <Award className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
  Lightbulb: <Lightbulb className="h-5 w-5 text-primary-800 dark:text-primary-200" />,
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
        <section className="relative min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-muted/50">
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="h-12 md:h-16 w-48 md:w-64 mx-auto mb-6 bg-muted animate-pulse rounded" />
            <div className="h-6 md:h-8 w-64 md:w-96 mx-auto mb-8 bg-muted animate-pulse rounded" />
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
  const founderLetterEnabled = content?.founderLetterEnabled ?? false
  const comparisonBarsEnabled = content?.comparisonBarsEnabled ?? false
  const bottomHeroCtaEnabled = content?.bottomHeroCtaEnabled ?? false
  const productShowcaseEnabled = content?.productShowcaseEnabled ?? false
  const imageCollageEnabled = content?.imageCollageEnabled ?? false

  const getSectionBg = (section: 'features' | 'testimonials' | 'faq' | 'cta' | 'customerStories') => {
    const style = content?.sectionBackgrounds?.[section] ?? 'default'
    if (style === 'muted') return 'bg-muted/50'
    if (style === 'gradient') return 'bg-gradient-to-br from-primary/5 via-background to-accent/5'
    if (style === 'mesh') return 'bg-mesh'
    return ''
  }

  const DEFAULT_SECTION_ORDER = [
    'trustedBy', 'metrics', 'features', 'testimonials', 'productShowcase',
    'imageText', 'process', 'customerStories', 'imageCollage', 'founderLetter',
    'comparisonBars', 'faq', 'cta', 'bottomHeroCta'
  ]

  const storedOrder = content?.sectionOrder?.length ? content.sectionOrder : DEFAULT_SECTION_ORDER
  const missingSections = DEFAULT_SECTION_ORDER.filter(s => !storedOrder.includes(s))
  const sectionOrder = [...storedOrder, ...missingSections]

  const getSectionColor = (section: string): React.CSSProperties => {
    const color = content?.sectionColors?.[section as keyof typeof content.sectionColors]
    return color ? { backgroundColor: color } : {}
  }

  const renderHeroContent = (isDark: boolean) => (
    <div className="relative z-10 container mx-auto px-4 text-center">
      <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-foreground'}`}>
        {heroAnimatedWords.length > 0 ? (
          <AnimatedWords words={heroAnimatedWords} className={isDark ? 'text-white' : ''} />
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
        <section className="relative min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="section-hero-video">
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
        <section className="relative min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="section-hero-pattern">
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
        <section className="relative min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="section-hero-floating">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
          <div className="relative z-10 container mx-auto px-4 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-[auto_auto] items-center" style={{ gap: `${floatingGap * 4}px` }}>
              <div className="text-center md:text-left space-y-6 max-w-lg">
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-foreground">
                  {heroAnimatedWords.length > 0 ? (
                    <AnimatedWords words={heroAnimatedWords} />
                  ) : (
                    <AppName />
                  )}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  <AppTagline />
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
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
                <div className="relative animate-float w-full max-w-[90vw] md:max-w-none" style={{ height: `${floatingImageHeight}px`, aspectRatio: '4/3' }}>
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

    if (heroStyle === 'collage' && (content?.heroCollageImages?.length ?? 0) > 0) {
      const collageImages = content?.heroCollageImages || []
      return (
        <section
          className="relative min-h-[500px] md:min-h-[700px] flex items-center overflow-hidden"
          data-testid="section-hero-collage"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />

          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
            <div className="relative h-full w-full">
              {collageImages.slice(0, 5).map((url, i) => {
                const positions = [
                  { top: '5%', left: '5%', width: '55%', height: '45%', zIndex: 3 },
                  { top: '10%', left: '50%', width: '45%', height: '40%', zIndex: 2 },
                  { top: '48%', left: '0%', width: '40%', height: '50%', zIndex: 4 },
                  { top: '42%', left: '35%', width: '42%', height: '48%', zIndex: 5 },
                  { top: '55%', left: '65%', width: '32%', height: '40%', zIndex: 1 },
                ]
                const pos = positions[i]
                return (
                  <div
                    key={i}
                    className="absolute rounded-lg overflow-hidden shadow-xl"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      width: pos.width,
                      height: pos.height,
                      zIndex: pos.zIndex,
                    }}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                      data-testid={`img-hero-collage-${i}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-lg">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                {heroAnimatedWords.length > 0 ? (
                  <AnimatedWords words={heroAnimatedWords} />
                ) : (
                  <AppName />
                )}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
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
          </div>

          <div className="lg:hidden mt-8 px-4">
            <div className="grid grid-cols-2 gap-3">
              {collageImages.slice(0, 4).map((url, i) => (
                <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                  <Image src={url} alt="" fill className="object-cover" unoptimized data-testid={`img-hero-collage-mobile-${i}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    return (
      <section 
        className="relative min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
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

      {sectionOrder.map(sectionId => {
        switch (sectionId) {
          case 'trustedBy':
            return trustedByEnabled ? <div key="trustedBy" style={getSectionColor('trustedBy')}><LogoMarquee /></div> : null
          
          case 'metrics':
            return metricsEnabled && (content?.metrics?.length ?? 0) > 0 ? (
              <div key="metrics" style={getSectionColor('metrics')}>
                <AnimatedCounterSection metrics={content?.metrics || []} headline={content?.metricsHeadline} />
              </div>
            ) : null
          
          case 'features':
            return featuresEnabled && (content?.featureCards?.length ?? 0) > 0 ? (
              <section key="features" className={`py-12 md:py-20 ${!content?.sectionColors?.features ? (getSectionBg('features') || 'bg-muted/50') : ''}`} style={getSectionColor('features')} data-testid="section-features">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                    {content?.featuresHeadline || 'Everything you need'}
                  </h2>
                  {content?.featuresSubheadline && (
                    <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                      {content.featuresSubheadline}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {content?.featureCards?.map((card, idx) => (
                      <FeatureCard key={card.id} icon={card.icon} title={card.title} description={card.description} index={idx} />
                    ))}
                  </div>
                </div>
              </section>
            ) : null

          case 'testimonials':
            if (!testimonialsEnabled || (content?.testimonials?.length ?? 0) === 0) return null
            return testimonialStyle === 'carousel' ? (
              <div key="testimonials" style={getSectionColor('testimonials')}>
                <TestimonialCarousel testimonials={content?.testimonials || []} headline={content?.testimonialsHeadline} />
              </div>
            ) : (
              <section key="testimonials" className={`py-12 md:py-20 ${!content?.sectionColors?.testimonials ? getSectionBg('testimonials') : ''}`} style={getSectionColor('testimonials')} data-testid="section-testimonials">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                    {content?.testimonialsHeadline || 'What our customers say'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
                    {content?.testimonials?.map((testimonial) => (
                      <TestimonialCard key={testimonial.id} name={testimonial.name} role={testimonial.role} company={testimonial.company} quote={testimonial.quote} avatarUrl={testimonial.avatarUrl} companyLogoUrl={testimonial.companyLogoUrl} />
                    ))}
                  </div>
                </div>
              </section>
            )

          case 'productShowcase':
            return productShowcaseEnabled && content?.productShowcase?.screenshotUrl ? (
              <div key="productShowcase" style={getSectionColor('productShowcase')}>
                <ProductShowcase settings={content.productShowcase} />
              </div>
            ) : null

          case 'imageText':
            return imageTextEnabled && (content?.imageTextBlocks?.length ?? 0) > 0 ? (
              <div key="imageText"><ImageTextSection blocks={content?.imageTextBlocks || []} /></div>
            ) : null

          case 'process':
            return processEnabled ? <div key="process"><ProcessSteps /></div> : null

          case 'customerStories':
            return customerStoriesEnabled && (content?.customerStories?.length ?? 0) > 0 ? (
              <div key="customerStories" style={getSectionColor('customerStories')}>
                <CustomerStories stories={content?.customerStories} headline={content?.customerStoriesHeadline} className={!content?.sectionColors?.customerStories ? getSectionBg('customerStories') : ''} />
              </div>
            ) : null

          case 'imageCollage':
            return imageCollageEnabled && (content?.imageCollageImages?.length ?? 0) > 0 ? (
              <div key="imageCollage" style={getSectionColor('imageCollage')}>
                <ImageCollageSection images={content?.imageCollageImages || []} headline={content?.imageCollageHeadline} subheadline={content?.imageCollageSubheadline} />
              </div>
            ) : null

          case 'founderLetter':
            return founderLetterEnabled && content?.founderLetter ? (
              <div key="founderLetter" style={getSectionColor('founderLetter')}>
                <FounderLetter settings={content.founderLetter} />
              </div>
            ) : null

          case 'comparisonBars':
            return comparisonBarsEnabled && content?.comparisonBars ? (
              <div key="comparisonBars" style={getSectionColor('comparisonBars')}>
                <ComparisonBars settings={content.comparisonBars} />
              </div>
            ) : null

          case 'faq':
            return faqEnabled && (content?.faqItems?.length ?? 0) > 0 ? (
              <section key="faq" className={`py-12 md:py-20 ${!content?.sectionColors?.faq ? (getSectionBg('faq') || 'bg-muted/50') : ''}`} style={getSectionColor('faq')} data-testid="section-faq">
                <div className="container mx-auto px-4 max-w-3xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                    {content?.faqHeadline || 'Frequently asked questions'}
                  </h2>
                  <div className="space-y-4">
                    {content?.faqItems?.map((faq) => (
                      <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                </div>
              </section>
            ) : null

          case 'cta':
            return ctaEnabled ? (
              <section key="cta" className={`py-12 md:py-20 ${!content?.sectionColors?.cta ? getSectionBg('cta') : ''}`} style={getSectionColor('cta')} data-testid="section-cta">
                <div className="container mx-auto px-4 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6">
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
            ) : null

          case 'bottomHeroCta':
            return bottomHeroCtaEnabled && content?.bottomHeroCta ? (
              <div key="bottomHeroCta" style={getSectionColor('bottomHeroCta')}>
                <BottomHeroCta settings={content.bottomHeroCta} />
              </div>
            ) : null

          default:
            return null
        }
      })}
    </div>
  )
}

function FeatureCard({ icon, title, description, index = 0 }: { icon: string; title: string; description: string; index?: number }) {
  const lightBgs = ['bg-primary-100', 'bg-primary-200', 'bg-primary-300']
  const darkBgs = ['dark:bg-primary-700', 'dark:bg-primary-800', 'dark:bg-primary-900']
  const bgIdx = index % 3
  return (
    <div className="p-6 rounded-lg border border-gray-500/50 bg-white/[0.09] text-black dark:text-white" data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${lightBgs[bgIdx]} ${darkBgs[bgIdx]}`}>
        {iconMap[icon] || <Zap className="h-5 w-5 text-primary-800 dark:text-primary-200" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="opacity-70">{description}</p>
    </div>
  )
}

function TestimonialCard({ name, role, company, quote, avatarUrl, companyLogoUrl }: { name: string; role: string; company: string; quote: string; avatarUrl?: string; companyLogoUrl?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  
  return (
    <div className="p-6 rounded-lg border border-gray-500/50 bg-white/[0.09] text-black dark:text-white relative" data-testid={`card-testimonial-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <Quote className="absolute top-4 right-4 h-8 w-8 text-primary-200 dark:text-primary-800" />
      <p className="text-black/70 dark:text-white/70 mb-6 italic leading-relaxed">&quot;{quote}&quot;</p>
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200 font-medium">{initials}</AvatarFallback>
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
