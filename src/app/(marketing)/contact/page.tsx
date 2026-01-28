'use client'

import { useState } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Phone, MapPin, Send, Check } from 'lucide-react'
import { PageHero } from '@/components/page-hero'

export default function ContactPage() {
  const { settings, loading } = useSettings()
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-contact" />
      </div>
    )
  }

  const contact = settings?.pages?.contact
  const branding = settings?.branding

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          to: contact?.email || branding?.supportEmail,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setFormState({ name: '', email: '', subject: '', message: '' })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send message. Please try again.')
      }
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHero
        headline={contact?.headline || 'Contact Us'}
        subheadline={contact?.subheadline || "We'd love to hear from you"}
        imageUrl={contact?.heroImageUrl}
        positionX={contact?.heroImagePositionX ?? 50}
        positionY={contact?.heroImagePositionY ?? 50}
        testId="contact"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-get-in-touch">Get in Touch</CardTitle>
              <CardDescription>
                Reach out to us through any of these channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(contact?.email || branding?.supportEmail) && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <a 
                    href={`mailto:${contact?.email || branding?.supportEmail}`}
                    className="text-primary hover:underline"
                    data-testid="link-email"
                  >
                    {contact?.email || branding?.supportEmail}
                  </a>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-primary hover:underline"
                    data-testid="link-phone"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground whitespace-pre-wrap" data-testid="text-address">
                    {contact.address}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {contact?.showContactForm !== false && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-send-message">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form and we'll get back to you soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2" data-testid="text-success">
                    Message Sent!
                  </p>
                  <p className="text-muted-foreground" data-testid="text-success-message">
                    {contact?.formSuccessMessage || "Thank you for your message! We'll get back to you soon."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSubmitted(false)}
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formState.subject}
                      onChange={(e) => setFormState(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="What's this about?"
                      required
                      data-testid="input-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formState.message}
                      onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Your message..."
                      rows={5}
                      required
                      data-testid="input-message"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive" data-testid="text-error">
                      {error}
                    </p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitting}
                    data-testid="button-submit"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}
