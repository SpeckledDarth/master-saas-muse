'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Palette, FileText, BookOpen, DollarSign, Globe, Settings, Save, Check, Loader2, Scale, MessageCircle, Shield, KeyRound, Package } from 'lucide-react'
import { SetupSettingsProvider, useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { TooltipProvider } from '@/components/ui/tooltip'

const sectionGroups = [
  {
    label: 'Brand Identity',
    items: [
      { id: 'branding', label: 'Branding', icon: Palette, href: '/admin/setup/branding' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'content', label: 'Homepage', icon: FileText, href: '/admin/setup/content' },
      { id: 'pages', label: 'Pages', icon: BookOpen, href: '/admin/setup/pages' },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'pricing', label: 'Pricing', icon: DollarSign, href: '/admin/setup/pricing' },
      { id: 'products', label: 'Products', icon: Package, href: '/admin/setup/products' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'features', label: 'Features', icon: Settings, href: '/admin/setup/features' },
      { id: 'social', label: 'Social Links', icon: Globe, href: '/admin/setup/social' },
      { id: 'support', label: 'Support', icon: MessageCircle, href: '/admin/setup/support' },
      { id: 'integrations', label: 'Integrations', icon: KeyRound, href: '/admin/setup/integrations' },
    ],
  },
  {
    label: 'Legal & Security',
    items: [
      { id: 'compliance', label: 'Compliance', icon: Scale, href: '/admin/setup/compliance' },
      { id: 'security', label: 'Security', icon: Shield, href: '/admin/setup/security' },
    ],
  },
]

function SetupLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ctx = useSetupSettingsContext()

  if (ctx.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-setup">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-8 px-6">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-setup-title">Setup Dashboard</h1>
          <p className="text-sm text-muted-foreground">Configure your SaaS branding, pricing, and features</p>
        </div>
        <Button
          onClick={ctx.handleSave}
          disabled={ctx.saving}
          data-testid="button-save-settings"
        >
          {ctx.saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : ctx.saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {ctx.saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex gap-6">
        <nav className="w-52 shrink-0">
          <div className="space-y-5 sticky top-20">
            {sectionGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2 mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider" data-testid={`nav-group-${group.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((section) => {
                    const isActive = pathname === section.href || (pathname === '/admin/setup' && section.id === 'branding')
                    return (
                      <Link key={section.id} href={section.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          data-testid={`tab-${section.id}`}
                        >
                          <section.icon className="h-4 w-4 mr-2" />
                          {section.label}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <SetupSettingsProvider>
        <SetupLayoutInner>{children}</SetupLayoutInner>
      </SetupSettingsProvider>
    </TooltipProvider>
  )
}
