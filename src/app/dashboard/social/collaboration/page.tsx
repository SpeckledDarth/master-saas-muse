'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users, Link as LinkIcon, Check, X, Copy, Send, Loader2, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface DraftPost {
  id: string
  content: string
  platform: string
  created_at: string
}

interface ApprovalLink {
  url: string
  createdAt: string
  expiresAt: string
  postCount: number
}

export default function CollaborationPage() {
  const { toast } = useToast()

  const [drafts, setDrafts] = useState<DraftPost[]>([])
  const [draftsLoading, setDraftsLoading] = useState(true)
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [approvalLinks, setApprovalLinks] = useState<ApprovalLink[]>([])

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?status=draft')
      if (!res.ok) return
      const data = await res.json()
      setDrafts(Array.isArray(data) ? data : data.posts || [])
    } catch {
      // ignore
    } finally {
      setDraftsLoading(false)
    }
  }, [])

  useEffect(() => { fetchDrafts() }, [fetchDrafts])

  const togglePost = (id: string) => {
    setSelectedPostIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedPostIds.size === drafts.length) {
      setSelectedPostIds(new Set())
    } else {
      setSelectedPostIds(new Set(drafts.map(d => d.id)))
    }
  }

  const handleGenerateLink = async () => {
    if (selectedPostIds.size === 0) {
      toast({ title: 'Error', description: 'Please select at least one draft post', variant: 'destructive' })
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/social/collaboration/approval-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: Array.from(selectedPostIds) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate approval link')
      }
      const data = await res.json()
      const newLink: ApprovalLink = {
        url: data.url || data.approvalUrl || '',
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        postCount: selectedPostIds.size,
      }
      setApprovalLinks(prev => [newLink, ...prev])
      setSelectedPostIds(new Set())
      toast({ title: 'Success', description: 'Approval link generated' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: 'Copied', description: 'Approval link copied to clipboard' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-collaboration-title">
            Client Collaboration
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-collaboration-description">
            Share content with clients for approval before publishing
          </p>
        </div>
        <Link href="/dashboard/social/overview">
          <Button variant="outline" data-testid="button-back-overview">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <Card data-testid="card-create-approval-link">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            Create Approval Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {draftsLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-drafts">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : drafts.length > 0 ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedPostIds.size === drafts.length && drafts.length > 0}
                  onCheckedChange={toggleAll}
                  data-testid="checkbox-select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({drafts.length} drafts)
                </label>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {drafts.map((draft, i) => (
                  <div
                    key={draft.id}
                    className="flex items-start gap-3 p-3 rounded-md border"
                    data-testid={`row-draft-${i}`}
                  >
                    <Checkbox
                      id={`draft-${draft.id}`}
                      checked={selectedPostIds.has(draft.id)}
                      onCheckedChange={() => togglePost(draft.id)}
                      className="mt-0.5"
                      data-testid={`checkbox-draft-${i}`}
                    />
                    <label htmlFor={`draft-${draft.id}`} className="flex-1 cursor-pointer space-y-1">
                      <p className="text-sm line-clamp-2" data-testid={`text-draft-content-${i}`}>{draft.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs" data-testid={`badge-draft-platform-${i}`}>{draft.platform}</Badge>
                        <span className="text-xs text-muted-foreground" data-testid={`text-draft-date-${i}`}>
                          {new Date(draft.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleGenerateLink}
                disabled={generating || selectedPostIds.size === 0}
                data-testid="button-generate-approval-link"
              >
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Generate Approval Link ({selectedPostIds.size} selected)
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4" data-testid="text-no-drafts">
              No draft posts available. Create some draft posts first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-active-approval-links">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Active Approval Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalLinks.length > 0 ? (
            <div className="space-y-3">
              {approvalLinks.map((link, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border"
                  data-testid={`row-approval-link-${i}`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-mono truncate" data-testid={`text-approval-url-${i}`}>{link.url}</p>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span data-testid={`text-approval-created-${i}`}>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
                      <span data-testid={`text-approval-expires-${i}`}>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-approval-posts-${i}`}>
                        {link.postCount} posts
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(link.url)}
                    data-testid={`button-copy-approval-link-${i}`}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4" data-testid="text-no-approval-links">
              No approval links generated yet. Select draft posts above and generate a link.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
