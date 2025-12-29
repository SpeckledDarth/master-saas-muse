'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserNav } from '@/components/auth/UserNav'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
          <span className="font-bold text-xl">SaaS Muse</span>
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
