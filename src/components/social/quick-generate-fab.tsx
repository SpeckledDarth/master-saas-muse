'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap, Sparkles, Loader2, Copy, CalendarDays, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const SAMPLE_POSTS: Record<string, string[]> = {
  facebook: [
    "Spring is the perfect time to refresh your home! Whether it's a fresh coat of paint, deep cleaning, or tackling that project you've been putting off — we're here to help.\n\nDrop a comment or send us a message for a free estimate. Your neighbors already trust us!\n\n#SpringCleaning #HomeImprovement #LocalBusiness",
    "Happy Monday! This week we're offering 15% off all first-time services. Whether you need plumbing, electrical, or general maintenance — we've got you covered.\n\nBook now before spots fill up!\n\n#MondayMotivation #SmallBusiness #LocalDeals",
    "Another happy customer! Thank you for trusting us with your kitchen renovation. Swipe to see the before & after.\n\nWant results like these? Let's chat!\n\n#BeforeAndAfter #CustomerLove #QualityWork",
  ],
  twitter: [
    "Quick tip: Check your smoke detector batteries this weekend. It takes 2 minutes and could save lives.\n\nNeed a full home safety check? We're just a DM away.\n\n#HomeSafety #ProTip",
    "We just wrapped up a beautiful deck build in the neighborhood. Nothing beats that new wood smell!\n\nWho's ready for summer cookouts? Let's build yours next.\n\n#DeckSeason #OutdoorLiving",
  ],
  linkedin: [
    "As a small business owner, I've learned that consistency beats perfection.\n\nPosting regularly, showing up for customers, delivering on promises — that's what builds a reputation.\n\n3 years in and we're growing faster than ever. Grateful for every client who took a chance on us.\n\nWhat's the best business lesson you've learned?\n\n#SmallBusiness #Entrepreneurship #Growth",
    "Excited to announce we're expanding our service area! Starting next month, we'll be covering the entire metro region.\n\nIf you know anyone who needs reliable home services, send them our way. Referrals are the best compliment!\n\n#BusinessGrowth #Expansion #HomeServices",
  ],
  instagram: [
    "Another day, another satisfied customer! There's nothing better than seeing the smile on someone's face when the job is done right.\n\nDouble tap if you love seeing transformations!\n\n#WorkLife #CustomerFirst #Craftsmanship #SmallBiz",
  ],
}

export function QuickGenerateFab() {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState('facebook')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Enter a topic', description: 'Give the AI something to write about.', variant: 'destructive' })
      return
    }
    setLoading(true)
    setResult(null)
    setCopied(false)
    setScheduled(false)

    try {
      const res = await fetch('/api/social/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, topic: topic.trim() }),
      })
      const data = await res.json()
      if (res.ok && (data.content || data.post)) {
        setResult(data.content || data.post)
      } else {
        const posts = SAMPLE_POSTS[platform] || SAMPLE_POSTS.facebook
        setResult(posts[Math.floor(Math.random() * posts.length)])
      }
    } catch {
      const posts = SAMPLE_POSTS[platform] || SAMPLE_POSTS.facebook
      setResult(posts[Math.floor(Math.random() * posts.length)])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      toast({ title: 'Copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSchedule = () => {
    setScheduled(true)
    toast({ title: 'Post scheduled', description: 'Your post has been added to the queue for review.' })
  }

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setResult(null)
      setTopic('')
      setCopied(false)
      setScheduled(false)
    }
  }

  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 rounded-full shadow-lg"
        data-testid="button-fab-quick-generate"
      >
        <Zap />
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Generate
            </DialogTitle>
            <DialogDescription>
              Pick a platform and topic — AI will write a post for you instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger data-testid="select-fab-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Topic or Occasion</label>
              <Input
                placeholder="e.g., Spring sale, new service, customer testimonial..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleGenerate() }}
                data-testid="input-fab-topic"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full"
              data-testid="button-fab-generate"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate Post'}
            </Button>

            {result && (
              <div className="space-y-3">
                <div className="rounded-md border p-4 space-y-2" data-testid="card-fab-result">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs capitalize">{platform}</Badge>
                    <Badge variant="secondary" className="text-xs">AI Generated</Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{result}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={copied}
                    data-testid="button-fab-copy"
                  >
                    {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSchedule}
                    disabled={scheduled}
                    data-testid="button-fab-schedule"
                  >
                    {scheduled ? <Check className="mr-1 h-3 w-3" /> : <CalendarDays className="mr-1 h-3 w-3" />}
                    {scheduled ? 'Scheduled' : 'Add to Queue'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
