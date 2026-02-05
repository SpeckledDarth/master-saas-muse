'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSettings } from '@/lib/settings'
import { FeatureToggles, defaultSettings } from '@/types/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { SiGoogle, SiGithub, SiApple, SiX } from 'react-icons/si'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [features, setFeatures] = useState<FeatureToggles>(defaultSettings.features)

  useEffect(() => {
    const pendingToken = localStorage.getItem('pendingInviteToken')
    if (pendingToken && !searchParams.get('redirectTo')) {
      router.replace(`/signup?redirectTo=/invite/${pendingToken}`)
    }
    
    // Load feature settings (defaults already set, this updates with server values)
    getSettings().then(settings => {
      setFeatures(settings.features)
    }).catch(() => {
      // Keep defaults on error
    })
  }, [searchParams, router])

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If user is immediately logged in (email confirmation disabled), redirect
    if (data?.session) {
      // Keep pendingInviteToken if redirecting to invite page (will be used for auto-accept)
      if (!redirectTo.startsWith('/invite/')) {
        localStorage.removeItem('pendingInviteToken')
      }
      router.push(redirectTo)
      return
    }

    // Otherwise show confirmation email message
    setSuccess(true)
    setLoading(false)
  }

  async function handleOAuthSignup(provider: 'google' | 'github' | 'apple' | 'twitter') {
    const supabase = createClient()
    const pendingToken = localStorage.getItem('pendingInviteToken')
    const finalRedirect = pendingToken ? `/invite/${pendingToken}` : redirectTo
    
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(finalRedirect)}`,
      },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in your email to activate your account.
            </p>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground text-center">
                <strong>No email?</strong> Check your spam folder, or if you already have an account,{' '}
                <Link href="/login" className="text-primary hover:underline" data-testid="link-login-from-success">
                  try logging in instead
                </Link>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Get started with your free account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(features.googleOAuth || features.githubOAuth || features.appleOAuth || features.twitterOAuth) && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {features.googleOAuth && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignup('google')}
                    data-testid="button-google-signup"
                  >
                    <SiGoogle className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                )}
                {features.githubOAuth && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignup('github')}
                    data-testid="button-github-signup"
                  >
                    <SiGithub className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                )}
                {features.appleOAuth && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignup('apple')}
                    data-testid="button-apple-signup"
                  >
                    <SiApple className="mr-2 h-4 w-4" />
                    Apple
                  </Button>
                )}
                {features.twitterOAuth && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignup('twitter')}
                    data-testid="button-twitter-signup"
                  >
                    <SiX className="mr-2 h-4 w-4" />
                    X
                  </Button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" data-testid="text-error">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

import { Suspense } from 'react'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SignupForm />
    </Suspense>
  )
}
