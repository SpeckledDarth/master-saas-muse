'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserNav } from '@/components/auth/UserNav'
import { useSettings } from '@/hooks/use-settings'

export function Header() {
  const { settings, loading } = useSettings()
  const { branding } = settings

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
          {branding.logoUrl ? (
            <Image 
              src={branding.logoUrl} 
              alt={branding.appName}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          ) : null}
          <span className="font-bold text-xl" data-testid="text-app-name">
            {loading ? 'Loading...' : branding.appName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-features"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-pricing"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-docs"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
