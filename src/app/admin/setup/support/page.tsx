'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageCircle } from 'lucide-react'
import { ColorInput } from '@/components/admin/color-input'

export default function SupportPage() {
  const { settings, saving, saved, handleSave, updateSupport } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Support Widget <InfoTooltip text="A floating chatbot that provides instant help to visitors on every page of your site." />
          </CardTitle>
          <CardDescription>
            Configure the AI-powered support chatbot widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Support Widget</p>
              <p className="text-sm text-muted-foreground">Show the support chatbot widget on your site</p>
            </div>
            <Switch
              checked={settings.support?.enabled ?? false}
              onCheckedChange={checked => updateSupport('enabled', checked)}
              data-testid="switch-support-enabled"
            />
          </div>

          {settings.support?.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="widget-position">Widget Position</Label>
                <Select
                  value={settings.support?.widgetPosition ?? 'bottom-right'}
                  onValueChange={(value) => updateSupport('widgetPosition', value as 'bottom-right' | 'bottom-left')}
                >
                  <SelectTrigger id="widget-position" data-testid="select-widget-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <ColorInput
                  label="Widget Color"
                  value={settings.support?.widgetColor ?? '#6366f1'}
                  onChange={hex => updateSupport('widgetColor', hex)}
                  defaultValue="#6366f1"
                  testId="input-widget-color"
                />
                <p className="text-xs text-muted-foreground">Choose the primary color for the widget</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Input
                  id="welcome-message"
                  placeholder="Hi! How can I help you today?"
                  value={settings.support?.welcomeMessage ?? ''}
                  onChange={(e) => updateSupport('welcomeMessage', e.target.value)}
                  data-testid="input-welcome-message"
                />
                <p className="text-xs text-muted-foreground">The initial greeting shown when the widget opens</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallback-email">Fallback Email</Label>
                <Input
                  id="fallback-email"
                  type="email"
                  placeholder={settings.branding?.supportEmail || 'support@example.com'}
                  value={settings.support?.fallbackEmail ?? ''}
                  onChange={(e) => updateSupport('fallbackEmail', e.target.value)}
                  data-testid="input-fallback-email"
                />
                <p className="text-xs text-muted-foreground">Email address when the AI can't help the user</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.support?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">AI Support Configuration <InfoTooltip text="Controls how the AI assistant responds to user questions. Customize the personality and knowledge base." /></CardTitle>
            <CardDescription>
              Configure how your AI support assistant should behave
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="You are a helpful customer support assistant for our company. Help users with their questions and issues..."
                value={settings.support?.systemPrompt ?? ''}
                onChange={(e) => updateSupport('systemPrompt', e.target.value)}
                data-testid="textarea-system-prompt"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Use {'{appName}'} as a placeholder - it will be replaced with your app name.
              </p>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Log Chat Conversations</p>
                <p className="text-sm text-muted-foreground">Save anonymous chat transcripts for admin review</p>
              </div>
              <Switch
                checked={settings.support?.logChats ?? false}
                onCheckedChange={checked => updateSupport('logChats', checked)}
                data-testid="switch-log-chats"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <SaveButton
        saving={saving}
        saved={saved}
        onClick={handleSave}
        testId="button-save-support-settings"
      />
    </div>
  )
}
