'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)
  const router = useRouter()
  const { settings, loading } = useSettings()
  const { pricing } = settings

  const handleSubscribe = async (priceId: string | null, tier: string) => {
    if (!priceId) {
      router.push('/signup')
      return
    }

    setIsSubscribing(tier)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        router.push('/login?redirect=/pricing')
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsSubscribing(null)
    }
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mb-12">Loading pricing plans...</p>
        </div>
      </div>
    )
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      features: ['Basic features', 'Community support', '1 project'],
      priceId: null,
      popular: false,
    },
    {
      id: 'pro',
      name: pricing.proName,
      description: 'For growing businesses',
      price: pricing.proPrice,
      features: pricing.proFeatures,
      priceId: pricing.proPriceId,
      popular: true,
    },
    {
      id: 'team',
      name: pricing.teamName,
      description: 'For larger teams',
      price: pricing.teamPrice,
      features: pricing.teamFeatures,
      priceId: pricing.teamPriceId,
      popular: false,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground mb-8" data-testid="text-pricing-subtitle">
          Choose the plan that works best for you
        </p>
        
        <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={billingInterval === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingInterval('month')}
            data-testid="button-billing-monthly"
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === 'year' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingInterval('year')}
            data-testid="button-billing-yearly"
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const displayPrice = billingInterval === 'year' 
            ? Math.round(plan.price * 12 * 0.8) 
            : plan.price

          return (
            <Card 
              key={plan.id} 
              className={plan.popular ? 'border-primary shadow-lg' : ''}
              data-testid={`card-plan-${plan.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge>Popular</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{formatPrice(displayPrice)}</span>
                  <span className="text-muted-foreground">/{billingInterval}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.priceId, plan.id)}
                  disabled={isSubscribing === plan.id}
                  data-testid={`button-subscribe-${plan.id}`}
                >
                  {isSubscribing === plan.id ? 'Loading...' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
