'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, ChevronRight, X } from 'lucide-react'

interface CoachingMessage {
  text: string
  category: 'tip' | 'motivation' | 'strategy'
}

const COACHING_MESSAGES: CoachingMessage[] = [
  { text: 'Consistency beats perfection. Posting regularly — even imperfectly — builds trust with your audience over time.', category: 'motivation' },
  { text: 'Engagement dips are normal. The algorithm rewards persistence, not perfection.', category: 'motivation' },
  { text: 'Your next viral post could be one draft away. Keep experimenting with what resonates.', category: 'motivation' },
  { text: 'Every expert was once a beginner. Your audience grows with you — they appreciate authenticity.', category: 'motivation' },
  { text: 'Small audiences are mighty. Even 100 engaged followers can drive real business results.', category: 'motivation' },
  { text: 'Try the 80/20 rule: 80% valuable content, 20% promotional. Your followers will thank you.', category: 'tip' },
  { text: 'Posts with questions get 2x more comments. Ask your audience what they think.', category: 'tip' },
  { text: 'Schedule posts for when your audience is most active. Check your Best Times section below.', category: 'tip' },
  { text: 'Repurpose your best content across platforms. A LinkedIn article can become 5 tweets.', category: 'tip' },
  { text: 'Use AI generation to overcome writer\'s block, then add your personal touch before posting.', category: 'tip' },
  { text: 'Video content gets 3x more engagement than text-only posts on most platforms.', category: 'strategy' },
  { text: 'Respond to comments within the first hour. Early engagement signals boost your post visibility.', category: 'strategy' },
  { text: 'Track which post topics get the most engagement, then create more content in those areas.', category: 'strategy' },
  { text: 'Cross-promote between platforms. Your LinkedIn audience might not follow you on Twitter yet.', category: 'strategy' },
  { text: 'Batch-create a week\'s worth of content in one sitting. It saves time and keeps your message consistent.', category: 'strategy' },
]

const CATEGORY_LABELS: Record<string, string> = {
  tip: 'Quick Tip',
  motivation: 'Keep Going',
  strategy: 'Strategy',
}

export function CoachingCard({ className }: { className?: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )
    setMessageIndex(dayOfYear % COACHING_MESSAGES.length)
  }, [])

  const message = useMemo(() => COACHING_MESSAGES[messageIndex], [messageIndex])

  const handleNext = () => {
    setMessageIndex((prev) => (prev + 1) % COACHING_MESSAGES.length)
  }

  if (dismissed) return null

  return (
    <Card className={`relative overflow-hidden ${className || ''}`} data-testid="card-coaching">
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
        }}
      />
      <CardContent className="relative flex items-start gap-3 py-4 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <Lightbulb className="h-4 w-4 text-primary-700 dark:text-primary-300" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground" data-testid="text-coaching-category">
            {CATEGORY_LABELS[message.category] || 'Tip'}
          </span>
          <p className="text-sm mt-0.5 leading-relaxed" data-testid="text-coaching-message">
            {message.text}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            data-testid="button-next-coaching"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-coaching"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
