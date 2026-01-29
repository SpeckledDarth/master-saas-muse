'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserNav } from '@/components/auth/UserNav'
import { useSettings } from '@/hooks/use-settings'

export function Header() {
  const { settings, loading } = useSettings()
  const branding = settings?.branding

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
          {branding?.logoUrl ? (
            <Image 
              src={branding.logoUrl} 
              alt={branding.appName || 'Logo'}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          ) : null}
          <span className="font-bold text-xl" data-testid="text-app-name">
            {branding?.appName || 'App'}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {settings?.navigation?.items?.filter(item => item.enabled).map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
