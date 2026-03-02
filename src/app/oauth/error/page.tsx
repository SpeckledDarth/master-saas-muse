'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { DSCard as Card, DSCardContent as CardContent, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'

function OAuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An unknown error occurred during connection.'
  const platform = searchParams.get('platform') || 'the platform'

  const platformName = {
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
  }[platform] || platform

  const isCallbackMismatch = error.toLowerCase().includes('redirect') || error.toLowerCase().includes('mismatch') || error.toLowerCase().includes('callback url')
  const isExpired = error.toLowerCase().includes('expired')
  const isTokenFailed = error.toLowerCase().includes('token exchange')
  const isDenied = error.toLowerCase().includes('declined') || error.toLowerCase().includes('denied')
  const isTimeout = error.toLowerCase().includes('timed out') || error.toLowerCase().includes('timeout')
  const isCredentials = error.toLowerCase().includes('credentials') || error.toLowerCase().includes('not configured')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full" data-testid="card-oauth-error">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle data-testid="text-oauth-error-title">
            Connection Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-[var(--content-density-gap,1rem)]">
          <p className="text-center text-muted-foreground" data-testid="text-oauth-error-message">
            We couldn&apos;t connect your {platformName} account.
          </p>
          
          <div className="rounded-[var(--card-radius,0.75rem)] bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-sm text-destructive" data-testid="text-oauth-error-detail">
              {error}
            </p>
          </div>

          {isCallbackMismatch && (
            <div className="rounded-[var(--card-radius,0.75rem)] bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] p-3">
              <p className="text-sm text-[hsl(var(--warning))]">
                This usually means the callback URL in your {platformName} developer app settings doesn&apos;t match your site URL. Check the developer portal and update it.
              </p>
            </div>
          )}

          {isExpired && (
            <div className="rounded-[var(--card-radius,0.75rem)] bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] p-3">
              <p className="text-sm text-[hsl(var(--warning))]">
                The authorization request expired. This happens if you wait too long on the authorization page. Please try again.
              </p>
            </div>
          )}

          {isTokenFailed && (
            <div className="rounded-[var(--card-radius,0.75rem)] bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] p-3">
              <p className="text-sm text-[hsl(var(--warning))]">
                The token exchange with {platformName} failed. Check that your API credentials (Client ID and Secret) are correct in the admin settings.
              </p>
            </div>
          )}

          {isDenied && (
            <div className="rounded-[var(--card-radius,0.75rem)] bg-[hsl(var(--info)/0.1)] border border-[hsl(var(--info)/0.3)] p-3">
              <p className="text-sm text-[hsl(var(--info))]">
                No worries — you can try connecting again whenever you&apos;re ready. Just click &quot;Try Again&quot; below.
              </p>
            </div>
          )}

          {isTimeout && (
            <div className="rounded-[var(--card-radius,0.75rem)] bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] p-3">
              <p className="text-sm text-[hsl(var(--warning))]">
                The request to {platformName} timed out. This can happen if {platformName}&apos;s servers are slow. Wait a moment and try again.
              </p>
            </div>
          )}

          {isCredentials && (
            <div className="rounded-[var(--card-radius,0.75rem)] bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] p-3">
              <p className="text-sm text-[hsl(var(--warning))]">
                Your {platformName} API credentials may not be set up yet. Go to Admin Settings to add the Client ID and Secret.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-[var(--content-density-gap,1rem)] pt-2">
            <Button asChild variant="outline" className="flex-1" data-testid="button-back-to-social">
              <Link href="/dashboard/social">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Accounts
              </Link>
            </Button>
            <Button asChild className="flex-1" data-testid="button-try-again">
              <Link href="/dashboard/social">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  )
}
