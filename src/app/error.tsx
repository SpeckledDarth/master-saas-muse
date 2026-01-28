'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-error-title">
            Something went wrong
          </h1>
          <p className="text-muted-foreground" data-testid="text-error-message">
            We're sorry, but something unexpected happened. 
            Please try again or contact support if the problem persists.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => reset()}
            data-testid="button-try-again"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Link href="/" data-testid="link-home">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-go-home">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-muted-foreground" data-testid="text-error-id">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
