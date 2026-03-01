'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DSCard as Card, DSCardContent as CardContent } from '@/components/ui/ds-card'
import { Loader2, ArrowRight } from 'lucide-react'

interface LandingPageData {
  page: {
    headline: string
    bio: string
    photo_url: string
    custom_cta: string
    theme_color: string
    slug: string
  }
  ref_code: string | null
}

export default function PartnerLandingPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [data, setData] = useState<LandingPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/affiliate/landing-page/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-partner-page">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" data-testid="error-partner-page">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-4">This partner page doesn't exist or is no longer active.</p>
            <Link href="/">
              <Button data-testid="button-go-home">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { page, ref_code } = data
  const themeColor = page.theme_color || '#6366f1'
  const signupUrl = ref_code ? `/?ref=${ref_code}` : '/'

  return (
    <div className="min-h-screen bg-background" data-testid="page-partner-landing">
      <div
        className="w-full py-20 px-4"
        style={{ background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}08)` }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {page.photo_url && (
            <div className="flex justify-center mb-4">
              <img
                src={page.photo_url}
                alt="Partner"
                className="w-24 h-24 rounded-full object-cover border-4"
                style={{ borderColor: themeColor }}
                data-testid="img-partner-photo"
              />
            </div>
          )}

          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            data-testid="text-partner-headline"
          >
            {page.headline || 'Welcome'}
          </h1>

          {page.bio && (
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed" data-testid="text-partner-bio">
              {page.bio}
            </p>
          )}

          <div className="pt-4">
            <Link href={signupUrl}>
              <Button
                size="lg"
                className="text-base px-8"
                style={{ backgroundColor: themeColor, borderColor: themeColor }}
                data-testid="button-partner-cta"
              >
                {page.custom_cta || 'Get Started'} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Referred by a trusted partner
        </p>
      </div>
    </div>
  )
}
