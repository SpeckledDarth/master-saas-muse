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
  { id: 'tiktok', name: 'TikTok' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'discord', name: 'Discord' },
]

function SocialAccountsContent() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [moduleDisabled, setModuleDisabled] = useState(false)
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
      toast({
        title: 'Account Connected',
        description: `Your ${platformName} account has been successfully connected!`,
      })
      window.history.replaceState({}, '', '/dashboard/social')
    } else if (error) {
      toastShownRef.current = true
      toast({
        title: 'Connection Error',
        description: error,
        variant: 'destructive',
      })
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

  const OAUTH_PLATFORMS = ['twitter', 'linkedin', 'facebook']

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_success' && event.data?.platform) {
        const platformName = PLATFORMS.find(p => p.id === event.data.platform)?.name || event.data.platform
        toast({
          title: 'Account Connected',
          description: `Your ${platformName} account has been successfully connected!`,
        })
        fetchAccounts()
        setConnecting(null)
      } else if (event.data?.type === 'oauth_error' && event.data?.message) {
        toast({
          title: 'Connection Error',
          description: event.data.message,
          variant: 'destructive',
        })
        setConnecting(null)
      }
    }
    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [toast, fetchAccounts])

  const handleConnect = async (platformId: string) => {
    if (OAUTH_PLATFORMS.includes(platformId)) {
      setConnecting(platformId)
      const popup = window.open('about:blank', `connect_${platformId}`, 'width=600,height=700,scrollbars=yes')
      try {
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
          console.log('[OAuth Debug] authUrl:', data.authUrl)
          console.log('[OAuth Debug] redirect_uri used by server:', data.debugRedirectUri)
          if (popup && !popup.closed) {
            const redirectUrl = `/api/social/redirect?url=${encodeURIComponent(data.authUrl)}&sig=${encodeURIComponent(data.authUrlSig)}`
            popup.location.href = redirectUrl
            const pollTimer = setInterval(() => {
              try {
                if (popup.closed) {
                  clearInterval(pollTimer)
                  setConnecting(null)
                  fetchAccounts()
                }
              } catch {
                // cross-origin, popup still open
              }
            }, 500)
          } else {
            window.location.href = data.authUrl
          }
        } else {
          if (popup && !popup.closed) popup.close()
          throw new Error('No authorization URL returned')
        }
      } catch (err) {
        if (popup && !popup.closed) popup.close()
        toast({
          title: 'Connection Failed',
          description: (err as Error).message,
          variant: 'destructive',
        })
        setConnecting(null)
      }
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
                last_error: result.error,
              }
            }
            return account
          })
        )
      }
      toast({
        title: 'Validation Complete',
        description: `Validated ${data.results?.length || 0} account(s)`,
      })
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
                        {account.is_valid ? 'Connected' : 'Invalid'}
                      </Badge>
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

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent data-testid="dialog-connect-account">
          <DialogHeader>
            <DialogTitle data-testid="text-connect-dialog-title">
              Connect {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
            </DialogTitle>
            <DialogDescription data-testid="text-connect-dialog-description">
              {PLATFORMS.find(p => p.id === selectedPlatform)?.name} integration is coming soon.
              Stay tuned for updates!
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
