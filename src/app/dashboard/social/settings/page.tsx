'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Save,
  Bell,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { HelpTooltip } from '@/components/social/help-tooltip'

interface PostingPreferences {
  auto_approve: boolean
  default_status: string
  notifications_email: boolean
  notifications_in_app: boolean
  timezone: string
  quiet_hours_start: string
  quiet_hours_end: string
}

const DEFAULT_PREFS: PostingPreferences = {
  auto_approve: false,
  default_status: 'draft',
  notifications_email: true,
  notifications_in_app: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
]

export default function SocialSettingsPage() {
  const [prefs, setPrefs] = useState<PostingPreferences>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tierName, setTierName] = useState('Starter')
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [prefsRes, tierRes] = await Promise.all([
        fetch('/api/social/posting-preferences').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/social/tier').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      if (prefsRes?.preferences) {
        setPrefs(prev => ({ ...prev, ...prefsRes.preferences }))
      }
      if (tierRes?.tier) {
        const display: Record<string, string> = {
          starter: 'Starter', basic: 'Basic', premium: 'Premium',
          universal: 'Universal', power: 'Power',
        }
        setTierName(display[tierRes.tier] || tierRes.tier)
      }
    } catch {
      // show defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/social/posting-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save settings')
      }
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your PassivePost preferences and notifications.
        </p>
      </div>

      <Card data-testid="card-subscription">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Subscription</CardTitle>
            </div>
            <Badge variant="secondary" data-testid="badge-tier">{tierName}</Badge>
          </div>
          <CardDescription>
            Your current plan and usage limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild data-testid="button-manage-subscription">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="card-posting-preferences">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Posting Preferences</CardTitle>
          </div>
          <CardDescription>
            Control how posts are created and scheduled by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approve">Auto-Approve AI Posts <HelpTooltip text="When on, AI posts skip the approval queue and get scheduled automatically." /></Label>
              <p className="text-xs text-muted-foreground">
                Skip the approval queue and schedule AI-generated posts automatically.
              </p>
            </div>
            <Switch
              id="auto-approve"
              checked={prefs.auto_approve}
              onCheckedChange={v => setPrefs(prev => ({ ...prev, auto_approve: v }))}
              data-testid="switch-auto-approve"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="default-status">Default Post Status <HelpTooltip text="Choose whether new posts start as drafts (you publish manually) or get scheduled right away." /></Label>
            <Select
              value={prefs.default_status}
              onValueChange={v => setPrefs(prev => ({ ...prev, default_status: v }))}
            >
              <SelectTrigger data-testid="select-default-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The default status when creating a new post manually.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={prefs.timezone}
              onValueChange={v => setPrefs(prev => ({ ...prev, timezone: v }))}
            >
              <SelectTrigger data-testid="select-timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for scheduling posts and quiet hours.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Quiet Hours <HelpTooltip text="Posts won't be published during these hours, even if they're scheduled. Good for avoiding late-night posts." /></Label>
            <p className="text-xs text-muted-foreground">
              Posts will not be published during these hours.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="space-y-1">
                <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">Start</Label>
                <Select
                  value={prefs.quiet_hours_start}
                  onValueChange={v => setPrefs(prev => ({ ...prev, quiet_hours_start: v }))}
                >
                  <SelectTrigger className="w-[120px]" data-testid="select-quiet-start">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = String(i).padStart(2, '0')
                      return <SelectItem key={h} value={`${h}:00`}>{`${h}:00`}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-muted-foreground mt-5">to</span>
              <div className="space-y-1">
                <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">End</Label>
                <Select
                  value={prefs.quiet_hours_end}
                  onValueChange={v => setPrefs(prev => ({ ...prev, quiet_hours_end: v }))}
                >
                  <SelectTrigger className="w-[120px]" data-testid="select-quiet-end">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = String(i).padStart(2, '0')
                      return <SelectItem key={h} value={`${h}:00`}>{`${h}:00`}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-notifications">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to be notified about your social media activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="notif-email">Email Notifications <HelpTooltip text="Get email alerts when posts fail, trends appear, or your weekly summary is ready." /></Label>
              <p className="text-xs text-muted-foreground">
                Receive email alerts for post failures, trend alerts, and weekly summaries.
              </p>
            </div>
            <Switch
              id="notif-email"
              checked={prefs.notifications_email}
              onCheckedChange={v => setPrefs(prev => ({ ...prev, notifications_email: v }))}
              data-testid="switch-notifications-email"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="notif-inapp">In-App Notifications <HelpTooltip text="See alerts inside your dashboard for post status updates, trend alerts, and activity." /></Label>
              <p className="text-xs text-muted-foreground">
                Show notifications in the dashboard for post status updates and alerts.
              </p>
            </div>
            <Switch
              id="notif-inapp"
              checked={prefs.notifications_in_app}
              onCheckedChange={v => setPrefs(prev => ({ ...prev, notifications_in_app: v }))}
              data-testid="switch-notifications-inapp"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          data-testid="button-save-settings"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
