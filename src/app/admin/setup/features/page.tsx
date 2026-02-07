'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, Bot, Loader2, Check, AlertTriangle } from 'lucide-react'
import type { AIProvider } from '@/types/settings'

export default function FeaturesPage() {
  const { settings, saving, saved, handleSave, updateFeatures, updateAI, updateWebhooks, updateWebhookEvent, webhookTesting, webhookTestResult, testWebhook, aiProviders } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable features for your SaaS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Email Authentication</p>
              <p className="text-sm text-muted-foreground">Allow users to sign up with email/password</p>
            </div>
            <Switch
              checked={settings.features.emailAuth}
              onCheckedChange={checked => updateFeatures('emailAuth', checked)}
              data-testid="switch-email-auth"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Magic Link</p>
              <p className="text-sm text-muted-foreground">Allow passwordless email sign-in</p>
            </div>
            <Switch
              checked={settings.features.magicLink}
              onCheckedChange={checked => updateFeatures('magicLink', checked)}
              data-testid="switch-magic-link"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Google OAuth</p>
              <p className="text-sm text-muted-foreground">Allow users to sign in with Google</p>
            </div>
            <Switch
              checked={settings.features.googleOAuth}
              onCheckedChange={checked => updateFeatures('googleOAuth', checked)}
              data-testid="switch-google-oauth"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">GitHub OAuth</p>
              <p className="text-sm text-muted-foreground">Allow users to sign in with GitHub</p>
            </div>
            <Switch
              checked={settings.features.githubOAuth}
              onCheckedChange={checked => updateFeatures('githubOAuth', checked)}
              data-testid="switch-github-oauth"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Apple OAuth</p>
              <p className="text-sm text-muted-foreground">Allow users to sign in with Apple</p>
            </div>
            <Switch
              checked={settings.features.appleOAuth}
              onCheckedChange={checked => updateFeatures('appleOAuth', checked)}
              data-testid="switch-apple-oauth"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">X (Twitter) OAuth</p>
              <p className="text-sm text-muted-foreground">Allow users to sign in with X</p>
            </div>
            <Switch
              checked={settings.features.twitterOAuth}
              onCheckedChange={checked => updateFeatures('twitterOAuth', checked)}
              data-testid="switch-twitter-oauth"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Avatar Upload</p>
              <p className="text-sm text-muted-foreground">Allow users to upload profile pictures</p>
            </div>
            <Switch
              checked={settings.features.avatarUpload}
              onCheckedChange={checked => updateFeatures('avatarUpload', checked)}
              data-testid="switch-avatar-upload"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Admin Panel</p>
              <p className="text-sm text-muted-foreground">Enable the admin dashboard</p>
            </div>
            <Switch
              checked={settings.features.adminPanel}
              onCheckedChange={checked => updateFeatures('adminPanel', checked)}
              data-testid="switch-admin-panel"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Audit Logs</p>
              <p className="text-sm text-muted-foreground">Track admin actions</p>
            </div>
            <Switch
              checked={settings.features.auditLogs}
              onCheckedChange={checked => updateFeatures('auditLogs', checked)}
              data-testid="switch-audit-logs"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Allow New Signups</p>
              <p className="text-sm text-muted-foreground">Accept new user registrations</p>
            </div>
            <Switch
              checked={settings.features.allowNewSignups}
              onCheckedChange={checked => updateFeatures('allowNewSignups', checked)}
              data-testid="switch-allow-signups"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Show maintenance page to all users</p>
            </div>
            <Switch
              checked={settings.features.maintenanceMode}
              onCheckedChange={checked => updateFeatures('maintenanceMode', checked)}
              data-testid="switch-maintenance-mode"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Waitlist Mode</p>
              <p className="text-sm text-muted-foreground">Require users to join a waitlist before accessing the app</p>
            </div>
            <Switch
              checked={settings.features.waitlistMode}
              onCheckedChange={checked => updateFeatures('waitlistMode', checked)}
              data-testid="switch-waitlist-mode"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Feedback Widget</p>
              <p className="text-sm text-muted-foreground">Show the feedback widget for users to submit feedback</p>
            </div>
            <Switch
              checked={settings.features.feedbackWidget}
              onCheckedChange={checked => updateFeatures('feedbackWidget', checked)}
              data-testid="switch-feedback-widget"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">AI Features</p>
              <p className="text-sm text-muted-foreground">Enable AI-powered features using xAI Grok, OpenAI, or Anthropic</p>
            </div>
            <Switch
              checked={settings.features.aiEnabled}
              onCheckedChange={checked => updateFeatures('aiEnabled', checked)}
              data-testid="switch-ai-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="font-medium">MuseSocial Module</p>
              <p className="text-sm text-muted-foreground">Enable social media management (posting, monitoring, AI content generation)</p>
            </div>
            <Switch
              checked={settings.features.socialModuleEnabled}
              onCheckedChange={checked => updateFeatures('socialModuleEnabled', checked)}
              data-testid="switch-social-module"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enterprise SSO / SAML</p>
              <p className="text-sm text-muted-foreground">Enable SAML 2.0 single sign-on for enterprise customers</p>
            </div>
            <Switch
              checked={settings.features.ssoEnabled}
              onCheckedChange={checked => updateFeatures('ssoEnabled', checked)}
              data-testid="switch-sso-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhook / n8n Integration
          </CardTitle>
          <CardDescription>
            Send real-time events to n8n, Zapier, or any webhook URL when key actions happen in your app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Webhooks</p>
              <p className="text-sm text-muted-foreground">Fire HTTP POST events to an external URL</p>
            </div>
            <Switch
              checked={settings.webhooks?.enabled ?? false}
              onCheckedChange={checked => updateWebhooks('enabled', checked)}
              data-testid="switch-webhooks-enabled"
            />
          </div>

          {settings.webhooks?.enabled && (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-n8n-instance.com/webhook/abc123"
                  value={settings.webhooks?.url || ''}
                  onChange={(e) => updateWebhooks('url', e.target.value)}
                  data-testid="input-webhook-url"
                />
                <p className="text-xs text-muted-foreground">
                  The URL that will receive POST requests with event data
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret (optional)</Label>
                <Input
                  type="password"
                  placeholder="A shared secret for HMAC signature verification"
                  value={settings.webhooks?.secret || ''}
                  onChange={(e) => updateWebhooks('secret', e.target.value)}
                  data-testid="input-webhook-secret"
                />
                <p className="text-xs text-muted-foreground">
                  If set, each request includes an <code className="bg-muted px-1 py-0.5 rounded text-xs">X-Webhook-Signature</code> header for verification
                </p>
              </div>

              <div className="space-y-3">
                <Label>Events to Send</Label>
                <div className="space-y-2">
                  {[
                    { key: 'feedbackSubmitted' as const, label: 'Feedback Submitted', desc: 'When a user submits feedback' },
                    { key: 'waitlistEntry' as const, label: 'Waitlist Entry', desc: 'When someone joins the waitlist' },
                    { key: 'subscriptionCreated' as const, label: 'Subscription Created', desc: 'When a new subscription is purchased' },
                    { key: 'subscriptionUpdated' as const, label: 'Subscription Updated', desc: 'When a subscription is modified or set to cancel' },
                    { key: 'subscriptionCancelled' as const, label: 'Subscription Cancelled', desc: 'When a subscription is fully cancelled' },
                    { key: 'teamInvited' as const, label: 'Team Invitation Sent', desc: 'When a team member is invited' },
                    { key: 'teamMemberJoined' as const, label: 'Team Member Joined', desc: 'When an invitation is accepted' },
                    { key: 'contactSubmitted' as const, label: 'Contact Form Submitted', desc: 'When someone submits the contact form' },
                  ].map(evt => (
                    <div key={evt.key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium">{evt.label}</p>
                        <p className="text-xs text-muted-foreground">{evt.desc}</p>
                      </div>
                      <Switch
                        checked={settings.webhooks?.events?.[evt.key] ?? true}
                        onCheckedChange={checked => updateWebhookEvent(evt.key, checked)}
                        data-testid={`switch-webhook-event-${evt.key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testWebhook}
                  disabled={webhookTesting || !settings.webhooks?.url}
                  data-testid="button-test-webhook"
                >
                  {webhookTesting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
                  Send Test Event
                </Button>
                {webhookTestResult && (
                  <p className={`text-sm ${webhookTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {webhookTestResult.success
                      ? `Delivered (status ${webhookTestResult.status})`
                      : `Failed: ${webhookTestResult.error || 'Unknown error'}`}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.features.aiEnabled && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Provider Configuration
            </CardTitle>
            <CardDescription>
              Configure which AI provider and model to use. Set the API key as an environment variable in your deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={settings.ai?.provider || 'xai'}
                onValueChange={(value) => {
                  updateAI('provider', value as AIProvider)
                  const provider = aiProviders.find(p => p.id === value)
                  if (provider && provider.models.length > 0) {
                    updateAI('model', provider.models[0].id)
                  }
                }}
              >
                <SelectTrigger data-testid="select-ai-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map(p => (
                    <SelectItem key={p.id} value={p.id} data-testid={`option-ai-provider-${p.id}`}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Required env variable: <code className="bg-muted px-1 py-0.5 rounded text-xs">{aiProviders.find(p => p.id === (settings.ai?.provider || 'xai'))?.envKey || 'XAI_API_KEY'}</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={settings.ai?.model || 'grok-3-mini-fast'}
                onValueChange={(value) => updateAI('model', value)}
              >
                <SelectTrigger data-testid="select-ai-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {(aiProviders.find(p => p.id === (settings.ai?.provider || 'xai'))?.models || []).map(m => (
                    <SelectItem key={m.id} value={m.id} data-testid={`option-ai-model-${m.id}`}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  min={1}
                  max={32768}
                  value={settings.ai?.maxTokens || 1024}
                  onChange={(e) => updateAI('maxTokens', parseInt(e.target.value) || 1024)}
                  data-testid="input-ai-max-tokens"
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.ai?.temperature || 0.7}
                  onChange={(e) => updateAI('temperature', parseFloat(e.target.value) || 0.7)}
                  data-testid="input-ai-temperature"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={settings.ai?.systemPrompt || ''}
                onChange={(e) => updateAI('systemPrompt', e.target.value)}
                rows={3}
                data-testid="input-ai-system-prompt"
              />
              <p className="text-xs text-muted-foreground">
                Default instructions sent to the AI with every request
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-6">
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={handleSave}
          testId="button-save-features"
        />
      </div>
    </div>
  )
}
