'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Check } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'

export default function SettingsPage() {
  const { settings, loading: isLoading } = useSettings()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    
    const response = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ settings: localSettings }),
    })
    
    if (response.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    
    setSaving(false)
  }

  function updateFeature(key: keyof typeof localSettings.features, value: boolean) {
    setLocalSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your application settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="button-save-settings">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Configure how users can sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Authentication</Label>
                <p className="text-sm text-muted-foreground">Allow email/password sign up</p>
              </div>
              <Switch
                checked={localSettings.features.emailAuth}
                onCheckedChange={(checked) => updateFeature('emailAuth', checked)}
                data-testid="switch-email-auth"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Google OAuth</Label>
                <p className="text-sm text-muted-foreground">Allow Google sign in</p>
              </div>
              <Switch
                checked={localSettings.features.googleOAuth}
                onCheckedChange={(checked) => updateFeature('googleOAuth', checked)}
                data-testid="switch-google-oauth"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Enable or disable application features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Avatar Upload</Label>
                <p className="text-sm text-muted-foreground">Allow profile picture uploads</p>
              </div>
              <Switch
                checked={localSettings.features.avatarUpload}
                onCheckedChange={(checked) => updateFeature('avatarUpload', checked)}
                data-testid="switch-avatar-upload"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Admin Panel</Label>
                <p className="text-sm text-muted-foreground">Enable admin dashboard</p>
              </div>
              <Switch
                checked={localSettings.features.adminPanel}
                onCheckedChange={(checked) => updateFeature('adminPanel', checked)}
                data-testid="switch-admin-panel"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Show maintenance page to users</p>
              </div>
              <Switch
                checked={localSettings.features.maintenanceMode}
                onCheckedChange={(checked) => updateFeature('maintenanceMode', checked)}
                data-testid="switch-maintenance-mode"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
