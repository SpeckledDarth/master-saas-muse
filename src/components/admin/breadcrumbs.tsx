'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  crm: 'CRM',
  revenue: 'Revenue',
  subscriptions: 'Subscriptions',
  feedback: 'Support',
  blog: 'Blog',
  analytics: 'Analytics',
  waitlist: 'Waitlist',
  'email-templates': 'Email Templates',
  'audit-logs': 'Audit Logs',
  queue: 'Queue',
  sso: 'SSO',
  users: 'Users',
  team: 'Team',
  onboarding: 'Onboarding',
  setup: 'Settings',
  branding: 'Branding',
  palette: 'Color Palette',
  content: 'Homepage',
  pages: 'Pages',
  pricing: 'Pricing',
  products: 'Products',
  features: 'Features',
  social: 'Social Links',
  support: 'Support Config',
  integrations: 'Integrations',
  testimonials: 'Testimonials',
  watermark: 'Watermark',
  compliance: 'Compliance',
  security: 'Security',
  passivepost: 'PassivePost',
  affiliate: 'Affiliate Program',
  'discount-codes': 'Discount Codes',
  funnel: 'Onboarding Funnel',
}

interface BreadcrumbOverride {
  label: string
  position: number
}

interface AdminBreadcrumbsProps {
  overrides?: BreadcrumbOverride[]
}

export function AdminBreadcrumbs({ overrides }: AdminBreadcrumbsProps) {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 1) return null

  const crumbs: { label: string; href: string }[] = []
  let path = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    path += `/${segment}`

    const override = overrides?.find(o => o.position === i)

    if (i === 0 && segment === 'admin') {
      crumbs.push({ label: 'Admin', href: '/admin' })
      continue
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    if (override) {
      crumbs.push({ label: override.label, href: path })
    } else if (isUuid) {
      crumbs.push({ label: 'Details', href: path })
    } else {
      crumbs.push({
        label: ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: path,
      })
    }
  }

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4" data-testid="nav-breadcrumbs">
      <Link href="/admin" className="hover:text-foreground transition-colors" data-testid="link-breadcrumb-home" aria-label="Admin home">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb, index) => {
        const isLast = index === crumbs.length - 2
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]" data-testid={`text-breadcrumb-${index}`}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors truncate max-w-[200px]"
                data-testid={`link-breadcrumb-${index}`}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
