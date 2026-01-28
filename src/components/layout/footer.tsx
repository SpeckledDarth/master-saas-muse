'use client'

import Link from "next/link"
import Image from "next/image"
import { useSettings } from "@/hooks/use-settings"
import { SiX, SiLinkedin, SiGithub } from "react-icons/si"
import { Globe } from "lucide-react"

export function Footer() {
  const { settings, loading } = useSettings()
  
  if (loading || !settings) {
    return (
      <footer className="border-t bg-muted/40">
        <div className="container py-8 md:py-12">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
      </footer>
    )
  }
  
  const { branding, social } = settings
  const hasSocialLinks = social.twitter || social.linkedin || social.github || social.website

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2" data-testid="link-footer-home">
              {branding.logoUrl && (
                <Image 
                  src={branding.logoUrl} 
                  alt={branding.appName}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              )}
              <span className="font-semibold text-lg">
                {loading ? 'Loading...' : branding.appName}
              </span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {branding.tagline}
            </p>
            
            {hasSocialLinks && (
              <div className="flex items-center gap-3 mt-4">
                {social.twitter && (
                  <a 
                    href={social.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-social-twitter"
                  >
                    <SiX className="h-5 w-5" />
                  </a>
                )}
                {social.linkedin && (
                  <a 
                    href={social.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-social-linkedin"
                  >
                    <SiLinkedin className="h-5 w-5" />
                  </a>
                )}
                {social.github && (
                  <a 
                    href={social.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-social-github"
                  >
                    <SiGithub className="h-5 w-5" />
                  </a>
                )}
                {social.website && (
                  <a 
                    href={social.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-social-website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-foreground transition-colors" data-testid="link-footer-faq">FAQ</Link></li>
              {settings?.pages?.customPages?.filter(p => p.enabled && p.name && p.slug).map(page => (
                <li key={page.id}>
                  <Link 
                    href={`/p/${page.slug}`} 
                    className="hover:text-foreground transition-colors" 
                    data-testid={`link-footer-custom-${page.slug}`}
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors" data-testid="link-footer-about">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {branding.companyName}. All rights reserved.</p>
          {branding.supportEmail && (
            <p className="mt-1">
              <a href={`mailto:${branding.supportEmail}`} className="hover:text-foreground transition-colors">
                {branding.supportEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
