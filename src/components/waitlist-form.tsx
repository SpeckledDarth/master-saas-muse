'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'

interface WaitlistFormProps {
  className?: string
}

export function WaitlistForm({ className }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email) {
      toast({ title: 'Please enter your email', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        toast({ title: 'Success!', description: data.message })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to join waitlist', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary-600 dark:text-primary-400" />
        <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
        <p className="text-muted-foreground">
          We'll notify you when we launch.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          data-testid="input-waitlist-email"
        />
        <Button type="submit" disabled={loading} data-testid="button-join-waitlist">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </div>
    </form>
  )
}
