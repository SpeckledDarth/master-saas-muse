'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function AffiliateJoinPage() {
  const { settings } = useSettings()
  const appName = settings?.branding?.appName || 'Our Product'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [promotionMethod, setPromotionMethod] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/affiliate/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          website_url: websiteUrl || null,
          promotion_method: promotionMethod,
          message: message || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit application')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-gray-500/50">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2" data-testid="text-success-title">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              We'll review your application and get back to you within 24-48 hours. You'll receive an email at <strong>{email}</strong> once you're approved.
            </p>
            <Link href="/affiliate">
              <Button variant="outline" data-testid="button-back-to-affiliate">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Affiliate Program
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="link-back-affiliate">
            <ArrowLeft className="h-4 w-4" /> Back to Affiliate Program
          </Link>
        </div>

        <Card className="bg-white/10 border-gray-500/50">
          <CardHeader>
            <CardTitle className="text-2xl text-black dark:text-white" data-testid="text-join-title">Join the {appName} Affiliate Program</CardTitle>
            <CardDescription>Fill out the form below to apply. No account needed — we'll set everything up once you're approved.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  data-testid="input-affiliate-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="input-affiliate-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website / Channel URL</Label>
                <Input
                  id="website"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-blog.com or youtube.com/c/yourchannel"
                  data-testid="input-affiliate-website"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">How will you promote? *</Label>
                <Select value={promotionMethod} onValueChange={setPromotionMethod} required>
                  <SelectTrigger data-testid="select-promotion-method">
                    <SelectValue placeholder="Select your primary method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog / Website</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="newsletter">Newsletter / Email List</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="course">Online Course / Community</SelectItem>
                    <SelectItem value="consulting">Consulting / Freelance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Anything else you'd like to share?</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us about your audience, content niche, or why you're interested..."
                  rows={3}
                  data-testid="input-affiliate-message"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3" data-testid="text-error">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading || !name || !email || !promotionMethod} data-testid="button-submit-application">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Application
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already an affiliate? <Link href="/affiliate/login" className="text-primary-600 hover:underline" data-testid="link-affiliate-login">Log in here</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
