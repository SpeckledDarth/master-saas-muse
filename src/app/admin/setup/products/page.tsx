'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, Package, Layers, Key, CreditCard, X } from 'lucide-react'
import type { MuseProduct, ProductTierDefinition } from '@/lib/products/types'

interface TierLimit {
  key: string
  value: string
}

interface EditableTier {
  id: string
  displayName: string
  stripeMetadataValue: string
  limits: TierLimit[]
}

const emptyTier: EditableTier = {
  id: '',
  displayName: '',
  stripeMetadataValue: '',
  limits: [],
}

interface ProductFormData {
  slug: string
  name: string
  description: string
  stripeProductId: string
  metadataKey: string
  tierDefinitions: EditableTier[]
  isActive: boolean
}

const emptyForm: ProductFormData = {
  slug: '',
  name: '',
  description: '',
  stripeProductId: '',
  metadataKey: '',
  tierDefinitions: [],
  isActive: true,
}

function tierToEditable(tier: ProductTierDefinition): EditableTier {
  return {
    id: tier.id,
    displayName: tier.displayName,
    stripeMetadataValue: tier.stripeMetadataValue,
    limits: Object.entries(tier.limits).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  }
}

function editableToTier(tier: EditableTier): ProductTierDefinition {
  const limits: Record<string, number | boolean> = {}
  for (const { key, value } of tier.limits) {
    if (!key) continue
    if (value === 'true') limits[key] = true
    else if (value === 'false') limits[key] = false
    else limits[key] = Number(value) || 0
  }
  return {
    id: tier.id,
    displayName: tier.displayName,
    stripeMetadataValue: tier.stripeMetadataValue,
    limits,
  }
}

