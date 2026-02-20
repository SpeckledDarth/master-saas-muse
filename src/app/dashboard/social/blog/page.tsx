'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, ExternalLink, CheckCircle, XCircle, AlertTriangle, BookOpen, Pen, FileText, Globe } from 'lucide-react'
import { SiMedium, SiLinkedin, SiWordpress, SiGhost, SiSubstack } from 'react-icons/si'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'
import Link from 'next/link'
import type { BlogConnection, BlogPlatform } from '@/lib/social/types'
import { BLOG_PLATFORM_CONFIG } from '@/lib/social/types'

const PLATFORM_ICONS: Record<string, any> = {
  medium: SiMedium,
  wordpress: SiWordpress,
  linkedin_article: SiLinkedin,
  ghost: SiGhost,
  substack: SiSubstack,
}

function PlatformBlogIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICONS[platform]
  if (!Icon) return <Globe className={className || 'h-5 w-5'} />
  const config = BLOG_PLATFORM_CONFIG[platform as BlogPlatform]
  return (
    <>
      <Icon className={`${className || 'h-5 w-5'} dark:hidden`} style={{ color: config?.color || '#6B7280' }} />
      <Icon className={`${className || 'h-5 w-5'} hidden dark:block`} style={{ color: config?.darkColor || config?.color || '#6B7280' }} />
    </>
  )
}

interface ConnectionFormState {
  platform: BlogPlatform | ''
  apiKey: string
  accessToken: string
  siteUrl: string
  username: string
  displayName: string
}

const EMPTY_FORM: ConnectionFormState = { platform: '', apiKey: '', accessToken: '', siteUrl: '', username: '', displayName: '' }

