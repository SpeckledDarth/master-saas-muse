'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Mail, Edit2, Info, Plus, Trash2, Send, Eye, Code, Loader2 } from 'lucide-react'

interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  description: string
}

const ALL_VARIABLES = [
  { name: '{{appName}}', description: 'Your application name' },
  { name: '{{appLogo}}', description: 'URL to your app logo' },
  { name: '{{name}}', description: 'Recipient full name' },
  { name: '{{firstName}}', description: 'Recipient first name' },
  { name: '{{email}}', description: 'Recipient email address' },
  { name: '{{supportEmail}}', description: 'Your support email' },
  { name: '{{websiteUrl}}', description: 'Your website URL' },
  { name: '{{year}}', description: 'Current year' },
  { name: '{{planName}}', description: 'Subscription plan name' },
  { name: '{{endDate}}', description: 'Subscription end date' },
  { name: '{{orgName}}', description: 'Organization name' },
  { name: '{{inviteLink}}', description: 'Team invitation link' },
  { name: '{{resetLink}}', description: 'Password reset link' },
]

const SAMPLE_DATA: Record<string, string> = {
  '{{appName}}': 'Your App',
  '{{appLogo}}': '',
  '{{name}}': 'John Doe',
  '{{firstName}}': 'John',
  '{{email}}': 'john@example.com',
  '{{supportEmail}}': 'support@yourapp.com',
  '{{websiteUrl}}': 'https://yourapp.com',
  '{{year}}': new Date().getFullYear().toString(),
  '{{planName}}': 'Pro Plan',
  '{{endDate}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  '{{orgName}}': 'Acme Inc',
  '{{inviteLink}}': 'https://yourapp.com/invite/abc123',
  '{{resetLink}}': 'https://yourapp.com/reset/xyz789',
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
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit')
  const [testEmailDialog, setTestEmailDialog] = useState<{ templateId: number; templateName: string } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

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
    setPreviewTab('edit')
    setDialogOpen(true)
  }

  function openCreateTemplate() {
    setEditingTemplate(null)
    setIsCreateMode(true)
    setForm({
      name: '',
      subject: 'Welcome to {{appName}}',
      body: 'Hi {{name}},\n\nWelcome to {{appName}}! We\'re excited to have you on board.\n\nIf you have any questions, feel free to reach out to us at {{supportEmail}}.\n\nBest regards,\nThe {{appName}} Team',
      description: '',
    })
    setPreviewTab('edit')
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

  function openTestEmailDialog(templateId: number, templateName: string) {
    setTestEmailDialog({ templateId, templateName })
    setTestEmail('')
  }

  async function handleSendTestEmail() {
    if (!testEmailDialog || !testEmail.trim()) {
      toast({ title: 'Error', description: 'Email address is required', variant: 'destructive' })
      return
    }
    
    setSendingTestEmail(true)
    
    try {
      const res = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: testEmailDialog.templateId, recipientEmail: testEmail }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({ title: 'Test email sent!', description: data.message })
        setTestEmailDialog(null)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send test email', variant: 'destructive' })
    } finally {
      setSendingTestEmail(false)
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

  function insertVariable(variable: string) {
    setForm(prev => ({
      ...prev,
      body: prev.body + variable
    }))
  }

  const previewContent = useMemo(() => {
    let subject = form.subject
    let body = form.body
    
    for (const [variable, value] of Object.entries(SAMPLE_DATA)) {
      const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    }
    
    return { subject, body }
  }, [form.subject, form.body])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4" data-testid="email-templates-header">
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
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-2">Available Variables</p>
              <div className="flex flex-wrap gap-2">
                {ALL_VARIABLES.slice(0, 8).map(v => (
                  <Badge key={v.name} variant="secondary" className="font-mono text-xs">
                    {v.name}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">+{ALL_VARIABLES.length - 8} more</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No email templates yet</p>
            <p className="mb-4">Create your first template to start sending branded emails.</p>
            <Button onClick={openCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`template-${template.name}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg capitalize">
                    {template.name.replace(/_/g, ' ')}
                  </CardTitle>
                  <CardDescription className="truncate">{template.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTestEmailDialog(template.id, template.name)}
                    data-testid={`button-test-${template.name}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditTemplate(template)}
                    data-testid={`button-edit-template-${template.name}`}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={deleting === template.id}
                    data-testid={`button-delete-${template.name}`}
                    className="text-destructive hover:text-destructive"
                  >
                    {deleting === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Subject:</span>
                    <span className="text-sm text-muted-foreground">{template.subject}</span>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2 font-mono bg-muted/50 p-2 rounded">
                    {template.body.substring(0, 150)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {isCreateMode ? 'Create New Template' : `Edit ${editingTemplate?.name.replace(/_/g, ' ')} Template`}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode ? 'Create a custom email template for your application' : editingTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="flex-1 overflow-auto space-y-4 mt-4">
              {isCreateMode && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., payment_reminder"
                        data-testid="input-template-name"
                      />
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
                  data-testid="input-subject"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Email Body</Label>
                  <div className="flex flex-wrap gap-1">
                    {ALL_VARIABLES.slice(0, 5).map(v => (
                      <Button
                        key={v.name}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs font-mono"
                        onClick={() => insertVariable(v.name)}
                        data-testid={`button-insert-${v.name.replace(/[{}]/g, '')}`}
                      >
                        {v.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Email content..."
                  rows={10}
                  className="font-mono text-sm"
                  data-testid="input-content"
                />
              </div>
              
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">All Variables</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {ALL_VARIABLES.map(v => (
                      <div 
                        key={v.name} 
                        className="flex items-center gap-2 cursor-pointer hover:bg-background p-1 rounded"
                        onClick={() => insertVariable(v.name)}
                        data-testid={`variable-${v.name.replace(/[{}]/g, '')}`}
                      >
                        <code className="bg-background px-1.5 py-0.5 rounded text-primary-600 dark:text-primary-400">{v.name}</code>
                        <span className="text-muted-foreground truncate">{v.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 overflow-auto mt-4" data-testid="email-preview">
              <Card>
                <CardHeader className="border-b">
                  <div className="text-sm text-muted-foreground">Subject:</div>
                  <CardTitle className="text-lg">{previewContent.subject}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {previewContent.body.split('\n').map((line, i) => (
                      <p key={i} className="my-2">{line || <br />}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                This is a plain text preview. The actual email will include your branding (logo, colors, footer).
              </p>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-template">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-template">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isCreateMode ? 'Create Template' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!testEmailDialog} onOpenChange={() => setTestEmailDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test version of the "{testEmailDialog?.templateName.replace(/_/g, ' ')}" template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                data-testid="input-test-email"
              />
              <p className="text-xs text-muted-foreground">
                The email will include sample data for all variables.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestEmail} disabled={sendingTestEmail} data-testid="button-confirm-send-test">
              {sendingTestEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
