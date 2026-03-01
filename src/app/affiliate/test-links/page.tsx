'use client'

import Link from 'next/link'
import { DSCard as Card, DSCardContent as CardContent, DSCardHeader as CardHeader, DSCardTitle as CardTitle, DSCardDescription as CardDescription } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Globe, UserPlus, LogIn, LayoutDashboard, Settings, ArrowLeft } from 'lucide-react'

const links = [
  {
    section: 'Public Pages',
    items: [
      { label: 'Affiliate Landing Page', href: '/affiliate', icon: Globe, description: 'Public-facing program overview with commission details and CTAs' },
      { label: 'Application Form', href: '/affiliate/join', icon: UserPlus, description: 'Non-user affiliate application (name, email, website, promotion method)' },
      { label: 'Affiliate Login', href: '/affiliate/login', icon: LogIn, description: 'Separate login for affiliates (magic link + password)' },
    ],
  },
  {
    section: 'Affiliate Dashboard',
    items: [
      { label: 'Standalone Dashboard', href: '/affiliate/dashboard', icon: LayoutDashboard, description: 'Affiliate-only dashboard with stats, earnings, referral link, and assets' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Affiliate Admin (Applications, Networks, Settings)', href: '/admin/setup/affiliate', icon: Settings, description: 'Review applications, configure networks, manage tiers and assets' },
    ],
  },
]

export default function AffiliateTestLinksPage() {
  return (
    <div className="min-h-screen bg-background p-[var(--card-padding,1.25rem)] md:p-[var(--section-spacing,3.5rem)]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/affiliate" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Affiliate Landing
          </Link>
          <h1 className="text-3xl font-bold">Affiliate System — Test Links</h1>
          <p className="text-muted-foreground mt-2">Quick navigation to all affiliate routes. Remove this page before launch.</p>
        </div>

        <div className="space-y-[var(--content-density-gap,1rem)]">
          {links.map(section => (
            <div key={section.section}>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{section.section}</h2>
              <div className="space-y-3">
                {section.items.map(item => (
                  <Card key={item.href}>
                    <CardContent className="flex items-center gap-[var(--content-density-gap,1rem)] p-[var(--card-padding,1.25rem)]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--card-radius,0.75rem)] bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <code className="text-xs text-muted-foreground/70 mt-1 block">{item.href}</code>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={item.href}>
                          Open <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[var(--card-radius,0.75rem)] border border-dashed border-[hsl(var(--warning)/0.5)] bg-[hsl(var(--warning)/0.05)] p-[var(--card-padding,1.25rem)] text-sm text-[hsl(var(--warning))]">
          This is a temporary developer page. Remember to remove <code className="font-mono">/affiliate/test-links</code> before going live.
        </div>
      </div>
    </div>
  )
}
