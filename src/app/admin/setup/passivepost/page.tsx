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
import { DEFAULT_TIER_DEFINITIONS, defaultSocialModuleSettings } from '@/lib/social/types'
import type { NicheGuidanceEntry, TierDefinition } from '@/lib/social/types'

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
              className={`font-mono text-sm py-2 px-3 rounded-md border flex items-center cursor-pointer hover-elevate active-elevate-2 ${
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

export default function PassivePostPage() {
  const { settings, setSettings, saving, saved, handleSave } = useSetupSettingsContext()

  const socialModule = (settings as any).socialModule || defaultSocialModuleSettings

  function updateSocialModule<K extends keyof import('@/lib/social/types').SocialModuleSettings>(key: K, value: import('@/lib/social/types').SocialModuleSettings[K]) {
    setSettings(prev => ({ ...prev, socialModule: { ...((prev as any).socialModule || defaultSocialModuleSettings), [key]: value } } as any))
  }

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
    if ((settings as any).features?.socialModuleEnabled) {
      fetchSocialKeys()
    }
  }, [(settings as any).features?.socialModuleEnabled, fetchSocialKeys])

  function updatePosting(key: string, value: any) {
    const current = (settings as any).socialModule || defaultSocialModuleSettings
    updateSocialModule('posting', { ...current.posting, [key]: value })
  }

  function updateMonitoring(key: string, value: any) {
    const current = (settings as any).socialModule || defaultSocialModuleSettings
    updateSocialModule('monitoring', { ...current.monitoring, [key]: value })
  }

  function updateStatusChecker(key: string, value: any) {
    const current = (settings as any).socialModule || defaultSocialModuleSettings
    updateSocialModule('statusChecker', { ...current.statusChecker, [key]: value })
  }

  function updatePlatform(platform: string, key: string, value: any) {
    const current = (settings as any).socialModule || defaultSocialModuleSettings
    updateSocialModule('platforms', { ...current.platforms, [platform]: { ...current.platforms[platform as keyof typeof current.platforms], [key]: value } })
  }

  const isEnabled = (settings as any).features?.socialModuleEnabled

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
            PassivePost social media management module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium" data-testid="text-module-status-label">PassivePost Module</p>
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
              <CardTitle className="flex items-center gap-2">Tier Configuration <InfoTooltip text="Define your subscription tiers, their Stripe metadata values, and usage limits. Add as many tiers as your SaaS needs. The Stripe Metadata Value must match the muse_tier value on your Stripe products." /></CardTitle>
              <CardDescription>
                Define subscription tiers with display names, Stripe metadata mappings, and rate limits. Each tier gets an auto-generated ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Tier</Label>
                <Select
                  value={socialModule.tier}
                  onValueChange={(value) => updateSocialModule('tier', value)}
                >
                  <SelectTrigger data-testid="select-social-tier">
                    <SelectValue placeholder="Select default tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {(socialModule.tierDefinitions || DEFAULT_TIER_DEFINITIONS).map((td: TierDefinition) => (
                      <SelectItem key={td.id} value={td.id} data-testid={`option-tier-${td.id}`}>
                        {td.displayName} ({td.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Users without a paid subscription fall back to this tier.</p>
              </div>

              <div className="space-y-4">
                {(socialModule.tierDefinitions || DEFAULT_TIER_DEFINITIONS).map((td: TierDefinition, idx: number) => {
                  const defs = socialModule.tierDefinitions || DEFAULT_TIER_DEFINITIONS
                  return (
                    <div key={td.id} className="border rounded-md p-4 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{td.id}</Badge>
                          <span className="font-medium text-sm">{td.displayName}</span>
                        </div>
                        {defs.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const updated = defs.filter((_: TierDefinition, i: number) => i !== idx)
                              updateSocialModule('tierDefinitions', updated)
                              const newLimits = { ...socialModule.tierLimits }
                              delete newLimits[td.id]
                              updateSocialModule('tierLimits', newLimits)
                              if (socialModule.tier === td.id && updated.length > 0) {
                                updateSocialModule('tier', updated[0].id)
                              }
                            }}
                            data-testid={`button-remove-tier-${td.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input
                            value={td.displayName}
                            onChange={(e) => {
                              const updated = [...defs]
                              updated[idx] = { ...td, displayName: e.target.value }
                              updateSocialModule('tierDefinitions', updated)
                            }}
                            data-testid={`input-tier-name-${td.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stripe Metadata Value</Label>
                          <Input
                            value={td.stripeMetadataValue}
                            onChange={(e) => {
                              const updated = [...defs]
                              updated[idx] = { ...td, stripeMetadataValue: e.target.value }
                              updateSocialModule('tierDefinitions', updated)
                            }}
                            data-testid={`input-tier-stripe-${td.id}`}
                          />
                          <p className="text-xs text-muted-foreground">Set muse_tier to this value on your Stripe product.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="space-y-2">
                          <Label>AI / Day</Label>
                          <Input
                            type="number"
                            min={1}
                            value={td.limits.dailyAiGenerations}
                            onChange={(e) => {
                              const updated = [...defs]
                              updated[idx] = { ...td, limits: { ...td.limits, dailyAiGenerations: parseInt(e.target.value) || 1 } }
                              updateSocialModule('tierDefinitions', updated)
                              updateSocialModule('tierLimits', {
                                ...socialModule.tierLimits,
                                [td.id]: updated[idx].limits,
                              })
                            }}
                            data-testid={`input-tier-ai-${td.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Posts / Day</Label>
                          <Input
                            type="number"
                            min={1}
                            value={td.limits.dailyPosts}
                            onChange={(e) => {
                              const updated = [...defs]
                              updated[idx] = { ...td, limits: { ...td.limits, dailyPosts: parseInt(e.target.value) || 1 } }
                              updateSocialModule('tierDefinitions', updated)
                              updateSocialModule('tierLimits', {
                                ...socialModule.tierLimits,
                                [td.id]: updated[idx].limits,
                              })
                            }}
                            data-testid={`input-tier-posts-${td.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Posts / Month</Label>
                          <Input
                            type="number"
                            min={1}
                            value={td.limits.monthlyPosts ?? 999999}
                            onChange={(e) => {
                              const updated = [...defs]
                              updated[idx] = { ...td, limits: { ...td.limits, monthlyPosts: parseInt(e.target.value) || 1 } }
                              updateSocialModule('tierDefinitions', updated)
                              updateSocialModule('tierLimits', {
                                ...socialModule.tierLimits,
                                [td.id]: updated[idx].limits,
                              })
                            }}
                            data-testid={`input-tier-monthly-${td.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Platforms</Label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={td.limits.maxPlatforms ?? 10}
                            onChange={(e) => {
                              const updated = [...defs]
                              updated[idx] = { ...td, limits: { ...td.limits, maxPlatforms: parseInt(e.target.value) || 1 } }
                              updateSocialModule('tierDefinitions', updated)
                              updateSocialModule('tierLimits', {
                                ...socialModule.tierLimits,
                                [td.id]: updated[idx].limits,
                              })
                            }}
                            data-testid={`input-tier-platforms-${td.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                <Button
                  variant="outline"
                  onClick={() => {
                    const defs = socialModule.tierDefinitions || DEFAULT_TIER_DEFINITIONS
                    const nextNum = defs.length + 1
                    const newId = `tier_${nextNum}`
                    const newTier: TierDefinition = {
                      id: newId,
                      displayName: `Tier ${nextNum}`,
                      stripeMetadataValue: newId,
                      limits: { dailyAiGenerations: 10, dailyPosts: 5, monthlyPosts: 100, maxPlatforms: 3 },
                    }
                    updateSocialModule('tierDefinitions', [...defs, newTier])
                    updateSocialModule('tierLimits', {
                      ...socialModule.tierLimits,
                      [newId]: newTier.limits,
                    })
                  }}
                  data-testid="button-add-tier"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
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
                {(socialModule.nicheGuidance || defaultSocialModuleSettings.nicheGuidance || []).map((entry: NicheGuidanceEntry, index: number) => (
                  <div key={entry.key + index} className="border rounded-md p-3 space-y-2" data-testid={`niche-entry-${entry.key}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <Input
                          value={entry.label}
                          onChange={(e) => {
                            const updated = [...(socialModule.nicheGuidance || defaultSocialModuleSettings.nicheGuidance || [])]
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
                          const updated = [...(socialModule.nicheGuidance || defaultSocialModuleSettings.nicheGuidance || [])]
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
                        const updated = [...(socialModule.nicheGuidance || defaultSocialModuleSettings.nicheGuidance || [])]
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
                  const current = [...(socialModule.nicheGuidance || defaultSocialModuleSettings.nicheGuidance || [])]
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Monitoring <InfoTooltip text="Track brand mentions and trends across platforms automatically." /></CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Engagement Pull <InfoTooltip text="Controls how often the system fetches engagement metrics (likes, shares, comments) from platform APIs for your published posts." /></CardTitle>
              <CardDescription>
                Configure the automated engagement metrics collection schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="engagement-interval">Pull Interval (hours)</Label>
                <Input
                  id="engagement-interval"
                  type="number"
                  min={1}
                  max={168}
                  value={socialModule.engagementPull?.intervalHours ?? 24}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 24
                    updateSocialModule('engagementPull', {
                      ...(socialModule.engagementPull || { intervalHours: 24, lookbackHours: 24 }),
                      intervalHours: Math.max(1, Math.min(168, val)),
                    })
                  }}
                  data-testid="input-engagement-interval"
                />
                <p className="text-xs text-muted-foreground">
                  How often to fetch engagement metrics from platform APIs (1-168 hours)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="engagement-lookback">Lookback Window (hours)</Label>
                <Input
                  id="engagement-lookback"
                  type="number"
                  min={1}
                  max={168}
                  value={socialModule.engagementPull?.lookbackHours ?? 24}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 24
                    updateSocialModule('engagementPull', {
                      ...(socialModule.engagementPull || { intervalHours: 24, lookbackHours: 24 }),
                      lookbackHours: Math.max(1, Math.min(168, val)),
                    })
                  }}
                  data-testid="input-engagement-lookback"
                />
                <p className="text-xs text-muted-foreground">
                  How far back to look for posts when pulling engagement data (1-168 hours)
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
          testId="button-save-passivepost"
        />
      </div>
    </div>
  )
}
