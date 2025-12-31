'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ExternalLink, Loader2, Crown, Users, Sparkles } from 'lucide-react'

interface SubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing'
  tier: 'free' | 'pro' | 'team'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  subscriptionId: string | null
  priceId: string | null
}

const tierConfig = {
  free: {
    name: 'Free',
    description: 'Basic features for getting started',
    icon: Sparkles,
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
  },
  pro: {
    name: 'Pro',
    description: 'For professionals and growing teams',
    icon: Crown,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  },
  team: {
    name: 'Team',
    description: 'For larger organizations',
    icon: Users,
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  },
}

const statusLabels: Record<SubscriptionInfo['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  free: { label: 'Free Plan', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  trialing: { label: 'Trial', variant: 'outline' },
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/stripe/subscription')
        if (response.status === 401) {
          router.push('/login?redirect=/billing')
          return
        }
        const data = await response.json()
        setSubscription(data)
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubscription()
  }, [router])

  const handleManageBilling = async () => {
    setIsPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'No billing account found') {
        router.push('/pricing')
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-billing" />
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Unable to load subscription information.</p>
            <Button onClick={() => window.location.reload()} className="mt-4" data-testid="button-retry">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tierInfo = tierConfig[subscription.tier]
  const TierIcon = tierInfo.icon
  const statusInfo = statusLabels[subscription.status]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-billing-title">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
      </div>

      <div className="space-y-6">
        <Card data-testid="card-subscription-status">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tierInfo.color}`}>
                  <TierIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">{tierInfo.name} Plan</CardTitle>
                  <CardDescription>{tierInfo.description}</CardDescription>
                </div>
              </div>
              <Badge variant={statusInfo.variant} data-testid="badge-subscription-status">
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.status !== 'free' && subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between gap-4 py-3 border-t flex-wrap">
                <div>
                  <p className="text-sm font-medium">
                    {subscription.cancelAtPeriodEnd ? 'Access ends on' : 'Next billing date'}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-billing-date">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Canceling
                  </Badge>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2 flex-wrap">
              {subscription.status === 'free' ? (
                <Button onClick={() => router.push('/pricing')} data-testid="button-upgrade">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              ) : (
                <Button 
                  onClick={handleManageBilling} 
                  disabled={isPortalLoading}
                  data-testid="button-manage-billing"
                >
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Manage Billing
                </Button>
              )}
              {subscription.status !== 'free' && (
                <Button variant="outline" onClick={() => router.push('/pricing')} data-testid="button-view-plans">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-billing-help">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you have questions about your subscription or need assistance with billing, 
              please contact our support team.
            </p>
            <Button variant="outline" size="sm" data-testid="button-contact-support">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
