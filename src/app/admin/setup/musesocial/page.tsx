'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Share2, Twitter, Linkedin, Instagram, Youtube, Facebook, Music, MessageSquare, Image, Camera, Gamepad2,
  AlertTriangle, KeyRound, ChevronDown, ChevronRight, CircleDot,
  ExternalLink, Loader2, Pencil, Check, X, Eye, EyeOff, Trash2, Plus, BookOpen
} from 'lucide-react'
import { defaultSettings } from '@/types/settings'
import type { SocialModuleTier, NicheGuidanceEntry } from '@/types/settings'

interface IntegrationKey {
  id: string
  label: string
  envVar: string
  masked: string | null
  configured: boolean
  docsUrl: string
  source: 'env' | 'db' | null
  required: boolean
}

interface IntegrationGroup {
  id: string
  label: string
  icon: string
  keys: IntegrationKey[]
}

const SOCIAL_ICONS: Record<string, typeof Twitter> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: Music,
  reddit: MessageSquare,
  pinterest: Image,
  snapchat: Camera,
  discord: Gamepad2,
}

function SocialKeyRow({ keyData, onSaved }: { keyData: IntegrationKey; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [revealedValue, setRevealedValue] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReveal() {
    if (revealed) {
      setRevealed(false)
      setRevealedValue(null)
      return
    }
    setRevealing(true)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVar: keyData.envVar }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.value) {
          setRevealedValue(data.value)
          setRevealed(true)
        }
      }
    } catch {
    } finally {
      setRevealing(false)
    }
  }

  async function handleStartEdit() {
    setEditing(true)
    setError(null)
    if (revealedValue) {
      setInputValue(revealedValue)
      return
    }
    if (keyData.configured) {
      try {
        const res = await fetch('/api/admin/integrations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ envVar: keyData.envVar }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.value) {
            setInputValue(data.value)
            setRevealedValue(data.value)
            return
          }
        }
      } catch {}
    }
    setInputValue('')
  }

  function handleCancel() {
    setEditing(false)
    setInputValue('')
    setError(null)
  }

  async function handleSave() {
    if (!inputValue.trim()) {
      setError('Value cannot be empty')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVar: keyData.envVar, value: inputValue.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        return
      }
      setEditing(false)
      setInputValue('')
      setRevealed(false)
      setRevealedValue(null)
      onSaved()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove the saved value for ${keyData.label}? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVar: keyData.envVar }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to remove')
        return
      }
      setRevealed(false)
      setRevealedValue(null)
      setEditing(false)
      onSaved()
    } catch {
      setError('Network error')
    } finally {
      setDeleting(false)
    }
  }

  const displayValue = revealed && revealedValue
    ? revealedValue
    : keyData.configured
    ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
    : ''

  return (
    <div className="group" data-testid={`key-row-${keyData.id}`}>
      <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 py-3 px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate" data-testid={`label-${keyData.id}`}>
              {keyData.label}
            </span>
            <a
              href={keyData.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`link-docs-${keyData.id}`}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <code className="text-[11px] text-muted-foreground font-mono" data-testid={`env-var-${keyData.id}`}>
            {keyData.envVar}
          </code>
        </div>

        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
                placeholder={`Enter ${keyData.label}...`}
                className="font-mono text-sm"
                autoFocus
                data-testid={`input-${keyData.id}`}
              />
              <Button
                size="icon"
                onClick={handleSave}
                disabled={saving || !inputValue.trim()}
                data-testid={`button-save-${keyData.id}`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                data-testid={`button-cancel-${keyData.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className={`font-mono text-sm py-2 px-3 rounded-md border flex items-center cursor-pointer hover-elevate ${
                keyData.configured
                  ? 'bg-muted/40'
                  : 'bg-muted/20 border-dashed'
              }`}
              onClick={handleStartEdit}
              data-testid={`value-display-${keyData.id}`}
            >
              {keyData.configured ? (
                <span className={revealed ? 'break-all' : 'select-none text-muted-foreground'}>
                  {displayValue}
                </span>
              ) : (
                <span className="text-muted-foreground/60 text-xs">Click to add value...</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {keyData.source && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 mr-1 whitespace-nowrap"
              data-testid={`source-badge-${keyData.id}`}
            >
              {keyData.source === 'db' ? 'Dashboard' : 'Env Var'}
            </Badge>
          )}
          {keyData.configured && !editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReveal}
              disabled={revealing}
              title={revealed ? 'Hide value' : 'Reveal value'}
              data-testid={`button-reveal-${keyData.id}`}
            >
              {revealing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : revealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          {!editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStartEdit}
              title="Edit value"
              data-testid={`button-edit-${keyData.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {keyData.configured && !editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              title="Remove value"
              data-testid={`button-delete-${keyData.id}`}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive px-4 pb-2" data-testid={`error-${keyData.id}`}>{error}</p>
      )}
    </div>
  )
}

function SocialKeyGroup({ group, onSaved }: { group: IntegrationGroup; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = SOCIAL_ICONS[group.icon] || KeyRound
  const groupConfigured = group.keys.filter(k => k.configured).length
  const groupTotal = group.keys.length
  const allConfigured = groupConfigured === groupTotal

  return (
    <div data-testid={`group-${group.id}`}>
      <button
        type="button"
        className="w-full flex items-center gap-3 px-6 py-3 bg-muted/30 border-t text-left hover-elevate"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-toggle-${group.id}`}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold">{group.label}</span>
        <div className="flex items-center gap-1.5">
          {group.keys.map((k) => (
            <CircleDot
              key={k.id}
              className={`h-2.5 w-2.5 ${k.configured ? 'text-green-500' : 'text-muted-foreground/40'}`}
            />
          ))}
        </div>
        <Badge variant={allConfigured ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 ml-auto">
          {groupConfigured}/{groupTotal}
        </Badge>
      </button>
      {expanded && (
        <div className="divide-y">
          {group.keys.map(key => (
            <SocialKeyRow key={key.id} keyData={key} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MuseSocialPage() {
  const { settings, saving, saved, handleSave, updateSocialModule } = useSetupSettingsContext()

  const socialModule = settings.socialModule || defaultSettings.socialModule!

  const [socialPlatforms, setSocialPlatforms] = useState<IntegrationGroup[]>([])
  const [socialSummary, setSocialSummary] = useState({ socialConfigured: 0, socialTotal: 0 })
  const [loadingKeys, setLoadingKeys] = useState(false)

  const fetchSocialKeys = useCallback(async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch('/api/admin/integrations?section=social')
      if (res.ok) {
        const data = await res.json()
        setSocialPlatforms(data.socialPlatforms || [])
        setSocialSummary(data.summary || { socialConfigured: 0, socialTotal: 0 })
      }
    } catch {}
    setLoadingKeys(false)
  }, [])

  useEffect(() => {
    if (settings.features.socialModuleEnabled) {
      fetchSocialKeys()
    }
  }, [settings.features.socialModuleEnabled, fetchSocialKeys])

  function updatePosting(key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('posting', { ...current.posting, [key]: value })
  }

  function updateMonitoring(key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('monitoring', { ...current.monitoring, [key]: value })
  }

  function updateStatusChecker(key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('statusChecker', { ...current.statusChecker, [key]: value })
  }

  function updatePlatform(platform: string, key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('platforms', { ...current.platforms, [platform]: { ...current.platforms[platform as keyof typeof current.platforms], [key]: value } })
  }

  const isEnabled = settings.features.socialModuleEnabled

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Module Status
            <InfoTooltip text="Controls whether the social media features are available to your users. Enable it in the Features tab." />
          </CardTitle>
          <CardDescription>
            MuseSocial social media management module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium" data-testid="text-module-status-label">MuseSocial Module</p>
              <p className="text-sm text-muted-foreground">Enable this module in the Features tab</p>
            </div>
            {isEnabled ? (
              <Badge variant="default" className="bg-green-600" data-testid="badge-module-status">Active</Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-module-status">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {isEnabled && (() => {
        const warnings: { key: string; testId: string; message: string }[] = []
        if (!settings.features.aiEnabled) {
          warnings.push({ key: 'ai', testId: 'text-dependency-ai', message: 'AI features must be enabled for post generation' })
        }
        const platformEntries = Object.entries(socialModule.platforms) as [string, { enabled: boolean; apiKeyConfigured: boolean }][]
        const enabledPlatforms = platformEntries.filter(([, cfg]) => cfg.enabled)
        if (enabledPlatforms.length === 0) {
          warnings.push({ key: 'no-platforms', testId: 'text-dependency-no-platforms', message: 'Enable at least one social platform' })
        }
        const missingKeys = enabledPlatforms.filter(([, cfg]) => !cfg.apiKeyConfigured)
        if (missingKeys.length > 0) {
          const names = missingKeys.map(([p]) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
          warnings.push({ key: 'api-keys', testId: 'text-dependency-api-keys', message: `API credentials not configured for ${names}. Set them in the API Keys section below.` })
        }
        if (warnings.length === 0) return null
        return (
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20" data-testid="alert-dependency-warning">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  {warnings.map((w) => (
                    <p key={w.key} className="text-sm text-yellow-800 dark:text-yellow-200" data-testid={w.testId}>{w.message}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {isEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Tier Selection <InfoTooltip text="Determines which social features your users can access and their daily usage limits." /></CardTitle>
              <CardDescription>
                Choose the feature tier for your social module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Module Tier</Label>
                <Select
                  value={socialModule.tier}
                  onValueChange={(value) => updateSocialModule('tier', value as SocialModuleTier)}
                >
                  <SelectTrigger data-testid="select-social-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter" data-testid="option-tier-starter">Starter ($19/mo)</SelectItem>
                    <SelectItem value="basic" data-testid="option-tier-basic">Basic ($39/mo)</SelectItem>
                    <SelectItem value="premium" data-testid="option-tier-premium">Premium ($69/mo)</SelectItem>
                    <SelectItem value="universal" data-testid="option-tier-universal">Universal (Legacy)</SelectItem>
                    <SelectItem value="power" data-testid="option-tier-power">Power (Legacy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {socialModule.tier === 'starter' && (
                  <p data-testid="text-tier-description">15 posts/month, 5 AI generations/day, 2 platforms. Great for side-hustlers and gig workers.</p>
                )}
                {socialModule.tier === 'basic' && (
                  <p data-testid="text-tier-description">30 posts/month, 10 AI generations/day, 3 platforms, basic analytics. For solopreneurs and small businesses.</p>
                )}
                {socialModule.tier === 'premium' && (
                  <p data-testid="text-tier-description">Unlimited posts, 100 AI generations/day, 10 platforms, approval queue, advanced alerts. For power users.</p>
                )}
                {socialModule.tier === 'universal' && (
                  <p data-testid="text-tier-description">Legacy tier: 20 posts/day, 10 AI generations/day.</p>
                )}
                {socialModule.tier === 'power' && (
                  <p data-testid="text-tier-description">Legacy tier: Unlimited posts, 100 AI generations/day.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Tier Rate Limits <InfoTooltip text="Set daily caps per user to control API costs. Higher limits mean more API calls to social platforms." /></CardTitle>
              <CardDescription>
                Configure daily usage caps for each tier. These limits apply per user per day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Universal Tier</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="universal-ai">AI Generations / Day</Label>
                    <Input
                      id="universal-ai"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.universal?.dailyAiGenerations ?? 10}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        universal: { ...socialModule.tierLimits?.universal, dailyAiGenerations: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-universal-ai-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="universal-posts">Posts / Day</Label>
                    <Input
                      id="universal-posts"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.universal?.dailyPosts ?? 20}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        universal: { ...socialModule.tierLimits?.universal, dailyPosts: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-universal-post-limit"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Power Tier</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="power-ai">AI Generations / Day</Label>
                    <Input
                      id="power-ai"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.power?.dailyAiGenerations ?? 100}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        power: { ...socialModule.tierLimits?.power, dailyAiGenerations: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-power-ai-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="power-posts">Posts / Day</Label>
                    <Input
                      id="power-posts"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.power?.dailyPosts ?? 10000}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        power: { ...socialModule.tierLimits?.power, dailyPosts: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-power-post-limit"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Platform Connections <InfoTooltip text="Enable the social platforms your users can post to. Each platform requires its own API credentials." /></CardTitle>
              <CardDescription>
                Connect your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Twitter / X</p>
                    {socialModule.platforms.twitter.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.twitter.enabled}
                  onCheckedChange={checked => updatePlatform('twitter', 'enabled', checked)}
                  data-testid="switch-platform-twitter"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Linkedin className="h-5 w-5" />
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    {socialModule.platforms.linkedin.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.linkedin.enabled}
                  onCheckedChange={checked => updatePlatform('linkedin', 'enabled', checked)}
                  data-testid="switch-platform-linkedin"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">Coming soon — requires extended API approval</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.instagram.enabled}
                  onCheckedChange={checked => updatePlatform('instagram', 'enabled', checked)}
                  data-testid="switch-platform-instagram"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Youtube className="h-5 w-5" />
                  <div>
                    <p className="font-medium">YouTube</p>
                    <p className="text-sm text-muted-foreground">Requires Google Cloud Console app</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.youtube?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('youtube', 'enabled', checked)}
                  data-testid="switch-platform-youtube"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">Requires Meta Business app review</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.facebook?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('facebook', 'enabled', checked)}
                  data-testid="switch-platform-facebook"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5" />
                  <div>
                    <p className="font-medium">TikTok</p>
                    <p className="text-sm text-muted-foreground">Requires TikTok Developer Portal app</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.tiktok?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('tiktok', 'enabled', checked)}
                  data-testid="switch-platform-tiktok"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Reddit</p>
                    <p className="text-sm text-muted-foreground">Requires Reddit API application</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.reddit?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('reddit', 'enabled', checked)}
                  data-testid="switch-platform-reddit"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Image className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Pinterest</p>
                    <p className="text-sm text-muted-foreground">Requires Pinterest Business developer app</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.pinterest?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('pinterest', 'enabled', checked)}
                  data-testid="switch-platform-pinterest"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Snapchat</p>
                    <p className="text-sm text-muted-foreground">Requires Snap Kit developer access</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.snapchat?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('snapchat', 'enabled', checked)}
                  data-testid="switch-platform-snapchat"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Discord</p>
                    <p className="text-sm text-muted-foreground">Requires Discord Developer Portal bot/app</p>
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.discord?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('discord', 'enabled', checked)}
                  data-testid="switch-platform-discord"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Platform API Keys
                    <InfoTooltip text="API keys and secrets for each social platform. Click a platform to expand and manage its keys. Keys are stored securely in your database." />
                  </CardTitle>
                  <CardDescription>Configure API credentials for your enabled social platforms</CardDescription>
                </div>
                <Badge variant={socialSummary.socialConfigured === socialSummary.socialTotal ? 'default' : 'secondary'}>
                  {socialSummary.socialConfigured}/{socialSummary.socialTotal} configured
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingKeys ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                socialPlatforms.map((group) => (
                  <SocialKeyGroup
                    key={group.id}
                    group={group}
                    onSaved={fetchSocialKeys}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Posting Configuration <InfoTooltip text="Controls how AI generates and publishes social content, including brand voice and approval workflow." /></CardTitle>
              <CardDescription>
                Configure how posts are created and published
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brand-voice">Brand Voice</Label>
                <Textarea
                  id="brand-voice"
                  value={socialModule.posting.defaultBrandVoice}
                  onChange={(e) => updatePosting('defaultBrandVoice', e.target.value)}
                  rows={3}
                  data-testid="input-brand-voice"
                />
                <p className="text-xs text-muted-foreground">
                  Describe your brand tone and voice for AI-generated content
                </p>
              </div>

              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <p className="font-medium">Require Approval</p>
                  <p className="text-sm text-muted-foreground">Posts must be approved before publishing</p>
                </div>
                <Switch
                  checked={socialModule.posting.requireApproval}
                  onCheckedChange={checked => updatePosting('requireApproval', checked)}
                  data-testid="switch-require-approval"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Niche Guidance
                <InfoTooltip text="AI-generated posts use niche-specific voice guidance to sound authentic. Add, edit, or remove niches without code changes." />
              </CardTitle>
              <CardDescription>
                Customize AI voice guidance for each industry niche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                When a user sets their niche in Brand Preferences, the AI uses the matching guidance below to write posts that sound authentic for their industry.
              </p>
              <div className="space-y-3">
                {(socialModule.nicheGuidance || defaultSettings.socialModule!.nicheGuidance || []).map((entry: NicheGuidanceEntry, index: number) => (
                  <div key={entry.key + index} className="border rounded-md p-3 space-y-2" data-testid={`niche-entry-${entry.key}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <Input
                          value={entry.label}
                          onChange={(e) => {
                            const updated = [...(socialModule.nicheGuidance || defaultSettings.socialModule!.nicheGuidance || [])]
                            updated[index] = { ...updated[index], label: e.target.value, key: e.target.value.toLowerCase().replace(/[\s&]+/g, '_') }
                            updateSocialModule('nicheGuidance', updated)
                          }}
                          placeholder="Niche name (e.g., Plumbing)"
                          data-testid={`input-niche-label-${index}`}
                        />
                        <code className="text-xs text-muted-foreground self-center font-mono px-2">{entry.key}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = [...(socialModule.nicheGuidance || defaultSettings.socialModule!.nicheGuidance || [])]
                          updated.splice(index, 1)
                          updateSocialModule('nicheGuidance', updated)
                        }}
                        data-testid={`button-remove-niche-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={entry.guidance}
                      onChange={(e) => {
                        const updated = [...(socialModule.nicheGuidance || defaultSettings.socialModule!.nicheGuidance || [])]
                        updated[index] = { ...updated[index], guidance: e.target.value }
                        updateSocialModule('nicheGuidance', updated)
                      }}
                      rows={2}
                      placeholder="Voice guidance for AI when writing posts in this niche..."
                      data-testid={`input-niche-guidance-${index}`}
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const current = [...(socialModule.nicheGuidance || defaultSettings.socialModule!.nicheGuidance || [])]
                  current.push({ key: '', label: '', guidance: '' })
                  updateSocialModule('nicheGuidance', current)
                }}
                data-testid="button-add-niche"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Niche
              </Button>
            </CardContent>
          </Card>

          {socialModule.tier === 'power' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Monitoring <InfoTooltip text="Track brand mentions and trends across platforms automatically. Available only on the Power tier." /></CardTitle>
                <CardDescription>
                  Configure social media monitoring and automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="trend-interval">Trend Check Interval (hours)</Label>
                  <Input
                    id="trend-interval"
                    type="number"
                    min={1}
                    max={168}
                    value={socialModule.monitoring.trendCheckInterval}
                    onChange={(e) => updateMonitoring('trendCheckInterval', parseInt(e.target.value, 10) || 24)}
                    data-testid="input-trend-check-interval"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-b">
                  <div>
                    <p className="font-medium">Mention Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when your brand is mentioned</p>
                  </div>
                  <Switch
                    checked={socialModule.monitoring.mentionAlerts}
                    onCheckedChange={checked => updateMonitoring('mentionAlerts', checked)}
                    data-testid="switch-mention-alerts"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Auto-Reply</p>
                    <p className="text-sm text-muted-foreground">Automatically respond to mentions using AI</p>
                  </div>
                  <Switch
                    checked={socialModule.monitoring.autoReply}
                    onCheckedChange={checked => updateMonitoring('autoReply', checked)}
                    data-testid="switch-auto-reply"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">API Health Checker <InfoTooltip text="Monitors whether social platform APIs are reachable and functioning, with alerts for repeated failures." /></CardTitle>
              <CardDescription>
                Monitor the health of social media API connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Enable Status Checker</p>
                  <p className="text-sm text-muted-foreground">Periodically check API connection health</p>
                </div>
                <Switch
                  checked={socialModule.statusChecker.enabled}
                  onCheckedChange={checked => updateStatusChecker('enabled', checked)}
                  data-testid="switch-status-checker"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Alert on Repeated Failures</p>
                  <p className="text-sm text-muted-foreground">Send alerts when API failures exceed the threshold</p>
                </div>
                <Switch
                  checked={socialModule.statusChecker.alertOnRepeatedFailures}
                  onCheckedChange={checked => updateStatusChecker('alertOnRepeatedFailures', checked)}
                  data-testid="switch-alert-failures"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failure-threshold">Failure Threshold</Label>
                <Input
                  id="failure-threshold"
                  type="number"
                  min={1}
                  max={50}
                  value={socialModule.statusChecker.failureThreshold}
                  onChange={(e) => updateStatusChecker('failureThreshold', parseInt(e.target.value, 10) || 3)}
                  data-testid="input-failure-threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Number of consecutive failures before triggering an alert
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end pt-6">
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={() => {
            const guidance = socialModule.nicheGuidance || []
            const filtered = guidance.filter((e: NicheGuidanceEntry) => e.key.trim() && e.label.trim() && e.guidance.trim())
            if (filtered.length !== guidance.length) {
              updateSocialModule('nicheGuidance', filtered)
            }
            handleSave()
          }}
          testId="button-save-musesocial"
        />
      </div>
    </div>
  )
}
