'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Trash2, Star, Check, X, Pencil, GripVertical, Quote, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  quote: string
  avatar_url?: string
  company_logo_url?: string
  rating?: number
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  display_order: number
  source: string
  created_at: string
}

const emptyForm: {
  name: string
  role: string
  company: string
  quote: string
  avatar_url: string
  company_logo_url: string
  rating: number
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
} = {
  name: '',
  role: '',
  company: '',
  quote: '',
  avatar_url: '',
  company_logo_url: '',
  rating: 5,
  status: 'approved',
  featured: false,
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/testimonials')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTestimonials(data.testimonials || [])
    } catch (error) {
      console.error('Fetch error:', error)
      toast({ title: 'Error', description: 'Failed to load testimonials', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchTestimonials() }, [fetchTestimonials])

  const handleSave = async () => {
    if (!form.name.trim() || !form.quote.trim()) {
      toast({ title: 'Missing fields', description: 'Name and quote are required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form

      const res = await fetch('/api/admin/testimonials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast({ title: editingId ? 'Updated' : 'Created', description: 'Testimonial saved successfully' })
      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
      fetchTestimonials()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save testimonial', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (t: Testimonial) => {
    setForm({
      name: t.name,
      role: t.role,
      company: t.company,
      quote: t.quote,
      avatar_url: t.avatar_url || '',
      company_logo_url: t.company_logo_url || '',
      rating: t.rating || 5,
      status: t.status,
      featured: t.featured,
    })
    setEditingId(t.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Deleted', description: 'Testimonial removed' })
      fetchTestimonials()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete testimonial', variant: 'destructive' })
    }
  }

  const handleToggleFeatured = async (t: Testimonial) => {
    try {
      await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, featured: !t.featured }),
      })
      fetchTestimonials()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' })
    }
  }

  const handleToggleStatus = async (t: Testimonial, newStatus: string) => {
    try {
      await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, status: newStatus }),
      })
      fetchTestimonials()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' })
    }
  }

  const approvedCount = testimonials.filter(t => t.status === 'approved').length
  const featuredCount = testimonials.filter(t => t.featured).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-testimonials-title">Testimonials</h2>
          <p className="text-muted-foreground">Manage customer testimonials displayed on your site</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/testimonials" target="_blank">
            <Button variant="outline" size="sm" data-testid="button-view-public-page">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
          </Link>
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }} data-testid="button-add-testimonial">
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold" data-testid="text-total-count">{testimonials.length}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600" data-testid="text-approved-count">{approvedCount}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-600" data-testid="text-featured-count">{featuredCount}</div>
            <p className="text-sm text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Testimonial' : 'Add New Testimonial'}</CardTitle>
            <CardDescription>Fill in the customer details and their testimonial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Doe"
                  data-testid="input-testimonial-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Acme Inc"
                  data-testid="input-testimonial-company"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role / Title</Label>
                <Input
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="Marketing Manager"
                  data-testid="input-testimonial-role"
                />
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Select value={String(form.rating)} onValueChange={v => setForm(f => ({ ...f, rating: parseInt(v) }))}>
                  <SelectTrigger data-testid="select-testimonial-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea
                value={form.quote}
                onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                placeholder="This product changed how we work..."
                rows={4}
                data-testid="input-testimonial-quote"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Avatar URL</Label>
                <Input
                  value={form.avatar_url}
                  onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                  placeholder="https://..."
                  data-testid="input-testimonial-avatar"
                />
              </div>
              <div className="space-y-2">
                <Label>Company Logo URL</Label>
                <Input
                  value={form.company_logo_url}
                  onChange={e => setForm(f => ({ ...f, company_logo_url: e.target.value }))}
                  placeholder="https://..."
                  data-testid="input-testimonial-logo"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="w-32" data-testid="select-testimonial-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={checked => setForm(f => ({ ...f, featured: checked }))}
                  data-testid="switch-testimonial-featured"
                />
                <Label>Featured</Label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} data-testid="button-save-testimonial">
                {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Testimonial')}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }} data-testid="button-cancel-testimonial">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading testimonials...</CardContent>
        </Card>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Quote className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No testimonials yet</p>
            <p className="mb-4">Add your first customer testimonial to display on your site</p>
            <Button onClick={() => setShowForm(true)} data-testid="button-add-first-testimonial">
              <Plus className="h-4 w-4 mr-2" />
              Add First Testimonial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map(t => {
            const initials = t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            return (
              <Card key={t.id} className={`${t.featured ? 'border-yellow-400 dark:border-yellow-600' : ''}`} data-testid={`card-testimonial-${t.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      {t.avatar_url && <AvatarImage src={t.avatar_url} alt={t.name} />}
                      <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{t.name}</span>
                        {t.role && t.company && (
                          <span className="text-sm text-muted-foreground">{t.role}, {t.company}</span>
                        )}
                        <Badge variant={t.status === 'approved' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                          {t.status}
                        </Badge>
                        {t.featured && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground italic text-sm line-clamp-2">&quot;{t.quote}&quot;</p>
                      {t.rating && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < t.rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {t.status !== 'approved' && (
                        <Button size="icon" variant="ghost" onClick={() => handleToggleStatus(t, 'approved')} title="Approve" data-testid={`button-approve-${t.id}`}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {t.status === 'approved' && (
                        <Button size="icon" variant="ghost" onClick={() => handleToggleFeatured(t)} title={t.featured ? 'Unfeature' : 'Feature'} data-testid={`button-feature-${t.id}`}>
                          <Star className={`h-4 w-4 ${t.featured ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(t)} title="Edit" data-testid={`button-edit-${t.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} title="Delete" data-testid={`button-delete-${t.id}`}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
