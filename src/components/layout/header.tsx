'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserNav } from '@/components/auth/UserNav'
import { useSettings } from '@/hooks/use-settings'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const { settings, loading } = useSettings()
  const branding = settings?.branding
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle scroll detection for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Trigger mount animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const logoWidth = branding?.logoWidth ?? 32
  const logoHeight = branding?.logoHeight ?? 32
  const logoHoverEffect = branding?.logoHoverEffect ?? true
  const brandNameGradient = branding?.brandNameGradient ?? false
  const brandNameAnimated = branding?.brandNameAnimated ?? false

  if (loading || !settings) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled 
          ? "bg-background/80 backdrop-blur-lg shadow-sm" 
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div 
        className={cn(
          "container flex items-center justify-between gap-4 transition-all duration-300",
          scrolled ? "h-12" : "h-14"
        )}
      >
        <Link 
          href="/" 
          className={cn(
            "flex items-center space-x-2 group",
            brandNameAnimated && !mounted && "opacity-0 translate-y-2",
            brandNameAnimated && mounted && "opacity-100 translate-y-0 transition-all duration-500 ease-out",
            !brandNameAnimated && "opacity-100"
          )}
          data-testid="link-home"
        >
          {branding?.logoUrl ? (
            <div 
              className={cn(
                "relative transition-all duration-200",
                logoHoverEffect && "group-hover:scale-110"
              )}
              style={{ width: logoWidth, height: logoHeight }}
            >
              <Image 
                src={branding.logoUrl} 
                alt={branding.appName || 'Logo'}
                fill
                className={cn(
                  "object-contain transition-all duration-200",
                  logoHoverEffect && "group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                )}
                unoptimized
              />
            </div>
          ) : (
            <span 
              className={cn(
                "font-bold text-xl transition-all duration-200",
                brandNameGradient 
                  ? "bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent"
                  : "",
                scrolled && "text-lg"
              )}
              data-testid="text-app-name"
            >
              {branding?.appName || 'App'}
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {settings?.navigation?.items?.filter(item => item.enabled).map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              data-testid={`link-nav-${item.id}`}
            >
              {item.label}
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  item.badge === 'new' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  item.badge === 'beta' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                  'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {item.badge === 'new' ? 'New' : item.badge === 'beta' ? 'Beta' : 'Soon'}
                </span>
              )}
            </Link>
          ))}
          {settings?.pages?.customPages?.filter(p => p.enabled && p.name && p.slug).map(page => (
            <Link
              key={page.id}
              href={`/p/${page.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              data-testid={`link-custom-${page.slug}`}
            >
              {page.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
