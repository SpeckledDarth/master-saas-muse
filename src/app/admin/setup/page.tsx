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
import { Palette, DollarSign, Globe, Settings, Loader2, Save, Check, FileText, Plus, Trash2, Zap, Shield, Sparkles, Users, BarChart, Lock, Rocket, Heart, Star, Target, Award, Lightbulb, BookOpen } from 'lucide-react'
import type { FeatureCard, Testimonial, FAQItem, CTAContent, TeamMember } from '@/types/settings'
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
      setTimeout(() => {
        setSaved(false)
        window.location.reload()
      }, 1000)
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

  function updatePricing<K extends keyof SiteSettings['pricing']>(
    key: K,
    value: SiteSettings['pricing'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [key]: value }
    }))
  }

  function updateContent<K extends keyof SiteSettings['content']>(
    key: K,
    value: SiteSettings['content'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      content: { ...defaultSettings.content, ...prev.content, [key]: value }
    }))
  }

  function addFeatureCard() {
    const newCard: FeatureCard = {
      id: Date.now().toString(),
      icon: 'Zap',
      title: 'New Feature',
      description: 'Description of this feature',
    }
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        featureCards: [...(prev.content?.featureCards ?? []), newCard],
      }
    }))
  }

  function updateFeatureCard(id: string, field: keyof FeatureCard, value: string) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        featureCards: (prev.content?.featureCards ?? []).map(card =>
          card.id === id ? { ...card, [field]: value } : card
        ),
      }
    }))
  }

  function removeFeatureCard(id: string) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        featureCards: (prev.content?.featureCards ?? []).filter(card => card.id !== id),
      }
    }))
  }

  function addTestimonial() {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      name: 'Customer Name',
      role: 'Job Title',
      company: 'Company',
      quote: 'Their testimonial quote goes here.',
    }
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        testimonials: [...(prev.content?.testimonials ?? []), newTestimonial],
      }
    }))
  }

  function updateTestimonial(id: string, field: keyof Testimonial, value: string) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        testimonials: (prev.content?.testimonials ?? []).map(t =>
          t.id === id ? { ...t, [field]: value } : t
        ),
      }
    }))
  }

  function removeTestimonial(id: string) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        testimonials: (prev.content?.testimonials ?? []).filter(t => t.id !== id),
      }
    }))
  }

  function addFAQItem() {
    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      question: 'New question?',
      answer: 'Answer to the question.',
    }
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        faqItems: [...(prev.content?.faqItems ?? []), newFAQ],
      }
    }))
  }

  function updateFAQItem(id: string, field: keyof FAQItem, value: string) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        faqItems: (prev.content?.faqItems ?? []).map(item =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }
    }))
  }

  function removeFAQItem(id: string) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        faqItems: (prev.content?.faqItems ?? []).filter(item => item.id !== id),
      }
    }))
  }

  function updateCTA<K extends keyof CTAContent>(key: K, value: CTAContent[K]) {
    setSettings(prev => ({
      ...prev,
      content: {
        ...defaultSettings.content,
        ...prev.content,
        cta: {
          ...defaultSettings.content.cta,
          ...prev.content?.cta,
          [key]: value,
        },
      }
    }))
  }

  function updateAbout<K extends keyof SiteSettings['pages']['about']>(
    key: K,
    value: SiteSettings['pages']['about'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        about: {
          ...defaultSettings.pages.about,
          ...prev.pages?.about,
          [key]: value,
        },
      }
    }))
  }

  function updateContact<K extends keyof SiteSettings['pages']['contact']>(
    key: K,
    value: SiteSettings['pages']['contact'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        contact: {
          ...defaultSettings.pages.contact,
          ...prev.pages?.contact,
          [key]: value,
        },
      }
    }))
  }

  function updateLegal<K extends keyof SiteSettings['pages']['legal']>(
    key: K,
    value: SiteSettings['pages']['legal'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        legal: {
          ...defaultSettings.pages.legal,
          ...prev.pages?.legal,
          [key]: value,
        },
      }
    }))
  }

  function updatePricingPage<K extends keyof SiteSettings['pages']['pricing']>(
    key: K,
    value: SiteSettings['pages']['pricing'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        pricing: {
          ...defaultSettings.pages.pricing,
          ...prev.pages?.pricing,
          [key]: value,
        },
      }
    }))
  }

  function updateFAQPage<K extends keyof SiteSettings['pages']['faq']>(
    key: K,
    value: SiteSettings['pages']['faq'][K]
  ) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        faq: {
          ...defaultSettings.pages.faq,
          ...prev.pages?.faq,
          [key]: value,
        },
      }
    }))
  }

  function updateCustomPage(pageId: string, field: string, value: any) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        customPages: (prev.pages?.customPages ?? defaultSettings.pages.customPages).map(page =>
          page.id === pageId ? { ...page, [field]: value } : page
        ),
      }
    }))
  }

  function addTeamMember() {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: 'Team Member',
      role: 'Role',
      bio: 'Short bio about this team member.',
      imageUrl: null,
    }
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        about: {
          ...defaultSettings.pages.about,
          ...prev.pages?.about,
          team: [...(prev.pages?.about?.team ?? []), newMember],
        },
      }
    }))
  }

  function updateTeamMember(id: string, field: keyof TeamMember, value: string | null) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        about: {
          ...defaultSettings.pages.about,
          ...prev.pages?.about,
          team: (prev.pages?.about?.team ?? []).map(member =>
            member.id === id ? { ...member, [field]: value } : member
          ),
        },
      }
    }))
  }

  function removeTeamMember(id: string) {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...defaultSettings.pages,
        ...prev.pages,
        about: {
          ...defaultSettings.pages.about,
          ...prev.pages?.about,
          team: (prev.pages?.about?.team ?? []).filter(member => member.id !== id),
        },
      }
    }))
  }

  const iconOptions = [
    { value: 'Zap', label: 'Lightning' },
    { value: 'Shield', label: 'Shield' },
    { value: 'Sparkles', label: 'Sparkles' },
    { value: 'Users', label: 'Users' },
    { value: 'BarChart', label: 'Chart' },
    { value: 'Lock', label: 'Lock' },
    { value: 'Rocket', label: 'Rocket' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Star', label: 'Star' },
    { value: 'Target', label: 'Target' },
    { value: 'Award', label: 'Award' },
    { value: 'Lightbulb', label: 'Lightbulb' },
  ]

  const IconComponent = ({ name }: { name: string }) => {
    const icons: Record<string, React.ReactNode> = {
      Zap: <Zap className="h-4 w-4" />,
      Shield: <Shield className="h-4 w-4" />,
      Sparkles: <Sparkles className="h-4 w-4" />,
      Users: <Users className="h-4 w-4" />,
      BarChart: <BarChart className="h-4 w-4" />,
      Lock: <Lock className="h-4 w-4" />,
      Rocket: <Rocket className="h-4 w-4" />,
      Heart: <Heart className="h-4 w-4" />,
      Star: <Star className="h-4 w-4" />,
      Target: <Target className="h-4 w-4" />,
      Award: <Award className="h-4 w-4" />,
      Lightbulb: <Lightbulb className="h-4 w-4" />,
    }
    return <>{icons[name] || <Zap className="h-4 w-4" />}</>
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
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="branding" data-testid="tab-branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="pages" data-testid="tab-pages">
            <BookOpen className="h-4 w-4 mr-2" />
            Pages
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Light Mode Theme
              </CardTitle>
              <CardDescription>Customize colors for light mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.lightTheme?.background || '#ffffff'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, background: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.lightTheme?.background || '#ffffff'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, background: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.lightTheme?.foreground || '#0a0a0a'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, foreground: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.lightTheme?.foreground || '#0a0a0a'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, foreground: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Card Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.lightTheme?.card || '#ffffff'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, card: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.lightTheme?.card || '#ffffff'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, card: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.lightTheme?.border || '#e5e5e5'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, border: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.lightTheme?.border || '#e5e5e5'}
                      onChange={e => updateBranding('lightTheme', { ...settings.branding.lightTheme, border: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Dark Mode Theme
              </CardTitle>
              <CardDescription>Customize colors for dark mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.darkTheme?.background || '#0a0a1a'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, background: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.darkTheme?.background || '#0a0a1a'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, background: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.darkTheme?.foreground || '#fafafa'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, foreground: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.darkTheme?.foreground || '#fafafa'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, foreground: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Card Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.darkTheme?.card || '#0a0a1a'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, card: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.darkTheme?.card || '#0a0a1a'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, card: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.branding.darkTheme?.border || '#2a2a3e'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, border: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding.darkTheme?.border || '#2a2a3e'}
                      onChange={e => updateBranding('darkTheme', { ...settings.branding.darkTheme, border: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Features Section</CardTitle>
                    <CardDescription>Highlight what makes your product special</CardDescription>
                  </div>
                  <Switch
                    checked={settings.content?.featuresEnabled ?? true}
                    onCheckedChange={checked => updateContent('featuresEnabled', checked)}
                    data-testid="switch-features-enabled"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Headline</Label>
                    <Input
                      value={settings.content?.featuresHeadline ?? ''}
                      onChange={e => updateContent('featuresHeadline', e.target.value)}
                      placeholder="Everything you need"
                      data-testid="input-features-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Subheadline</Label>
                    <Input
                      value={settings.content?.featuresSubheadline ?? ''}
                      onChange={e => updateContent('featuresSubheadline', e.target.value)}
                      placeholder="Powerful features to help you build faster"
                      data-testid="input-features-subheadline"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Feature Cards</Label>
                    <Button size="sm" variant="outline" onClick={addFeatureCard} data-testid="button-add-feature">
                      <Plus className="h-4 w-4 mr-1" /> Add Feature
                    </Button>
                  </div>
                  
                  {(settings.content?.featureCards ?? []).map((card, index) => (
                    <div key={card.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Feature {index + 1}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeFeatureCard(card.id)}
                          aria-label="Remove feature"
                          data-testid={`button-remove-feature-${card.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Icon</Label>
                          <Select
                            value={card.icon}
                            onValueChange={value => updateFeatureCard(card.id, 'icon', value)}
                          >
                            <SelectTrigger data-testid={`select-feature-icon-${card.id}`}>
                              <div className="flex items-center gap-2">
                                <IconComponent name={card.icon} />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent name={opt.value} />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={card.title}
                            onChange={e => updateFeatureCard(card.id, 'title', e.target.value)}
                            placeholder="Feature title"
                            data-testid={`input-feature-title-${card.id}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={card.description}
                            onChange={e => updateFeatureCard(card.id, 'description', e.target.value)}
                            placeholder="Feature description"
                            data-testid={`input-feature-desc-${card.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Testimonials</CardTitle>
                    <CardDescription>Show what customers say about your product</CardDescription>
                  </div>
                  <Switch
                    checked={settings.content?.testimonialsEnabled ?? true}
                    onCheckedChange={checked => updateContent('testimonialsEnabled', checked)}
                    data-testid="switch-testimonials-enabled"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Headline</Label>
                  <Input
                    value={settings.content?.testimonialsHeadline ?? ''}
                    onChange={e => updateContent('testimonialsHeadline', e.target.value)}
                    placeholder="What our customers say"
                    data-testid="input-testimonials-headline"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Customer Testimonials</Label>
                    <Button size="sm" variant="outline" onClick={addTestimonial} data-testid="button-add-testimonial">
                      <Plus className="h-4 w-4 mr-1" /> Add Testimonial
                    </Button>
                  </div>
                  
                  {(settings.content?.testimonials ?? []).map((t, index) => (
                    <div key={t.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Testimonial {index + 1}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeTestimonial(t.id)}
                          aria-label="Remove testimonial"
                          data-testid={`button-remove-testimonial-${t.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={t.name}
                            onChange={e => updateTestimonial(t.id, 'name', e.target.value)}
                            placeholder="Customer name"
                            data-testid={`input-testimonial-name-${t.id}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Role</Label>
                          <Input
                            value={t.role}
                            onChange={e => updateTestimonial(t.id, 'role', e.target.value)}
                            placeholder="CEO, Developer, etc."
                            data-testid={`input-testimonial-role-${t.id}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Company</Label>
                          <Input
                            value={t.company}
                            onChange={e => updateTestimonial(t.id, 'company', e.target.value)}
                            placeholder="Company name"
                            data-testid={`input-testimonial-company-${t.id}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quote</Label>
                        <Textarea
                          value={t.quote}
                          onChange={e => updateTestimonial(t.id, 'quote', e.target.value)}
                          placeholder="Their testimonial..."
                          rows={2}
                          data-testid={`input-testimonial-quote-${t.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>FAQ Section</CardTitle>
                    <CardDescription>Answer common questions</CardDescription>
                  </div>
                  <Switch
                    checked={settings.content?.faqEnabled ?? true}
                    onCheckedChange={checked => updateContent('faqEnabled', checked)}
                    data-testid="switch-faq-enabled"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Headline</Label>
                  <Input
                    value={settings.content?.faqHeadline ?? ''}
                    onChange={e => updateContent('faqHeadline', e.target.value)}
                    placeholder="Frequently asked questions"
                    data-testid="input-faq-headline"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>FAQ Items</Label>
                    <Button size="sm" variant="outline" onClick={addFAQItem} data-testid="button-add-faq">
                      <Plus className="h-4 w-4 mr-1" /> Add FAQ
                    </Button>
                  </div>
                  
                  {(settings.content?.faqItems ?? []).map((faq, index) => (
                    <div key={faq.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">FAQ {index + 1}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeFAQItem(faq.id)}
                          aria-label="Remove FAQ"
                          data-testid={`button-remove-faq-${faq.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Question</Label>
                          <Input
                            value={faq.question}
                            onChange={e => updateFAQItem(faq.id, 'question', e.target.value)}
                            placeholder="How do I...?"
                            data-testid={`input-faq-question-${faq.id}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Answer</Label>
                          <Textarea
                            value={faq.answer}
                            onChange={e => updateFAQItem(faq.id, 'answer', e.target.value)}
                            placeholder="The answer is..."
                            rows={2}
                            data-testid={`input-faq-answer-${faq.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Call to Action</CardTitle>
                    <CardDescription>Final prompt to get users to sign up</CardDescription>
                  </div>
                  <Switch
                    checked={settings.content?.ctaEnabled ?? true}
                    onCheckedChange={checked => updateContent('ctaEnabled', checked)}
                    data-testid="switch-cta-enabled"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={settings.content?.cta?.headline ?? ''}
                      onChange={e => updateCTA('headline', e.target.value)}
                      placeholder="Ready to get started?"
                      data-testid="input-cta-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={settings.content?.cta?.description ?? ''}
                      onChange={e => updateCTA('description', e.target.value)}
                      placeholder="Join thousands of satisfied customers"
                      data-testid="input-cta-description"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={settings.content?.cta?.buttonText ?? ''}
                      onChange={e => updateCTA('buttonText', e.target.value)}
                      placeholder="Start Free Trial"
                      data-testid="input-cta-button-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Link</Label>
                    <Input
                      value={settings.content?.cta?.buttonLink ?? ''}
                      onChange={e => updateCTA('buttonLink', e.target.value)}
                      placeholder="/signup"
                      data-testid="input-cta-button-link"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About Page</CardTitle>
                <CardDescription>
                  Configure the content for your About Us page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Hero Image"
                  value={settings.pages?.about?.heroImageUrl}
                  onChange={(url) => updateAbout('heroImageUrl', url)}
                  bucket="branding"
                  folder="heroes"
                  aspectRatio="21/9"
                  testId="about-hero-image"
                />
                <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.about?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                  <div className="space-y-2">
                    <Label className="text-xs">Horizontal: {settings.pages?.about?.heroImagePositionX ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.about?.heroImagePositionX ?? 50}
                      onChange={e => updateAbout('heroImagePositionX', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.about?.heroImageUrl}
                      data-testid="input-about-hero-position-x"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Vertical: {settings.pages?.about?.heroImagePositionY ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.about?.heroImagePositionY ?? 50}
                      onChange={e => updateAbout('heroImagePositionY', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.about?.heroImageUrl}
                      data-testid="input-about-hero-position-y"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={settings.pages?.about?.headline ?? ''}
                      onChange={e => updateAbout('headline', e.target.value)}
                      placeholder="About Us"
                      data-testid="input-about-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subheadline</Label>
                    <Input
                      value={settings.pages?.about?.subheadline ?? ''}
                      onChange={e => updateAbout('subheadline', e.target.value)}
                      placeholder="Learn more about our mission"
                      data-testid="input-about-subheadline"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Our Story</Label>
                  <Textarea
                    value={settings.pages?.about?.story ?? ''}
                    onChange={e => updateAbout('story', e.target.value)}
                    placeholder="Tell your company's story..."
                    rows={4}
                    data-testid="input-about-story"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Statement</Label>
                  <Textarea
                    value={settings.pages?.about?.mission ?? ''}
                    onChange={e => updateAbout('mission', e.target.value)}
                    placeholder="Your company's mission..."
                    rows={3}
                    data-testid="input-about-mission"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Values (one per line)</Label>
                  <Textarea
                    value={(settings.pages?.about?.values ?? []).join('\n')}
                    onChange={e => updateAbout('values', e.target.value.split('\n').filter(v => v.trim()))}
                    onBlur={e => updateAbout('values', e.target.value.split('\n').filter(v => v.trim()))}
                    placeholder="Innovation&#10;Customer Focus&#10;Integrity"
                    rows={4}
                    data-testid="input-about-values"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="font-medium">Show Team Section</p>
                    <p className="text-sm text-muted-foreground">Display team members on the About page</p>
                  </div>
                  <Switch
                    checked={settings.pages?.about?.showTeam ?? false}
                    onCheckedChange={checked => updateAbout('showTeam', checked)}
                    data-testid="switch-show-team"
                  />
                </div>
                {settings.pages?.about?.showTeam && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Team Members</Label>
                      <Button size="sm" variant="outline" onClick={addTeamMember} data-testid="button-add-team-member">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Member
                      </Button>
                    </div>
                    {(settings.pages?.about?.team ?? []).map(member => (
                      <div key={member.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{member.name || 'New Member'}</span>
                          <Button size="icon" variant="ghost" onClick={() => removeTeamMember(member.id)} data-testid={`button-remove-member-${member.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={member.name}
                              onChange={e => updateTeamMember(member.id, 'name', e.target.value)}
                              placeholder="John Doe"
                              data-testid={`input-member-name-${member.id}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Role</Label>
                            <Input
                              value={member.role}
                              onChange={e => updateTeamMember(member.id, 'role', e.target.value)}
                              placeholder="CEO"
                              data-testid={`input-member-role-${member.id}`}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Bio</Label>
                          <Textarea
                            value={member.bio}
                            onChange={e => updateTeamMember(member.id, 'bio', e.target.value)}
                            placeholder="Short bio..."
                            rows={2}
                            data-testid={`input-member-bio-${member.id}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <ImageUpload
                            label="Photo"
                            value={member.imageUrl}
                            onChange={(url) => updateTeamMember(member.id, 'imageUrl', url)}
                            bucket="branding"
                            folder="team"
                            aspectRatio="1/1"
                            testId={`member-photo-${member.id}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Page</CardTitle>
                <CardDescription>
                  Configure contact information and form settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Hero Image"
                  value={settings.pages?.contact?.heroImageUrl}
                  onChange={(url) => updateContact('heroImageUrl', url)}
                  bucket="branding"
                  folder="heroes"
                  aspectRatio="21/9"
                  testId="contact-hero-image"
                />
                <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.contact?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                  <div className="space-y-2">
                    <Label className="text-xs">Horizontal: {settings.pages?.contact?.heroImagePositionX ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.contact?.heroImagePositionX ?? 50}
                      onChange={e => updateContact('heroImagePositionX', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.contact?.heroImageUrl}
                      data-testid="input-contact-hero-position-x"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Vertical: {settings.pages?.contact?.heroImagePositionY ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.contact?.heroImagePositionY ?? 50}
                      onChange={e => updateContact('heroImagePositionY', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.contact?.heroImageUrl}
                      data-testid="input-contact-hero-position-y"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={settings.pages?.contact?.headline ?? ''}
                      onChange={e => updateContact('headline', e.target.value)}
                      placeholder="Contact Us"
                      data-testid="input-contact-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subheadline</Label>
                    <Input
                      value={settings.pages?.contact?.subheadline ?? ''}
                      onChange={e => updateContact('subheadline', e.target.value)}
                      placeholder="We'd love to hear from you"
                      data-testid="input-contact-subheadline"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={settings.pages?.contact?.email ?? ''}
                      onChange={e => updateContact('email', e.target.value)}
                      placeholder="support@example.com"
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={settings.pages?.contact?.phone ?? ''}
                      onChange={e => updateContact('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={settings.pages?.contact?.address ?? ''}
                    onChange={e => updateContact('address', e.target.value)}
                    placeholder="123 Main Street&#10;City, State 12345"
                    rows={2}
                    data-testid="input-contact-address"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="font-medium">Show Contact Form</p>
                    <p className="text-sm text-muted-foreground">Display a contact form for visitors</p>
                  </div>
                  <Switch
                    checked={settings.pages?.contact?.showContactForm ?? true}
                    onCheckedChange={checked => updateContact('showContactForm', checked)}
                    data-testid="switch-show-contact-form"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Form Success Message</Label>
                  <Input
                    value={settings.pages?.contact?.formSuccessMessage ?? ''}
                    onChange={e => updateContact('formSuccessMessage', e.target.value)}
                    placeholder="Thank you! We'll get back to you soon."
                    data-testid="input-contact-success-message"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms of Service</CardTitle>
                <CardDescription>
                  Edit your Terms of Service content (supports Markdown)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Last Updated Date</Label>
                  <Input
                    type="date"
                    value={settings.pages?.legal?.termsLastUpdated ?? ''}
                    onChange={e => updateLegal('termsLastUpdated', e.target.value)}
                    data-testid="input-terms-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms of Service Content (Markdown)</Label>
                  <Textarea
                    value={settings.pages?.legal?.termsOfService ?? ''}
                    onChange={e => updateLegal('termsOfService', e.target.value)}
                    placeholder="# Terms of Service&#10;&#10;## 1. Introduction..."
                    rows={12}
                    className="font-mono text-sm"
                    data-testid="input-terms-content"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>
                  Edit your Privacy Policy content (supports Markdown)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Last Updated Date</Label>
                  <Input
                    type="date"
                    value={settings.pages?.legal?.privacyLastUpdated ?? ''}
                    onChange={e => updateLegal('privacyLastUpdated', e.target.value)}
                    data-testid="input-privacy-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Privacy Policy Content (Markdown)</Label>
                  <Textarea
                    value={settings.pages?.legal?.privacyPolicy ?? ''}
                    onChange={e => updateLegal('privacyPolicy', e.target.value)}
                    placeholder="# Privacy Policy&#10;&#10;## 1. Information We Collect..."
                    rows={12}
                    className="font-mono text-sm"
                    data-testid="input-privacy-content"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Page</CardTitle>
                <CardDescription>
                  Configure the appearance of your pricing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Hero Image"
                  value={settings.pages?.pricing?.heroImageUrl}
                  onChange={(url) => updatePricingPage('heroImageUrl', url)}
                  bucket="branding"
                  folder="heroes"
                  aspectRatio="21/9"
                  testId="pricing-hero-image"
                />
                <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.pricing?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                  <div className="space-y-2">
                    <Label className="text-xs">Horizontal: {settings.pages?.pricing?.heroImagePositionX ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.pricing?.heroImagePositionX ?? 50}
                      onChange={e => updatePricingPage('heroImagePositionX', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.pricing?.heroImageUrl}
                      data-testid="input-pricing-hero-position-x"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Vertical: {settings.pages?.pricing?.heroImagePositionY ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.pricing?.heroImagePositionY ?? 50}
                      onChange={e => updatePricingPage('heroImagePositionY', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.pricing?.heroImageUrl}
                      data-testid="input-pricing-hero-position-y"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={settings.pages?.pricing?.headline ?? ''}
                      onChange={e => updatePricingPage('headline', e.target.value)}
                      placeholder="Simple, Transparent Pricing"
                      data-testid="input-pricing-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subheadline</Label>
                    <Input
                      value={settings.pages?.pricing?.subheadline ?? ''}
                      onChange={e => updatePricingPage('subheadline', e.target.value)}
                      placeholder="Choose the plan that works for you"
                      data-testid="input-pricing-subheadline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FAQ Page</CardTitle>
                <CardDescription>
                  Configure the appearance of your FAQ page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Hero Image"
                  value={settings.pages?.faq?.heroImageUrl}
                  onChange={(url) => updateFAQPage('heroImageUrl', url)}
                  bucket="branding"
                  folder="heroes"
                  aspectRatio="21/9"
                  testId="faq-hero-image"
                />
                <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.faq?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                  <div className="space-y-2">
                    <Label className="text-xs">Horizontal: {settings.pages?.faq?.heroImagePositionX ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.faq?.heroImagePositionX ?? 50}
                      onChange={e => updateFAQPage('heroImagePositionX', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.faq?.heroImageUrl}
                      data-testid="input-faq-hero-position-x"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Vertical: {settings.pages?.faq?.heroImagePositionY ?? 50}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.pages?.faq?.heroImagePositionY ?? 50}
                      onChange={e => updateFAQPage('heroImagePositionY', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      disabled={!settings.pages?.faq?.heroImageUrl}
                      data-testid="input-faq-hero-position-y"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={settings.pages?.faq?.headline ?? ''}
                      onChange={e => updateFAQPage('headline', e.target.value)}
                      placeholder="Frequently Asked Questions"
                      data-testid="input-faq-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subheadline</Label>
                    <Input
                      value={settings.pages?.faq?.subheadline ?? ''}
                      onChange={e => updateFAQPage('subheadline', e.target.value)}
                      placeholder="Find answers to common questions"
                      data-testid="input-faq-subheadline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Pages</CardTitle>
                <CardDescription>
                  Configure up to 4 additional marketing pages with custom names
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(settings.pages?.customPages ?? defaultSettings.pages.customPages).map((page, index) => (
                  <div key={page.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Page {index + 1}: {page.name || 'Untitled'}</span>
                      <Switch
                        checked={page.enabled}
                        onCheckedChange={checked => updateCustomPage(page.id, 'enabled', checked)}
                        data-testid={`switch-custom-page-${page.id}`}
                      />
                    </div>
                    {page.enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Page Name (appears in menu)</Label>
                            <Input
                              value={page.name}
                              onChange={e => updateCustomPage(page.id, 'name', e.target.value)}
                              placeholder="Features"
                              data-testid={`input-custom-page-name-${page.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">URL Slug</Label>
                            <Input
                              value={page.slug}
                              onChange={e => updateCustomPage(page.id, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              placeholder="features"
                              data-testid={`input-custom-page-slug-${page.id}`}
                            />
                          </div>
                        </div>
                        <ImageUpload
                          label="Hero Image"
                          value={page.heroImageUrl}
                          onChange={(url) => updateCustomPage(page.id, 'heroImageUrl', url)}
                          bucket="branding"
                          folder="heroes"
                          aspectRatio="21/9"
                          testId={`custom-page-hero-${page.id}`}
                        />
                        <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${page.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                          <div className="space-y-2">
                            <Label className="text-xs">Horizontal: {page.heroImagePositionX ?? 50}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={page.heroImagePositionX ?? 50}
                              onChange={e => updateCustomPage(page.id, 'heroImagePositionX', parseInt(e.target.value))}
                              className="w-full cursor-pointer"
                              disabled={!page.heroImageUrl}
                              data-testid={`input-custom-page-hero-position-x-${page.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Vertical: {page.heroImagePositionY ?? 50}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={page.heroImagePositionY ?? 50}
                              onChange={e => updateCustomPage(page.id, 'heroImagePositionY', parseInt(e.target.value))}
                              className="w-full cursor-pointer"
                              disabled={!page.heroImageUrl}
                              data-testid={`input-custom-page-hero-position-y-${page.id}`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Headline</Label>
                            <Input
                              value={page.headline}
                              onChange={e => updateCustomPage(page.id, 'headline', e.target.value)}
                              placeholder="Our Features"
                              data-testid={`input-custom-page-headline-${page.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Subheadline</Label>
                            <Input
                              value={page.subheadline}
                              onChange={e => updateCustomPage(page.id, 'subheadline', e.target.value)}
                              placeholder="Discover what makes us different"
                              data-testid={`input-custom-page-subheadline-${page.id}`}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Free Tier Configuration</CardTitle>
                <CardDescription>
                  Configure your free plan that appears on the pricing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Show Free Plan</p>
                    <p className="text-sm text-muted-foreground">Display a free tier on the pricing page</p>
                  </div>
                  <Switch
                    checked={settings.pricing?.showFreePlan ?? true}
                    onCheckedChange={checked => updatePricing('showFreePlan', checked)}
                    data-testid="switch-show-free-plan"
                  />
                </div>

                {(settings.pricing?.showFreePlan ?? true) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="freePlanName">Plan Name</Label>
                        <Input
                          id="freePlanName"
                          value={settings.pricing?.freePlanName ?? 'Free'}
                          onChange={e => updatePricing('freePlanName', e.target.value)}
                          placeholder="Free"
                          data-testid="input-free-plan-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="freePlanDescription">Description</Label>
                        <Input
                          id="freePlanDescription"
                          value={settings.pricing?.freePlanDescription ?? ''}
                          onChange={e => updatePricing('freePlanDescription', e.target.value)}
                          placeholder="Perfect for getting started"
                          data-testid="input-free-plan-description"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Features (one per line)</Label>
                      <Textarea
                        value={(settings.pricing?.freePlanFeatures ?? []).join('\n')}
                        onChange={e => updatePricing('freePlanFeatures', e.target.value.split('\n'))}
                        onBlur={e => updatePricing('freePlanFeatures', e.target.value.split('\n').filter(f => f.trim()))}
                        placeholder="Basic features&#10;Up to 100 items&#10;Community support"
                        rows={4}
                        data-testid="textarea-free-plan-features"
                      />
                      <p className="text-xs text-muted-foreground">Enter each feature on a new line</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paid Pricing Plans</CardTitle>
                <CardDescription>
                  Manage your subscription tiers in Stripe Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-muted/50 text-center space-y-4">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Paid plans are managed in Stripe</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      To keep invoices, emails, and your pricing page consistent, 
                      paid plans are managed directly in Stripe. Changes you make there 
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
          </div>
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
