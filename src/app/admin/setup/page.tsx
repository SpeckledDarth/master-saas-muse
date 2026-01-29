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
import type { FeatureCard, Testimonial, FAQItem, CTAContent, TeamMember, NavItem } from '@/types/settings'
import { ImageUpload } from '@/components/admin/image-upload'

function MiniSaveButton({ saving, saved, onClick, testId }: { saving: boolean; saved: boolean; onClick: () => void; testId: string }) {
  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={onClick} 
      disabled={saving}
      data-testid={testId}
    >
      {saving ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : saved ? (
        <Check className="h-3 w-3" />
      ) : (
        <Save className="h-3 w-3" />
      )}
    </Button>
  )
}

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

  function updateNavigation(items: NavItem[]) {
    setSettings(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        items,
      }
    }))
  }

  function addNavItem() {
    const newItem: NavItem = {
      id: `nav-${Date.now()}`,
      label: 'New Link',
      href: '/',
      enabled: true,
    }
    const currentItems = settings.navigation?.items ?? []
    updateNavigation([...currentItems, newItem])
  }

  function updateNavItem(id: string, field: keyof NavItem, value: string | boolean | null) {
    const currentItems = settings.navigation?.items ?? []
    updateNavigation(
      currentItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  function removeNavItem(id: string) {
    const currentItems = settings.navigation?.items ?? []
    updateNavigation(currentItems.filter(item => item.id !== id))
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
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mb-6">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-300">Branding & Hero Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
              <p><strong>Hero Styles:</strong> Choose from 5 styles - Full Width Background (default), Split Layout, Video Background, Pattern/Texture, or Floating Mockup.</p>
              <p><strong>Animated Words:</strong> Add 2+ comma-separated words (e.g., "fast, secure, reliable") to create a cycling animation after your app name. Click outside the field to save.</p>
              <p><strong>Video Hero:</strong> Paste a YouTube embed URL, Vimeo URL, or direct .mp4 link. The video replaces the static image and plays automatically (muted, looping).</p>
              <p><strong>Announcement Bar:</strong> Scroll down to enable a top banner for promotions, product launches, or important updates.</p>
            </CardContent>
          </Card>

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

              <div className="space-y-2">
                <Label>Hero Layout Style</Label>
                <Select
                  value={settings.content?.heroStyle ?? 'fullWidth'}
                  onValueChange={value => updateContent('heroStyle', value as 'fullWidth' | 'split' | 'video' | 'pattern' | 'floating')}
                >
                  <SelectTrigger data-testid="select-hero-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fullWidth">Full Width Background Image</SelectItem>
                    <SelectItem value="split">Split Layout (Image + Text Side by Side)</SelectItem>
                    <SelectItem value="video">Video Background</SelectItem>
                    <SelectItem value="pattern">Pattern/Texture Overlay</SelectItem>
                    <SelectItem value="floating">Gradient + Floating Mockup</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose how the hero section is displayed</p>
              </div>

              <div className="space-y-2">
                <Label>Hero Animated Words (optional)</Label>
                <Input
                  defaultValue={(settings.content?.heroAnimatedWords || []).join(', ')}
                  onBlur={e => {
                    const words = e.target.value.split(',').map(w => w.trim()).filter(w => w)
                    updateContent('heroAnimatedWords', words)
                  }}
                  placeholder="innovative, powerful, seamless"
                  data-testid="input-hero-animated-words"
                />
                <p className="text-xs text-muted-foreground">
                  Enter 2 or more comma-separated words to create cycling animation (e.g., "fast, secure, reliable"). 
                  With only 1 word, it displays as static text. Click outside the field to save.
                </p>
              </div>

              {settings.content?.heroStyle === 'split' && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium">Split Hero Settings</p>
                  <div className="space-y-2">
                    <Label>Split Hero Image</Label>
                    <Input
                      value={settings.content?.splitHeroImageUrl ?? ''}
                      onChange={e => updateContent('splitHeroImageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-split-hero-image-url"
                    />
                    <p className="text-xs text-muted-foreground">URL for the image in split hero layout</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Image Position</Label>
                    <Select
                      value={settings.content?.splitHeroImagePosition ?? 'right'}
                      onValueChange={value => updateContent('splitHeroImagePosition', value as 'left' | 'right')}
                    >
                      <SelectTrigger data-testid="select-split-hero-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Image on Right</SelectItem>
                        <SelectItem value="left">Image on Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Background Style</Label>
                    <Select
                      value={settings.content?.splitHeroBackground ?? 'transparent'}
                      onValueChange={value => updateContent('splitHeroBackground', value as 'transparent' | 'muted' | 'gradient' | 'accent')}
                    >
                      <SelectTrigger data-testid="select-split-hero-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transparent">Transparent (inherits page background)</SelectItem>
                        <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                        <SelectItem value="gradient">Gradient (primary to accent)</SelectItem>
                        <SelectItem value="accent">Accent (subtle accent color)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose a background to make the hero section stand out</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Spacing Between Text and Image: {settings.content?.splitHeroGap ?? 12}</Label>
                    <Input
                      type="range"
                      min="0"
                      max="24"
                      value={settings.content?.splitHeroGap ?? 12}
                      onChange={e => updateContent('splitHeroGap', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      data-testid="input-split-hero-gap"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust the gap between text and image (0 = tight, 24 = very spaced out)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Image Height: {settings.content?.splitHeroImageHeight ?? 400}px</Label>
                    <Input
                      type="range"
                      min="200"
                      max="700"
                      step="25"
                      value={settings.content?.splitHeroImageHeight ?? 400}
                      onChange={e => updateContent('splitHeroImageHeight', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      data-testid="input-split-hero-image-height"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust the image height (200px = small, 700px = large)
                    </p>
                  </div>
                </div>
              )}

              {settings.content?.heroStyle === 'video' && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium">Video Hero Settings</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    The video replaces the static hero image and plays automatically in the background (muted, looping).
                  </p>
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                      value={settings.branding?.heroVideoUrl ?? ''}
                      onChange={e => updateBranding('heroVideoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                      data-testid="input-hero-video-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      <strong>YouTube:</strong> Use embed URL format: https://www.youtube.com/embed/VIDEO_ID<br/>
                      <strong>Vimeo:</strong> Use player URL: https://player.vimeo.com/video/VIDEO_ID<br/>
                      <strong>Direct file:</strong> Paste a direct .mp4 or .webm URL from any hosting service
                    </p>
                  </div>
                </div>
              )}

              {settings.content?.heroStyle === 'pattern' && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium">Pattern/Texture Settings</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload a seamless pattern or texture that tiles over the gradient background. PNG with transparency works best.
                  </p>
                  <ImageUpload
                    label="Pattern Image"
                    value={settings.branding?.heroPatternUrl ?? null}
                    onChange={url => updateBranding('heroPatternUrl', url)}
                    folder="patterns"
                    aspectRatio="1/1"
                    testId="pattern-upload"
                  />
                  <div className="space-y-2">
                    <Label>Pattern Opacity: {settings.branding?.heroPatternOpacity ?? 20}%</Label>
                    <Input
                      type="range"
                      min="5"
                      max="50"
                      value={settings.branding?.heroPatternOpacity ?? 20}
                      onChange={e => updateBranding('heroPatternOpacity', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      data-testid="input-hero-pattern-opacity"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values create a subtle texture, higher values make the pattern more visible.
                    </p>
                  </div>
                </div>
              )}

              {settings.content?.heroStyle === 'floating' && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium">Floating Mockup Settings</p>
                  <div className="space-y-2">
                    <Label>Product/Mockup Image URL</Label>
                    <Input
                      value={settings.branding?.heroFloatingImageUrl ?? ''}
                      onChange={e => updateBranding('heroFloatingImageUrl', e.target.value)}
                      placeholder="https://example.com/product-mockup.png"
                      data-testid="input-hero-floating-image-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG with transparent background works best for the floating effect
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Spacing Between Text and Image: {settings.content?.floatingHeroGap ?? 8}</Label>
                    <Input
                      type="range"
                      min="0"
                      max="24"
                      value={settings.content?.floatingHeroGap ?? 8}
                      onChange={e => updateContent('floatingHeroGap', parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      data-testid="input-floating-hero-gap"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust the gap between the text content and the floating image (0 = tight, 24 = very spaced out)
                    </p>
                  </div>
                </div>
              )}

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

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Announcement Bar</CardTitle>
                  <CardDescription>
                    Display a top banner for promotions or announcements
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-announcement" />
                  <Switch
                    checked={settings.announcement?.enabled ?? false}
                    onCheckedChange={checked => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, enabled: checked }
                    }))}
                    data-testid="switch-announcement-enabled"
                  />
                </div>
              </div>
            </CardHeader>
            {settings.announcement?.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Announcement Text</Label>
                  <Input
                    value={settings.announcement?.text ?? ''}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, text: e.target.value }
                    }))}
                    placeholder="Introducing our new feature!"
                    data-testid="input-announcement-text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Link Text (optional)</Label>
                    <Input
                      value={settings.announcement?.linkText ?? ''}
                      onChange={e => setSettings(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement!, linkText: e.target.value }
                      }))}
                      placeholder="Learn more"
                      data-testid="input-announcement-link-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link URL (optional)</Label>
                    <Input
                      value={settings.announcement?.linkUrl ?? ''}
                      onChange={e => setSettings(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement!, linkUrl: e.target.value }
                      }))}
                      placeholder="/features"
                      data-testid="input-announcement-link-url"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.announcement?.backgroundColor ?? '#7c3aed'}
                        onChange={e => setSettings(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement!, backgroundColor: e.target.value }
                        }))}
                        className="w-12 h-9 p-1"
                        data-testid="input-announcement-bg-color"
                      />
                      <Input
                        value={settings.announcement?.backgroundColor ?? '#7c3aed'}
                        onChange={e => setSettings(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement!, backgroundColor: e.target.value }
                        }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.announcement?.textColor ?? '#ffffff'}
                        onChange={e => setSettings(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement!, textColor: e.target.value }
                        }))}
                        className="w-12 h-9 p-1"
                        data-testid="input-announcement-text-color"
                      />
                      <Input
                        value={settings.announcement?.textColor ?? '#ffffff'}
                        onChange={e => setSettings(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement!, textColor: e.target.value }
                        }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.announcement?.dismissible ?? true}
                    onCheckedChange={checked => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, dismissible: checked }
                    }))}
                    data-testid="switch-announcement-dismissible"
                  />
                  <Label>Allow users to dismiss</Label>
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Navigation Menu</CardTitle>
                  <CardDescription>
                    Configure which links appear in the top navigation bar of your website
                  </CardDescription>
                </div>
                <Button onClick={addNavItem} size="sm" data-testid="button-add-nav-item">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>How it works:</strong> Each link you add here will appear in the header navigation bar. 
                  Use the toggle to show/hide links. Add badges like "New" or "Beta" to highlight new features. 
                  Common links include: Pricing, About, Contact, Blog, Features.
                </p>
              </div>
              <div className="space-y-3">
                {(settings.navigation?.items ?? []).map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={checked => updateNavItem(item.id, 'enabled', checked)}
                        data-testid={`switch-nav-${index}`}
                      />
                    </div>
                    <Input
                      value={item.label}
                      onChange={e => updateNavItem(item.id, 'label', e.target.value)}
                      placeholder="Link Label"
                      className="flex-1"
                      data-testid={`input-nav-label-${index}`}
                    />
                    <Input
                      value={item.href}
                      onChange={e => updateNavItem(item.id, 'href', e.target.value)}
                      placeholder="/path"
                      className="flex-1"
                      data-testid={`input-nav-href-${index}`}
                    />
                    <Select
                      value={item.badge || 'none'}
                      onValueChange={value => updateNavItem(item.id, 'badge', value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="w-28" data-testid={`select-nav-badge-${index}`}>
                        <SelectValue placeholder="Badge" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Badge</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="beta">Beta</SelectItem>
                        <SelectItem value="coming-soon">Soon</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeNavItem(item.id)}
                      data-testid={`button-remove-nav-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(settings.navigation?.items ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No navigation links configured. Click "Add Link" to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-6">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              data-testid="button-save-branding"
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
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300">Quick Tips for Homepage Sections</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                <p><strong>Enable/Disable:</strong> Use the toggle switch on each section card to show or hide it on your homepage.</p>
                <p><strong>Section Order:</strong> Sections appear on the homepage in this order: Hero → Logo Marquee → Metrics → Features → Testimonials → Process Steps → Customer Stories → Image+Text Blocks → FAQ → CTA.</p>
                <p><strong>Backgrounds:</strong> Scroll down to "Section Backgrounds" to customize each section's look (transparent, muted, gradient, or mesh).</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Features Section</CardTitle>
                    <CardDescription>Highlight what makes your product special</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-features" />
                    <Switch
                      checked={settings.content?.featuresEnabled ?? true}
                      onCheckedChange={checked => updateContent('featuresEnabled', checked)}
                      data-testid="switch-features-enabled"
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-testimonials" />
                    <Switch
                      checked={settings.content?.testimonialsEnabled ?? true}
                      onCheckedChange={checked => updateContent('testimonialsEnabled', checked)}
                      data-testid="switch-testimonials-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Headline</Label>
                    <Input
                      value={settings.content?.testimonialsHeadline ?? ''}
                      onChange={e => updateContent('testimonialsHeadline', e.target.value)}
                      placeholder="What our customers say"
                      data-testid="input-testimonials-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Style</Label>
                    <Select
                      value={settings.content?.testimonialStyle ?? 'cards'}
                      onValueChange={value => updateContent('testimonialStyle', value as 'cards' | 'carousel')}
                    >
                      <SelectTrigger data-testid="select-testimonial-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cards">Grid Cards</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-faq" />
                    <Switch
                      checked={settings.content?.faqEnabled ?? true}
                      onCheckedChange={checked => updateContent('faqEnabled', checked)}
                      data-testid="switch-faq-enabled"
                    />
                  </div>
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

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trusted By / Logo Marquee</CardTitle>
                    <CardDescription>Show scrolling logos of companies that trust you</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-logo-marquee" />
                    <Switch
                      checked={settings.content?.trustedByEnabled ?? false}
                      onCheckedChange={checked => updateContent('trustedByEnabled', checked)}
                      data-testid="switch-trusted-by-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Headline</Label>
                  <Input
                    value={settings.content?.trustedByHeadline ?? ''}
                    onChange={e => updateContent('trustedByHeadline', e.target.value)}
                    placeholder="Trusted by industry leaders"
                    data-testid="input-trusted-by-headline"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Trusted Logos</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const logos = settings.content?.trustedLogos || []
                        updateContent('trustedLogos', [
                          ...logos,
                          { id: `logo-${Date.now()}`, name: 'New Company', imageUrl: '' }
                        ])
                      }}
                      data-testid="button-add-logo"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Logo
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(settings.content?.trustedLogos || []).map((logo, index) => (
                      <div key={logo.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Logo {index + 1}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const logos = (settings.content?.trustedLogos || []).filter((_, i) => i !== index)
                              updateContent('trustedLogos', logos)
                            }}
                            data-testid={`button-delete-logo-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          value={logo.name}
                          onChange={e => {
                            const logos = [...(settings.content?.trustedLogos || [])]
                            logos[index] = { ...logos[index], name: e.target.value }
                            updateContent('trustedLogos', logos)
                          }}
                          placeholder="Company name"
                          data-testid={`input-logo-name-${index}`}
                        />
                        <ImageUpload
                          label="Logo Image"
                          value={logo.imageUrl || null}
                          onChange={url => {
                            const logos = [...(settings.content?.trustedLogos || [])]
                            logos[index] = { ...logos[index], imageUrl: url || undefined }
                            updateContent('trustedLogos', logos)
                          }}
                          bucket="branding"
                          folder="logos"
                          aspectRatio="3/1"
                          testId={`logo-image-${index}`}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Horizontal Position: {logo.imagePositionX ?? 50}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={logo.imagePositionX ?? 50}
                              onChange={e => {
                                const logos = [...(settings.content?.trustedLogos || [])]
                                logos[index] = { ...logos[index], imagePositionX: parseInt(e.target.value) }
                                updateContent('trustedLogos', logos)
                              }}
                              className="cursor-pointer"
                              data-testid={`input-logo-positionx-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Vertical Position: {logo.imagePositionY ?? 50}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={logo.imagePositionY ?? 50}
                              onChange={e => {
                                const logos = [...(settings.content?.trustedLogos || [])]
                                logos[index] = { ...logos[index], imagePositionY: parseInt(e.target.value) }
                                updateContent('trustedLogos', logos)
                              }}
                              className="cursor-pointer"
                              data-testid={`input-logo-positiony-${index}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(settings.content?.trustedLogos?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No logos added yet. Click "Add Logo" to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Metrics / Counters</CardTitle>
                    <CardDescription>Show animated metric counters (e.g., "10,000+ Customers")</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-metrics" />
                    <Switch
                      checked={settings.content?.metricsEnabled ?? false}
                      onCheckedChange={checked => updateContent('metricsEnabled', checked)}
                      data-testid="switch-metrics-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Headline (optional)</Label>
                  <Input
                    value={settings.content?.metricsHeadline ?? ''}
                    onChange={e => updateContent('metricsHeadline', e.target.value)}
                    placeholder="Results that speak for themselves"
                    data-testid="input-metrics-headline"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Metrics</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const metrics = settings.content?.metrics || []
                        updateContent('metrics', [
                          ...metrics,
                          { id: `metric-${Date.now()}`, value: 100, suffix: '+', label: 'New Metric' }
                        ])
                      }}
                      data-testid="button-add-metric"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Metric
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {(settings.content?.metrics || []).map((metric, index) => (
                      <div key={metric.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Metric {index + 1}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const metrics = (settings.content?.metrics || []).filter((_, i) => i !== index)
                              updateContent('metrics', metrics)
                            }}
                            data-testid={`button-delete-metric-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            value={metric.prefix || ''}
                            onChange={e => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], prefix: e.target.value }
                              updateContent('metrics', metrics)
                            }}
                            placeholder="Prefix ($)"
                            className="text-center"
                            data-testid={`input-metric-prefix-${index}`}
                          />
                          <Input
                            type="number"
                            value={metric.value}
                            onChange={e => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], value: parseInt(e.target.value) || 0 }
                              updateContent('metrics', metrics)
                            }}
                            placeholder="Value"
                            data-testid={`input-metric-value-${index}`}
                          />
                          <Input
                            value={metric.suffix || ''}
                            onChange={e => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], suffix: e.target.value }
                              updateContent('metrics', metrics)
                            }}
                            placeholder="Suffix (+, %, K)"
                            className="text-center"
                            data-testid={`input-metric-suffix-${index}`}
                          />
                          <Input
                            value={metric.label}
                            onChange={e => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], label: e.target.value }
                              updateContent('metrics', metrics)
                            }}
                            placeholder="Label"
                            data-testid={`input-metric-label-${index}`}
                          />
                        </div>
                        <div className="pt-2 border-t">
                          <ImageUpload
                            label="Icon Image (optional)"
                            value={metric.iconUrl || null}
                            onChange={url => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], iconUrl: url || undefined }
                              updateContent('metrics', metrics)
                            }}
                            bucket="branding"
                            folder="icons"
                            aspectRatio="1/1"
                            testId={`metric-icon-${index}`}
                          />
                          {metric.iconUrl && (
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Horizontal: {metric.iconPositionX ?? 50}%</Label>
                                <Input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={metric.iconPositionX ?? 50}
                                  onChange={e => {
                                    const metrics = [...(settings.content?.metrics || [])]
                                    metrics[index] = { ...metrics[index], iconPositionX: parseInt(e.target.value) }
                                    updateContent('metrics', metrics)
                                  }}
                                  className="cursor-pointer"
                                  data-testid={`input-metric-iconx-${index}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Vertical: {metric.iconPositionY ?? 50}%</Label>
                                <Input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={metric.iconPositionY ?? 50}
                                  onChange={e => {
                                    const metrics = [...(settings.content?.metrics || [])]
                                    metrics[index] = { ...metrics[index], iconPositionY: parseInt(e.target.value) }
                                    updateContent('metrics', metrics)
                                  }}
                                  className="cursor-pointer"
                                  data-testid={`input-metric-icony-${index}`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(settings.content?.metrics?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No metrics added yet. Click "Add Metric" to get started.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Example: Prefix "$", Value "10", Suffix "M+", Label "Revenue" → displays as "$10M+ Revenue"
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>How It Works / Process Steps</CardTitle>
                    <CardDescription>Show step-by-step process visualization</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-process" />
                    <Switch
                      checked={settings.content?.processEnabled ?? false}
                      onCheckedChange={checked => updateContent('processEnabled', checked)}
                      data-testid="switch-process-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Headline</Label>
                    <Input
                      value={settings.content?.processHeadline ?? ''}
                      onChange={e => updateContent('processHeadline', e.target.value)}
                      placeholder="How it works"
                      data-testid="input-process-headline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Subheadline</Label>
                    <Input
                      value={settings.content?.processSubheadline ?? ''}
                      onChange={e => updateContent('processSubheadline', e.target.value)}
                      placeholder="Get started in just a few simple steps"
                      data-testid="input-process-subheadline"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Process Steps</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const steps = settings.content?.processSteps || []
                        updateContent('processSteps', [
                          ...steps,
                          { id: `step-${Date.now()}`, number: steps.length + 1, title: 'New Step', description: 'Step description' }
                        ])
                      }}
                      data-testid="button-add-step"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Step
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(settings.content?.processSteps || []).map((step, index) => (
                      <div key={step.id} className="flex gap-3 items-start p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                          {step.number}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            <Input
                              type="number"
                              value={step.number}
                              onChange={e => {
                                const steps = [...(settings.content?.processSteps || [])]
                                steps[index] = { ...steps[index], number: parseInt(e.target.value) || 1 }
                                updateContent('processSteps', steps)
                              }}
                              placeholder="#"
                              className="w-16"
                              data-testid={`input-step-number-${index}`}
                            />
                            <Input
                              value={step.title}
                              onChange={e => {
                                const steps = [...(settings.content?.processSteps || [])]
                                steps[index] = { ...steps[index], title: e.target.value }
                                updateContent('processSteps', steps)
                              }}
                              placeholder="Step title"
                              className="col-span-3"
                              data-testid={`input-step-title-${index}`}
                            />
                          </div>
                          <Input
                            value={step.description}
                            onChange={e => {
                              const steps = [...(settings.content?.processSteps || [])]
                              steps[index] = { ...steps[index], description: e.target.value }
                              updateContent('processSteps', steps)
                            }}
                            placeholder="Step description"
                            data-testid={`input-step-description-${index}`}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const steps = (settings.content?.processSteps || []).filter((_, i) => i !== index)
                            updateContent('processSteps', steps)
                          }}
                          data-testid={`button-delete-step-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {(settings.content?.processSteps?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No steps added yet. Click "Add Step" to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Image + Text Blocks</CardTitle>
                    <CardDescription>Alternating image and text sections (like GitBook/TheWone)</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-image-text" />
                    <Switch
                      checked={settings.content?.imageTextEnabled ?? false}
                      onCheckedChange={checked => updateContent('imageTextEnabled', checked)}
                      data-testid="switch-image-text-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Content Blocks</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const blocks = settings.content?.imageTextBlocks || []
                        updateContent('imageTextBlocks', [
                          ...blocks,
                          { 
                            id: `block-${Date.now()}`, 
                            headline: 'New Section', 
                            description: 'Add your description here', 
                            imageUrl: '', 
                            imagePosition: blocks.length % 2 === 0 ? 'left' : 'right'
                          }
                        ])
                      }}
                      data-testid="button-add-image-text-block"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Block
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {(settings.content?.imageTextBlocks || []).map((block, index) => (
                      <div key={block.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Block {index + 1}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const blocks = (settings.content?.imageTextBlocks || []).filter((_, i) => i !== index)
                              updateContent('imageTextBlocks', blocks)
                            }}
                            data-testid={`button-delete-image-text-block-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Headline</Label>
                            <Input
                              value={block.headline}
                              onChange={e => {
                                const blocks = [...(settings.content?.imageTextBlocks || [])]
                                blocks[index] = { ...blocks[index], headline: e.target.value }
                                updateContent('imageTextBlocks', blocks)
                              }}
                              placeholder="Section headline"
                              data-testid={`input-block-headline-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Image Position</Label>
                            <Select
                              value={block.imagePosition}
                              onValueChange={value => {
                                const blocks = [...(settings.content?.imageTextBlocks || [])]
                                blocks[index] = { ...blocks[index], imagePosition: value as 'left' | 'right' }
                                updateContent('imageTextBlocks', blocks)
                              }}
                            >
                              <SelectTrigger data-testid={`select-block-position-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Image on Left</SelectItem>
                                <SelectItem value="right">Image on Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={block.description}
                            onChange={e => {
                              const blocks = [...(settings.content?.imageTextBlocks || [])]
                              blocks[index] = { ...blocks[index], description: e.target.value }
                              updateContent('imageTextBlocks', blocks)
                            }}
                            placeholder="Section description"
                            rows={2}
                            data-testid={`input-block-description-${index}`}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <ImageUpload
                            label="Section Image"
                            value={block.imageUrl || null}
                            onChange={url => {
                              const blocks = [...(settings.content?.imageTextBlocks || [])]
                              blocks[index] = { ...blocks[index], imageUrl: url || '' }
                              updateContent('imageTextBlocks', blocks)
                            }}
                            bucket="branding"
                            folder="content"
                            aspectRatio="4/3"
                            testId={`block-image-${index}`}
                          />
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="space-y-2">
                              <Label className="text-xs">Horizontal: {block.imagePositionX ?? 50}%</Label>
                              <Input
                                type="range"
                                min="0"
                                max="100"
                                value={block.imagePositionX ?? 50}
                                onChange={e => {
                                  const blocks = [...(settings.content?.imageTextBlocks || [])]
                                  blocks[index] = { ...blocks[index], imagePositionX: parseInt(e.target.value) }
                                  updateContent('imageTextBlocks', blocks)
                                }}
                                className="cursor-pointer"
                                data-testid={`input-block-positionx-${index}`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Vertical: {block.imagePositionY ?? 50}%</Label>
                              <Input
                                type="range"
                                min="0"
                                max="100"
                                value={block.imagePositionY ?? 50}
                                onChange={e => {
                                  const blocks = [...(settings.content?.imageTextBlocks || [])]
                                  blocks[index] = { ...blocks[index], imagePositionY: parseInt(e.target.value) }
                                  updateContent('imageTextBlocks', blocks)
                                }}
                                className="cursor-pointer"
                                data-testid={`input-block-positiony-${index}`}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Button Text (optional)</Label>
                            <Input
                              value={block.buttonText || ''}
                              onChange={e => {
                                const blocks = [...(settings.content?.imageTextBlocks || [])]
                                blocks[index] = { ...blocks[index], buttonText: e.target.value }
                                updateContent('imageTextBlocks', blocks)
                              }}
                              placeholder="Learn More"
                              data-testid={`input-block-button-text-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Button Link (optional)</Label>
                            <Input
                              value={block.buttonLink || ''}
                              onChange={e => {
                                const blocks = [...(settings.content?.imageTextBlocks || [])]
                                blocks[index] = { ...blocks[index], buttonLink: e.target.value }
                                updateContent('imageTextBlocks', blocks)
                              }}
                              placeholder="/features"
                              data-testid={`input-block-button-link-${index}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(settings.content?.imageTextBlocks?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No blocks added yet. Click "Add Block" to create alternating image/text sections.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Stories</CardTitle>
                    <CardDescription>Showcase customer success stories with photos and quotes</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-customer-stories" />
                    <Switch
                      checked={settings.content?.customerStoriesEnabled ?? false}
                      onCheckedChange={checked => updateContent('customerStoriesEnabled', checked)}
                      data-testid="switch-customer-stories-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              {(settings.content?.customerStoriesEnabled ?? false) && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Headline</Label>
                    <Input
                      value={settings.content?.customerStoriesHeadline ?? ''}
                      onChange={e => updateContent('customerStoriesHeadline', e.target.value)}
                      placeholder="Customer Stories"
                      data-testid="input-customer-stories-headline"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Stories</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories.push({
                          id: `story-${Date.now()}`,
                          companyName: '',
                          companyLogoUrl: '',
                          personName: '',
                          personRole: '',
                          personPhotoUrl: '',
                          quote: '',
                          storyUrl: '',
                          backgroundImageUrl: '',
                        })
                        updateContent('customerStories', stories)
                      }}
                      data-testid="button-add-customer-story"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Story
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(settings.content?.customerStories || []).map((story, index) => (
                      <div key={story.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Story {index + 1}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const stories = (settings.content?.customerStories || []).filter((_, i) => i !== index)
                              updateContent('customerStories', stories)
                            }}
                            data-testid={`button-delete-story-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Company Name</Label>
                            <Input
                              value={story.companyName}
                              onChange={e => {
                                const stories = [...(settings.content?.customerStories || [])]
                                stories[index] = { ...stories[index], companyName: e.target.value }
                                updateContent('customerStories', stories)
                              }}
                              placeholder="Acme Inc"
                              data-testid={`input-story-company-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Company Logo URL</Label>
                            <Input
                              value={story.companyLogoUrl || ''}
                              onChange={e => {
                                const stories = [...(settings.content?.customerStories || [])]
                                stories[index] = { ...stories[index], companyLogoUrl: e.target.value }
                                updateContent('customerStories', stories)
                              }}
                              placeholder="https://..."
                              data-testid={`input-story-logo-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Person Name</Label>
                            <Input
                              value={story.personName || ''}
                              onChange={e => {
                                const stories = [...(settings.content?.customerStories || [])]
                                stories[index] = { ...stories[index], personName: e.target.value }
                                updateContent('customerStories', stories)
                              }}
                              placeholder="John Doe"
                              data-testid={`input-story-person-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Person Role</Label>
                            <Input
                              value={story.personRole || ''}
                              onChange={e => {
                                const stories = [...(settings.content?.customerStories || [])]
                                stories[index] = { ...stories[index], personRole: e.target.value }
                                updateContent('customerStories', stories)
                              }}
                              placeholder="CTO, Acme Inc"
                              data-testid={`input-story-role-${index}`}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Quote</Label>
                          <Textarea
                            value={story.quote || ''}
                            onChange={e => {
                              const stories = [...(settings.content?.customerStories || [])]
                              stories[index] = { ...stories[index], quote: e.target.value }
                              updateContent('customerStories', stories)
                            }}
                            placeholder="This product changed everything..."
                            rows={2}
                            data-testid={`input-story-quote-${index}`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Person Photo URL</Label>
                            <Input
                              value={story.personPhotoUrl || ''}
                              onChange={e => {
                                const stories = [...(settings.content?.customerStories || [])]
                                stories[index] = { ...stories[index], personPhotoUrl: e.target.value }
                                updateContent('customerStories', stories)
                              }}
                              placeholder="https://..."
                              data-testid={`input-story-photo-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Background Image URL</Label>
                            <Input
                              value={story.backgroundImageUrl || ''}
                              onChange={e => {
                                const stories = [...(settings.content?.customerStories || [])]
                                stories[index] = { ...stories[index], backgroundImageUrl: e.target.value }
                                updateContent('customerStories', stories)
                              }}
                              placeholder="https://..."
                              data-testid={`input-story-bg-${index}`}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Story Link (optional)</Label>
                          <Input
                            value={story.storyUrl || ''}
                            onChange={e => {
                              const stories = [...(settings.content?.customerStories || [])]
                              stories[index] = { ...stories[index], storyUrl: e.target.value }
                              updateContent('customerStories', stories)
                            }}
                            placeholder="/customers/acme"
                            data-testid={`input-story-url-${index}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Section Backgrounds</CardTitle>
                    <CardDescription>Customize background styles for each section</CardDescription>
                  </div>
                  <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-backgrounds" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Features Section</Label>
                    <Select
                      value={settings.content?.sectionBackgrounds?.features ?? 'muted'}
                      onValueChange={value => {
                        const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                        sectionBackgrounds.features = value as 'default' | 'muted' | 'gradient'
                        updateContent('sectionBackgrounds', sectionBackgrounds)
                      }}
                    >
                      <SelectTrigger data-testid="select-bg-features">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (transparent)</SelectItem>
                        <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                        <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                        <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Testimonials Section</Label>
                    <Select
                      value={settings.content?.sectionBackgrounds?.testimonials ?? 'default'}
                      onValueChange={value => {
                        const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                        sectionBackgrounds.testimonials = value as 'default' | 'muted' | 'gradient' | 'mesh'
                        updateContent('sectionBackgrounds', sectionBackgrounds)
                      }}
                    >
                      <SelectTrigger data-testid="select-bg-testimonials">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (transparent)</SelectItem>
                        <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                        <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                        <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>FAQ Section</Label>
                    <Select
                      value={settings.content?.sectionBackgrounds?.faq ?? 'muted'}
                      onValueChange={value => {
                        const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                        sectionBackgrounds.faq = value as 'default' | 'muted' | 'gradient' | 'mesh'
                        updateContent('sectionBackgrounds', sectionBackgrounds)
                      }}
                    >
                      <SelectTrigger data-testid="select-bg-faq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (transparent)</SelectItem>
                        <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                        <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                        <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Section</Label>
                    <Select
                      value={settings.content?.sectionBackgrounds?.cta ?? 'default'}
                      onValueChange={value => {
                        const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                        sectionBackgrounds.cta = value as 'default' | 'muted' | 'gradient' | 'mesh'
                        updateContent('sectionBackgrounds', sectionBackgrounds)
                      }}
                    >
                      <SelectTrigger data-testid="select-bg-cta">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (transparent)</SelectItem>
                        <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                        <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                        <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Stories Section</Label>
                    <Select
                      value={settings.content?.sectionBackgrounds?.customerStories ?? 'default'}
                      onValueChange={value => {
                        const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                        sectionBackgrounds.customerStories = value as 'default' | 'muted' | 'gradient' | 'mesh'
                        updateContent('sectionBackgrounds', sectionBackgrounds)
                      }}
                    >
                      <SelectTrigger data-testid="select-bg-customer-stories">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (transparent)</SelectItem>
                        <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                        <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                        <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                data-testid="button-save-content"
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
                        <div className="space-y-2">
                          <Label className="text-xs">Page Content (Markdown supported)</Label>
                          <Textarea
                            value={page.content ?? ''}
                            onChange={e => updateCustomPage(page.id, 'content', e.target.value)}
                            placeholder="Write your page content here. You can use Markdown for formatting..."
                            rows={8}
                            className="font-mono text-sm"
                            data-testid={`input-custom-page-content-${page.id}`}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                data-testid="button-save-pages"
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

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                data-testid="button-save-pricing"
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

          <div className="flex justify-end pt-6">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              data-testid="button-save-social"
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

          <div className="flex justify-end pt-6">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              data-testid="button-save-features"
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