function productToForm(product: MuseProduct): ProductFormData {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description || '',
    stripeProductId: product.stripeProductId || '',
    metadataKey: product.metadataKey,
    tierDefinitions: product.tierDefinitions.map(tierToEditable),
    isActive: product.isActive,
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<MuseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function openAddDialog() {
    setEditingSlug(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(product: MuseProduct) {
    setEditingSlug(product.slug)
    setForm(productToForm(product))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        stripeProductId: form.stripeProductId || undefined,
        description: form.description || undefined,
        tierDefinitions: form.tierDefinitions.map(editableToTier),
      }

      if (editingSlug) {
        const res = await fetch(`/api/admin/products/${editingSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update')
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create')
      }
      setDialogOpen(false)
      await fetchProducts()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slug: string) {
    setDeleting(slug)
    try {
      const res = await fetch(`/api/admin/products/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchProducts()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleActive(product: MuseProduct) {
    try {
      await fetch(`/api/admin/products/${product.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      await fetchProducts()
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  function updateForm(key: keyof ProductFormData, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addTier() {
    setForm(prev => ({
      ...prev,
      tierDefinitions: [...prev.tierDefinitions, { ...emptyTier }],
    }))
  }

  function removeTier(index: number) {
    setForm(prev => ({
      ...prev,
      tierDefinitions: prev.tierDefinitions.filter((_, i) => i !== index),
    }))
  }

  function updateTier(index: number, key: keyof EditableTier, value: unknown) {
    setForm(prev => ({
      ...prev,
      tierDefinitions: prev.tierDefinitions.map((t, i) =>
        i === index ? { ...t, [key]: value } : t
      ),
    }))
  }

  function addTierLimit(tierIndex: number) {
    setForm(prev => ({
      ...prev,
      tierDefinitions: prev.tierDefinitions.map((t, i) =>
        i === tierIndex ? { ...t, limits: [...t.limits, { key: '', value: '' }] } : t
      ),
    }))
  }

  function removeTierLimit(tierIndex: number, limitIndex: number) {
    setForm(prev => ({
      ...prev,
      tierDefinitions: prev.tierDefinitions.map((t, i) =>
        i === tierIndex
          ? { ...t, limits: t.limits.filter((_, li) => li !== limitIndex) }
          : t
      ),
    }))
  }

  function updateTierLimit(tierIndex: number, limitIndex: number, field: 'key' | 'value', val: string) {
    setForm(prev => ({
      ...prev,
      tierDefinitions: prev.tierDefinitions.map((t, i) =>
        i === tierIndex
          ? {
              ...t,
              limits: t.limits.map((l, li) =>
                li === limitIndex ? { ...l, [field]: val } : l
              ),
            }
          : t
      ),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-products">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Registry
              </CardTitle>
              <CardDescription>
                Register and manage SaaS products built on MuseKit
              </CardDescription>
            </div>
            <Button onClick={openAddDialog} data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-products">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No products registered yet</p>
              <p className="text-sm mt-1">Click &quot;Add Product&quot; to register your first product</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Card
                  key={product.slug}
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-product-${product.slug}`}
                  onClick={() => openEditDialog(product)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base" data-testid={`text-product-name-${product.slug}`}>
                            {product.name}
                          </h3>
                          <Badge variant="secondary" data-testid={`badge-product-slug-${product.slug}`}>
                            {product.slug}
                          </Badge>
                          <Badge
                            variant={product.isActive ? 'default' : 'outline'}
                            data-testid={`badge-product-status-${product.slug}`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground" data-testid={`text-product-description-${product.slug}`}>
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {product.stripeProductId && (
                            <span className="flex items-center gap-1" data-testid={`text-product-stripe-${product.slug}`}>
                              <CreditCard className="h-3 w-3" />
                              {product.stripeProductId}
                            </span>
                          )}
                          <span className="flex items-center gap-1" data-testid={`text-product-metadata-key-${product.slug}`}>
                            <Key className="h-3 w-3" />
                            {product.metadataKey}
                          </span>
                          <span className="flex items-center gap-1" data-testid={`text-product-tiers-${product.slug}`}>
                            <Layers className="h-3 w-3" />
                            {product.tierDefinitions.length} tier{product.tierDefinitions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleActive(product)}
                          data-testid={`switch-product-active-${product.slug}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(product)
                          }}
                          data-testid={`button-edit-product-${product.slug}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(product.slug)
                          }}
                          disabled={deleting === product.slug}
                          data-testid={`button-delete-product-${product.slug}`}
                        >
                          {deleting === product.slug ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingSlug ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingSlug
                ? 'Update the product configuration and tier definitions'
                : 'Register a new SaaS product built on MuseKit'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-slug">Slug</Label>
                <Input
                  id="product-slug"
                  placeholder="my-product"
                  value={form.slug}
                  onChange={(e) => updateForm('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  disabled={!!editingSlug}
                  data-testid="input-product-slug"
                />
                <p className="text-xs text-muted-foreground">Lowercase, no spaces. Used as identifier.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  placeholder="My Product"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  data-testid="input-product-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Input
                id="product-description"
                placeholder="Optional product description"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                data-testid="input-product-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-stripe-id">Stripe Product ID</Label>
                <Input
                  id="product-stripe-id"
                  placeholder="prod_..."
                  value={form.stripeProductId}
                  onChange={(e) => updateForm('stripeProductId', e.target.value)}
                  data-testid="input-product-stripe-id"
                />
                <p className="text-xs text-muted-foreground">From your Stripe dashboard</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-metadata-key">Metadata Key</Label>
                <Input
                  id="product-metadata-key"
                  placeholder="e.g., muse_tier"
                  value={form.metadataKey}
                  onChange={(e) => updateForm('metadataKey', e.target.value)}
                  data-testid="input-product-metadata-key"
                />
                <p className="text-xs text-muted-foreground">Stripe product metadata key for tier resolution</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-b">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">Enable this product for users</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => updateForm('isActive', checked)}
                data-testid="switch-product-active-form"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <Label className="text-base font-semibold">Tier Definitions</Label>
                  <p className="text-sm text-muted-foreground">Define pricing tiers and their limits</p>
                </div>
                <Button variant="outline" size="sm" onClick={addTier} data-testid="button-add-tier">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tier
                </Button>
              </div>

              {form.tierDefinitions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tiers defined. Click &quot;Add Tier&quot; to create one.
                </p>
              )}

              {form.tierDefinitions.map((tier, tierIndex) => (
                <Card key={tierIndex} data-testid={`card-tier-${tierIndex}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">Tier {tierIndex + 1}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTier(tierIndex)}
                        data-testid={`button-remove-tier-${tierIndex}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tier ID</Label>
                        <Input
                          placeholder="free"
                          value={tier.id}
                          onChange={(e) => updateTier(tierIndex, 'id', e.target.value)}
                          data-testid={`input-tier-id-${tierIndex}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Display Name</Label>
                        <Input
                          placeholder="Free"
                          value={tier.displayName}
                          onChange={(e) => updateTier(tierIndex, 'displayName', e.target.value)}
                          data-testid={`input-tier-display-name-${tierIndex}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Stripe Metadata Value</Label>
                        <Input
                          placeholder="free"
                          value={tier.stripeMetadataValue}
                          onChange={(e) => updateTier(tierIndex, 'stripeMetadataValue', e.target.value)}
                          data-testid={`input-tier-stripe-value-${tierIndex}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">Limits</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addTierLimit(tierIndex)}
                          data-testid={`button-add-limit-${tierIndex}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Limit
                        </Button>
                      </div>
                      {tier.limits.map((limit, limitIndex) => (
                        <div key={limitIndex} className="flex items-center gap-2">
                          <Input
                            placeholder="key"
                            value={limit.key}
                            onChange={(e) => updateTierLimit(tierIndex, limitIndex, 'key', e.target.value)}
                            className="flex-1"
                            data-testid={`input-limit-key-${tierIndex}-${limitIndex}`}
                          />
                          <Input
                            placeholder="value"
                            value={limit.value}
                            onChange={(e) => updateTierLimit(tierIndex, limitIndex, 'value', e.target.value)}
                            className="flex-1"
                            data-testid={`input-limit-value-${tierIndex}-${limitIndex}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTierLimit(tierIndex, limitIndex)}
                            data-testid={`button-remove-limit-${tierIndex}-${limitIndex}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-product">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.slug || !form.name || !form.metadataKey}
              data-testid="button-save-product"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingSlug ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
