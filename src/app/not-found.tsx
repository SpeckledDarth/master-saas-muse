'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/use-settings'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const { settings } = useSettings()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary" data-testid="text-404">
            404
          </h1>
          <h2 className="text-2xl font-semibold mt-4 mb-2" data-testid="text-page-not-found">
            Page Not Found
          </h2>
          <p className="text-muted-foreground" data-testid="text-404-message">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" data-testid="link-home">
            <Button className="w-full sm:w-auto" data-testid="button-go-home">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="w-full sm:w-auto"
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-helpful-links">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/features" 
              className="text-sm text-primary hover:underline"
              data-testid="link-features"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm text-primary hover:underline"
              data-testid="link-pricing"
            >
              Pricing
            </Link>
            <Link 
              href="/faq" 
              className="text-sm text-primary hover:underline"
              data-testid="link-faq"
            >
              FAQ
            </Link>
            <Link 
              href="/contact" 
              className="text-sm text-primary hover:underline"
              data-testid="link-contact"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
