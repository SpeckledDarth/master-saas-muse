'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Metric {
  id: string
  value: number | string
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

function Counter({ value: rawValue, suffix = '', prefix = '' }: { value: number | string; suffix?: string; prefix?: string }) {
  const numValue = typeof rawValue === 'string' ? (parseFloat(rawValue) || 0) : (Number(rawValue) || 0)
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startAnimation = useCallback(() => {
    if (hasAnimated || numValue === 0) return
    setHasAnimated(true)
    const duration = 2000
    const steps = 60
    const increment = numValue / steps
    let current = 0
    timerRef.current = setInterval(() => {
      current += increment
      if (current >= numValue) {
        setCount(numValue)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
  }, [numValue, hasAnimated])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      startAnimation()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startAnimation()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startAnimation])

  const displayValue = numValue === 0 ? 0 : count

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}{suffix}
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
