'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'

interface UpgradeBannerProps {
  feature: string
  requiredTier: 'pro' | 'team'
  showDismiss?: boolean
}

export function UpgradeBanner({ feature, requiredTier, showDismiss = true }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  if (dismissed) return null

  const tierName = requiredTier === 'team' ? 'Team' : 'Pro'

  return (
    <Card className="border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950" data-testid="banner-upgrade">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900">
              <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-upgrade-feature">
                {feature} requires {tierName} plan
              </p>
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock this feature and more
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => router.push('/pricing')} 
              size="sm"
              data-testid="button-upgrade-now"
            >
              Upgrade Now
            </Button>
            {showDismiss && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setDismissed(true)}
                data-testid="button-dismiss-banner"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureGateProps {
  children: React.ReactNode
  feature: string
  userTier: 'free' | 'pro' | 'team'
  requiredTier: 'pro' | 'team'
  fallback?: React.ReactNode
}

export function FeatureGate({ 
  children, 
  feature,
  userTier, 
  requiredTier, 
  fallback 
}: FeatureGateProps) {
  const tierHierarchy = ['free', 'pro', 'team']
  const userIndex = tierHierarchy.indexOf(userTier)
  const requiredIndex = tierHierarchy.indexOf(requiredTier)

  if (userIndex >= requiredIndex) {
    return <>{children}</>
  }

  return fallback ?? <UpgradeBanner feature={feature} requiredTier={requiredTier} />
}
