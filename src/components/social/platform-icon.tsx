import { Twitter, Linkedin, Facebook, FileText } from 'lucide-react'

const PLATFORM_BG: Record<string, string> = {
  twitter: 'bg-chart-1/10 dark:bg-chart-1/20',
  linkedin: 'bg-chart-2/10 dark:bg-chart-2/20',
  facebook: 'bg-chart-3/10 dark:bg-chart-3/20',
}

const PLATFORM_TEXT: Record<string, string> = {
  twitter: 'text-chart-1',
  linkedin: 'text-chart-2',
  facebook: 'text-chart-3',
}

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
  const bgClass = PLATFORM_BG[platform] || 'bg-muted'
  const textClass = PLATFORM_TEXT[platform] || 'text-muted-foreground'

  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full ${bgClass}`}>
      <PlatformIcon platform={platform} className={`${iconSize} ${textClass}`} />
    </div>
  )
}
