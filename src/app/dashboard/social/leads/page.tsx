'use client'

import { useState, useEffect } from 'react'
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
import { Target, MessageSquare, ArrowRight, Search, Filter, Check, Bell, Loader2, Copy, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'
import { LeadCrm } from '@/components/social/lead-crm'
import { Users } from 'lucide-react'

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
  const [gigAlerts, setGigAlerts] = useState<any[]>([])
  const [gigLoading, setGigLoading] = useState(false)
  const [gigKeywords, setGigKeywords] = useState<string[]>([])
  const [replyTemplates, setReplyTemplates] = useState<any[]>([])
  const [activeSection, setActiveSection] = useState<'leads' | 'gig-alerts' | 'crm'>('leads')
  const { toast } = useToast()

  const loadGigData = () => {
    setGigLoading(true)
    Promise.all([
      fetch('/api/social/leads/gig-scanner').then(r => r.ok ? r.json() : null),
      fetch('/api/social/leads/reply-templates').then(r => r.ok ? r.json() : null),
    ]).then(([scannerData, templatesData]) => {
      if (scannerData) {
        setGigAlerts(scannerData.alerts || [])
        setGigKeywords(scannerData.keywords || [])
      }
      if (templatesData) setReplyTemplates(templatesData.templates || [])
    }).catch(() => {}).finally(() => setGigLoading(false))
  }

  useEffect(() => {
    loadGigData()
  }, [])

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

  const handleGigAction = (alertId: string, action: 'reply' | 'dismiss', customReply?: string) => {
    fetch('/api/social/leads/gig-scanner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, action, customReply }),
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.success) {
        setGigAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: action === 'reply' ? 'replied' : 'dismissed' } : a))
        toast({ title: action === 'reply' ? 'Reply sent' : 'Alert dismissed' })
      }
    }).catch(() => {
      toast({ title: 'Action failed', description: 'Please try again.' })
    })
  }

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard' })
    }).catch(() => {})
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

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button variant={activeSection === 'leads' ? 'default' : 'outline'} size="sm" onClick={() => setActiveSection('leads')} data-testid="button-tab-leads">
          <Target className="mr-1 h-4 w-4" /> Lead Tracker
        </Button>
        <Button variant={activeSection === 'gig-alerts' ? 'default' : 'outline'} size="sm" onClick={() => setActiveSection('gig-alerts')} data-testid="button-tab-gig-alerts">
          <Bell className="mr-1 h-4 w-4" /> Gig Alerts
          {gigAlerts.filter(a => a.status === 'new').length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs px-1.5">{gigAlerts.filter(a => a.status === 'new').length}</Badge>
          )}
        </Button>
        <Button variant={activeSection === 'crm' ? 'default' : 'outline'} size="sm" onClick={() => setActiveSection('crm')} data-testid="button-tab-crm">
          <Users className="mr-1 h-4 w-4" /> Lead CRM
        </Button>
      </div>

      {activeSection === 'leads' && (
        <>
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="flex items-center gap-2 flex-wrap">
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
        </>
      )}

      {activeSection === 'gig-alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground" data-testid="text-gig-monitoring">
                Monitoring keywords based on your niche
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {gigKeywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-keyword-${i}`}>{kw}</Badge>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadGigData}
              disabled={gigLoading}
              data-testid="button-scan-now"
            >
              {gigLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
              Scan Now
            </Button>
          </div>

          {gigLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Scanning for gig opportunities...</p>
              </CardContent>
            </Card>
          )}

          {!gigLoading && gigAlerts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No gig alerts found yet. Set up your brand preferences to start scanning.</p>
              </CardContent>
            </Card>
          )}

          {!gigLoading && gigAlerts.length > 0 && (
            <div className="space-y-3" data-testid="list-gig-alerts">
              {gigAlerts.map(alert => (
                <Card key={alert.id} data-testid={`gig-alert-${alert.id}`}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">{alert.platform}</Badge>
                        <Badge variant="default" className="text-xs">{alert.matchedKeyword}</Badge>
                        {alert.status === 'replied' && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="mr-1 h-3 w-3" />
                            Replied
                          </Badge>
                        )}
                        {alert.status === 'dismissed' && (
                          <Badge variant="secondary" className="text-xs opacity-60">Dismissed</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{alert.source}</span>
                        <span className="text-xs text-muted-foreground">{alert.detectedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm">{alert.snippet}</p>
                    </div>
                    {alert.status === 'new' && (
                      <div className="space-y-3">
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Reply Templates</p>
                          <div className="space-y-2">
                            {replyTemplates.slice(0, 3).map((tmpl, ti) => (
                              <div key={ti}>
                                <p className="text-xs font-medium text-muted-foreground mb-1">{tmpl.signal}</p>
                                {tmpl.replies.slice(0, 1).map((reply: any, ri: number) => (
                                  <div key={ri} className="flex items-start justify-between gap-2">
                                    <p className="text-sm flex-1">{reply.text}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copyTemplate(reply.text)}
                                      data-testid={`button-copy-template-${alert.id}-${ti}`}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button size="sm" onClick={() => handleGigAction(alert.id, 'reply')} data-testid={`button-reply-gig-${alert.id}`}>
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Reply Now
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleGigAction(alert.id, 'dismiss')} data-testid={`button-dismiss-gig-${alert.id}`}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'crm' && (
        <LeadCrm />
      )}
    </div>
  )
}
