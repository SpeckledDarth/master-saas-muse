'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface Price {
  id: string
  unit_amount: number
  currency: string
  recurring: {
    interval: string
  } | null
}

interface Product {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
  prices: Price[]
}

const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  description: 'Perfect for getting started',
  features: ['Basic features', 'Community support', '1 project'],
  price: 0,
}

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const router = useRouter()

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/stripe/products')
        const data = await response.json()
        setProducts(data.data || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleSubscribe = async (priceId: string) => {
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
    }
  }

  const getPrice = (product: Product): Price | undefined => {
    return product.prices.find(p => p.recurring?.interval === billingInterval)
  }

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount / 100)
  }

  const getFeatures = (product: Product): string[] => {
    try {
      return JSON.parse(product.metadata?.features || '[]')
    } catch {
      return []
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mb-12">Loading pricing plans...</p>
        </div>
      </div>
    )
  }

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
        <Card data-testid="card-plan-free">
          <CardHeader>
            <CardTitle>{FREE_PLAN.name}</CardTitle>
            <CardDescription>{FREE_PLAN.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3">
              {FREE_PLAN.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/signup')} data-testid="button-subscribe-free">
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {products.map((product) => {
          const price = getPrice(product)
          const features = getFeatures(product)
          const isPro = product.metadata?.tier === 'pro'

          return (
            <Card 
              key={product.id} 
              className={isPro ? 'border-primary shadow-lg' : ''}
              data-testid={`card-plan-${product.metadata?.tier || product.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{product.name}</CardTitle>
                  {isPro && <Badge>Popular</Badge>}
                </div>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  {price ? (
                    <>
                      <span className="text-4xl font-bold">{formatPrice(price.unit_amount)}</span>
                      <span className="text-muted-foreground">/{billingInterval}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Contact us</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {features.map((feature, i) => (
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
                  variant={isPro ? 'default' : 'outline'}
                  onClick={() => price && handleSubscribe(price.id)}
                  disabled={!price}
                  data-testid={`button-subscribe-${product.metadata?.tier || product.id}`}
                >
                  Subscribe
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
