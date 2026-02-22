'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2, Plus, Trash2, ExternalLink, CheckCircle, XCircle, AlertTriangle,
  BookOpen, Pen, FileText, Globe, TrendingUp, ArrowUp, ArrowDown, Minus,
  RefreshCw, Sparkles, ChevronDown, ChevronUp as ChevronUpIcon, Layers,
  ShieldCheck, HelpCircle,
} from 'lucide-react'
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

interface FlywheelMetrics {
  healthScore: number
  momentum: 'accelerating' | 'steady' | 'decelerating'
  breakdown: { writing: number; crossPosting: number; repurposing: number; scheduling: number }
  counts: {
    totalArticles: number
    articlesThisMonth: number
    publishedArticles: number
    totalCrossPosts: number
    totalSnippets: number
    publishedSnippets: number
    draftedSnippets: number
    connectedBlogPlatforms: number
  }
  nextAction: { type: string; message: string; href: string } | null
  articlePerformance: ArticlePerformance[]
}

interface ArticlePerformance {
  id: string
  title: string
  status: string
  platforms: string[]
  createdAt: string
  publishedAt: string | null
  snippetCount: number
  snippetsPublished: number
  snippetsDrafted: number
  tags: string[]
  seriesName: string | null
}

const EMPTY_FORM: ConnectionFormState = { platform: '', apiKey: '', accessToken: '', siteUrl: '', username: '', displayName: '' }

const BLOG_SETUP_GUIDES: Record<string, { steps: { title: string; detail: string }[]; time: string; security: string }> = {
  wordpress: {
    steps: [
      { title: 'Log into your WordPress site', detail: 'Go to your WordPress admin area (usually yourblog.com/wp-admin) and log in.' },
      { title: 'Go to your Profile page', detail: 'In the left sidebar, click Users, then click Profile (or "Your Profile").' },
      { title: 'Create an Application Password', detail: 'Scroll down to the "Application Passwords" section. Type "PassivePost" in the "New Application Password Name" field and click "Add New Application Password".' },
      { title: 'Copy the password', detail: 'WordPress will show you a password (looks like: xxxx xxxx xxxx xxxx). Copy it now — you won\'t be able to see it again!' },
      { title: 'Paste it here', detail: 'In the field below, type your WordPress username, a colon, then paste the password. Example: john:xxxx xxxx xxxx xxxx' },
    ],
    time: 'Takes about 2 minutes',
    security: 'Application Passwords give PassivePost permission to create blog posts on your behalf. Your main WordPress password is never shared. You can revoke this anytime from the same Profile page.',
  },
  ghost: {
    steps: [
      { title: 'Log into your Ghost admin', detail: 'Go to your Ghost admin area (usually yourblog.com/ghost) and log in.' },
      { title: 'Open Settings', detail: 'Click the gear icon (Settings) in the bottom-left corner.' },
      { title: 'Go to Integrations', detail: 'Scroll down and click "Integrations".' },
      { title: 'Add a Custom Integration', detail: 'Click "Add custom integration" and name it "PassivePost". Click "Create".' },
      { title: 'Copy the Admin API Key', detail: 'You\'ll see an "Admin API Key" — it looks like a long string with a colon in the middle (e.g., 6489a5...abcd:1234...5678). Copy the full thing.' },
      { title: 'Paste it here', detail: 'Paste the full Admin API Key in the field below.' },
    ],
    time: 'Takes about 2 minutes',
    security: 'The Admin API Key lets PassivePost create and edit blog posts on your behalf. It cannot change your site settings or delete your account. You can revoke it anytime by deleting the integration.',
  },
}

