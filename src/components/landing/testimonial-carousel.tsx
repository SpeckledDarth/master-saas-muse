'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Testimonial } from '@/types/settings'

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
  headline?: string
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function TestimonialCarousel({ 
  testimonials, 
  headline = 'What our customers say',
  autoPlay = true,
  autoPlayInterval = 5000
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [testimonials.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  useEffect(() => {
    if (!autoPlay || isHovered || testimonials.length <= 1) return
    
    const timer = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(timer)
  }, [autoPlay, autoPlayInterval, goToNext, isHovered, testimonials.length])

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const current = testimonials[currentIndex]
  const initials = current.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <section 
      className="py-20 bg-muted/30" 
      data-testid="section-testimonial-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {headline}
        </h2>
        
        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/75 rounded-xl p-8 md:p-12 shadow-sm border border-gray-500/50 text-black dark:text-white relative overflow-hidden">
            <Quote className="absolute top-6 left-6 h-12 w-12 text-primary-200 dark:text-primary-800" />
            
            <div className="relative z-10 text-center">
              <p className="text-xl md:text-2xl text-muted-foreground italic leading-relaxed mb-8">
                &quot;{current.quote}&quot;
              </p>
              
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-16 w-16">
                  {current.avatarUrl && <AvatarImage src={current.avatarUrl} alt={current.name} />}
                  <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200 text-lg font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-semibold text-lg">{current.name}</p>
                  <p className="text-muted-foreground">
                    {current.role}, {current.company}
                  </p>
                </div>
                
                {current.companyLogoUrl && (
                  <img 
                    src={current.companyLogoUrl} 
                    alt={current.company} 
                    className="h-8 w-auto opacity-60 mt-2" 
                  />
                )}
              </div>
            </div>
          </div>

          {testimonials.length > 1 && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 rounded-full shadow-md"
                onClick={goToPrev}
                data-testid="button-testimonial-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Button
                size="icon"
                variant="outline"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 rounded-full shadow-md"
                onClick={goToNext}
                data-testid="button-testimonial-next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary-600 dark:bg-primary-400' : 'bg-muted-foreground/30'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  data-testid={`button-testimonial-dot-${index}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
