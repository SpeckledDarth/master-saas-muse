'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { PageHero } from '@/components/page-hero'

interface StripePrice {
  id: string
  unit_amount: number | null
  currency: string
  recurring: {
    interval: 'month' | 'year'
  } | null
}

interface StripeProduct {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
  prices: StripePrice[]
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([])
  const [stripeLoading, setStripeLoading] = useState(true)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const router = useRouter()
  const { settings, loading } = useSettings()
  const pricing = settings?.pricing
  
  useEffect(() => {
    async function fetchStripeProducts() {
      try {
        const res = await fetch('/api/stripe/products')
        if (res.ok) {
          const data = await res.json()
          setStripeProducts(data.data || [])
        } else {
          setStripeError('Unable to load pricing from Stripe')
        }
      } catch (err) {
        setStripeError('Unable to load pricing from Stripe')
      } finally {
        setStripeLoading(false)
      }
    }
    fetchStripeProducts()
  }, [])

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
      currency: pricing?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading || stripeLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mb-12 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pricing plans...
          </p>
        </div>
      </div>
    )
  }

  const hasStripeProducts = stripeProducts.length > 0 && !stripeError

  const sortedStripeProducts = [...stripeProducts].sort((a, b) => {
    const orderA = parseInt(a.metadata.sort_order || '999', 10)
    const orderB = parseInt(b.metadata.sort_order || '999', 10)
    return orderA - orderB
  })

  const getStripePrice = (product: StripeProduct, interval: 'month' | 'year'): StripePrice | undefined => {
    return product.prices.find(p => p.recurring?.interval === interval)
  }

  const formatStripePrice = (amount: number | null, currency: string): string => {
    if (amount === null) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100)
  }

  const pricingPage = settings?.pages?.pricing

  return (
    <div className="flex flex-col">
      <PageHero
        headline={pricingPage?.headline || 'Simple, Transparent Pricing'}
        subheadline={pricingPage?.subheadline || 'Choose the plan that works best for you'}
        imageUrl={pricingPage?.heroImageUrl}
        positionX={pricingPage?.heroImagePositionX ?? 50}
        positionY={pricingPage?.heroImagePositionY ?? 50}
        testId="pricing"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
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

      {hasStripeProducts ? (
        (() => {
          const totalCards = sortedStripeProducts.length + (pricing?.showFreePlan !== false ? 1 : 0)
          const layout = pricing?.cardLayout || 'auto'
          const colsClass = layout === '2' ? 'md:grid-cols-2' : layout === '3' ? 'md:grid-cols-3' : layout === '4' ? 'md:grid-cols-4' : totalCards <= 2 ? 'md:grid-cols-2' : totalCards === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
          return (
            <div className={`grid gap-8 max-w-6xl mx-auto ${colsClass}`}>
              {pricing?.showFreePlan !== false && (
                <Card data-testid="card-plan-free">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{pricing?.freePlanName || 'Free'}</CardTitle>
                    </div>
                    <CardDescription className="whitespace-pre-line">
                      {pricing?.freePlanDescription || 'Perfect for getting started'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground">/forever</span>
                    </div>
                    <ul className="space-y-3">
                      {(pricing?.freePlanFeatures || ['Basic features', 'Up to 100 items', 'Community support']).map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => router.push('/signup')}
                      data-testid="button-subscribe-free"
                    >
                      Get Started Free
                    </Button>
                  </CardFooter>
                </Card>
              )}
              {sortedStripeProducts.map((product) => {
                const price = getStripePrice(product, billingInterval)
                const isPopular = product.metadata.popular === 'true'

                return (
                  <Card 
                    key={product.id} 
                    className={isPopular ? 'border-primary shadow-lg' : ''}
                    data-testid={`card-plan-${product.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle>{product.name}</CardTitle>
                        {isPopular && <Badge>Popular</Badge>}
                      </div>
                      <CardDescription className="whitespace-pre-line">
                        {product.description || 'Get started with this plan'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        {price ? (
                          <>
                            <span className="text-4xl font-bold">{formatStripePrice(price.unit_amount, price.currency)}</span>
                            <span className="text-muted-foreground">/{billingInterval}</span>
                          </>
                        ) : (
                          <span className="text-4xl font-bold">Contact Us</span>
                        )}
                      </div>
                      {product.metadata.features && (
                        <ul className="space-y-3">
                          {product.metadata.features.split(',').map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{feature.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={isPopular ? 'default' : 'outline'}
                        onClick={() => price && handleSubscribe(price.id, product.id)}
                        disabled={!price || isSubscribing === product.id}
                        data-testid={`button-subscribe-${product.id}`}
                      >
                        {isSubscribing === product.id ? 'Loading...' : price ? 'Subscribe' : 'Contact Sales'}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )
        })()
      ) : (
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {(pricing?.plans || []).map((plan) => {
            const displayPrice = billingInterval === 'year' 
              ? Math.round(plan.price * 12 * 0.8) 
              : plan.price

            return (
              <Card 
                key={plan.id} 
                className={plan.highlighted ? 'border-primary shadow-lg' : ''}
                data-testid={`card-plan-${plan.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.highlighted && <Badge>Popular</Badge>}
                  </div>
                  <CardDescription>
                    {plan.price === 0 ? 'Perfect for getting started' : 
                     plan.id === 'pro' ? 'For growing businesses' : 'For larger teams'}
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{formatPrice(displayPrice)}</span>
                  <span className="text-muted-foreground">/{billingInterval}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.stripePriceId || null, plan.id)}
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
      )}
      </div>
    </div>
  )
}
