'use client'

import {
  SiX,
  SiLinkedin,
  SiFacebook,
  SiInstagram,
  SiYoutube,
  SiTiktok,
  SiReddit,
  SiPinterest,
  SiSnapchat,
  SiDiscord,
} from 'react-icons/si'
import { Globe } from 'lucide-react'
import type { IconType } from 'react-icons'

const PLATFORM_CONFIG: Record<string, { icon: IconType; color: string; darkColor?: string; name: string }> = {
  twitter:   { icon: SiX,         color: '#000000', darkColor: '#FFFFFF', name: 'X' },
  linkedin:  { icon: SiLinkedin,  color: '#0A66C2', name: 'LinkedIn' },
  facebook:  { icon: SiFacebook,  color: '#1877F2', name: 'Facebook' },
  instagram: { icon: SiInstagram, color: '#E4405F', name: 'Instagram' },
  youtube:   { icon: SiYoutube,   color: '#FF0000', name: 'YouTube' },
  tiktok:    { icon: SiTiktok,    color: '#000000', darkColor: '#FFFFFF', name: 'TikTok' },
  reddit:    { icon: SiReddit,    color: '#FF4500', name: 'Reddit' },
  pinterest: { icon: SiPinterest, color: '#E60023', name: 'Pinterest' },
  snapchat:  { icon: SiSnapchat,  color: '#E5D800', darkColor: '#FFFC00', name: 'Snapchat' },
  discord:   { icon: SiDiscord,   color: '#5865F2', name: 'Discord' },
}

export function getPlatformColor(platform: string): string {
  return PLATFORM_CONFIG[platform]?.color ?? '#6B7280'
}

export function getPlatformName(platform: string): string {
  return PLATFORM_CONFIG[platform]?.name ?? platform
}

export function PlatformIcon({
  platform,
  className,
  branded = true,
}: {
  platform: string
  className?: string
  branded?: boolean
}) {
  const config = PLATFORM_CONFIG[platform]
  if (!config) {
    const iconClass = className || 'h-4 w-4'
    return <Globe className={`${iconClass} text-muted-foreground`} />
  }

  const Icon = config.icon
  const iconClass = className || 'h-4 w-4'

  if (!branded) {
    return <Icon className={`${iconClass} text-muted-foreground`} />
  }

  const darkColor = config.darkColor

  return (
    <>
      <Icon
        className={`${iconClass}${darkColor ? ' dark:hidden' : ''}`}
        style={{ color: config.color }}
      />
      {darkColor && (
        <Icon
          className={`${iconClass} hidden dark:block`}
          style={{ color: darkColor }}
        />
      )}
    </>
  )
}

export function PlatformIconCircle({
  platform,
  size = 'md',
}: {
  platform: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  const config = PLATFORM_CONFIG[platform]
  if (!config) {
    return (
      <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-muted`}>
        <span className={`${iconSize} text-muted-foreground`} />
      </div>
    )
  }

  const bgOpacity = 0.12
  const darkBgOpacity = 0.2

  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full`}>
      <div
        className="flex items-center justify-center rounded-full w-full h-full dark:hidden"
        style={{ backgroundColor: `${config.color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}` }}
      >
        <PlatformIcon platform={platform} className={iconSize} />
      </div>
      <div
        className="hidden dark:flex items-center justify-center rounded-full w-full h-full"
        style={{ backgroundColor: `${config.darkColor ?? config.color}${Math.round(darkBgOpacity * 255).toString(16).padStart(2, '0')}` }}
      >
        <PlatformIcon platform={platform} className={iconSize} />
      </div>
    </div>
  )
}
