'use client'

import { useEffect, useRef, useState } from 'react'

interface Metric {
  id: string
  value: number
  suffix?: string
  prefix?: string
  label: string
  iconUrl?: string
  iconPositionX?: number
  iconPositionY?: number
}

interface AnimatedCounterProps {
  metrics: Metric[]
  headline?: string
}

function Counter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0
          timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              if (timer) clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
      if (timer) clearInterval(timer)
    }
  }, [value, hasAnimated])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export function AnimatedCounterSection({ metrics, headline }: AnimatedCounterProps) {
  if (!metrics || metrics.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-primary/5" data-testid="section-metrics">
      <div className="container mx-auto px-4">
        {headline && (
          <h2 className="text-2xl font-bold text-center mb-12 text-muted-foreground">
            {headline}
          </h2>
        )}
        <div className={`grid gap-8 ${metrics.length === 2 ? 'md:grid-cols-2' : metrics.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} max-w-4xl mx-auto`}>
          {metrics.map((metric) => (
            <div key={metric.id} className="text-center" data-testid={`metric-${metric.id}`}>
              {metric.iconUrl && (
                <div className="flex justify-center mb-3">
                  <img
                    src={metric.iconUrl}
                    alt={metric.label}
                    className="h-12 w-12 object-cover rounded"
                    style={{ objectPosition: `${metric.iconPositionX ?? 50}% ${metric.iconPositionY ?? 50}%` }}
                  />
                </div>
              )}
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                <Counter value={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
              </div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
