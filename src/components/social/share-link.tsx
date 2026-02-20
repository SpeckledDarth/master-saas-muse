'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, Share2, Users, MousePointerClick } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReferralLink {
  id: string
  ref_code: string
  clicks: number
  signups: number
  shareUrl: string
}

export function ShareLink() {
  const [link, setLink] = useState<ReferralLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(data => setLink(data.link))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.shareUrl)
      setCopied(true)
      toast({ title: 'Copied!', description: 'Share link copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <div className="animate-pulse">Loading your share link...</div>
        </CardContent>
      </Card>
    )
  }

  if (!link) return null

  return (
    <Card data-testid="card-share-link">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Link
        </CardTitle>
        <CardDescription>Share your unique link and track referrals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={link.shareUrl}
            readOnly
            className="font-mono text-sm"
            data-testid="input-share-url"
          />
          <Button onClick={handleCopy} variant="outline" size="icon" data-testid="button-copy-share-link">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xl font-bold" data-testid="text-referral-clicks">{link.clicks}</div>
              <div className="text-xs text-muted-foreground">Clicks</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xl font-bold" data-testid="text-referral-signups">{link.signups}</div>
              <div className="text-xs text-muted-foreground">Sign-ups</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Your referral code: <code className="bg-muted px-1 py-0.5 rounded">{link.ref_code}</code>
        </p>
      </CardContent>
    </Card>
  )
}
