'use client'

import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Zap, Shield, Globe } from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const appName = settings?.branding?.appName || 'Our Platform'

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" data-testid="text-features-title">
          Features
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-subtitle">
          Discover what makes {appName} the best choice for your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="hover-elevate" data-testid="card-feature-speed">
          <CardHeader>
            <Zap className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-feature-speed-title">Lightning Fast</CardTitle>
            <CardDescription data-testid="text-feature-speed-desc">
              Built for speed and performance from the ground up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-feature-speed-content">
              Experience blazing fast load times and responsive interactions that keep you productive.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-feature-security">
          <CardHeader>
            <Shield className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-feature-security-title">Secure by Default</CardTitle>
            <CardDescription data-testid="text-feature-security-desc">
              Enterprise-grade security for peace of mind
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-feature-security-content">
              Your data is protected with industry-leading security measures and encryption.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-feature-access">
          <CardHeader>
            <Globe className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-feature-access-title">Works Everywhere</CardTitle>
            <CardDescription data-testid="text-feature-access-desc">
              Access from any device, anywhere in the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-feature-access-content">
              Whether on desktop, tablet, or mobile, enjoy a seamless experience across all devices.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-feature-coming">
          <CardHeader>
            <Sparkles className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-feature-coming-title">More Coming Soon</CardTitle>
            <CardDescription data-testid="text-feature-coming-desc">
              This page is under construction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-feature-coming-content">
              We are actively building out this features page. Check back soon for more details!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Link href="/pricing" data-testid="link-view-pricing">
          <Button size="lg" data-testid="button-view-pricing">
            View Pricing
          </Button>
        </Link>
      </div>
    </div>
  )
}
