'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { DSCard as Card, DSCardContent as CardContent, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldCheck, ShieldX, Award } from 'lucide-react'

const BADGE_LABELS: Record<string, string> = {
  verified_partner: 'Verified Partner',
  top_partner: 'Top Partner',
  elite_partner: 'Elite Partner',
}

export default function VerifyBadgePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!code) return
    fetch(`/api/affiliate/badges/verify/${code}`)
      .then(res => res.json())
      .then(data => {
        if (data.is_valid) {
          setResult(data)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold" data-testid="text-verify-invalid">Invalid Verification</h2>
            <p className="text-sm text-muted-foreground">
              This verification code is invalid or the badge is no longer active.
            </p>
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="link-verify-home">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const badgeLabel = BADGE_LABELS[result.badge_type] || result.badge_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="page-badge-verify">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--success)/0.1)] flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="h-8 w-8 text-[hsl(var(--success))]" />
          </div>
          <CardTitle className="text-xl" data-testid="text-verify-valid">Verified Badge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-sm" data-testid="badge-type-display">{badgeLabel}</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between px-4 py-2 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Partner</span>
              <span className="font-medium" data-testid="text-affiliate-name">{result.affiliate_name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Earnings Threshold</span>
              <span className="font-medium" data-testid="text-threshold">${(result.threshold_cents / 100).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 rounded-md bg-muted/50">
              <span className="text-muted-foreground">Awarded</span>
              <span className="font-medium" data-testid="text-awarded-date">{new Date(result.awarded_at).toLocaleDateString()}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            This badge confirms that this affiliate partner has earned at least ${(result.threshold_cents / 100).toLocaleString()} through our affiliate program.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
