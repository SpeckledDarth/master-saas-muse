'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Link2,
  Palette,
  Settings,
  Sparkles,
  AlertCircle,
  Facebook,
  Linkedin,
  Twitter,
  Loader2,
  ArrowRight,
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Connect Platforms', description: 'Link your social accounts', icon: Link2 },
  { id: 2, title: 'Brand Voice', description: 'Define your tone and niche', icon: Palette },
  { id: 3, title: 'Preferences', description: 'Set posting frequency and approvals', icon: Settings },
  { id: 4, title: 'Ready', description: 'Start scheduling', icon: Sparkles },
]

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, note: 'Requires a Facebook Page (not personal profile)' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, note: 'Professional networking' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, note: 'Posts up to 280 characters' },
]

const TONE_OPTIONS = ['Professional', 'Casual', 'Friendly', 'Authoritative', 'Humorous', 'Educational']
const FREQUENCY_OPTIONS = ['Once daily', 'Twice daily', 'Three times daily', 'Once every other day', 'Three times a week', 'Weekly']

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])

  const [brandPrefs, setBrandPrefs] = useState({
    tone: '',
    niche: '',
    location: '',
    target_audience: '',
    posting_goals: '',
    sample_content: '',
  })

  const [postingPrefs, setPostingPrefs] = useState({
    frequency: 'Once daily',
    requireApproval: true,
    autoHashtags: true,
  })

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected) {
      toast({ title: 'Connected', description: `${connected} account connected successfully.` })
      fetchConnectedAccounts()
    }
    if (error) {
      toast({ title: 'Connection failed', description: decodeURIComponent(error), variant: 'destructive' })
    }
  }, [searchParams])

  useEffect(() => {
    fetchConnectedAccounts()
    fetchBrandPreferences()
  }, [])

  async function fetchConnectedAccounts() {
    try {
      const res = await fetch('/api/social/accounts')
      if (res.ok) {
        const data = await res.json()
        const platforms = (data.accounts || []).map((a: { platform: string }) => a.platform)
        setConnectedPlatforms(platforms)
      }
    } catch {}
  }

  async function fetchBrandPreferences() {
    try {
      const res = await fetch('/api/social/brand-preferences')
      if (res.ok) {
        const data = await res.json()
        if (data.preferences) {
          setBrandPrefs(prev => ({
            ...prev,
            ...data.preferences,
          }))
        }
      }
    } catch {}
  }

  async function connectPlatform(platform: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
        return
      }
      if (!res.ok) {
        throw new Error(data.error || 'Connection failed')
      }
      setConnectedPlatforms(prev => [...prev, platform])
      toast({ title: 'Connected', description: `${platform} account connected successfully.` })
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function saveBrandPreferences() {
    setLoading(true)
    try {
      const res = await fetch('/api/social/brand-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandPrefs),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Saved', description: 'Brand preferences saved successfully.' })
      setCurrentStep(3)
    } catch {
      toast({ title: 'Error', description: 'Could not save brand preferences.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function savePostingPreferences() {
    setLoading(true)
    try {
      const res = await fetch('/api/social/posting-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: postingPrefs.frequency,
          require_approval: postingPrefs.requireApproval,
          auto_hashtags: postingPrefs.autoHashtags,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.error?.includes('migration')) {
          toast({ title: 'Preferences noted', description: 'Your preferences will be saved after database setup is complete.' })
        } else {
          toast({ title: 'Warning', description: 'Could not save preferences to server, but you can continue.', variant: 'destructive' })
        }
      } else {
        toast({ title: 'Saved', description: 'Posting preferences saved successfully.' })
      }
      setCurrentStep(4)
    } catch {
      toast({ title: 'Warning', description: 'Could not save preferences to server, but you can continue.', variant: 'destructive' })
      setCurrentStep(4)
    } finally {
      setLoading(false)
    }
  }

  function finishOnboarding() {
    router.push('/dashboard/social/overview')
  }

  const canProceed = (step: number) => {
    if (step === 1) return connectedPlatforms.length > 0
    if (step === 2) return brandPrefs.tone.length > 0 && brandPrefs.niche.length > 0
    return true
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Get Started with Social Scheduling</h1>
        <p className="text-muted-foreground mt-1">Set up your social media posting in a few quick steps.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                currentStep === step.id
                  ? 'bg-primary-600 dark:bg-primary-400 text-white dark:text-black'
                  : currentStep > step.id
                  ? 'bg-muted text-muted-foreground'
                  : 'text-muted-foreground'
              }`}
              data-testid={`step-indicator-${step.id}`}
            >
              {currentStep > step.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </div>
            {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step-title">Connect Your Platforms</CardTitle>
            <CardDescription>
              Link the social media accounts you want to post to. You can add more later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PLATFORMS.map(platform => {
              const isConnected = connectedPlatforms.includes(platform.id)
              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between gap-4 p-3 border rounded-md"
                  data-testid={`platform-row-${platform.id}`}
                >
                  <div className="flex items-center gap-3">
                    <platform.icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.note}</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge variant="secondary" data-testid={`badge-connected-${platform.id}`}>
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => connectPlatform(platform.id)}
                      disabled={loading}
                      data-testid={`button-connect-${platform.id}`}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                    </Button>
                  )}
                </div>
              )
            })}

            {connectedPlatforms.includes('facebook') === false && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-muted-foreground">
                  Facebook posting requires a Facebook Page. If you don&apos;t have one yet,
                  you can create one for free at{' '}
                  <a href="https://www.facebook.com/pages/create" target="_blank" rel="noopener noreferrer" className="underline">
                    facebook.com/pages/create
                  </a>.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceed(1)}
                data-testid="button-next-step-1"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step-title">Define Your Brand Voice</CardTitle>
            <CardDescription>
              This helps our AI generate posts that sound like you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map(tone => (
                  <Badge
                    key={tone}
                    variant={brandPrefs.tone === tone.toLowerCase() ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setBrandPrefs(prev => ({ ...prev, tone: tone.toLowerCase() }))}
                    data-testid={`badge-tone-${tone.toLowerCase()}`}
                  >
                    {tone}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niche">Your Niche / Industry</Label>
              <Input
                id="niche"
                placeholder="e.g., Plumbing, Real Estate, Rideshare, Freelance Design"
                value={brandPrefs.niche}
                onChange={e => setBrandPrefs(prev => ({ ...prev, niche: e.target.value }))}
                data-testid="input-niche"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Austin TX, Greater Chicago Area"
                value={brandPrefs.location}
                onChange={e => setBrandPrefs(prev => ({ ...prev, location: e.target.value }))}
                data-testid="input-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Who are your customers?</Label>
              <Input
                id="target_audience"
                placeholder="e.g., Homeowners needing repairs, First-time home buyers"
                value={brandPrefs.target_audience}
                onChange={e => setBrandPrefs(prev => ({ ...prev, target_audience: e.target.value }))}
                data-testid="input-target-audience"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posting_goals">What do you want your posts to do?</Label>
              <Input
                id="posting_goals"
                placeholder="e.g., Get more calls, Build trust, Show expertise"
                value={brandPrefs.posting_goals}
                onChange={e => setBrandPrefs(prev => ({ ...prev, posting_goals: e.target.value }))}
                data-testid="input-posting-goals"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sample_content">Example post (optional)</Label>
              <Textarea
                id="sample_content"
                placeholder="Paste an example of a post you've written or liked..."
                value={brandPrefs.sample_content}
                onChange={e => setBrandPrefs(prev => ({ ...prev, sample_content: e.target.value }))}
                rows={3}
                className="resize-none"
                data-testid="textarea-sample-content"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={saveBrandPreferences}
                disabled={!canProceed(2) || loading}
                data-testid="button-next-step-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save & Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-step-title">Posting Preferences</CardTitle>
            <CardDescription>
              Choose how often to post and whether you want to review posts before they go live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Posting Frequency</Label>
              <div className="grid grid-cols-2 gap-2">
                {FREQUENCY_OPTIONS.map(freq => (
                  <div
                    key={freq}
                    className={`p-3 border rounded-md cursor-pointer text-sm hover-elevate ${
                      postingPrefs.frequency === freq ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950' : ''
                    }`}
                    onClick={() => setPostingPrefs(prev => ({ ...prev, frequency: freq }))}
                    data-testid={`option-frequency-${freq.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {freq}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div
                className={`flex items-center justify-between p-3 border rounded-md cursor-pointer hover-elevate ${
                  postingPrefs.requireApproval ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950' : ''
                }`}
                onClick={() => setPostingPrefs(prev => ({ ...prev, requireApproval: !prev.requireApproval }))}
                data-testid="toggle-require-approval"
              >
                <div>
                  <p className="font-medium text-sm">Review before posting</p>
                  <p className="text-xs text-muted-foreground">AI-generated posts go to your approval queue first</p>
                </div>
                <Badge variant={postingPrefs.requireApproval ? 'default' : 'outline'}>
                  {postingPrefs.requireApproval ? 'On' : 'Off'}
                </Badge>
              </div>

              <div
                className={`flex items-center justify-between p-3 border rounded-md cursor-pointer hover-elevate ${
                  postingPrefs.autoHashtags ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950' : ''
                }`}
                onClick={() => setPostingPrefs(prev => ({ ...prev, autoHashtags: !prev.autoHashtags }))}
                data-testid="toggle-auto-hashtags"
              >
                <div>
                  <p className="font-medium text-sm">Auto-add hashtags</p>
                  <p className="text-xs text-muted-foreground">AI adds relevant hashtags based on your niche</p>
                </div>
                <Badge variant={postingPrefs.autoHashtags ? 'default' : 'outline'}>
                  {postingPrefs.autoHashtags ? 'On' : 'Off'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step-3">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={savePostingPreferences}
                disabled={loading}
                data-testid="button-next-step-3"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save & Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 mb-3">
              <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <CardTitle className="text-xl" data-testid="text-step-title">You&apos;re All Set!</CardTitle>
            <CardDescription className="text-base" data-testid="text-motivational-message">
              PassivePost will start working for you. Your social media presence is about to grow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Setup Summary</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Connected Platforms</span>
                <div className="flex gap-1 flex-wrap">
                  {connectedPlatforms.length > 0 ? connectedPlatforms.map(p => {
                    const platformInfo = PLATFORMS.find(pl => pl.id === p)
                    return (
                      <Badge key={p} variant="secondary" data-testid={`badge-summary-platform-${p}`}>
                        {platformInfo ? platformInfo.name : p}
                      </Badge>
                    )
                  }) : (
                    <span className="text-sm text-muted-foreground" data-testid="text-summary-no-platforms">None connected</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Brand Voice</span>
                <span className="text-sm font-medium capitalize" data-testid="text-summary-tone">{brandPrefs.tone || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Niche</span>
                <span className="text-sm font-medium" data-testid="text-summary-niche">{brandPrefs.niche || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Posting Frequency</span>
                <span className="text-sm font-medium" data-testid="text-summary-frequency">{postingPrefs.frequency}</span>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Review before posting</span>
                <Badge variant={postingPrefs.requireApproval ? 'default' : 'outline'} data-testid="badge-summary-approval">
                  {postingPrefs.requireApproval ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Auto-hashtags</span>
                <Badge variant={postingPrefs.autoHashtags ? 'default' : 'outline'} data-testid="badge-summary-hashtags">
                  {postingPrefs.autoHashtags ? 'On' : 'Off'}
                </Badge>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground text-center">
              You can update any of these settings later from your dashboard.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-0">
            <Button
              className="w-full"
              size="lg"
              onClick={finishOnboarding}
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(3)}
              data-testid="button-back-step-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Preferences
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default function SocialOnboardingPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
      <OnboardingContent />
    </Suspense>
  )
}
