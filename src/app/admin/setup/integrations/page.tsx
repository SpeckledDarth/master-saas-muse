'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '../components'
import {
  Loader2, ExternalLink, Database, CreditCard, Mail, Brain,
  Server, ShieldAlert, BarChart3, KeyRound, Share2,
  Pencil, Save, Trash2, Eye, EyeOff, Check, X, CircleDot,
  ChevronDown, ChevronRight
} from 'lucide-react'

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

const TECH_ICONS: Record<string, typeof Database> = {
  database: Database,
  'credit-card': CreditCard,
  mail: Mail,
  brain: Brain,
  server: Server,
  'shield-alert': ShieldAlert,
  'bar-chart': BarChart3,
}

const FORMAT_VALIDATORS: Record<string, { pattern: RegExp; hint: string }> = {
  STRIPE_SECRET_KEY: { pattern: /^(sk_live_|sk_test_|rk_live_|rk_test_)/, hint: 'Should start with sk_live_, sk_test_, rk_live_, or rk_test_' },
  STRIPE_WEBHOOK_SECRET: { pattern: /^whsec_/, hint: 'Should start with whsec_' },
  NEXT_PUBLIC_SUPABASE_URL: { pattern: /\.supabase\.co\/?$/, hint: 'Should be a Supabase URL ending in .supabase.co' },
  NEXT_PUBLIC_SENTRY_DSN: { pattern: /^https:\/\/.*@.*\.ingest\..*sentry\.io\//, hint: 'Should be a valid Sentry DSN URL' },
  OPENAI_API_KEY: { pattern: /^sk-/, hint: 'Should start with sk-' },
  UPSTASH_REDIS_REST_URL: { pattern: /^https:\/\//, hint: 'Should be a valid HTTPS URL' },
  NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL: { pattern: /^https:\/\//, hint: 'Should be a valid HTTPS URL' },
}

function KeyRow({ keyData, onSaved }: { keyData: IntegrationKey; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [revealedValue, setRevealedValue] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [inputRevealed, setInputRevealed] = useState(false)
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
    setInputRevealed(false)
    setError(null)
  }

  function validateFormat(value: string): string | null {
    const validator = FORMAT_VALIDATORS[keyData.envVar]
    if (validator && !validator.pattern.test(value)) {
      return validator.hint
    }
    return null
  }

  async function handleSave() {
    if (!inputValue.trim()) {
      setError('Value cannot be empty')
      return
    }
    const formatError = validateFormat(inputValue.trim())
    if (formatError) {
      setError(formatError)
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
      setInputRevealed(false)
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
            {keyData.required ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0" data-testid={`badge-required-${keyData.id}`}>Required</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`badge-optional-${keyData.id}`}>Optional</Badge>
            )}
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
              <div className="relative flex-1">
                <Input
                  type={inputRevealed ? 'text' : 'password'}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
                  placeholder={`Enter ${keyData.label}...`}
                  className="font-mono text-sm pr-10"
                  autoFocus
                  data-testid={`input-${keyData.id}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={() => setInputRevealed(!inputRevealed)}
                  tabIndex={-1}
                  data-testid={`button-toggle-input-${keyData.id}`}
                >
                  {inputRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
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

function CollapsibleGroup({ group, iconMap, onSaved }: { group: IntegrationGroup; iconMap: Record<string, typeof Database>; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = iconMap[group.icon] || KeyRound
  const groupConfigured = group.keys.filter(k => k.configured).length
  const groupTotal = group.keys.length
  const allConfigured = groupConfigured === groupTotal
  const hasRequired = group.keys.some(k => k.required)
  const requiredMissing = group.keys.filter(k => k.required && !k.configured).length

  return (
    <div data-testid={`group-${group.id}`}>
      <button
        type="button"
        className="w-full flex items-center gap-3 px-6 py-3 bg-muted/30 border-t text-left hover-elevate active-elevate-2"
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
              className={`h-2.5 w-2.5 ${k.configured ? 'text-green-500' : k.required ? 'text-destructive' : 'text-muted-foreground/40'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {requiredMissing > 0 && hasRequired && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {requiredMissing} required missing
            </Badge>
          )}
          <Badge variant={allConfigured ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
            {groupConfigured}/{groupTotal}
          </Badge>
        </div>
      </button>
      {expanded && (
        <div className="divide-y">
          {group.keys.map(key => (
            <KeyRow key={key.id} keyData={key} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [techStack, setTechStack] = useState<IntegrationGroup[]>([])
  const [socialPlatforms, setSocialPlatforms] = useState<IntegrationGroup[]>([])
  const [summary, setSummary] = useState({ techConfigured: 0, techTotal: 0, requiredConfigured: 0, requiredTotal: 0, socialConfigured: 0, socialTotal: 0 })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTechStack(data.techStack || [])
      setSocialPlatforms(data.socialPlatforms || [])
      setSummary(data.summary || {})
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-integrations">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card data-testid="card-total-summary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Tech Stack Keys</p>
                <p className="text-2xl font-bold" data-testid="text-tech-count">{summary.techConfigured}/{summary.techTotal}</p>
              </div>
              <Badge variant={summary.techConfigured === summary.techTotal ? 'default' : 'secondary'}>
                {summary.techConfigured === summary.techTotal ? 'All Set' : 'Incomplete'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-social-summary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Social Platform Keys</p>
                <p className="text-2xl font-bold" data-testid="text-social-count">{summary.socialConfigured}/{summary.socialTotal}</p>
              </div>
              <Badge variant={summary.socialConfigured === summary.socialTotal ? 'default' : 'secondary'}>
                {summary.socialConfigured === summary.socialTotal ? 'All Set' : 'Incomplete'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-required-summary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Required Keys</p>
                <p className="text-2xl font-bold" data-testid="text-required-count">{summary.requiredConfigured}/{summary.requiredTotal}</p>
              </div>
              <Badge variant={summary.requiredConfigured === summary.requiredTotal ? 'default' : 'destructive'}>
                {summary.requiredConfigured === summary.requiredTotal ? 'All Set' : `${summary.requiredTotal - summary.requiredConfigured} Missing`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Tech Stack Integrations
                <InfoTooltip text="Click any group to expand it. Click a value field to edit. Use the eye icon to reveal a saved value. Keys saved here are stored in your database and take effect immediately." />
              </CardTitle>
              <CardDescription>Database, payments, email, AI, caching, monitoring, and analytics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {techStack.map((group) => (
            <CollapsibleGroup
              key={group.id}
              group={group}
              iconMap={TECH_ICONS}
              onSaved={fetchData}
            />
          ))}
        </CardContent>
      </Card>

      {socialPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Platform Credentials
                  <InfoTooltip text="These are your app-level API credentials for each social platform. Users never see these — they just click Connect and go through OAuth. Enter your developer app credentials here to enable OAuth flows." />
                </CardTitle>
                <CardDescription>App-level API keys that power OAuth connections for all users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {socialPlatforms.map((group) => (
              <CollapsibleGroup
                key={group.id}
                group={group}
                iconMap={TECH_ICONS}
                onSaved={fetchData}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="p-4 rounded-md bg-muted/30 border text-sm text-muted-foreground space-y-1" data-testid="text-env-info">
        <p>Keys can be set in two ways:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-2">
          <li><Badge variant="secondary" className="text-[10px] px-1.5 py-0 mr-1">Dashboard</Badge>Saved from this page, stored in your database, takes effect immediately</li>
          <li><Badge variant="secondary" className="text-[10px] px-1.5 py-0 mr-1">Env Var</Badge>Set in your hosting platform (Vercel, Replit, etc.), recognized automatically</li>
        </ul>
        <p className="pt-1">Dashboard-saved keys take priority over environment variables.</p>
      </div>
    </div>
  )
}
