'use client'

import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, BookOpen, FileText, HelpCircle, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
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
        <h1 className="text-4xl font-bold mb-4" data-testid="text-docs-title">
          Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-docs-subtitle">
          Everything you need to get started with {appName}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        <Card className="hover-elevate" data-testid="card-docs-getting-started">
          <CardHeader>
            <BookOpen className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-docs-getting-started-title">Getting Started</CardTitle>
            <CardDescription data-testid="text-docs-getting-started-desc">
              Quick start guide for new users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-docs-getting-started-content">
              Learn the basics and get up and running in minutes with our step-by-step guide.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-docs-api">
          <CardHeader>
            <FileText className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-docs-api-title">API Reference</CardTitle>
            <CardDescription data-testid="text-docs-api-desc">
              Complete API documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-docs-api-content">
              Detailed documentation for developers looking to integrate with our platform.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-docs-faq">
          <CardHeader>
            <HelpCircle className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-docs-faq-title">FAQ</CardTitle>
            <CardDescription data-testid="text-docs-faq-desc">
              Frequently asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-docs-faq-content">
              Find answers to common questions about features, billing, and more.
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-docs-support">
          <CardHeader>
            <MessageCircle className="h-10 w-10 text-foreground mb-2" />
            <CardTitle data-testid="text-docs-support-title">Support</CardTitle>
            <CardDescription data-testid="text-docs-support-desc">
              Get help when you need it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground" data-testid="text-docs-support-content">
              Our support team is here to help you succeed. Reach out anytime.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center bg-muted/50 rounded-lg p-8 max-w-2xl mx-auto" data-testid="section-docs-coming-soon">
        <h2 className="text-2xl font-semibold mb-4" data-testid="text-docs-coming-soon-title">Documentation Coming Soon</h2>
        <p className="text-muted-foreground mb-6" data-testid="text-docs-coming-soon-desc">
          We are actively building out comprehensive documentation. In the meantime, feel free to explore or contact us with any questions.
        </p>
        <Link href="/" data-testid="link-back-home">
          <Button data-testid="button-back-home">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
