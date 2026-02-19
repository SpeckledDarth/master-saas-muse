'use client'

import { Twitter, Linkedin, Facebook, FileText } from 'lucide-react'

export function getPlatformColor(platform: string): string {
  if (platform === 'twitter') return 'text-chart-1'
  if (platform === 'linkedin') return 'text-chart-2'
  if (platform === 'facebook') return 'text-chart-3'
  return 'text-muted-foreground'
}

export function getPlatformName(platform: string): string {
  if (platform === 'twitter') return 'Twitter/X'
  if (platform === 'linkedin') return 'LinkedIn'
  if (platform === 'facebook') return 'Facebook'
  if (platform === 'instagram') return 'Instagram'
  return platform
}

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const iconClass = className || 'h-4 w-4'
  const colorClass = getPlatformColor(platform)
  const fullClass = `${iconClass} ${colorClass}`

  if (platform === 'twitter') return <Twitter className={fullClass} />
  if (platform === 'linkedin') return <Linkedin className={fullClass} />
  if (platform === 'facebook') return <Facebook className={fullClass} />
  return <FileText className={fullClass} />
}

export function PlatformIconCircle({ platform, size = 'md' }: { platform: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  let bgClass = 'bg-muted'
  if (platform === 'twitter') {
    bgClass = 'bg-chart-1/15 dark:bg-chart-1/25'
  } else if (platform === 'linkedin') {
    bgClass = 'bg-chart-2/15 dark:bg-chart-2/25'
  } else if (platform === 'facebook') {
    bgClass = 'bg-chart-3/15 dark:bg-chart-3/25'
  }

  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full ${bgClass}`}>
      <PlatformIcon platform={platform} className={iconSize} />
    </div>
  )
}
