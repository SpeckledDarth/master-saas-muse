'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSettings } from '@/lib/settings'
import { FeatureToggles, defaultSettings } from '@/types/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Shield } from 'lucide-react'
import { SiGoogle, SiGithub, SiApple, SiX } from 'react-icons/si'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlRedirectTo = searchParams.get('redirectTo') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoAvailable, setSsoAvailable] = useState(false)
  const [ssoDomain, setSsoDomain] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [redirectTo, setRedirectTo] = useState(urlRedirectTo)
  const [features, setFeatures] = useState<FeatureToggles>(defaultSettings.features)

  // Load feature settings and check for pending invite token
  useEffect(() => {
    const pendingToken = localStorage.getItem('pendingInviteToken')
    if (pendingToken && !urlRedirectTo.startsWith('/invite/')) {
      setRedirectTo(`/invite/${pendingToken}`)
    }
    
    // Load feature settings (defaults already set, this updates with server values)
    getSettings().then(settings => {
      setFeatures(settings.features)
    }).catch(() => {
      // Keep defaults on error
    })
  }, [urlRedirectTo])

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirect - if going to invite page, keep the token for auto-accept
    const pendingToken = localStorage.getItem('pendingInviteToken')
    const finalRedirect = pendingToken ? `/invite/${pendingToken}` : redirectTo
    
    router.push(finalRedirect)
  }

  async function handleOAuthLogin(provider: 'google' | 'github' | 'apple' | 'twitter') {
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

  useEffect(() => {
    if (!features.ssoEnabled) return
    const domain = email.includes('@') ? email.split('@')[1] : null
    if (!domain || domain.length < 3) {
      setSsoAvailable(false)
      setSsoDomain(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/sso/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain }),
        })
        if (res.ok) {
          const data = await res.json()
          setSsoAvailable(data.hasSSO)
          setSsoDomain(data.hasSSO ? domain : null)
        }
      } catch {
        setSsoAvailable(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [email, features.ssoEnabled])

  async function handleSSOLogin() {
    if (!ssoDomain) return
    setSsoLoading(true)
    setError(null)

    const supabase = createClient()
    const pendingToken = localStorage.getItem('pendingInviteToken')
    const finalRedirect = pendingToken ? `/invite/${pendingToken}` : redirectTo

    const { data, error } = await supabase.auth.signInWithSSO({
      domain: ssoDomain,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(finalRedirect)}`,
      },
    })

    if (error) {
      setError(error.message)
      setSsoLoading(false)
      return
    }

    if (data?.url) {
      window.location.href = data.url
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    setMagicLinkLoading(true)
    setError(null)
    
    const supabase = createClient()
    const pendingToken = localStorage.getItem('pendingInviteToken')
    const finalRedirect = pendingToken ? `/invite/${pendingToken}` : redirectTo
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(finalRedirect)}`,
      },
    })
    
    if (error) {
      setError(error.message)
      setMagicLinkLoading(false)
      return
    }
    
    setMagicLinkSent(true)
    setMagicLinkLoading(false)
  }

  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md" data-testid="card-magic-link-sent">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" data-testid="text-magic-link-title">Check your email</CardTitle>
          <CardDescription data-testid="text-magic-link-description">
            We've sent a magic link to <strong data-testid="text-magic-link-email">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center" data-testid="text-magic-link-instructions">
            Click the link in your email to sign in instantly.
          </p>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setMagicLinkSent(false)}
            data-testid="button-back-to-login"
          >
            Back to login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(features.googleOAuth || features.githubOAuth || features.appleOAuth || features.twitterOAuth) && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {features.googleOAuth && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthLogin('google')}
                  data-testid="button-google-login"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Google
                </Button>
              )}
              {features.githubOAuth && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthLogin('github')}
                  data-testid="button-github-login"
                >
                  <SiGithub className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              )}
              {features.appleOAuth && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthLogin('apple')}
                  data-testid="button-apple-login"
                >
                  <SiApple className="mr-2 h-4 w-4" />
                  Apple
                </Button>
              )}
              {features.twitterOAuth && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthLogin('twitter')}
                  data-testid="button-twitter-login"
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

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/reset-password" 
                className="text-xs text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                data-testid="link-forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="text-error">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
          
          {features.magicLink && (
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={handleMagicLink}
              disabled={magicLinkLoading}
              data-testid="button-magic-link"
            >
              {magicLinkLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send magic link instead
            </Button>
          )}

          {ssoAvailable && ssoDomain && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    SSO detected for {ssoDomain}
                  </span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleSSOLogin}
                disabled={ssoLoading}
                data-testid="button-sso-login"
              >
                {ssoLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Sign in with SSO
              </Button>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href={redirectTo !== '/' ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'} className="text-primary-600 dark:text-primary-400 hover:underline" data-testid="link-signup">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
