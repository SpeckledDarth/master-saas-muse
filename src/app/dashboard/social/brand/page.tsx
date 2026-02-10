'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Sparkles, Plus, X as XIcon, Palette, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BrandPreferences {
  id?: string
  tone: string
  niche: string
  location: string
  sample_urls: string[]
  target_audience: string
  posting_goals: string
  preferred_platforms: string[]
  post_frequency: string
}

const DEFAULT_PREFS: BrandPreferences = {
  tone: 'professional',
  niche: '',
  location: '',
  sample_urls: [],
  target_audience: '',
  posting_goals: '',
  preferred_platforms: [],
  post_frequency: 'daily',
}

const TONE_OPTIONS = [
  'professional',
  'casual',
  'fun',
  'creative',
  'authoritative',
  'witty',
  'friendly',
  'inspirational',
]

const FREQUENCY_OPTIONS = [
  { value: 'multiple_daily', label: 'Multiple times a day' },
  { value: 'daily', label: 'Once a day' },
  { value: 'few_per_week', label: 'A few times a week' },
  { value: 'weekly', label: 'Once a week' },
  { value: 'biweekly', label: 'Every two weeks' },
]

export default function BrandPreferencesPage() {
  const [prefs, setPrefs] = useState<BrandPreferences>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)
  const [newSampleUrl, setNewSampleUrl] = useState('')
  const { toast } = useToast()

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/social/brand-preferences')
      if (res.status === 403) {
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!res.ok && !data.preferences) {
        setError('Could not load brand preferences. Please try again.')
        setLoading(false)
        return
      }
      if (data.preferences) {
        setPrefs({
          ...DEFAULT_PREFS,
          ...data.preferences,
          sample_urls: data.preferences.sample_urls || [],
          preferred_platforms: data.preferences.preferred_platforms || [],
        })
        setHasExisting(true)
      }
    } catch {
      setError('Could not load brand preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/social/brand-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      toast({
        title: 'Saved',
        description: 'Your brand preferences have been saved. AI-generated posts will now reflect your brand.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const addSampleUrl = () => {
    if (newSampleUrl.trim()) {
      setPrefs(prev => ({
        ...prev,
        sample_urls: [...prev.sample_urls, newSampleUrl.trim()],
      }))
      setNewSampleUrl('')
    }
  }

  const removeSampleUrl = (index: number) => {
    setPrefs(prev => ({
      ...prev,
      sample_urls: prev.sample_urls.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card data-testid="error-state-brand">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchPreferences() }} data-testid="button-retry-brand">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Brand Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Tell us about your brand so AI-generated posts match your voice and audience.
        </p>
      </div>

      {!hasExisting && (
        <Card data-testid="empty-state-brand">
          <CardContent className="py-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No brand preferences set</h3>
            <p className="text-muted-foreground mt-1">
              Fill in the form below to personalize AI-generated content to match your brand voice and audience.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Your Brand Identity
          </CardTitle>
          <CardDescription>
            These preferences are used when generating AI content for your social media posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="niche">Business Niche</Label>
            <Input
              id="niche"
              data-testid="input-niche"
              placeholder="e.g., plumber, magician, realtor, dog trainer, coach"
              value={prefs.niche}
              onChange={e => setPrefs(prev => ({ ...prev, niche: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">What type of business or service do you offer?</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Brand Tone</Label>
            <Select
              value={prefs.tone}
              onValueChange={value => setPrefs(prev => ({ ...prev, tone: value }))}
            >
              <SelectTrigger id="tone" data-testid="select-tone">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(tone => (
                  <SelectItem key={tone} value={tone}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How should your posts sound?</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Target Audience</Label>
            <Input
              id="target_audience"
              data-testid="input-target-audience"
              placeholder="e.g., homeowners in NYC, small business owners, parents"
              value={prefs.target_audience}
              onChange={e => setPrefs(prev => ({ ...prev, target_audience: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Who are you trying to reach?</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Market</Label>
            <Input
              id="location"
              data-testid="input-location"
              placeholder="e.g., New York, NY or Nationwide"
              value={prefs.location}
              onChange={e => setPrefs(prev => ({ ...prev, location: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Where are your customers? Leave blank for global reach.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posting_goals">Posting Goals</Label>
            <Textarea
              id="posting_goals"
              data-testid="input-posting-goals"
              placeholder="e.g., Get more local leads, build brand awareness, share tips and expertise"
              value={prefs.posting_goals}
              onChange={e => setPrefs(prev => ({ ...prev, posting_goals: e.target.value }))}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">What do you want your social media presence to achieve?</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post_frequency">How Often to Post</Label>
            <Select
              value={prefs.post_frequency}
              onValueChange={value => setPrefs(prev => ({ ...prev, post_frequency: value }))}
            >
              <SelectTrigger id="post_frequency" data-testid="select-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sample Content URLs</Label>
            <p className="text-xs text-muted-foreground">
              Share links to content that represents your brand style (blog posts, social profiles, etc.)
            </p>
            <div className="space-y-2">
              {prefs.sample_urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={url}
                    readOnly
                    className="flex-1"
                    data-testid={`text-sample-url-${index}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSampleUrl(index)}
                    data-testid={`button-remove-url-${index}`}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://example.com/your-content"
                  value={newSampleUrl}
                  onChange={e => setNewSampleUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSampleUrl()}
                  data-testid="input-new-sample-url"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={addSampleUrl}
                  disabled={!newSampleUrl.trim()}
                  data-testid="button-add-url"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          data-testid="button-save-preferences"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
