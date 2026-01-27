'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
    }
  }, [sessionId, router])

  return (
    <Card className="max-w-md w-full text-center" data-testid="card-checkout-success">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl" data-testid="text-success-title">Payment Successful!</CardTitle>
        <CardDescription data-testid="text-success-description">
          Thank you for your subscription. Your account has been upgraded.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You will receive a confirmation email shortly with your subscription details.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push('/profile')} data-testid="button-go-to-profile">
            Go to Profile
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} data-testid="button-go-home">
            Return Home
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Suspense fallback={
        <Card className="max-w-md w-full text-center">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
