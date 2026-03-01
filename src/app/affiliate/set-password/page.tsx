'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DSCard as Card, DSCardContent as CardContent, DSCardDescription as CardDescription, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
import { Loader2, CheckCircle, ArrowLeft, Lock } from 'lucide-react'

export default function AffiliateSetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <AffiliateSetPasswordPage />
    </Suspense>
  )
}

function AffiliateSetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const appName = settings?.branding?.appName || 'Our Product'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function initSession() {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setHasSession(true)
        setCheckingSession(false)
        return
      }

      const hash = window.location.hash
      if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            setHasSession(true)
            setCheckingSession(false)
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }
      }

      setCheckingSession(false)
    }
    initSession()
  }, [])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    setMessage({ type: 'success', text: 'Password set successfully! Redirecting to your dashboard...' })
    setLoading(false)

    setTimeout(() => {
      router.push('/affiliate/dashboard')
    }, 2000)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-border">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/10 border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--warning)/0.1)] flex items-center justify-center mx-auto mb-2">
                <Lock className="h-6 w-6 text-[hsl(var(--warning))]" />
              </div>
              <CardTitle className="text-2xl text-black dark:text-white" data-testid="text-expired-title">Link Expired or Invalid</CardTitle>
              <CardDescription>
                The password setup link has expired or is no longer valid. No worries — you can request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" size="lg" data-testid="button-forgot-password">
                <Link href="/affiliate/forgot-password">Request New Password Link</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="lg" data-testid="button-go-login">
                <Link href="/affiliate/login">Go to Login</Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You can also use the magic link option on the login page to sign in without a password.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/affiliate/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="link-back-dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <Card className="bg-white/10 border-border">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-black dark:text-white" data-testid="text-set-password-title">Set Your Password</CardTitle>
            <CardDescription>
              Create a password so you can log in directly to your {appName} affiliate dashboard without needing a magic link each time.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSetPassword}>
            <CardContent className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                  data-testid="text-set-password-message"
                >
                  {message.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
                  {message.text}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="input-set-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || !password || !confirmPassword} data-testid="button-set-password">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  'Set Password'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                This is optional. You can always use the magic link to log in.
              </p>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
