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

function parseNumericValue(raw: number | string): number {
  if (typeof raw === 'number') return raw
  const cleaned = String(raw).replace(/,/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function Counter({ value: rawValue, suffix = '', prefix = '' }: { value: number | string; suffix?: string; prefix?: string }) {
  const numValue = parseNumericValue(rawValue)
  const [count, setCount] = useState(numValue)
  const startedRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  const animate = useCallback(() => {
    if (startedRef.current || numValue === 0) return
    startedRef.current = true
    setCount(0)
    const duration = 2000
    const steps = 60
    const increment = numValue / steps
    let current = 0
    intervalRef.current = setInterval(() => {
      current += increment
      if (current >= numValue) {
        setCount(numValue)
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
  }, [numValue])

  useEffect(() => {
    if (numValue === 0) {
      setCount(0)
      return
    }

    setCount(numValue)
    startedRef.current = false

    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      animate()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          animate()
          observer.disconnect()
        }
      },
      { threshold: 0 }
    )

    observer.observe(el)

    const fallbackTimer = setTimeout(() => {
      if (!startedRef.current) {
        animate()
        observer.disconnect()
      }
    }, 2000)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [numValue, animate])

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
    <section className="py-16 bg-primary-50 dark:bg-primary-950" data-testid="section-metrics">
      <div className="container mx-auto px-4">
        {headline && (
          <h2 className="text-2xl font-bold text-center mb-12 text-muted-foreground">
            {headline}
          </h2>
        )}
        <div className={`grid gap-8 sm:gap-10 ${
          metrics.length === 1 ? 'grid-cols-1 max-w-xs' :
          metrics.length === 2 ? 'grid-cols-2 max-w-2xl' :
          metrics.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl' :
          metrics.length === 4 ? 'grid-cols-2 md:grid-cols-4 max-w-5xl' :
          metrics.length <= 6 ? 'grid-cols-2 md:grid-cols-3 max-w-5xl' :
          'grid-cols-2 md:grid-cols-4 max-w-6xl'
        } mx-auto`}>
          {metrics.map((metric) => (
            <div key={metric.id} className="text-center min-w-0" data-testid={`metric-${metric.id}`}>
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
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2 break-words">
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
