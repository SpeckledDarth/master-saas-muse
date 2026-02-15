'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notification-bell'
import { UserNav } from '@/components/auth/UserNav'
import { useSettings } from '@/hooks/use-settings'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'

export function Header() {
  const { settings, loading } = useSettings()
  const branding = settings?.branding
  const { resolvedTheme } = useTheme()
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

  const logoHeight = branding?.logoHeight ?? 40
  const logoHoverEffect = branding?.logoHoverEffect ?? true
  const brandNameGradient = branding?.brandNameGradient ?? false
  const brandNameAnimated = branding?.brandNameAnimated ?? false

  // Don't show anything while loading to prevent flash
  if (loading || !settings) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-transparent h-14">
        <div className="container flex h-14 items-center justify-between gap-4" />
      </header>
    )
  }

  // Calculate dynamic header height based on logo size (with min/max bounds)
  // Allow up to 120px logo height, header will grow to accommodate
  const effectiveLogoHeight = Math.min(logoHeight, 120)
  const baseHeaderHeight = Math.max(56, effectiveLogoHeight + 24) // Logo + 24px padding
  const scrolledHeaderHeight = Math.max(48, effectiveLogoHeight + 12) // Shrinks padding when scrolled
  const currentHeaderHeight = scrolled ? scrolledHeaderHeight : baseHeaderHeight

  // When animation is enabled but not yet triggered, use clip-path to hide content
  const isAnimating = brandNameAnimated && !mounted

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "border-b bg-background/80 backdrop-blur-lg shadow-sm" 
          : "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
      style={{
        clipPath: isAnimating ? 'inset(0 0 100% 0)' : 'inset(0 0 0 0)',
        transition: 'clip-path 0.7s ease-out, background-color 0.3s ease'
      }}
    >
      <div 
        className="container flex items-center justify-between gap-4 transition-all duration-300"
        style={{ height: currentHeaderHeight }}
      >
        <Link 
          href="/" 
          className="flex items-center space-x-2 group flex-shrink-0"
          data-testid="link-home"
        >
          {branding?.logoUrl ? (
            <>
              {branding.logoIconUrl && (
                <div 
                  className={cn(
                    "relative transition-all duration-200 flex-shrink-0 md:hidden",
                    logoHoverEffect && "group-hover:scale-110"
                  )}
                  style={{ height: Math.min(effectiveLogoHeight, 36) }}
                >
                  <Image 
                    src={branding.logoIconUrl} 
                    alt={branding.appName || 'Logo'}
                    width={Math.min(effectiveLogoHeight, 36)}
                    height={Math.min(effectiveLogoHeight, 36)}
                    className={cn(
                      "h-full w-auto object-contain transition-all duration-200",
                      logoHoverEffect && "group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    )}
                    unoptimized
                  />
                </div>
              )}
              <div 
                className={cn(
                  "relative transition-all duration-200 flex-shrink-0",
                  logoHoverEffect && "group-hover:scale-110",
                  branding.logoIconUrl ? "hidden md:block" : ""
                )}
                style={{ 
                  height: effectiveLogoHeight,
                  maxWidth: effectiveLogoHeight * 8,
                }}
              >
                <Image 
                  src={(resolvedTheme === 'dark' && branding.logoDarkUrl) ? branding.logoDarkUrl : branding.logoUrl} 
                  alt={branding.appName || 'Logo'}
                  width={effectiveLogoHeight * 8}
                  height={effectiveLogoHeight}
                  className={cn(
                    "h-full w-auto object-contain transition-all duration-200",
                    logoHoverEffect && "group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  )}
                  unoptimized
                />
              </div>
            </>
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <Link href="/" className="flex items-center space-x-2" data-testid="link-mobile-home">
                    {branding?.logoUrl ? (
                      <Image
                        src={(resolvedTheme === 'dark' && branding.logoDarkUrl) ? branding.logoDarkUrl : branding.logoUrl}
                        alt={branding.appName || 'Logo'}
                        width={120}
                        height={32}
                        className="h-8 w-auto object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="font-bold text-lg">{branding?.appName || 'App'}</span>
                    )}
                  </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                  {settings?.navigation?.items?.filter(item => item.enabled).map(item => (
                    <SheetClose asChild key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover-elevate"
                        data-testid={`link-mobile-nav-${item.id}`}
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
                    </SheetClose>
                  ))}
                  {settings?.pages?.customPages?.filter(p => p.enabled && p.name && p.slug).map(page => (
                    <SheetClose asChild key={page.id}>
                      <Link
                        href={`/p/${page.slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover-elevate"
                        data-testid={`link-mobile-custom-${page.slug}`}
                      >
                        {page.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <NotificationBell />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
