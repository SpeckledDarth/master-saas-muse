'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const isCallbackMismatch = error.toLowerCase().includes('redirect') || error.toLowerCase().includes('mismatch')
  const isExpired = error.toLowerCase().includes('expired')
  const isTokenFailed = error.toLowerCase().includes('token exchange')

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
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground" data-testid="text-oauth-error-message">
            We couldn&apos;t connect your {platformName} account.
          </p>
          
          <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-sm text-destructive" data-testid="text-oauth-error-detail">
              {error}
            </p>
          </div>

          {isCallbackMismatch && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This usually means the callback URL in your {platformName} developer app settings doesn&apos;t match your site URL. Check the developer portal and update it.
              </p>
            </div>
          )}

          {isExpired && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                The authorization request expired. This happens if you wait too long on the authorization page. Please try again.
              </p>
            </div>
          )}

          {isTokenFailed && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                The token exchange with {platformName} failed. Check that your API credentials (Client ID and Secret) are correct in the admin settings.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
