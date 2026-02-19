'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Target, MessageSquare, ArrowRight, Search, Filter, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'

interface Lead {
  id: string
  platform: string
  name: string
  snippet: string
  signal: string
  time: string
  suggestedReply: string
  status: 'new' | 'replied' | 'dismissed'
}

const SAMPLE_LEADS: Lead[] = [
  {
    id: 'lead-1',
    platform: 'facebook',
    name: 'Sarah M.',
    snippet: 'How much would it cost to do a full bathroom remodel? We have a small space but want to make it modern.',
    signal: 'Price inquiry',
    time: '3 hours ago',
    suggestedReply: "Hi Sarah! I'd love to help with your bathroom remodel. Could you send me a few photos of the space? I can give you a free estimate within 24 hours.",
    status: 'new',
  },
  {
    id: 'lead-2',
    platform: 'twitter',
    name: '@HomeOwnerJake',
    snippet: "This is exactly what I need! Do you service the Brooklyn area? I've been looking for someone reliable.",
    signal: 'Service area check',
    time: '8 hours ago',
    suggestedReply: "Yes, we cover all of Brooklyn! DM me your address and I'll get you on the schedule. First consultation is free.",
    status: 'new',
  },
  {
    id: 'lead-3',
    platform: 'linkedin',
    name: 'Michael R.',
    snippet: 'Great post. We manage 12 rental properties and need ongoing maintenance help. Can we discuss a contract?',
    signal: 'Bulk/contract inquiry',
    time: '1 day ago',
    suggestedReply: "Michael, that sounds like a great fit! I'd love to discuss a property management maintenance plan. Can we set up a call this week?",
    status: 'new',
  },
  {
    id: 'lead-4',
    platform: 'facebook',
    name: 'Lisa K.',
    snippet: "We just moved into a fixer-upper and there's SO much to do. Do you offer any kind of package deal for multiple projects?",
    signal: 'Multi-project inquiry',
    time: '2 days ago',
    suggestedReply: "Congrats on the new home, Lisa! We absolutely offer bundled pricing for multiple projects. Send me a list of what you need done and I'll put together a custom quote.",
    status: 'new',
  },
  {
    id: 'lead-5',
    platform: 'instagram',
    name: '@reno_dreams_',
    snippet: 'Love this transformation! How long did this kitchen take? And do you do custom cabinetry?',
    signal: 'Service inquiry',
    time: '2 days ago',
    suggestedReply: "Thank you! That kitchen took about 3 weeks. Yes, we do custom cabinetry — it's one of our specialties. DM me for more details!",
    status: 'replied',
  },
  {
    id: 'lead-6',
    platform: 'twitter',
    name: '@CommercialPropMgr',
    snippet: 'Do you handle commercial properties? We have a retail space that needs a full refresh before our new tenant moves in.',
    signal: 'Commercial inquiry',
    time: '3 days ago',
    suggestedReply: "We do handle commercial projects! Retail space refreshes are right in our wheelhouse. Can you share the square footage and timeline? I'll get you a proposal ASAP.",
    status: 'new',
  },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(SAMPLE_LEADS)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()

  const filteredLeads = leads.filter(lead => {
    if (platformFilter !== 'all' && lead.platform !== platformFilter) return false
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return lead.name.toLowerCase().includes(q) || lead.snippet.toLowerCase().includes(q) || lead.signal.toLowerCase().includes(q)
    }
    return true
  })

  const newCount = leads.filter(l => l.status === 'new').length

  const handleReply = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'replied' as const } : l))
    toast({ title: 'Reply sent', description: 'Your response has been queued for delivery.' })
  }

  const handleDismiss = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'dismissed' as const } : l))
    toast({ title: 'Lead dismissed' })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-leads-title">
            <Target className="h-6 w-6" />
            Lead Tracker
            <HelpTooltip text="People who responded to your posts with buying signals like price questions or service inquiries." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-leads-subtitle">
            High-intent engagement detected from your posts
            <HelpTooltip text="Each lead shows the type of interest detected (like a price inquiry or service question) and a suggested reply you can send." />
          </p>
        </div>
        <Badge variant="secondary" data-testid="badge-leads-count">
          {newCount} new lead{newCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-leads"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-platform-filter">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="twitter">Twitter / X</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3" data-testid="list-leads">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No leads match your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map(lead => (
            <Card key={lead.id} data-testid={`lead-${lead.id}`}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{lead.platform}</Badge>
                    <span className="text-sm font-medium">{lead.name}</span>
                    {lead.status === 'replied' && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Replied
                      </Badge>
                    )}
                    {lead.status === 'dismissed' && (
                      <Badge variant="secondary" className="text-xs opacity-60">Dismissed</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">{lead.signal}</Badge>
                    <span className="text-xs text-muted-foreground">{lead.time}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm">{lead.snippet}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Suggested Reply <HelpTooltip text="AI drafts a reply based on the lead's message and your brand voice. Edit it before sending if you'd like." /></p>
                  <p className="text-sm">{lead.suggestedReply}</p>
                </div>
                {lead.status === 'new' && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleReply(lead.id)} data-testid={`button-reply-${lead.id}`}>
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDismiss(lead.id)} data-testid={`button-dismiss-${lead.id}`}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
