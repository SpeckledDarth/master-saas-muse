'use client'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  from?: string
  to?: string
}

export function GradientText({ 
  children, 
  className = '',
  from = 'from-primary',
  to = 'to-primary/60'
}: GradientTextProps) {
  return (
    <span 
      className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  )
}
