'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteSettings, defaultSettings } from '@/types/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Palette, DollarSign, Globe, Settings, Loader2, Save, Check } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState('branding')

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUserId(user.id)
      
      const response = await fetch('/api/admin/setup', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
      
      setLoading(false)
    }
    
    loadSettings()
  }, [router])

  async function handleSave() {
    if (!userId) return
    
    setSaving(true)
    setSaved(false)
    
    const response = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ settings }),
    })
    
    if (response.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    
    setSaving(false)
  }

  function updateBranding<K extends keyof SiteSettings['branding']>(
    key: K,
    value: SiteSettings['branding'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, [key]: value }
    }))
  }

  function updateSocial<K extends keyof SiteSettings['social']>(
    key: K,
    value: SiteSettings['social'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      social: { ...prev.social, [key]: value }
    }))
  }

  function updateFeatures<K extends keyof SiteSettings['features']>(
    key: K,
    value: SiteSettings['features'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value }
    }))
  }

  function updatePlan(planId: string, field: string, value: string | number | boolean | string[]) {
    setSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: prev.pricing.plans.map(plan =>
          plan.id === planId ? { ...plan, [field]: value } : plan
        )
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-setup">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-setup-title">Setup Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Configure your SaaS branding, pricing, and features
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          data-testid="button-save-settings"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="branding" data-testid="tab-branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="social" data-testid="tab-social">
            <Globe className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-features">
            <Settings className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>
                Configure your app name, colors, and company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input
                    id="appName"
                    value={settings.branding.appName}
                    onChange={e => updateBranding('appName', e.target.value)}
                    placeholder="My SaaS"
                    data-testid="input-app-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.branding.companyName}
                    onChange={e => updateBranding('companyName', e.target.value)}
                    placeholder="Your Company LLC"
                    data-testid="input-company-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.branding.tagline}
                  onChange={e => updateBranding('tagline', e.target.value)}
                  placeholder="Build something amazing"
                  data-testid="input-tagline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.branding.supportEmail}
                  onChange={e => updateBranding('supportEmail', e.target.value)}
                  placeholder="support@example.com"
                  data-testid="input-support-email"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <ImageUpload
                  label="Logo"
                  value={settings.branding.logoUrl}
                  onChange={url => updateBranding('logoUrl', url)}
                  folder="logos"
                  aspectRatio="1/1"
                  testId="logo-upload"
                />
                <ImageUpload
                  label="Hero Image"
                  value={settings.branding.heroImageUrl}
                  onChange={url => updateBranding('heroImageUrl', url)}
                  folder="heroes"
                  aspectRatio="16/9"
                  testId="hero-upload"
                />
              </div>

              <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                <p className="text-sm font-medium">Recommended Hero Image Specs</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Dimensions: <span className="font-medium text-foreground">1920 x 1080 pixels</span> (16:9 ratio)</li>
                  <li>Minimum width: <span className="font-medium text-foreground">1280 pixels</span> for sharp display</li>
                  <li>File size: Under <span className="font-medium text-foreground">500 KB</span> for fast loading</li>
                  <li>Format: <span className="font-medium text-foreground">JPG</span> for photos, <span className="font-medium text-foreground">PNG</span> for graphics</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroSize">Hero Image Size</Label>
                  <Select
                    value={settings.branding.heroImageSize || 'cover'}
                    onValueChange={value => updateBranding('heroImageSize', value)}
                  >
                    <SelectTrigger id="heroSize" data-testid="select-hero-size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover (fills area, may crop)</SelectItem>
                      <SelectItem value="contain">Contain (shows full image)</SelectItem>
                      <SelectItem value="auto">Auto (original size)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">How the image scales to fit</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heroPositionX">Horizontal Position: {settings.branding.heroImagePositionX ?? 50}%</Label>
                    <Input
                      id="heroPositionX"
                      type="range"
                      min="0"
                      max="100"
                      value={settings.branding.heroImagePositionX ?? 50}
                      onChange={e => updateBranding('heroImagePositionX', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      data-testid="input-hero-position-x"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Left</span>
                      <span>Center</span>
                      <span>Right</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroPositionY">Vertical Position: {settings.branding.heroImagePositionY ?? 50}%</Label>
                    <Input
                      id="heroPositionY"
                      type="range"
                      min="0"
                      max="100"
                      value={settings.branding.heroImagePositionY ?? 50}
                      onChange={e => updateBranding('heroImagePositionY', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      data-testid="input-hero-position-y"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Top</span>
                      <span>Center</span>
                      <span>Bottom</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Adjust where the focal point of your image is positioned (0% = left/top, 100% = right/bottom)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.branding.primaryColor}
                      onChange={e => updateBranding('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={settings.branding.primaryColor}
                      onChange={e => updateBranding('primaryColor', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.branding.accentColor}
                      onChange={e => updateBranding('accentColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                      data-testid="input-accent-color"
                    />
                    <Input
                      value={settings.branding.accentColor}
                      onChange={e => updateBranding('accentColor', e.target.value)}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border" style={{
                background: `linear-gradient(135deg, ${settings.branding.primaryColor}20, ${settings.branding.accentColor}20)`
              }}>
                <p className="text-sm text-muted-foreground mb-2">Color Preview</p>
                <div className="flex gap-4">
                  <div 
                    className="w-24 h-12 rounded-md flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings.branding.primaryColor }}
                  >
                    Primary
                  </div>
                  <div 
                    className="w-24 h-12 rounded-md flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings.branding.accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>
                Manage your subscription tiers in Stripe Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border rounded-lg bg-muted/50 text-center space-y-4">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Pricing is managed in Stripe</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    To keep invoices, emails, and your pricing page consistent, 
                    all pricing is managed directly in Stripe. Changes you make there 
                    will automatically appear on your site.
                  </p>
                </div>
                <Button
                  onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
                  className="mt-4"
                  data-testid="button-open-stripe"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Manage Products in Stripe
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create or edit products in Stripe Dashboard</li>
                  <li>Set product names, prices, and descriptions</li>
                  <li>Add features in the product metadata (key: features, value: JSON array)</li>
                  <li>Your pricing page will automatically display the updates</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Add links to your social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={settings.social.twitter}
                  onChange={e => updateSocial('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                  data-testid="input-twitter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={settings.social.linkedin}
                  onChange={e => updateSocial('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  data-testid="input-linkedin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={settings.social.github}
                  onChange={e => updateSocial('github', e.target.value)}
                  placeholder="https://github.com/yourorg"
                  data-testid="input-github"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={settings.social.website}
                  onChange={e => updateSocial('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                  data-testid="input-website"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable features for your SaaS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Email Authentication</p>
                  <p className="text-sm text-muted-foreground">Allow users to sign up with email/password</p>
                </div>
                <Switch
                  checked={settings.features.emailAuth}
                  onCheckedChange={checked => updateFeatures('emailAuth', checked)}
                  data-testid="switch-email-auth"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Google OAuth</p>
                  <p className="text-sm text-muted-foreground">Allow users to sign in with Google</p>
                </div>
                <Switch
                  checked={settings.features.googleOAuth}
                  onCheckedChange={checked => updateFeatures('googleOAuth', checked)}
                  data-testid="switch-google-oauth"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Avatar Upload</p>
                  <p className="text-sm text-muted-foreground">Allow users to upload profile pictures</p>
                </div>
                <Switch
                  checked={settings.features.avatarUpload}
                  onCheckedChange={checked => updateFeatures('avatarUpload', checked)}
                  data-testid="switch-avatar-upload"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Admin Panel</p>
                  <p className="text-sm text-muted-foreground">Enable the admin dashboard</p>
                </div>
                <Switch
                  checked={settings.features.adminPanel}
                  onCheckedChange={checked => updateFeatures('adminPanel', checked)}
                  data-testid="switch-admin-panel"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Audit Logs</p>
                  <p className="text-sm text-muted-foreground">Track admin actions</p>
                </div>
                <Switch
                  checked={settings.features.auditLogs}
                  onCheckedChange={checked => updateFeatures('auditLogs', checked)}
                  data-testid="switch-audit-logs"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Allow New Signups</p>
                  <p className="text-sm text-muted-foreground">Accept new user registrations</p>
                </div>
                <Switch
                  checked={settings.features.allowNewSignups}
                  onCheckedChange={checked => updateFeatures('allowNewSignups', checked)}
                  data-testid="switch-allow-signups"
                />
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Show maintenance page to all users</p>
                </div>
                <Switch
                  checked={settings.features.maintenanceMode}
                  onCheckedChange={checked => updateFeatures('maintenanceMode', checked)}
                  data-testid="switch-maintenance-mode"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
