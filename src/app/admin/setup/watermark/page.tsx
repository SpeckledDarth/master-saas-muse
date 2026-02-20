'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Stamp } from 'lucide-react'

interface WatermarkSettings {
  enabled: boolean
  text: string
  position: string
}

export default function WatermarkAdminPage() {
  const [settings, setSettings] = useState<WatermarkSettings>({
    enabled: false,
    text: 'Posted via PassivePost',
    position: 'bottom',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/social/watermark')
      .then(r => r.json())
      .then(data => {
        if (data.watermark) setSettings(data.watermark)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/social/watermark', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      toast({ title: 'Saved', description: 'Watermark settings updated successfully.' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Watermark Settings</h2>
        <p className="text-muted-foreground">
          Add a text watermark to all published social posts. Higher tiers can disable this.
        </p>
      </div>

      <Card data-testid="card-watermark-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stamp className="h-5 w-5" />
            Post Watermark
          </CardTitle>
          <CardDescription>
            When enabled, a text line is appended to every published post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="watermark-toggle">Enable Watermark</Label>
              <p className="text-sm text-muted-foreground">Append watermark text to published posts</p>
            </div>
            <Switch
              id="watermark-toggle"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, enabled: checked }))}
              data-testid="switch-watermark-toggle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input
              id="watermark-text"
              value={settings.text}
              onChange={(e) => setSettings(s => ({ ...s, text: e.target.value }))}
              placeholder="Posted via PassivePost"
              disabled={!settings.enabled}
              data-testid="input-watermark-text"
            />
            <p className="text-xs text-muted-foreground">
              This text appears at the bottom of every published post
            </p>
          </div>

          {settings.enabled && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <Label className="text-sm font-medium mb-2 block">Preview</Label>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2 text-foreground">Your post content goes here...</p>
                <p className="text-xs opacity-60">{settings.text}</p>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} data-testid="button-save-watermark">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Watermark Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
