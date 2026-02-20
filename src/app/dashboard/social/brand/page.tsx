'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Sparkles, Plus, X as XIcon, Palette, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'

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
  const [voiceSamples, setVoiceSamples] = useState<string[]>(['', '', ''])
  const [voiceAnalyzing, setVoiceAnalyzing] = useState(false)
  const [voiceProfile, setVoiceProfile] = useState<any>(null)
  const [voiceLoading, setVoiceLoading] = useState(true)
  const { toast } = useToast()

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/social/brand-preferences')
      if (!res.ok) { setLoading(false); return }
      let data
      try { data = await res.json() } catch { data = {} }
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
      // silently show empty form
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  useEffect(() => {
    fetch('/api/social/brand-voice/fine-tune').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.profile) setVoiceProfile(data.profile)
    }).catch(() => {}).finally(() => setVoiceLoading(false))
  }, [])

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

  const handleVoiceAnalysis = async () => {
    const filled = voiceSamples.filter(s => s.trim().length > 10)
    if (filled.length < 3) {
      toast({ title: 'Need more samples', description: 'Please provide at least 3 writing samples (10+ characters each)', variant: 'destructive' })
      return
    }
    setVoiceAnalyzing(true)
    try {
      const res = await fetch('/api/social/brand-voice/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samplePosts: filled }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setVoiceProfile(data.profile)
      toast({ title: 'Voice Profile Created', description: 'Your AI writing voice has been analyzed and saved' })
    } catch {
      toast({ title: 'Error', description: 'Could not analyze voice samples', variant: 'destructive' })
    } finally {
      setVoiceAnalyzing(false)
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
      <div className="p-6">
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
    <div className="p-6 space-y-6">
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
            <Label htmlFor="niche">Business Niche <HelpTooltip text="Your industry or trade. AI uses this to write relevant, on-topic posts for your business." /></Label>
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
            <Label htmlFor="tone">Brand Tone <HelpTooltip text="The overall feel of your posts. Professional sounds polished; casual sounds conversational." /></Label>
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
            <Label htmlFor="target_audience">Target Audience <HelpTooltip text="Who you want to reach. AI tailors language and topics to appeal to this group." /></Label>
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
            <Label htmlFor="posting_goals">Posting Goals <HelpTooltip text="What you want social media to do for your business, like generate leads or build awareness." /></Label>
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
            <Label>Sample Content URLs <HelpTooltip text="Links to existing content that represents your style. AI studies these for inspiration when writing your posts." /></Label>
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

      <Card className="mt-6" data-testid="card-voice-fine-tuner">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
            <Sparkles className="h-5 w-5" />
            AI Voice Fine-Tuner
            <HelpTooltip text="Paste 3-10 examples of your writing (social posts, blog excerpts, emails). AI will analyze your unique voice and create a custom writing template." />
          </CardTitle>
          <CardDescription>Teach AI to write exactly like you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {voiceProfile && (
            <Card className="border-primary/30 bg-primary/5" data-testid="card-voice-profile">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-medium">Your Voice Profile</h4>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{voiceProfile.summary}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium">Tone:</span> {voiceProfile.tone}</div>
                  <div><span className="font-medium">Sentence Style:</span> {voiceProfile.sentenceStyle}</div>
                  <div><span className="font-medium">Emoji Usage:</span> {voiceProfile.emojiUsage}</div>
                  <div><span className="font-medium">CTA Style:</span> {voiceProfile.ctaStyle}</div>
                </div>
                {voiceProfile.uniquePhrases?.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Unique Phrases: </span>
                    {voiceProfile.uniquePhrases.map((p: string, i: number) => (
                      <Badge key={i} variant="outline" className="mr-1 mb-1">{p}</Badge>
                    ))}
                  </div>
                )}
                {voiceProfile.promptTemplate && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">AI Prompt Template:</span>
                    <pre className="mt-1 text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">{voiceProfile.promptTemplate}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            <Label>Paste Your Writing Samples</Label>
            <p className="text-xs text-muted-foreground">Add at least 3 examples of your writing (posts, emails, blog excerpts). The more samples, the better the AI learns your voice.</p>
            {voiceSamples.map((sample, i) => (
              <div key={i} className="flex gap-2">
                <Textarea
                  placeholder={`Sample ${i + 1}: Paste a post or writing example...`}
                  value={sample}
                  onChange={e => {
                    const updated = [...voiceSamples]
                    updated[i] = e.target.value
                    setVoiceSamples(updated)
                  }}
                  className="min-h-[60px] resize-none"
                  data-testid={`input-voice-sample-${i}`}
                />
              </div>
            ))}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceSamples(prev => [...prev, ''])}
                disabled={voiceSamples.length >= 15}
                data-testid="button-add-sample"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Sample
              </Button>
              {voiceSamples.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceSamples(prev => prev.slice(0, -1))}
                  data-testid="button-remove-sample"
                >
                  <XIcon className="mr-1 h-3 w-3" /> Remove Last
                </Button>
              )}
            </div>
          </div>
          <Button
            onClick={handleVoiceAnalysis}
            disabled={voiceAnalyzing || voiceSamples.filter(s => s.trim().length > 10).length < 3}
            data-testid="button-analyze-voice"
          >
            {voiceAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze My Voice
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
