'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '../components'
import {
  Loader2, ExternalLink, Check, X, Database, CreditCard, Mail, Brain,
  Server, ShieldAlert, BarChart3, Twitter, Linkedin, Instagram, Youtube,
  Facebook, Music, MessageSquare, Image, Camera, Gamepad2, KeyRound,
  ChevronDown, ChevronRight, Pencil, Save, Trash2, Eye, EyeOff
} from 'lucide-react'

interface IntegrationKey {
  id: string
  label: string
  envVar: string
  masked: string | null
  configured: boolean
  docsUrl: string
  source: 'env' | 'db' | null
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

function KeyRow({ keyData, onSaved }: { keyData: IntegrationKey; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setShowValue(false)
      onSaved()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
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
      onSaved()
    } catch {
      setError('Network error')
    } finally {
      setDeleting(false)
    }
  }

  function handleCancel() {
    setEditing(false)
    setInputValue('')
    setShowValue(false)
    setError(null)
  }

  return (
    <div className="py-3 space-y-2" data-testid={`key-${keyData.id}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{keyData.label}</span>
            {keyData.configured ? (
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <X className="h-3.5 w-3.5 text-destructive" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <code className="text-xs text-muted-foreground font-mono">{keyData.envVar}</code>
            {keyData.masked && (
              <span className="text-xs text-muted-foreground font-mono" data-testid={`masked-${keyData.id}`}>
                {keyData.masked}
              </span>
            )}
            {keyData.source && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`source-${keyData.id}`}>
                {keyData.source === 'db' ? 'Dashboard' : 'Env Var'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant={keyData.configured ? 'default' : 'destructive'} data-testid={`badge-key-${keyData.id}`}>
            {keyData.configured ? 'Configured' : 'Missing'}
          </Badge>
          {!editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(true)}
              data-testid={`button-edit-${keyData.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {keyData.source === 'db' && !editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              data-testid={`button-delete-${keyData.id}`}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a href={keyData.docsUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-docs-${keyData.id}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      {editing && (
        <div className="flex items-center gap-2 pl-0">
          <div className="relative flex-1">
            <Input
              type={showValue ? 'text' : 'password'}
              placeholder={`Enter ${keyData.label}...`}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              className="pr-10 font-mono text-sm"
              autoFocus
              data-testid={`input-${keyData.id}`}
            />
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              data-testid={`button-toggle-visibility-${keyData.id}`}
            >
              {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            size="icon"
            onClick={handleSave}
            disabled={saving || !inputValue.trim()}
            data-testid={`button-save-${keyData.id}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
      )}
      {error && (
        <p className="text-xs text-destructive pl-0" data-testid={`error-${keyData.id}`}>{error}</p>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [techStack, setTechStack] = useState<IntegrationGroup[]>([])
  const [socialPlatforms, setSocialPlatforms] = useState<IntegrationGroup[]>([])
  const [summary, setSummary] = useState({ techConfigured: 0, techTotal: 0, socialConfigured: 0, socialTotal: 0 })
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTechStack(data.techStack)
      setSocialPlatforms(data.socialPlatforms)
      setSummary(data.summary)
      if (loading) {
        const missingGroups = new Set<string>()
        ;[...data.techStack, ...data.socialPlatforms].forEach((g: IntegrationGroup) => {
          if (g.keys.some((k: IntegrationKey) => !k.configured)) {
            missingGroups.add(g.id)
          }
        })
        setExpandedGroups(missingGroups)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [loading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function toggleGroup(id: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-integrations">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  function renderGroup(group: IntegrationGroup, iconMap: Record<string, typeof Database>) {
    const Icon = iconMap[group.icon] || KeyRound
    const configured = group.keys.filter(k => k.configured).length
    const total = group.keys.length
    const allConfigured = configured === total
    const isExpanded = expandedGroups.has(group.id)

    return (
      <div key={group.id} className="border rounded-md" data-testid={`group-${group.id}`}>
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between gap-2 p-4 text-left hover-elevate rounded-md"
          data-testid={`button-toggle-${group.id}`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{group.label}</span>
            <Badge variant={allConfigured ? 'default' : 'secondary'} data-testid={`badge-status-${group.id}`}>
              {configured}/{total}
            </Badge>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-1 divide-y" data-testid={`keys-${group.id}`}>
            {group.keys.map(key => (
              <KeyRow key={key.id} keyData={key} onSaved={fetchData} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card data-testid="card-tech-summary">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Tech Stack Integrations
            <InfoTooltip text="Core infrastructure services that power your app. Click the pencil icon on any key to enter or update its value. Keys saved here are stored securely in your database and take effect immediately." />
          </CardTitle>
          <CardDescription>
            Database, payments, email, AI, caching, monitoring, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {techStack.map(group => renderGroup(group, TECH_ICONS))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Social Media Platforms
            <InfoTooltip text="API credentials for each social platform. Click the pencil icon to enter your API keys after registering a developer app with each platform." />
          </CardTitle>
          <CardDescription>
            API keys and secrets for social posting, monitoring, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {socialPlatforms.map(group => renderGroup(group, SOCIAL_ICONS))}
        </CardContent>
      </Card>

      <div className="p-4 rounded-md bg-muted/50 border">
        <p className="text-sm text-muted-foreground" data-testid="text-env-info">
          Keys can be set in two ways: directly from this page (stored in your database) or as environment variables in your hosting platform (Vercel, Replit, etc.). Dashboard-saved keys take effect immediately. Environment variables set in your hosting platform are also recognized and shown here. A <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-1 inline">Dashboard</Badge> badge means the key was saved from this page. An <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-1 inline">Env Var</Badge> badge means it comes from your deployment environment.
        </p>
      </div>
    </div>
  )
}