export default function BlogConnectionsPage() {
  const [connections, setConnections] = useState<BlogConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ConnectionFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/social/blog/connections')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setConnections(data.connections || [])
    } catch {
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConnections() }, [fetchConnections])

  const handleConnect = async () => {
    if (!form.platform) {
      toast({ title: 'Error', description: 'Select a platform', variant: 'destructive' })
      return
    }

    if (form.platform !== 'linkedin_article') {
      if (!form.apiKey && !form.accessToken) {
        toast({ title: 'Error', description: 'An API key or access token is required', variant: 'destructive' })
        return
      }
      if ((form.platform === 'wordpress' || form.platform === 'ghost') && !form.siteUrl) {
        toast({ title: 'Error', description: 'Site URL is required for this platform', variant: 'destructive' })
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/social/blog/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          apiKey: form.apiKey || undefined,
          accessToken: form.accessToken || undefined,
          siteUrl: form.siteUrl || undefined,
          username: form.username || undefined,
          displayName: form.displayName || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to connect')
      }
      const data = await res.json()
      setConnections(prev => {
        const existing = prev.findIndex(c => c.platform === data.connection.platform)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data.connection
          return updated
        }
        return [data.connection, ...prev]
      })
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      toast({ title: 'Connected', description: `${BLOG_PLATFORM_CONFIG[form.platform]?.name || form.platform} connected successfully` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (conn: BlogConnection) => {
    setDisconnecting(conn.id)
    try {
      const res = await fetch(`/api/social/blog/connections/${conn.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect')
      }
      setConnections(prev => prev.filter(c => c.id !== conn.id))
      toast({ title: 'Disconnected', description: `${BLOG_PLATFORM_CONFIG[conn.platform]?.name || conn.platform} disconnected` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDisconnecting(null)
    }
  }

  const connectedPlatforms = new Set(connections.map(c => c.platform))

  const needsSiteUrl = form.platform === 'wordpress' || form.platform === 'ghost'
  const isLinkedIn = form.platform === 'linkedin_article'
  const platformConfig = form.platform ? BLOG_PLATFORM_CONFIG[form.platform] : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-blog-connections">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-blog-title">
            Blog Publishing <HelpTooltip text="Connect your blog platforms to cross-post articles and generate social media snippets from your content." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-blog-description">
            Connect platforms to cross-post your blog articles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/social/blog/compose">
            <Button data-testid="button-compose-blog">
              <Pen className="mr-2 h-4 w-4" />
              Write Article
            </Button>
          </Link>
          <Link href="/dashboard/social/blog/posts">
            <Button variant="outline" data-testid="button-view-blog-posts">
              <FileText className="mr-2 h-4 w-4" />
              All Posts
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(BLOG_PLATFORM_CONFIG).map(([key, config]) => {
          const platform = key as BlogPlatform
          const conn = connections.find(c => c.platform === platform)
          const isConnected = !!conn

          return (
            <Card key={platform} className="hover-elevate" data-testid={`card-blog-platform-${platform}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <PlatformBlogIcon platform={platform} />
                    </div>
                    <div>
                      <h3 className="font-medium flex items-center gap-1.5">
                        {config.name}
                        {config.beta && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Beta</Badge>}
                      </h3>
                      <p className="text-xs text-muted-foreground">{config.apiType}</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge variant="default" className="shrink-0">
                      <CheckCircle className="mr-1 h-3 w-3" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-muted-foreground">
                      Not connected
                    </Badge>
                  )}
                </div>

                {isConnected && conn && (
                  <div className="mt-4 space-y-2">
                    {conn.display_name && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-blog-display-${platform}`}>
                        {conn.display_name}
                      </p>
                    )}
                    {conn.site_url && (
                      <a
                        href={conn.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 hover:underline"
                        data-testid={`link-blog-site-${platform}`}
                      >
                        <ExternalLink className="h-3 w-3" /> {conn.site_url}
                      </a>
                    )}
                    {!conn.is_valid && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> Connection invalid
                        {conn.last_error && <span className="text-xs">: {conn.last_error}</span>}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(conn)}
                      disabled={disconnecting === conn.id}
                      data-testid={`button-disconnect-${platform}`}
                    >
                      {disconnecting === conn.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                      Disconnect
                    </Button>
                  </div>
                )}

                {!isConnected && (
                  <div className="mt-4">
                    <Dialog open={dialogOpen && form.platform === platform} onOpenChange={(open) => {
                      if (open) {
                        setForm({ ...EMPTY_FORM, platform })
                        setDialogOpen(true)
                      } else {
                        setDialogOpen(false)
                        setForm(EMPTY_FORM)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-connect-${platform}`}>
                          <Plus className="mr-1 h-3 w-3" /> Connect
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md" data-testid={`dialog-connect-${platform}`}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <PlatformBlogIcon platform={platform} className="h-5 w-5" />
                            Connect {config.name}
                          </DialogTitle>
                          <DialogDescription>
                            {isLinkedIn
                              ? 'LinkedIn Articles uses your existing LinkedIn social connection.'
                              : `Enter your ${config.name} credentials to enable cross-posting.`}
                          </DialogDescription>
                        </DialogHeader>

                        {isLinkedIn ? (
                          <div className="space-y-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-3">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                This will use your connected LinkedIn social account to publish articles. Make sure your LinkedIn account is connected in the Accounts page first.
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(EMPTY_FORM) }}>Cancel</Button>
                              <Button onClick={handleConnect} disabled={saving} data-testid="button-connect-linkedin-article">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Connect
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {config.beta && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                  <p className="text-sm text-amber-800 dark:text-amber-200">
                                    This integration is in beta and uses an unofficial API. It may break without notice.
                                  </p>
                                </div>
                              </div>
                            )}

                            {needsSiteUrl && (
                              <div className="space-y-2">
                                <Label htmlFor="site-url">Site URL</Label>
                                <Input
                                  id="site-url"
                                  placeholder={platform === 'wordpress' ? 'https://myblog.wordpress.com' : 'https://myblog.ghost.io'}
                                  value={form.siteUrl}
                                  onChange={e => setForm(f => ({ ...f, siteUrl: e.target.value }))}
                                  data-testid="input-blog-site-url"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="api-key">
                                {platform === 'medium' ? 'Integration Token' : platform === 'ghost' ? 'Admin API Key' : platform === 'wordpress' ? 'Application Password' : 'API Key'}
                              </Label>
                              <Input
                                id="api-key"
                                type="password"
                                placeholder="Paste your token or API key"
                                value={form.apiKey}
                                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                                data-testid="input-blog-api-key"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="display-name">Display Name (optional)</Label>
                              <Input
                                id="display-name"
                                placeholder="My Blog"
                                value={form.displayName}
                                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                                data-testid="input-blog-display-name"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(EMPTY_FORM) }}>Cancel</Button>
                              <Button onClick={handleConnect} disabled={saving} data-testid="button-save-connection">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Connect
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
