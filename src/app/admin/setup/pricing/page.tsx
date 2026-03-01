'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, LayoutGrid } from 'lucide-react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { InfoTooltip } from '../components'
import { EditableSettingsGroup } from '@/components/admin/editable-settings-group'
import { DSCard, DSCardContent } from '@/components/ui/ds-card'

export default function PricingPage() {
  const { settings, saving, handleSave, updatePricing } = useSetupSettingsContext()

  const onSave = async () => { await handleSave() }

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <EditableSettingsGroup
        title="Free Tier Configuration"
        description="Configure your free plan that appears on the pricing page"
        onSave={onSave}
        isSaving={saving}
      >
        <div className="space-y-[var(--content-density-gap,1rem)]">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Show Free Plan</p>
              <p className="text-sm text-muted-foreground">Display a free tier on the pricing page</p>
            </div>
            <Switch
              checked={settings.pricing?.showFreePlan ?? true}
              onCheckedChange={checked => updatePricing('showFreePlan', checked)}
              data-testid="switch-show-free-plan"
            />
          </div>

          {(settings.pricing?.showFreePlan ?? true) && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--content-density-gap,1rem)]">
                <div className="space-y-2">
                  <Label htmlFor="freePlanName">Plan Name</Label>
                  <Input
                    id="freePlanName"
                    value={settings.pricing?.freePlanName ?? 'Free'}
                    onChange={e => updatePricing('freePlanName', e.target.value)}
                    placeholder="Free"
                    data-testid="input-free-plan-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freePlanDescription">Description</Label>
                  <Textarea
                    id="freePlanDescription"
                    value={settings.pricing?.freePlanDescription ?? ''}
                    onChange={e => updatePricing('freePlanDescription', e.target.value)}
                    placeholder="Perfect for getting started&#10;Add more details on a new line"
                    rows={3}
                    data-testid="input-free-plan-description"
                  />
                  <p className="text-xs text-muted-foreground">Supports multiple lines for marketing content</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={(settings.pricing?.freePlanFeatures ?? []).join('\n')}
                  onChange={e => updatePricing('freePlanFeatures', e.target.value.split('\n'))}
                  onBlur={e => updatePricing('freePlanFeatures', e.target.value.split('\n').filter(f => f.trim()))}
                  placeholder="Basic features&#10;Up to 100 items&#10;Community support"
                  rows={4}
                  data-testid="textarea-free-plan-features"
                />
                <p className="text-xs text-muted-foreground">Enter each feature on a new line</p>
              </div>
            </>
          )}
        </div>
      </EditableSettingsGroup>

      <DSCard>
        <DSCardContent className="space-y-[var(--content-density-gap,1rem)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3
                className="text-base font-semibold text-foreground flex items-center gap-2"
                style={{ fontSize: 'var(--h3-size, 1.125rem)', fontWeight: 'var(--h3-weight, 600)' }}
              >
                Paid Pricing Plans <InfoTooltip text="Revenue-generating subscription tiers managed through Stripe. Changes in Stripe automatically sync to your pricing page." />
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Manage your subscription tiers in Stripe Dashboard</p>
            </div>
          </div>
          <div className="p-[var(--section-spacing,1.5rem)] border rounded-[var(--card-radius,0.75rem)] bg-muted/50 text-center space-y-[var(--content-density-gap,1rem)]">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Paid plans are managed in Stripe</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                To keep invoices, emails, and your pricing page consistent, 
                paid plans are managed directly in Stripe. Changes you make there 
                will automatically appear on your site.
              </p>
            </div>
            <Button
              onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
              className="mt-4"
              data-testid="button-open-stripe"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Manage Products in Stripe
            </Button>
          </div>
          
          <div className="text-sm space-y-[var(--content-density-gap,1rem)]">
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Create or edit products in Stripe Dashboard</li>
              <li>Set product names, prices, and multi-line descriptions</li>
              <li>Your pricing page will automatically display the updates</li>
            </ol>

            <div className="border rounded-[var(--card-radius,0.75rem)] p-[var(--card-padding,1.25rem)] space-y-3">
              <p className="font-medium">Stripe Product Metadata Keys</p>
              <p className="text-xs text-muted-foreground">Add these as metadata key/value pairs on each Stripe product to control how cards appear on your pricing page.</p>
              <div className="grid gap-[var(--content-density-gap,1rem)]">
                <div className="flex items-start gap-[var(--content-density-gap,1rem)] p-[var(--card-padding,1.25rem)] bg-muted/50 rounded-[var(--card-radius,0.75rem)]">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-shrink-0">features</code>
                  <div>
                    <p className="text-sm">Comma-separated list of features shown with checkmarks</p>
                    <p className="text-xs text-muted-foreground mt-1">Example: <code className="bg-muted px-1 rounded">Unlimited posts, Priority support, API access</code></p>
                  </div>
                </div>
                <div className="flex items-start gap-[var(--content-density-gap,1rem)] p-[var(--card-padding,1.25rem)] bg-muted/50 rounded-[var(--card-radius,0.75rem)]">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-shrink-0">sort_order</code>
                  <div>
                    <p className="text-sm">Controls the left-to-right display order of cards</p>
                    <p className="text-xs text-muted-foreground mt-1">Example: <code className="bg-muted px-1 rounded">1</code>, <code className="bg-muted px-1 rounded">2</code>, <code className="bg-muted px-1 rounded">3</code> (lowest number appears first)</p>
                  </div>
                </div>
                <div className="flex items-start gap-[var(--content-density-gap,1rem)] p-[var(--card-padding,1.25rem)] bg-muted/50 rounded-[var(--card-radius,0.75rem)]">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-shrink-0">popular</code>
                  <div>
                    <p className="text-sm">Highlights the card with a border and &ldquo;Popular&rdquo; badge</p>
                    <p className="text-xs text-muted-foreground mt-1">Set to <code className="bg-muted px-1 rounded">true</code> on exactly one product to highlight it</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DSCardContent>
      </DSCard>

      <EditableSettingsGroup
        title="Card Layout"
        description="Choose how pricing cards are displayed on the page"
        onSave={onSave}
        isSaving={saving}
      >
        <div className="space-y-[var(--content-density-gap,1rem)]">
          <div className="space-y-2">
            <Label>Cards Per Row</Label>
            <Select
              value={settings.pricing?.cardLayout ?? 'auto'}
              onValueChange={value => updatePricing('cardLayout', value as 'auto' | '2' | '3' | '4')}
            >
              <SelectTrigger data-testid="select-card-layout" className="w-full">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (based on plan count)</SelectItem>
                <SelectItem value="2">2 per row</SelectItem>
                <SelectItem value="3">3 per row</SelectItem>
                <SelectItem value="4">4 per row</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Auto mode shows 2 columns for 2 plans, 3 columns for 3 plans, and 4 columns for 4+ plans
            </p>
          </div>
        </div>
      </EditableSettingsGroup>
    </div>
  )
}
