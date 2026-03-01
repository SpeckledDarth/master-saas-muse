'use client'

import { Button } from '@/components/ui/button'
import { Save, Check, Loader2 } from 'lucide-react'
import { SetupSettingsProvider, useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { TooltipProvider } from '@/components/ui/tooltip'

function SetupLayoutInner({ children }: { children: React.ReactNode }) {
  const ctx = useSetupSettingsContext()

  if (ctx.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-setup">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-[var(--section-spacing,1.5rem)] px-[var(--section-spacing,1.5rem)]">
      <div className="flex items-center justify-between mb-[var(--content-density-gap,1rem)] gap-[var(--content-density-gap,1rem)] flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-setup-title">Setup Dashboard</h1>
          <p className="text-sm text-muted-foreground">Configure your SaaS branding, pricing, and features</p>
        </div>
        <Button
          onClick={ctx.handleSave}
          disabled={ctx.saving}
          data-testid="button-save-settings"
        >
          {ctx.saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : ctx.saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {ctx.saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="min-w-0">
        {children}
      </div>
    </div>
  )
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <SetupSettingsProvider>
        <SetupLayoutInner>{children}</SetupLayoutInner>
      </SetupSettingsProvider>
    </TooltipProvider>
  )
}
