'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign, Loader2, Save, Check } from 'lucide-react'
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
                  <Input
                    id="freePlanDescription"
                    value={settings.pricing?.freePlanDescription ?? ''}
                    onChange={e => updatePricing('freePlanDescription', e.target.value)}
                    placeholder="Perfect for getting started"
                    data-testid="input-free-plan-description"
                  />
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
              <li>Set product names, prices, and descriptions</li>
              <li>Add features in the product metadata (key: features, value: JSON array)</li>
              <li>Your pricing page will automatically display the updates</li>
            </ol>
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
