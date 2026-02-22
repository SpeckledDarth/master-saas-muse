'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function AffiliateLoginPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const appName = settings?.branding?.appName || 'Our Product'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('magic')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setMagicLinkLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/affiliate/dashboard`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setMagicLinkSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setMagicLinkLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/affiliate/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-gray-500/50">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2" data-testid="text-magic-sent">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              We sent a login link to <strong>{email}</strong>. Click the link in the email to access your affiliate dashboard.
            </p>
            <Button variant="outline" onClick={() => setMagicLinkSent(false)} data-testid="button-try-again">
              Try a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="link-back-affiliate">
            <ArrowLeft className="h-4 w-4" /> Affiliate Program
          </Link>
        </div>

        <Card className="bg-white/10 border-gray-500/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-black dark:text-white" data-testid="text-login-title">Affiliate Login</CardTitle>
            <CardDescription>Access your {appName} affiliate dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'magic' ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    data-testid="input-login-email"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3" data-testid="text-login-error">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={magicLinkLoading || !email} data-testid="button-send-magic-link">
                  {magicLinkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send Login Link
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('password'); setError(null) }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    data-testid="button-switch-password"
                  >
                    Use password instead
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    data-testid="input-login-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="input-login-password"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3" data-testid="text-login-error">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading || !email || !password} data-testid="button-password-login">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Log In
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('magic'); setError(null) }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    data-testid="button-switch-magic"
                  >
                    Use magic link instead
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              Not an affiliate yet?{' '}
              <Link href="/affiliate/join" className="text-primary-600 hover:underline" data-testid="link-apply">
                Apply here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
