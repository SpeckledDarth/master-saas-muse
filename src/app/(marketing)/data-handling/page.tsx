'use client'

import { useSettings } from '@/hooks/use-settings'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function stripFirstHeading(content: string): string {
  return content.replace(/^#\s+[^\n]+\n*/, '')
}

export default function DataHandlingPage() {
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-data-handling" />
      </div>
    )
  }

  const legal = settings?.pages?.legal
  const branding = settings?.branding
  const compliance = settings?.compliance

  if (!compliance?.dataHandlingEnabled) {
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-data-handling-title">
            Data Handling Policy
          </h1>
          <p className="text-muted-foreground" data-testid="text-data-handling-updated">
            Last updated: {legal?.dataHandlingLastUpdated || 'Not specified'}
          </p>
        </div>
        <div className="prose prose-neutral dark:prose-invert max-w-none" data-testid="content-data-handling">
          <ReactMarkdown>
            {stripFirstHeading(legal?.dataHandling
              ?.replace(/\{appName\}/g, branding?.appName || 'Our Service')
              ?.replace(/\{supportEmail\}/g, branding?.supportEmail || 'support@example.com') || 
             'Content has not been configured yet.')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
