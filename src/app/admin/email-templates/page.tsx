'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Mail, Edit2, Info, Plus, Trash2, Send } from 'lucide-react'

interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  description: string
}

const TEMPLATE_VARIABLES = {
  welcome: ['{{appName}}', '{{name}}'],
  subscription_confirmed: ['{{appName}}', '{{name}}', '{{planName}}'],
  subscription_cancelled: ['{{appName}}', '{{name}}', '{{planName}}', '{{endDate}}'],
  password_reset: ['{{appName}}', '{{name}}', '{{resetLink}}'],
  team_invitation: ['{{appName}}', '{{orgName}}', '{{inviteLink}}'],
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
  })
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [sendingTest, setSendingTest] = useState<number | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/email-templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  function openEditTemplate(template: EmailTemplate) {
    setEditingTemplate(template)
    setIsCreateMode(false)
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description,
    })
    setDialogOpen(true)
  }

  function openCreateTemplate() {
    setEditingTemplate(null)
    setIsCreateMode(true)
    setForm({
      name: '',
      subject: '',
      body: '',
      description: '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (isCreateMode && !form.name.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    
    try {
      const payload = isCreateMode 
        ? {
            name: form.name.toLowerCase().replace(/\s+/g, '_'),
            subject: form.subject,
            body: form.body,
            description: form.description,
          }
        : {
            id: editingTemplate?.id,
            subject: form.subject,
            body: form.body,
            description: form.description,
          }

      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        toast({ title: isCreateMode ? 'Template created' : 'Template updated' })
        setDialogOpen(false)
        fetchTemplates()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest(templateId: number) {
    setSendingTest(templateId)
    
    try {
      const res = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({ title: 'Test email sent!', description: data.message })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send test email', variant: 'destructive' })
    } finally {
      setSendingTest(null)
    }
  }

  async function handleDelete(templateId: number, templateName: string) {
    if (!confirm(`Are you sure you want to delete the "${templateName.replace(/_/g, ' ')}" template?`)) {
      return
    }
    
    setDeleting(templateId)
    
    try {
      const res = await fetch(`/api/admin/email-templates?id=${templateId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        toast({ title: 'Template deleted' })
        fetchTemplates()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Templates
          </h1>
          <p className="text-muted-foreground">Customize the emails sent to your users</p>
        </div>
        <Button onClick={openCreateTemplate} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Template Variables</p>
              <p className="text-muted-foreground">
                Use variables like {'{{appName}}'}, {'{{name}}'}, etc. in your templates. 
                These will be replaced with actual values when emails are sent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No email templates found. Templates are created automatically.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`template-${template.name}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg capitalize">
                    {template.name.replace(/_/g, ' ')}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSendTest(template.id)}
                    disabled={sendingTest === template.id}
                    data-testid={`button-test-${template.name}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingTest === template.id ? 'Sending...' : 'Send Test'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openEditTemplate(template)}
                    data-testid={`button-edit-${template.name}`}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={deleting === template.id}
                    data-testid={`button-delete-${template.name}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Subject: </span>
                    <span className="text-sm text-muted-foreground">{template.subject}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Variables: {(TEMPLATE_VARIABLES[template.name as keyof typeof TEMPLATE_VARIABLES] || []).join(', ') || 'None'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {isCreateMode ? 'Create New Template' : `Edit ${editingTemplate?.name.replace(/_/g, ' ')} Template`}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode ? 'Create a custom email template for your application' : editingTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isCreateMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., payment_reminder"
                    data-testid="input-template-name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase with underscores (spaces will be converted)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="When this email is sent..."
                    data-testid="input-template-description"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Email subject..."
                data-testid="input-template-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Email content..."
                rows={12}
                className="font-mono text-sm"
                data-testid="input-template-body"
              />
              <p className="text-xs text-muted-foreground">
                {isCreateMode 
                  ? 'Use variables like {{appName}}, {{name}}, etc. that will be replaced when sending'
                  : `Available variables: ${(TEMPLATE_VARIABLES[editingTemplate?.name as keyof typeof TEMPLATE_VARIABLES] || []).join(', ') || 'Custom template - use any variables'}`
                }
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-template">
              {saving ? 'Saving...' : (isCreateMode ? 'Create Template' : 'Save Template')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