function BlogConnectionForm({ platform, form, setForm, saving, onConnect, onCancel, needsSiteUrl, config }: {
  platform: string
  form: ConnectionFormState
  setForm: (fn: (prev: ConnectionFormState) => ConnectionFormState) => void
  saving: boolean
  onConnect: () => void
  onCancel: () => void
  needsSiteUrl: boolean
  config: { name: string; color: string; darkColor?: string; apiType: string; beta?: boolean }
}) {
  const [showGuide, setShowGuide] = useState(true)
  const guide = BLOG_SETUP_GUIDES[platform]

  return (
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

      {guide && (
        <div className="rounded-lg border bg-muted/30">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex w-full items-center justify-between p-3 text-left"
            data-testid="button-toggle-setup-guide"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <HelpCircle className="h-4 w-4 text-primary" />
              How do I find my {platform === 'wordpress' ? 'Application Password' : 'Admin API Key'}?
            </span>
            {showGuide ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showGuide && (
            <div className="border-t px-3 pb-3 pt-2 space-y-3">
              <ol className="space-y-2.5">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground italic">{guide.time}</p>
              <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-2.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-xs text-muted-foreground">{guide.security}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {needsSiteUrl && (
        <div className="space-y-2">
          <Label htmlFor="site-url">Site URL</Label>
          <Input
            id="site-url"
            placeholder={platform === 'wordpress' ? 'https://myblog.com' : 'https://myblog.ghost.io'}
            value={form.siteUrl}
            onChange={e => setForm(f => ({ ...f, siteUrl: e.target.value }))}
            data-testid="input-blog-site-url"
          />
          <p className="text-xs text-muted-foreground">
            {platform === 'wordpress'
              ? 'The address of your WordPress blog (e.g., https://myblog.com)'
              : 'The address of your Ghost blog (e.g., https://myblog.ghost.io)'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="api-key">
          {platform === 'ghost' ? 'Admin API Key' : platform === 'wordpress' ? 'Application Password' : 'API Key'}
        </Label>
        <Input
          id="api-key"
          type="password"
          placeholder={platform === 'wordpress' ? 'username:xxxx xxxx xxxx xxxx' : platform === 'ghost' ? '6489...abcd:1234...5678' : 'Paste your key here'}
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
        <p className="text-xs text-muted-foreground">
          We'll auto-detect your site name if left blank.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConnect} disabled={saving} data-testid="button-save-connection">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Connect & Test
        </Button>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'outline',
  scheduled: 'secondary',
  publishing: 'secondary',
  published: 'default',
  failed: 'destructive',
}

export default function BlogDashboardPage() {
  const [connections, setConnections] = useState<BlogConnection[]>([])
  const [metrics, setMetrics] = useState<FlywheelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ConnectionFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [validatingConn, setValidatingConn] = useState<string | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [connRes, metricsRes] = await Promise.all([
        fetch('/api/social/blog/connections').then(r => r.ok ? r.json() : { connections: [] }).catch(() => ({ connections: [] })),
        fetch('/api/social/flywheel/metrics').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setConnections(connRes.connections || [])
      setMetrics(metricsRes)
    } catch {
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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

  const handleValidateConnection = async (conn: BlogConnection) => {
    setValidatingConn(conn.id)
    try {
      const res = await fetch('/api/social/blog/connections/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: conn.id }),
      })
      const data = await res.json()
      if (data.valid) {
        setConnections(prev => prev.map(c =>
          c.id === conn.id
            ? { ...c, is_valid: true, last_validated_at: new Date().toISOString(), last_error: null, display_name: data.siteTitle || c.display_name, platform_username: data.username || c.platform_username }
            : c
        ))
        toast({ title: 'Connection Valid', description: `${BLOG_PLATFORM_CONFIG[conn.platform]?.name || conn.platform} connection is working.` })
      } else {
        setConnections(prev => prev.map(c =>
          c.id === conn.id
            ? { ...c, is_valid: false, last_validated_at: new Date().toISOString(), last_error: data.error || 'Validation failed' }
            : c
        ))
        toast({ title: 'Connection Invalid', description: data.error || 'Validation failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Could not validate connection', variant: 'destructive' })
    } finally {
      setValidatingConn(null)
    }
  }

  const needsSiteUrl = form.platform === 'wordpress' || form.platform === 'ghost'
  const isLinkedIn = form.platform === 'linkedin_article'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-blog-dashboard">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const m = metrics
  const score = m?.healthScore ?? 0
  const scoreColor = score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
  const MomentumIcon = m?.momentum === 'accelerating' ? ArrowUp : m?.momentum === 'decelerating' ? ArrowDown : Minus
  const momentumLabel = m?.momentum === 'accelerating' ? 'Accelerating' : m?.momentum === 'decelerating' ? 'Decelerating' : 'Steady'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-blog-title">
            Blog Dashboard <HelpTooltip text="Your blog publishing hub. Write articles, cross-post to multiple platforms, and repurpose into social media snippets." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-blog-description">
            Write, cross-post, and repurpose your blog content
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
              All Articles
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-articles">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles <HelpTooltip text="Total blog articles you've created across all time." /></CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-articles">{m?.counts.totalArticles ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{m?.counts.articlesThisMonth ?? 0} this month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-cross-posts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cross-Posts <HelpTooltip text="Total number of platform cross-posts across all articles. Higher means better distribution." /></CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-cross-posts">{m?.counts.totalCrossPosts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{connections.length} platform{connections.length !== 1 ? 's' : ''} connected</p>
          </CardContent>
        </Card>

        <Card data-testid="card-snippets-generated">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Snippets Generated <HelpTooltip text="Social media posts created from your blog articles via the repurpose engine." /></CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-snippets-total">{m?.counts.totalSnippets ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{m?.counts.publishedSnippets ?? 0} published, {m?.counts.draftedSnippets ?? 0} drafted</p>
          </CardContent>
        </Card>

        <Card data-testid="card-flywheel-mini">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flywheel Score <HelpTooltip text="Measures how well your content flywheel is running: writing blogs, cross-posting, repurposing into social, and scheduling those posts." /></CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${scoreColor}`} data-testid="text-flywheel-score">{score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MomentumIcon className={`h-3.5 w-3.5 ${m?.momentum === 'accelerating' ? 'text-green-500' : m?.momentum === 'decelerating' ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground">{momentumLabel}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {m?.nextAction && (
        <Card className="border-primary/30 bg-primary/5" data-testid="card-next-action">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Next Best Action</p>
                  <p className="text-sm text-muted-foreground">{m.nextAction.message}</p>
                </div>
              </div>
              <Link href={m.nextAction.href}>
                <Button size="sm" data-testid="button-next-action">
                  Go <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {m && m.breakdown && (
        <Card data-testid="card-flywheel-breakdown">
          <CardHeader>
            <CardTitle className="text-base">Flywheel Breakdown <HelpTooltip text="Each pillar of the content flywheel scored out of 25. Improve weak areas to boost your overall score." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Writing', value: m.breakdown.writing, max: 25, desc: 'Blog articles created this month' },
              { label: 'Cross-Posting', value: m.breakdown.crossPosting, max: 25, desc: 'Articles distributed to multiple platforms' },
              { label: 'Repurposing', value: m.breakdown.repurposing, max: 25, desc: 'Social snippets generated from blogs' },
              { label: 'Scheduling', value: m.breakdown.scheduling, max: 25, desc: 'Snippets published or scheduled' },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.value} / {item.max}</span>
                </div>
                <Progress value={(item.value / item.max) * 100} data-testid={`progress-${item.label.toLowerCase()}`} />
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {m && m.articlePerformance && m.articlePerformance.length > 0 && (
        <Card data-testid="card-article-performance">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Article Performance <HelpTooltip text="How each blog article is performing in the content flywheel — cross-posts, snippets, and publication status." /></CardTitle>
            <Link href="/dashboard/social/blog/posts">
              <Button variant="outline" size="sm" data-testid="button-view-all-articles">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="list-article-performance">
              {m.articlePerformance.map(article => (
                <div
                  key={article.id}
                  className="flex items-start gap-3 p-3 rounded-md border hover-elevate"
                  data-testid={`article-perf-${article.id}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{article.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={STATUS_COLORS[article.status] as any || 'outline'} className="text-xs" data-testid={`badge-article-status-${article.id}`}>
                        {article.status}
                      </Badge>
                      {article.platforms.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {article.platforms.length} platform{article.platforms.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {article.snippetCount > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="mr-1 h-2.5 w-2.5" />
                          {article.snippetsPublished}/{article.snippetCount} snippets published
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No snippets yet</span>
                      )}
                      {article.seriesName && (
                        <Badge variant="outline" className="text-xs">{article.seriesName}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/dashboard/social/blog/compose?edit=${article.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2" data-testid={`button-edit-article-${article.id}`}>
                        <Pen className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <button
          onClick={() => setShowConnections(!showConnections)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          data-testid="button-toggle-connections"
        >
          {showConnections ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Manage Blog Connections ({connections.length} connected)
        </button>

        {showConnections && (
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
                        <div className="flex items-center gap-2">
                          {(platform === 'wordpress' || platform === 'ghost') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleValidateConnection(conn)}
                              disabled={validatingConn === conn.id}
                              data-testid={`button-validate-${platform}`}
                            >
                              {validatingConn === conn.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                              Test
                            </Button>
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
                              <BlogConnectionForm
                                platform={form.platform}
                                form={form}
                                setForm={setForm}
                                saving={saving}
                                onConnect={handleConnect}
                                onCancel={() => { setDialogOpen(false); setForm(EMPTY_FORM) }}
                                needsSiteUrl={needsSiteUrl}
                                config={config}
                              />
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
        )}
      </div>
    </div>
  )
}
