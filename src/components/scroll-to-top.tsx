'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggle = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', toggle, { passive: true })
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isEnabled = typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-scroll-top') !== 'false'

  if (!isEnabled) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollUp}
      className={cn(
        "scroll-to-top fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="Scroll to top"
      data-testid="button-scroll-to-top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  )
}
