'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Check, ChevronRight, Palette, CreditCard, Globe, Sparkles } from 'lucide-react'

const STEPS = [
  {
    id: 1,
    title: 'Branding',
    description: 'Set up your app name and colors',
    icon: Palette,
  },
  {
    id: 2,
    title: 'Stripe',
    description: 'Connect payment processing',
    icon: CreditCard,
  },
  {
    id: 3,
    title: 'Content',
    description: 'Add your marketing content',
    icon: Globe,
  },
  {
    id: 4,
    title: 'Launch',
    description: 'Review and publish',
    icon: Sparkles,
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [branding, setBranding] = useState({
    appName: '',
    tagline: '',
    primaryColor: '#6366f1',
    accentColor: '#f59e0b',
  })

  useEffect(() => {
    fetchOnboarding()
  }, [])

  async function fetchOnboarding() {
    try {
      const res = await fetch('/api/admin/onboarding')
      const data = await res.json()
      
      if (data.completed) {
        router.push('/admin')
        return
      }
      
      setCurrentStep(data.current_step || 1)
      setCompletedSteps(data.completed_steps || [])
    } catch (error) {
      console.error('Error fetching onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveProgress(step: number, completed: number[], isComplete = false) {
    try {
      await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: step,
          completed_steps: completed,
          completed: isComplete,
        }),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  async function handleStepComplete() {
    setSaving(true)
    
    if (currentStep === 1) {
      try {
        const res = await fetch('/api/admin/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branding: {
              appName: branding.appName,
              tagline: branding.tagline,
              primaryColor: branding.primaryColor,
              accentColor: branding.accentColor,
            },
          }),
        })
        
        if (!res.ok) {
          throw new Error('Failed to save branding')
        }
        
        toast({ title: 'Branding saved!' })
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to save branding', variant: 'destructive' })
        setSaving(false)
        return
      }
    }
    
    const newCompleted = [...completedSteps, currentStep]
    setCompletedSteps(newCompleted)
    
    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      await saveProgress(nextStep, newCompleted)
    } else {
      await saveProgress(currentStep, newCompleted, true)
      toast({ title: 'Setup complete!', description: 'Your app is ready to launch' })
      router.push('/admin')
    }
    
    setSaving(false)
  }

  function handleSkip() {
    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      saveProgress(nextStep, completedSteps)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Your SaaS</h1>
          <p className="text-muted-foreground">Let's get your app set up in just a few minutes</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  completedSteps.includes(step.id)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step.id === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    completedSteps.includes(step.id) ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {STEPS[currentStep - 1]?.icon && (
                <span className="text-primary">
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon
                    return <Icon className="h-5 w-5" />
                  })()}
                </span>
              )}
              {STEPS[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input
                    id="appName"
                    placeholder="My Awesome SaaS"
                    value={branding.appName}
                    onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
                    data-testid="input-app-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Textarea
                    id="tagline"
                    placeholder="The best solution for your needs"
                    value={branding.tagline}
                    onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                    data-testid="input-tagline"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-12 h-10 p-1"
                        data-testid="input-primary-color"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
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
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="w-12 h-10 p-1"
                        data-testid="input-accent-color"
                      />
                      <Input
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect your Stripe account to enable subscriptions and payments.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">To set up Stripe:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to your Stripe Dashboard</li>
                    <li>Create your products and pricing</li>
                    <li>Copy your API keys to your environment variables</li>
                    <li>Set up webhooks for subscription events</li>
                  </ol>
                </div>
                <Button variant="outline" asChild className="w-full">
                  <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                    Open Stripe Dashboard
                  </a>
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Add your marketing content - features, testimonials, FAQ, and more.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Content you can customize:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Hero section with images or videos</li>
                    <li>Features with icons and descriptions</li>
                    <li>Customer testimonials</li>
                    <li>FAQ section</li>
                    <li>About, Contact, and Legal pages</li>
                  </ul>
                </div>
                <Button variant="outline" asChild className="w-full">
                  <a href="/admin/setup">
                    Go to Setup Dashboard
                  </a>
                </Button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Review your setup and launch your app!
                </p>
                <div className="space-y-2">
                  {STEPS.slice(0, -1).map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <step.icon className="h-5 w-5 text-muted-foreground" />
                        <span>{step.title}</span>
                      </div>
                      {completedSteps.includes(step.id) ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-sm text-muted-foreground">Skipped</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              {currentStep < STEPS.length ? (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={handleStepComplete} disabled={saving} data-testid="button-next-step">
                {saving ? 'Saving...' : currentStep === STEPS.length ? 'Complete Setup' : 'Continue'}
                {currentStep < STEPS.length && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
