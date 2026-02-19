import { Twitter, Linkedin, Facebook, FileText } from 'lucide-react'

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const iconClass = className || 'h-4 w-4'
  if (platform === 'twitter') return <Twitter className={iconClass} />
  if (platform === 'linkedin') return <Linkedin className={iconClass} />
  if (platform === 'facebook') return <Facebook className={iconClass} />
  return <FileText className={iconClass} />
}

export function PlatformIconCircle({ platform, size = 'md' }: { platform: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  let bgClass = 'bg-muted'
  let textClass = 'text-muted-foreground'

  if (platform === 'twitter') {
    bgClass = 'bg-chart-1/10 dark:bg-chart-1/20'
    textClass = 'text-chart-1'
  } else if (platform === 'linkedin') {
    bgClass = 'bg-chart-2/10 dark:bg-chart-2/20'
    textClass = 'text-chart-2'
  } else if (platform === 'facebook') {
    bgClass = 'bg-chart-3/10 dark:bg-chart-3/20'
    textClass = 'text-chart-3'
  }

  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full ${bgClass}`}>
      <PlatformIcon platform={platform} className={`${iconSize} ${textClass}`} />
    </div>
  )
}
