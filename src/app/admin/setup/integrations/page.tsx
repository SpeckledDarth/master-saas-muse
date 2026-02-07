'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '../components'
import {
  Loader2, ExternalLink, Check, X, Database, CreditCard, Mail, Brain,
  Server, ShieldAlert, BarChart3, Twitter, Linkedin, Instagram, Youtube,
  Facebook, Music, MessageSquare, Image, Camera, Gamepad2, KeyRound, ChevronDown, ChevronRight
} from 'lucide-react'

interface IntegrationKey {
  id: string
  label: string
  envVar: string
  masked: string | null
  configured: boolean
  docsUrl: string
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

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [techStack, setTechStack] = useState<IntegrationGroup[]>([])
  const [socialPlatforms, setSocialPlatforms] = useState<IntegrationGroup[]>([])
  const [summary, setSummary] = useState({ techConfigured: 0, techTotal: 0, socialConfigured: 0, socialTotal: 0 })
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/integrations')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setTechStack(data.techStack)
        setSocialPlatforms(data.socialPlatforms)
        setSummary(data.summary)
        const missingGroups = new Set<string>()
        ;[...data.techStack, ...data.socialPlatforms].forEach((g: IntegrationGroup) => {
          if (g.keys.some((k: IntegrationKey) => !k.configured)) {
            missingGroups.add(g.id)
          }
        })
        setExpandedGroups(missingGroups)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
          className="w-full flex items-center justify-between p-4 text-left hover-elevate rounded-md"
          data-testid={`button-toggle-${group.id}`}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{group.label}</span>
            <Badge variant={allConfigured ? 'default' : 'secondary'} data-testid={`badge-status-${group.id}`}>
              {configured}/{total}
            </Badge>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-2 space-y-3" data-testid={`keys-${group.id}`}>
            {group.keys.map(key => (
              <div key={key.id} className="flex items-center justify-between gap-4 py-2 flex-wrap" data-testid={`key-${key.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{key.label}</span>
                    {key.configured ? (
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <code className="text-xs text-muted-foreground font-mono">{key.envVar}</code>
                    {key.masked && (
                      <span className="text-xs text-muted-foreground font-mono" data-testid={`masked-${key.id}`}>
                        {key.masked}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={key.configured ? 'default' : 'destructive'} data-testid={`badge-key-${key.id}`}>
                    {key.configured ? 'Configured' : 'Missing'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={key.docsUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-docs-${key.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
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
            <InfoTooltip text="Core infrastructure services that power your app. These keys are stored as environment variables in your deployment." />
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
            <InfoTooltip text="API credentials for each social platform. Each deployment needs its own developer app registrations." />
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
          All keys are stored as environment variables and read from your deployment environment. To add or change a key, update the environment variable in your hosting platform (Vercel, Replit, etc.) and restart the application. Keys are never stored in the database.
        </p>
      </div>
    </div>
  )
}
