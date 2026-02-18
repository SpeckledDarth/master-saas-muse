'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  async function checkUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  function handleOpen() {
    checkUser()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleSubmit() {
    if (!message.trim()) {
      toast({ title: 'Please enter your feedback', variant: 'destructive' })
      return
    }

    if (!user && !email) {
      toast({ title: 'Please enter your email', variant: 'destructive' })
      return
    }

    setSending(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          email: email || user?.email,
          pageUrl: window.location.pathname,
          npsScore,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('')
        setEmail('')
        setNpsScore(null)
        setOpen(false)
        toast({ title: 'Thank you!', description: 'Your feedback has been submitted successfully.' })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit feedback', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
        size="icon"
        data-testid="button-feedback"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {open && (
        <div ref={panelRef} className="fixed bottom-20 right-4 w-80 bg-card border rounded-lg shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Send Feedback</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(false)}
              data-testid="button-close-feedback"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="feedback-email">Your Email</Label>
                <Input
                  id="feedback-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-feedback-email"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="input-feedback-message"
              />
            </div>

            <div className="space-y-2">
              <Label data-testid="label-nps-rating">How likely are you to recommend us? <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="grid grid-cols-11 gap-0.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNpsScore(npsScore === i ? null : i)}
                    className={`h-7 text-xs rounded-md font-medium transition-colors ${
                      npsScore === i
                        ? 'bg-primary-600 text-white dark:bg-primary-400 dark:text-black'
                        : 'bg-muted text-muted-foreground hover-elevate'
                    }`}
                    data-testid={`button-nps-${i}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between gap-2 text-[10px] text-muted-foreground">
                <span data-testid="text-nps-low">Not likely</span>
                <span data-testid="text-nps-high">Very likely</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full"
              data-testid="button-submit-feedback"
            >
              {sending ? 'Sending...' : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
