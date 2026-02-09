'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Loader2, Save, Check, LayoutGrid } from 'lucide-react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'

export default function PricingPage() {
  const { settings, saving, saved, handleSave, updatePricing } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Free Tier Configuration <InfoTooltip text="A free plan reduces signup friction and feeds your conversion funnel. Configure what free users get access to." /></CardTitle>
          <CardDescription>
            Configure your free plan that appears on the pricing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Paid Pricing Plans <InfoTooltip text="Revenue-generating subscription tiers managed through Stripe. Changes in Stripe automatically sync to your pricing page." /></CardTitle>
          <CardDescription>
            Manage your subscription tiers in Stripe Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-muted/50 text-center space-y-4">
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
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create or edit products in Stripe Dashboard</li>
              <li>Set product names, prices, and multi-line descriptions</li>
              <li>Add features in the product metadata (key: <code className="text-xs bg-muted px-1 rounded">features</code>, value: comma-separated list)</li>
              <li>Set display order with metadata key <code className="text-xs bg-muted px-1 rounded">sort_order</code> (e.g. 1, 2, 3)</li>
              <li>Mark the featured plan with metadata key <code className="text-xs bg-muted px-1 rounded">popular</code> set to <code className="text-xs bg-muted px-1 rounded">true</code></li>
              <li>Your pricing page will automatically display the updates</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Card Layout <InfoTooltip text="Control how pricing cards are arranged on your pricing page. Auto will choose the best layout based on the number of plans." />
          </CardTitle>
          <CardDescription>
            Choose how pricing cards are displayed on the page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <SaveButton 
          saving={saving}
          saved={saved}
          onClick={handleSave}
          testId="button-save-pricing"
        />
      </div>
    </div>
  )
}
