'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X, RefreshCw, Unlink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'
import { PlatformIcon, getPlatformColor } from '@/components/social/platform-icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { BookOpen, ShieldCheck, ExternalLink, ChevronRight } from 'lucide-react'
import type { SocialAccount } from '@/lib/social/client'

type PlatformInfo = {
  id: string
  name: string
  comingSoon?: boolean
}

const PLATFORMS: PlatformInfo[] = [
  { id: 'twitter', name: 'X' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'discord', name: 'Discord' },
]

const PLATFORM_GUIDES: Record<string, { what: string; steps: string[]; time: string; note?: string }> = {
  twitter: {
    what: 'PassivePost will be able to post tweets and view your profile on your behalf.',
    steps: [
      'Click "Connect with X" below.',
      'You\'ll be taken to X (Twitter) — log in if needed.',
      'Review the permissions and click "Authorize app".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'Your password is never shared with PassivePost. X uses a secure system where you grant permission directly on their site.',
  },
  linkedin: {
    what: 'PassivePost will be able to create posts and view your profile on your behalf.',
    steps: [
      'Click "Connect with LinkedIn" below.',
      'You\'ll be taken to LinkedIn — log in if needed.',
      'Review the permissions and click "Allow".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'Your password is never shared with PassivePost. LinkedIn uses a secure system where you grant permission directly on their site.',
  },
  facebook: {
    what: 'PassivePost will be able to post to your Facebook Pages on your behalf.',
    steps: [
      'Click "Connect with Facebook" below.',
      'You\'ll be taken to Facebook — log in if needed.',
      'Choose which Pages to connect (you can select multiple).',
      'Click "Done" and you\'ll be brought back here.',
    ],
    time: 'Takes about 1 minute',
    note: 'PassivePost only posts to Pages you select — it cannot access your personal profile or messages.',
  },
  instagram: {
    what: 'PassivePost will be able to view your Instagram profile and engagement data.',
    steps: [
      'Click "Connect with Instagram" below.',
      'You\'ll be taken to Instagram — log in if needed.',
      'Review the permissions and click "Allow".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'Instagram requires a Business or Creator account. Personal accounts cannot be connected.',
  },
  youtube: {
    what: 'PassivePost will be able to view your channel info and upload videos on your behalf.',
    steps: [
      'Click "Connect with YouTube" below.',
      'You\'ll be taken to Google — log in if needed.',
      'Choose the Google account linked to your YouTube channel.',
      'Review the permissions and click "Allow".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'You must have a YouTube channel on the Google account you choose.',
  },
  reddit: {
    what: 'PassivePost will be able to create posts and view your profile on Reddit.',
    steps: [
      'Click "Connect with Reddit" below.',
      'You\'ll be taken to Reddit — log in if needed.',
      'Review the permissions and click "Allow".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'Your Reddit account should be at least 30 days old to post in most communities.',
  },
  pinterest: {
    what: 'PassivePost will be able to create pins and view your boards.',
    steps: [
      'Click "Connect with Pinterest" below.',
      'You\'ll be taken to Pinterest — log in if needed.',
      'Review the permissions and click "Allow".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'You need a Pinterest Business account. You can convert a personal account for free in Pinterest settings.',
  },
  discord: {
    what: 'PassivePost will be able to post messages to your Discord server on your behalf.',
    steps: [
      'Click "Connect with Discord" below.',
      'You\'ll be taken to Discord — log in if needed.',
      'Choose which server to connect.',
      'Review the permissions and click "Authorize".',
      'You\'ll be brought back here automatically.',
    ],
    time: 'Takes about 30 seconds',
    note: 'You need to be an admin or have "Manage Server" permission on the Discord server you want to connect.',
  },
}

function SocialAccountsContent() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [moduleDisabled, setModuleDisabled] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthSuccess, setOauthSuccess] = useState<string | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const toastShownRef = useRef(false)

  useEffect(() => {
    if (toastShownRef.current) return
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      toastShownRef.current = true
      const platformName = PLATFORMS.find(p => p.id === connected)?.name || connected
      setOauthSuccess(`Your ${platformName} account has been successfully connected!`)
      window.history.replaceState({}, '', '/dashboard/social')
    } else if (error) {
      toastShownRef.current = true
      setOauthError(error)
      window.history.replaceState({}, '', '/dashboard/social')
    }
  }, [searchParams, toast])

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts')
      if (res.status === 403) {
        setModuleDisabled(true)
        setLoading(false)
        return
      }
      if (!res.ok) {
        throw new Error('Failed to fetch accounts')
      }
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {
      toast({
        title: 'Error',
        description: 'Could not load social accounts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const OAUTH_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'discord', 'youtube', 'pinterest']

  const showGuideDialog = (platformId: string) => {
    setSelectedPlatform(platformId)
    setConnectDialogOpen(true)
  }

  const startOAuthConnect = async (platformId: string) => {
    setConnecting(platformId)
    setConnectDialogOpen(false)
    setOauthError(null)
    setOauthSuccess(null)
    try {
      const preflightRes = await fetch('/api/social/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      })
      if (!preflightRes.ok) {
        const errData = await preflightRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Pre-flight check failed. Please try again.')
      }
      const preflight = await preflightRes.json()
      if (!preflight.ready) {
        const issues = preflight.failures
          .map((f: { label: string; detail?: string }) => f.detail || f.label)
          .join('\n')
        throw new Error(`Setup incomplete:\n${issues}`)
      }

      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to start connection')
      }
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No authorization URL returned')
      }
    } catch (err) {
      const message = (err as Error).message
      setOauthError(message)
      setConnecting(null)
    }
  }

  const handleConnect = (platformId: string) => {
    if (OAUTH_PLATFORMS.includes(platformId)) {
      showGuideDialog(platformId)
    } else {
      setSelectedPlatform(platformId)
      setConnectDialogOpen(true)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    setDisconnecting(accountId)
    try {
      const res = await fetch(`/api/social/accounts/${accountId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to disconnect account')
      }
      setAccounts(prev => prev.filter(a => a.id !== accountId))
      toast({
        title: 'Disconnected',
        description: 'Social account has been disconnected',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Could not disconnect account',
        variant: 'destructive',
      })
    } finally {
      setDisconnecting(null)
    }
  }

  const handleValidateAll = async () => {
    setValidating(true)
    try {
      const res = await fetch('/api/social/accounts/validate', {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error('Validation failed')
      }
      const data = await res.json()
      if (data.results) {
        setAccounts(prev =>
          prev.map(account => {
            const result = data.results.find((r: { id: string }) => r.id === account.id)
            if (result) {
              return {
                ...account,
                is_valid: result.is_valid,
                last_validated_at: new Date().toISOString(),
                last_error: result.requires_reconnect
                  ? `Token expired — please reconnect`
                  : result.error,
              }
            }
            return account
          })
        )

        const refreshedCount = data.results.filter((r: { refreshed: boolean }) => r.refreshed).length
        const invalidCount = data.results.filter((r: { is_valid: boolean }) => !r.is_valid).length
        const reconnectCount = data.results.filter((r: { requires_reconnect: boolean }) => r.requires_reconnect).length
        const total = data.results.length

        let description = `Validated ${total} account(s).`
        if (refreshedCount > 0) description += ` ${refreshedCount} token(s) refreshed.`
        if (reconnectCount > 0) description += ` ${reconnectCount} need reconnecting.`

        toast({
          title: invalidCount > 0 ? 'Validation Complete — Issues Found' : 'All Accounts Valid',
          description,
          variant: invalidCount > 0 ? 'destructive' : 'default',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Could not validate accounts',
        variant: 'destructive',
      })
    } finally {
      setValidating(false)
    }
  }

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-social-accounts">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (moduleDisabled) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-social-disabled-title">Social Module Not Enabled</CardTitle>
            <CardDescription data-testid="text-social-disabled-description">
              The social media module is not enabled. Please contact your administrator to enable it in the admin settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {oauthError && (
        <div className="mb-4 p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800" data-testid="banner-oauth-error">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Connection Error</h3>
              <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap break-words">{oauthError}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOauthError(null)} className="shrink-0 h-7 w-7" data-testid="button-dismiss-oauth-error">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {oauthSuccess && (
        <div className="mb-4 p-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800" data-testid="banner-oauth-success">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">Connected!</h3>
              <p className="text-sm text-green-700 dark:text-green-400">{oauthSuccess}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOauthSuccess(null)} className="shrink-0 h-7 w-7" data-testid="button-dismiss-oauth-success">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-social-title">
            Connected Social Accounts <HelpTooltip text="Link your social media accounts so PassivePost can post on your behalf." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-social-description">
            Connect your social media accounts to enable posting and monitoring
            <HelpTooltip text="Use Validate All to check that all connected accounts still have valid access. Disconnect any account you no longer want to use." />
          </p>
        </div>
        {accounts.length > 0 && (
          <Button
            variant="outline"
            onClick={handleValidateAll}
            disabled={validating}
            data-testid="button-validate-all"
          >
            {validating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Validate All
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {PLATFORMS.map(platform => {
          const account = getAccountForPlatform(platform.id)
          const brandColor = getPlatformColor(platform.id)

          return (
            <Card key={platform.id} data-testid={`card-platform-${platform.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${brandColor}14` }}
                  >
                    <PlatformIcon platform={platform.id} className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base" data-testid={`text-platform-name-${platform.id}`}>
                      {platform.name}
                    </CardTitle>
                    {account && account.platform_username && (
                      <CardDescription data-testid={`text-platform-username-${platform.id}`}>
                        @{account.platform_username}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {platform.comingSoon && (
                    <Badge variant="secondary" data-testid={`badge-coming-soon-${platform.id}`}>
                      Coming Soon
                    </Badge>
                  )}
                  {account ? (
                    <>
                      <Badge
                        variant={account.is_valid ? 'default' : 'destructive'}
                        data-testid={`badge-status-${platform.id}`}
                      >
                        {account.is_valid ? (
                          <Check className="mr-1 h-3 w-3" />
                        ) : (
                          <X className="mr-1 h-3 w-3" />
                        )}
                        {account.is_valid ? 'Connected' : 'Expired'}
                      </Badge>
                      {!account.is_valid && account.last_error?.includes('reconnect') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting === platform.id}
                          data-testid={`button-reconnect-${platform.id}`}
                        >
                          {connecting === platform.id ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Reconnecting...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Reconnect
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnecting === account.id}
                        data-testid={`button-disconnect-${platform.id}`}
                      >
                        {disconnecting === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleConnect(platform.id)}
                      disabled={platform.comingSoon || connecting === platform.id}
                      data-testid={`button-connect-${platform.id}`}
                    >
                      {connecting === platform.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              {account && (
                <CardContent data-testid={`content-details-${platform.id}`}>
                  <div className="flex flex-row items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {account.display_name && (
                      <span data-testid={`text-display-name-${platform.id}`}>
                        {account.display_name}
                      </span>
                    )}
                    <span data-testid={`text-connected-at-${platform.id}`}>
                      Connected: {formatDate(account.connected_at)}
                    </span>
                    <span data-testid={`text-last-validated-${platform.id}`}>
                      Last validated: {formatDate(account.last_validated_at)}
                    </span>
                    {account.last_error && (
                      <span className="text-destructive" data-testid={`text-error-${platform.id}`}>
                        {account.last_error}
                      </span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="mt-6" data-testid="card-blog-platforms-link">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base" data-testid="text-blog-section-title">Blog Platforms</CardTitle>
              <CardDescription>Connect WordPress, Ghost, and other blog platforms</CardDescription>
            </div>
          </div>
          <Link href="/dashboard/social/blog">
            <Button variant="outline" data-testid="button-manage-blogs">
              Manage Blogs
            </Button>
          </Link>
        </CardHeader>
      </Card>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-connect-account">
          {selectedPlatform && PLATFORM_GUIDES[selectedPlatform] ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" data-testid="text-connect-dialog-title">
                  <PlatformIcon platform={selectedPlatform} className="h-5 w-5" />
                  Connect {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                </DialogTitle>
                <DialogDescription data-testid="text-connect-dialog-description">
                  {PLATFORM_GUIDES[selectedPlatform].what}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">How it works:</p>
                  <ol className="space-y-2 ml-1">
                    {PLATFORM_GUIDES[selectedPlatform].steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  {PLATFORM_GUIDES[selectedPlatform].time}
                </p>

                {PLATFORM_GUIDES[selectedPlatform].note && (
                  <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      {PLATFORM_GUIDES[selectedPlatform].note}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setConnectDialogOpen(false)}
                    data-testid="button-close-connect-dialog"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => startOAuthConnect(selectedPlatform)}
                    disabled={connecting === selectedPlatform}
                    data-testid="button-start-oauth-connect"
                  >
                    {connecting === selectedPlatform ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Connect with {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-connect-dialog-title">
                  Connect {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                </DialogTitle>
                <DialogDescription data-testid="text-connect-dialog-description">
                  This integration is coming soon. Stay tuned for updates!
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConnectDialogOpen(false)}
                  data-testid="button-close-connect-dialog"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SocialAccountsContent />
    </Suspense>
  )
}
