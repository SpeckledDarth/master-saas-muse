'use client'

import { useSettings } from '@/hooks/use-settings'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function stripFirstHeading(content: string): string {
  return content.replace(/^#\s+[^\n]+\n*/, '')
}

export default function DmcaPage() {
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-dmca" />
      </div>
    )
  }

  const legal = settings?.pages?.legal
  const branding = settings?.branding
  const compliance = settings?.compliance

  if (!compliance?.dmcaEnabled) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Available</h1>
          <p className="text-muted-foreground">This page has not been enabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <title>{`DMCA Policy | ${branding?.appName || 'Our Service'}`}</title>
      <meta name="description" content={`DMCA Policy for ${branding?.appName || 'Our Service'}. Learn about our procedures for copyright infringement claims.`} />
      <meta property="og:title" content={`DMCA Policy | ${branding?.appName || 'Our Service'}`} />
      <meta property="og:description" content={`DMCA Policy for ${branding?.appName || 'Our Service'}. Learn about our procedures for copyright infringement claims.`} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="/dmca" />
      <link rel="canonical" href="/dmca" />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-dmca-title">
            DMCA Policy
          </h1>
          <p className="text-muted-foreground" data-testid="text-dmca-updated">
            Last updated: {legal?.dmcaLastUpdated || 'Not specified'}
          </p>
        </div>
        <div className="prose prose-neutral dark:prose-invert max-w-none" data-testid="content-dmca">
          <ReactMarkdown>
            {stripFirstHeading(legal?.dmcaPolicy
              ?.replace(/\{appName\}/g, branding?.appName || 'Our Service')
              ?.replace(/\{supportEmail\}/g, branding?.supportEmail || 'support@example.com') || 
             'Content has not been configured yet.')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
