'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Plus, Tag, StickyNote, Loader2, Search, X, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { HelpTooltip } from '@/components/social/help-tooltip'

interface CrmLead {
  id: string
  name: string
  platform: string
  snippet: string
  signal: string
  status: string
  tags: string[]
  notes: string[]
  suggestedReply: string
  createdAt: string
}

const PRESET_TAGS = ['Hot', 'Warm', 'Cold', 'Follow-up', 'Closed']
const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'won', 'lost']

export function LeadCrm() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [newNote, setNewNote] = useState<Record<string, string>>({})
  const [customTag, setCustomTag] = useState<Record<string, string>>({})
  const [addingLead, setAddingLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', platform: 'facebook', snippet: '', signal: '' })
  const { toast } = useToast()

  const fetchLeads = () => {
    setLoading(true)
    fetch('/api/social/leads/manage')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.leads) setLeads(data.leads)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const filteredLeads = leads.filter(lead => {
    if (tagFilter !== 'all' && !lead.tags.includes(tagFilter)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return lead.name.toLowerCase().includes(q) || lead.snippet.toLowerCase().includes(q) || lead.signal.toLowerCase().includes(q)
    }
    return true
  })

  const handleAddLead = () => {
    if (!newLead.name || !newLead.snippet || !newLead.signal) {
      toast({ title: 'Missing fields', description: 'Please fill in name, snippet, and signal.' })
      return
    }
    setAddingLead(true)
    fetch('/api/social/leads/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.lead) {
          setLeads(prev => [data.lead, ...prev])
          setNewLead({ name: '', platform: 'facebook', snippet: '', signal: '' })
          setAddDialogOpen(false)
          toast({ title: 'Lead added' })
        }
      })
      .catch(() => toast({ title: 'Failed to add lead' }))
      .finally(() => setAddingLead(false))
  }

  const updateLead = (id: string, updates: Partial<CrmLead>) => {
    fetch('/api/social/leads/manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.lead) {
          setLeads(prev => prev.map(l => l.id === id ? data.lead : l))
        }
      })
      .catch(() => toast({ title: 'Failed to update lead' }))
  }

  const addTag = (leadId: string, tag: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.tags.includes(tag)) return
    updateLead(leadId, { tags: [...lead.tags, tag] })
  }

  const removeTag = (leadId: string, tag: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    updateLead(leadId, { tags: lead.tags.filter(t => t !== tag) })
  }

  const addNote = (leadId: string) => {
    const noteText = newNote[leadId]?.trim()
    if (!noteText) return
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    const timestamp = new Date().toLocaleString()
    const formattedNote = `[${timestamp}] ${noteText}`
    updateLead(leadId, { notes: [...lead.notes, formattedNote] })
    setNewNote(prev => ({ ...prev, [leadId]: '' }))
  }

  const handleStatusChange = (leadId: string, status: string) => {
    updateLead(leadId, { status })
  }

  const handleExport = () => {
    window.location.href = '/api/social/leads/export'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" data-testid="text-lead-crm-title">
            Lead CRM
          </h2>
          <HelpTooltip text="Manage your leads with tags, notes, and status tracking. Add leads manually or save them from the Lead Tracker." />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-lead">
                <Plus className="mr-1 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Name</Label>
                  <Input
                    id="lead-name"
                    placeholder="Lead name"
                    value={newLead.name}
                    onChange={e => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-lead-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-platform">Platform</Label>
                  <Select value={newLead.platform} onValueChange={v => setNewLead(prev => ({ ...prev, platform: v }))}>
                    <SelectTrigger data-testid="select-lead-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-snippet">Snippet</Label>
                  <Textarea
                    id="lead-snippet"
                    placeholder="What did they say?"
                    value={newLead.snippet}
                    onChange={e => setNewLead(prev => ({ ...prev, snippet: e.target.value }))}
                    data-testid="input-lead-snippet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-signal">Signal</Label>
                  <Input
                    id="lead-signal"
                    placeholder="e.g. Price inquiry, Service question"
                    value={newLead.signal}
                    onChange={e => setNewLead(prev => ({ ...prev, signal: e.target.value }))}
                    data-testid="input-lead-signal"
                  />
                </div>
                <Button onClick={handleAddLead} disabled={addingLead} className="w-full" data-testid="button-submit-lead">
                  {addingLead && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Add Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-csv">
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search-crm-leads"
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-tag-filter">
            <Tag className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {PRESET_TAGS.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading leads...</p>
          </CardContent>
        </Card>
      )}

      {!loading && filteredLeads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {leads.length === 0 ? 'No leads yet. Add your first lead to get started.' : 'No leads match your filters.'}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && filteredLeads.length > 0 && (
        <div className="space-y-3" data-testid="list-crm-leads">
          {filteredLeads.map(lead => {
            const isExpanded = expandedLead === lead.id
            return (
              <Card key={lead.id} data-testid={`crm-lead-${lead.id}`}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" data-testid={`text-lead-name-${lead.id}`}>{lead.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">{lead.platform}</Badge>
                      <Badge variant="default" className="text-xs">{lead.signal}</Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={lead.status} onValueChange={v => handleStatusChange(lead.id, v)}>
                        <SelectTrigger className="w-[130px]" data-testid={`select-status-${lead.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{lead.snippet}</p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {lead.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(lead.id, tag)}
                          className="ml-0.5 rounded-full"
                          data-testid={`button-remove-tag-${lead.id}-${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Select onValueChange={v => {
                      if (v === '__custom__') return
                      addTag(lead.id, v)
                    }}>
                      <SelectTrigger className="w-auto border-dashed" data-testid={`button-add-tag-${lead.id}`}>
                        <Plus className="h-3 w-3 mr-1" />
                        <span className="text-xs">Tag</span>
                      </SelectTrigger>
                      <SelectContent>
                        {PRESET_TAGS.filter(t => !lead.tags.includes(t)).map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Custom tag"
                        className="w-[100px] text-xs"
                        value={customTag[lead.id] || ''}
                        onChange={e => setCustomTag(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && customTag[lead.id]?.trim()) {
                            addTag(lead.id, customTag[lead.id].trim())
                            setCustomTag(prev => ({ ...prev, [lead.id]: '' }))
                          }
                        }}
                        data-testid={`input-custom-tag-${lead.id}`}
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                    data-testid={`button-toggle-notes-${lead.id}`}
                  >
                    <StickyNote className="mr-1 h-4 w-4" />
                    Notes ({lead.notes.length})
                    {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                  </Button>

                  {isExpanded && (
                    <div className="space-y-2 pl-2 border-l-2 border-muted ml-2">
                      {lead.notes.length === 0 && (
                        <p className="text-xs text-muted-foreground">No notes yet.</p>
                      )}
                      {lead.notes.map((note, idx) => (
                        <p key={idx} className="text-sm" data-testid={`text-note-${lead.id}-${idx}`}>{note}</p>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add a note..."
                          className="flex-1 text-sm"
                          value={newNote[lead.id] || ''}
                          onChange={e => setNewNote(prev => ({ ...prev, [lead.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addNote(lead.id) }}
                          data-testid={`input-note-${lead.id}`}
                        />
                        <Button size="icon" onClick={() => addNote(lead.id)} data-testid={`button-add-note-${lead.id}`}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
