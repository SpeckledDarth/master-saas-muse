'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export interface ComparisonItem {
  id: string
  label: string
  value: string
  barPercent: number
  highlighted?: boolean
}

export interface ComparisonBarsSettings {
  headline: string
  subheadline?: string
  items: ComparisonItem[]
  ctaText?: string
  ctaLink?: string
}

interface ComparisonBarsProps {
  settings: ComparisonBarsSettings
  className?: string
}

export function ComparisonBars({ settings, className = '' }: ComparisonBarsProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className={`py-16 md:py-24 ${className}`}
      data-testid="section-comparison-bars"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" data-testid="text-comparison-headline">
          {settings.headline}
        </h2>
        {settings.subheadline && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto" data-testid="text-comparison-subheadline">
            {settings.subheadline}
          </p>
        )}

        <div className="max-w-2xl mx-auto space-y-4">
          {settings.items.map((item) => (
            <div key={item.id} className="space-y-2" data-testid={`comparison-item-${item.id}`}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-bold tabular-nums ${item.highlighted ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                  {item.value}
                </span>
              </div>
              <div className="h-3 rounded-full bg-primary-100 dark:bg-primary-900 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    item.highlighted
                      ? 'bg-primary-600 dark:bg-primary-400'
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{
                    width: isVisible ? `${item.barPercent}%` : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {settings.ctaText && settings.ctaLink && (
          <div className="text-center mt-10">
            <Button asChild data-testid="button-comparison-cta">
              <a href={settings.ctaLink}>
                {settings.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
