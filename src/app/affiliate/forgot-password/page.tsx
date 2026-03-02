'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DSCard as Card, DSCardContent as CardContent, DSCardDescription as CardDescription, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'

export default function AffiliateForgotPasswordPage() {
  const { settings } = useSettings()
  const appName = settings?.branding?.appName || 'Our Product'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/affiliate/set-password`,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Check your email for the password reset link. It may take a minute to arrive.' })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/affiliate/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="link-back-login">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>

        <Card className="bg-white/10 border-border">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-black dark:text-white" data-testid="text-forgot-title">Reset Your Password</CardTitle>
            <CardDescription>
              Enter the email address you use for your {appName} affiliate account and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-[var(--content-density-gap,1rem)]">
              {message && (
                <div
                  className={`p-3 rounded-[var(--card-radius,0.75rem)] text-sm ${
                    message.type === 'success'
                      ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                  data-testid="text-forgot-message"
                >
                  {message.text}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-forgot-email"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || !email} data-testid="button-send-reset">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/affiliate/login" className="text-primary hover:underline" data-testid="link-back-to-login">
                  Log in
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
