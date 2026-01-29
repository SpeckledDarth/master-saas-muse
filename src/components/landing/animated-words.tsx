'use client'

import { useState, useEffect } from 'react'

interface AnimatedWordsProps {
  words: string[]
  className?: string
}

export function AnimatedWords({ words, className = '' }: AnimatedWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (words.length <= 1) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length)
        setIsAnimating(false)
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [words.length])

  if (words.length === 0) return null
  if (words.length === 1) return <span className={className}>{words[0]}</span>

  return (
    <span className={`inline-block ${className}`}>
      <span 
        className={`inline-block transition-all duration-300 ${
          isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
        data-testid="animated-word"
      >
        {words[currentIndex]}
      </span>
    </span>
  )
}
