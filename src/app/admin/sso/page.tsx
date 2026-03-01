'use client'

import { useEffect, useState, useCallback } from 'react'
import { DSCard, DSCardContent, DSCardHeader, DSCardTitle, DSCardDescription } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, Shield, Globe, Copy, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'

interface SSODomain {
  id: string
  domain: string
  created_at: string
}

interface SSOProvider {
  id: string
  type: string
  saml?: {
    entity_id: string
    metadata_url?: string
  }
  domains: SSODomain[]
  created_at: string
  updated_at: string
}

export default function SSODashboard() {
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [samlMetadataUrl, setSamlMetadataUrl] = useState('')
  const [samlAcsUrl, setSamlAcsUrl] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMetadataUrl, setNewMetadataUrl] = useState('')
  const [newDomains, setNewDomains] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sso')
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
        setSamlMetadataUrl(data.samlMetadataUrl || '')
        setSamlAcsUrl(data.samlAcsUrl || '')
        setWarning(data.warning || null)
      }
    } catch (err) {
      console.error('Failed to fetch SSO providers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setError(null)

    const domains = newDomains
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean)

    if (domains.length === 0) {
      setError('Please enter at least one domain')
      setAddLoading(false)
      return
    }

    if (!newMetadataUrl) {
      setError('Please enter the identity provider metadata URL')
      setAddLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          metadataUrl: newMetadataUrl,
          domains,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add SSO provider')
        setAddLoading(false)
        return
      }

      setNewMetadataUrl('')
      setNewDomains('')
      setShowAddForm(false)
      await fetchProviders()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAddLoading(false)
    }
  }

  const [providerToDelete, setProviderToDelete] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    if (!providerToDelete) return
    const providerId = providerToDelete
    setProviderToDelete(null)
    setDeleteLoading(providerId)
    try {
      await fetch('/api/admin/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', providerId }),
      })
      await fetchProviders()
    } finally {
      setDeleteLoading(null)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-[var(--section-spacing,1.5rem)] px-[var(--section-spacing,1.5rem)]">
      <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)] flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-sso-title">SSO / SAML</h1>
          <p className="text-sm text-muted-foreground">Configure enterprise single sign-on for your organization</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} data-testid="button-add-sso">
            <Plus className="h-4 w-4 mr-1" />
            Add Identity Provider
          </Button>
        )}
      </div>

      {warning && (
        <DSCard className="mb-[var(--content-density-gap,1rem)] border-[hsl(var(--warning)/0.5)]">
          <DSCardContent className="pt-4 pb-4">
            <div className="flex items-start gap-[var(--content-density-gap,1rem)]">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
              <p className="text-sm" data-testid="text-sso-warning">{warning}</p>
            </div>
          </DSCardContent>
        </DSCard>
      )}

      <DSCard className="mb-[var(--content-density-gap,1rem)]">
        <DSCardHeader>
          <DSCardTitle className="text-lg">SAML Configuration</DSCardTitle>
          <DSCardDescription>Provide these URLs to your identity provider (Okta, Azure AD, Google Workspace, etc.)</DSCardDescription>
        </DSCardHeader>
        <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">SP Metadata URL</Label>
            <div className="flex items-center gap-2">
              <Input value={samlMetadataUrl} readOnly className="font-mono text-sm" data-testid="input-metadata-url" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(samlMetadataUrl, 'metadata')}
                data-testid="button-copy-metadata"
              >
                {copied === 'metadata' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Assertion Consumer Service (ACS) URL</Label>
            <div className="flex items-center gap-2">
              <Input value={samlAcsUrl} readOnly className="font-mono text-sm" data-testid="input-acs-url" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(samlAcsUrl, 'acs')}
                data-testid="button-copy-acs"
              >
                {copied === 'acs' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DSCardContent>
      </DSCard>

      {showAddForm && (
        <DSCard className="mb-[var(--content-density-gap,1rem)]">
          <DSCardHeader>
            <DSCardTitle className="text-lg">Add Identity Provider</DSCardTitle>
            <DSCardDescription>Connect an external SAML 2.0 identity provider</DSCardDescription>
          </DSCardHeader>
          <DSCardContent>
            <form onSubmit={handleAddProvider} className="space-y-[var(--content-density-gap,1rem)]">
              <div className="space-y-2">
                <Label htmlFor="metadataUrl">IdP Metadata URL</Label>
                <Input
                  id="metadataUrl"
                  placeholder="https://login.microsoftonline.com/.../federationmetadata.xml"
                  value={newMetadataUrl}
                  onChange={(e) => setNewMetadataUrl(e.target.value)}
                  required
                  data-testid="input-idp-metadata"
                />
                <p className="text-xs text-muted-foreground">
                  The SAML metadata XML URL from your identity provider (Azure AD, Okta, Google Workspace, etc.)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domains">Email Domains</Label>
                <Input
                  id="domains"
                  placeholder="company.com, subsidiary.com"
                  value={newDomains}
                  onChange={(e) => setNewDomains(e.target.value)}
                  required
                  data-testid="input-sso-domains"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated email domains. Users with emails from these domains will be redirected to SSO login.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive" data-testid="text-sso-error">{error}</p>
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={addLoading} data-testid="button-save-sso">
                  {addLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Add Provider
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setError(null) }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DSCardContent>
        </DSCard>
      )}

      <div className="space-y-[var(--content-density-gap,1rem)]">
        <h2 className="text-lg font-semibold">Identity Providers ({providers.length})</h2>

        {providers.length === 0 ? (
          <DSCard>
            <DSCardContent className="py-[var(--section-spacing,1.5rem)] text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground" data-testid="text-no-providers">
                No SSO providers configured yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add an identity provider to enable enterprise single sign-on
              </p>
            </DSCardContent>
          </DSCard>
        ) : (
          providers.map((provider) => (
            <DSCard key={provider.id} data-testid={`card-sso-provider-${provider.id}`}>
              <DSCardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-[var(--content-density-gap,1rem)] flex-wrap">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default">
                        <Shield className="h-3 w-3 mr-1" />
                        SAML 2.0
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{provider.id.slice(0, 8)}...</span>
                    </div>
                    {provider.saml?.entity_id && (
                      <p className="text-sm text-muted-foreground truncate">
                        Entity ID: {provider.saml.entity_id}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {provider.domains.map((d) => (
                        <Badge key={d.id} variant="outline">{d.domain}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(provider.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProviderToDelete(provider.id)}
                    disabled={deleteLoading === provider.id}
                    data-testid={`button-delete-sso-${provider.id}`}
                  >
                    {deleteLoading === provider.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Remove
                  </Button>
                </div>
              </DSCardContent>
            </DSCard>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!providerToDelete}
        onOpenChange={(open) => { if (!open) setProviderToDelete(null) }}
        title="Remove SSO Provider"
        description="Are you sure you want to remove this SSO provider? Users from these domains will no longer be able to use SSO login."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
