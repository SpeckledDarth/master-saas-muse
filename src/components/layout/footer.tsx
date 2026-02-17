'use client'

import Link from "next/link"
import Image from "next/image"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { SiX, SiLinkedin, SiGithub } from "react-icons/si"
import { Globe } from "lucide-react"

function getContrastColor(hex: string): string {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

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
  const footerStyle = settings?.navigation?.footerStyle
  const layout = footerStyle?.layout ?? 'default'

  const brandingPrimary = settings?.branding?.primaryColor
  const effectiveBgColor = footerStyle?.bgColor || brandingPrimary
  const effectiveTextColor = footerStyle?.bgImage ? '#ffffff' : (footerStyle?.textColor || (brandingPrimary ? getContrastColor(brandingPrimary) : undefined))

  const footerBgStyle: React.CSSProperties = {}
  if (effectiveBgColor) {
    footerBgStyle.backgroundColor = effectiveBgColor
  }
  if (effectiveTextColor) {
    footerBgStyle.color = effectiveTextColor
  }

  return (
    <footer 
      className={cn(
        "border-t relative overflow-hidden",
        !effectiveBgColor && "bg-muted/40"
      )}
      style={footerBgStyle}
    >
      {footerStyle?.bgImage && (
        <div className="absolute inset-0">
          <Image
            src={footerStyle.bgImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>
      )}
      <div className={cn("container py-8 md:py-12", footerStyle?.bgImage && "relative z-10")}>
        <div className={cn(
          layout === 'centered' ? "flex flex-col items-center text-center gap-6" :
          layout === 'minimal' ? "flex flex-col md:flex-row items-center justify-between gap-4" :
          "grid grid-cols-2 md:grid-cols-4 gap-8"
        )}>
          <div className={cn(
            layout === 'default' && "col-span-2 md:col-span-1",
            layout === 'centered' && "flex flex-col items-center"
          )}>
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
            <p className={cn("mt-2 text-sm", footerStyle?.textColor ? "opacity-70" : "text-muted-foreground")}>
              {branding.tagline}
            </p>
            
            {hasSocialLinks && (
              <div className="flex items-center gap-3 mt-4">
                {social.twitter && (
                  <a 
                    href={social.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn("transition-colors", footerStyle?.textColor ? "opacity-70 hover:opacity-100" : "text-muted-foreground hover:text-foreground")}
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
                    className={cn("transition-colors", footerStyle?.textColor ? "opacity-70 hover:opacity-100" : "text-muted-foreground hover:text-foreground")}
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
                    className={cn("transition-colors", footerStyle?.textColor ? "opacity-70 hover:opacity-100" : "text-muted-foreground hover:text-foreground")}
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
                    className={cn("transition-colors", footerStyle?.textColor ? "opacity-70 hover:opacity-100" : "text-muted-foreground hover:text-foreground")}
                    data-testid="link-social-website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {layout !== 'minimal' && (<>
            <div>
              <h4 className="font-medium mb-3">Product</h4>
              <ul className={cn("space-y-2 text-sm", footerStyle?.textColor ? "opacity-70" : "text-muted-foreground")}>
                <li><Link href="/pricing" className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")} data-testid="link-footer-pricing">Pricing</Link></li>
                <li><Link href="/faq" className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")} data-testid="link-footer-faq">FAQ</Link></li>
                {settings?.pages?.customPages?.filter(p => p.enabled && p.name && p.slug).map(page => (
                  <li key={page.id}>
                    <Link 
                      href={`/p/${page.slug}`} 
                      className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")}
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
              <ul className={cn("space-y-2 text-sm", footerStyle?.textColor ? "opacity-70" : "text-muted-foreground")}>
                <li><Link href="/about" className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")} data-testid="link-footer-about">About</Link></li>
                <li><Link href="/contact" className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")} data-testid="link-footer-contact">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Legal</h4>
              <ul className={cn("space-y-2 text-sm", footerStyle?.textColor ? "opacity-70" : "text-muted-foreground")}>
                <li><Link href="/privacy" className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")} data-testid="link-footer-privacy">Privacy</Link></li>
                <li><Link href="/terms" className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")} data-testid="link-footer-terms">Terms</Link></li>
              </ul>
            </div>
          </>)}
        </div>

        <div className={cn("mt-8 pt-8 border-t text-center text-sm", footerStyle?.textColor ? "opacity-60" : "text-muted-foreground")}>
          <p>&copy; {new Date().getFullYear()} {branding.companyName}. All rights reserved.</p>
          {branding.supportEmail && (
            <p className="mt-1">
              <a href={`mailto:${branding.supportEmail}`} className={cn("transition-colors", footerStyle?.textColor ? "hover:opacity-100" : "hover:text-foreground")}>
                {branding.supportEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
