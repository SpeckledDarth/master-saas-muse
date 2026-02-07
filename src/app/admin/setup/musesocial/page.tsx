'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Share2, Twitter, Linkedin, Instagram, Youtube, Facebook, Music, MessageSquare, Image, Camera, Gamepad2, AlertTriangle } from 'lucide-react'
import { SiTiktok, SiReddit, SiPinterest, SiSnapchat, SiDiscord } from 'react-icons/si'
import { defaultSettings } from '@/types/settings'
import type { SocialModuleTier } from '@/types/settings'

export default function MuseSocialPage() {
  const { settings, saving, saved, handleSave, updateSocialModule } = useSetupSettingsContext()

  const socialModule = settings.socialModule || defaultSettings.socialModule!

  function updatePosting(key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('posting', { ...current.posting, [key]: value })
  }

  function updateMonitoring(key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('monitoring', { ...current.monitoring, [key]: value })
  }

  function updateStatusChecker(key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('statusChecker', { ...current.statusChecker, [key]: value })
  }

  function updatePlatform(platform: string, key: string, value: any) {
    const current = settings.socialModule || defaultSettings.socialModule!
    updateSocialModule('platforms', { ...current.platforms, [platform]: { ...current.platforms[platform as keyof typeof current.platforms], [key]: value } })
  }

  const isEnabled = settings.features.socialModuleEnabled

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Module Status
            <InfoTooltip text="Controls whether the social media features are available to your users. Enable it in the Features tab." />
          </CardTitle>
          <CardDescription>
            MuseSocial social media management module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium" data-testid="text-module-status-label">MuseSocial Module</p>
              <p className="text-sm text-muted-foreground">Enable this module in the Features tab</p>
            </div>
            {isEnabled ? (
              <Badge variant="default" className="bg-green-600" data-testid="badge-module-status">Active</Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-module-status">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {isEnabled && (() => {
        const warnings: { key: string; testId: string; message: string }[] = []
        if (!settings.features.aiEnabled) {
          warnings.push({ key: 'ai', testId: 'text-dependency-ai', message: 'AI features must be enabled for post generation' })
        }
        const platformEntries = Object.entries(socialModule.platforms) as [string, { enabled: boolean; apiKeyConfigured: boolean }][]
        const enabledPlatforms = platformEntries.filter(([, cfg]) => cfg.enabled)
        if (enabledPlatforms.length === 0) {
          warnings.push({ key: 'no-platforms', testId: 'text-dependency-no-platforms', message: 'Enable at least one social platform' })
        }
        const missingKeys = enabledPlatforms.filter(([, cfg]) => !cfg.apiKeyConfigured)
        if (missingKeys.length > 0) {
          const names = missingKeys.map(([p]) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
          warnings.push({ key: 'api-keys', testId: 'text-dependency-api-keys', message: `API credentials not configured for ${names}. Configure them in Integrations.` })
        }
        if (warnings.length === 0) return null
        return (
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20" data-testid="alert-dependency-warning">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  {warnings.map((w) => (
                    <p key={w.key} className="text-sm text-yellow-800 dark:text-yellow-200" data-testid={w.testId}>{w.message}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {isEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Tier Selection <InfoTooltip text="Determines which social features your users can access and their daily usage limits." /></CardTitle>
              <CardDescription>
                Choose the feature tier for your social module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Module Tier</Label>
                <Select
                  value={socialModule.tier}
                  onValueChange={(value) => updateSocialModule('tier', value as SocialModuleTier)}
                >
                  <SelectTrigger data-testid="select-social-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universal" data-testid="option-tier-universal">Universal</SelectItem>
                    <SelectItem value="power" data-testid="option-tier-power">Power</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {socialModule.tier === 'universal' ? (
                  <p data-testid="text-tier-description">Auto-post changelogs, basic brand monitoring, share buttons</p>
                ) : (
                  <p data-testid="text-tier-description">Full scheduling, trend analysis, AI content generation, analytics, mention automation</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Tier Rate Limits <InfoTooltip text="Set daily caps per user to control API costs. Higher limits mean more API calls to social platforms." /></CardTitle>
              <CardDescription>
                Configure daily usage caps for each tier. These limits apply per user per day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Universal Tier</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="universal-ai">AI Generations / Day</Label>
                    <Input
                      id="universal-ai"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.universal?.dailyAiGenerations ?? 10}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        universal: { ...socialModule.tierLimits?.universal, dailyAiGenerations: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-universal-ai-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="universal-posts">Posts / Day</Label>
                    <Input
                      id="universal-posts"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.universal?.dailyPosts ?? 20}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        universal: { ...socialModule.tierLimits?.universal, dailyPosts: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-universal-post-limit"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Power Tier</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="power-ai">AI Generations / Day</Label>
                    <Input
                      id="power-ai"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.power?.dailyAiGenerations ?? 100}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        power: { ...socialModule.tierLimits?.power, dailyAiGenerations: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-power-ai-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="power-posts">Posts / Day</Label>
                    <Input
                      id="power-posts"
                      type="number"
                      min={1}
                      value={socialModule.tierLimits?.power?.dailyPosts ?? 10000}
                      onChange={(e) => updateSocialModule('tierLimits', {
                        ...socialModule.tierLimits,
                        power: { ...socialModule.tierLimits?.power, dailyPosts: parseInt(e.target.value) || 1 },
                      })}
                      data-testid="input-power-post-limit"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Platform Connections <InfoTooltip text="Enable the social platforms your users can post to. Each platform requires its own API credentials." /></CardTitle>
              <CardDescription>
                Connect your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Twitter / X</p>
                    {socialModule.platforms.twitter.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.twitter.enabled}
                  onCheckedChange={checked => updatePlatform('twitter', 'enabled', checked)}
                  data-testid="switch-platform-twitter"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Linkedin className="h-5 w-5" />
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    {socialModule.platforms.linkedin.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.linkedin.enabled}
                  onCheckedChange={checked => updatePlatform('linkedin', 'enabled', checked)}
                  data-testid="switch-platform-linkedin"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">Coming soon — requires extended API approval</p>
                    {socialModule.platforms.instagram.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.instagram.enabled}
                  onCheckedChange={checked => updatePlatform('instagram', 'enabled', checked)}
                  data-testid="switch-platform-instagram"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Youtube className="h-5 w-5" />
                  <div>
                    <p className="font-medium">YouTube</p>
                    <p className="text-sm text-muted-foreground">Requires Google Cloud Console app</p>
                    {socialModule.platforms.youtube?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.youtube?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('youtube', 'enabled', checked)}
                  data-testid="switch-platform-youtube"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">Requires Meta Business app review</p>
                    {socialModule.platforms.facebook?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.facebook?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('facebook', 'enabled', checked)}
                  data-testid="switch-platform-facebook"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5" />
                  <div>
                    <p className="font-medium">TikTok</p>
                    <p className="text-sm text-muted-foreground">Requires TikTok Developer Portal app</p>
                    {socialModule.platforms.tiktok?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.tiktok?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('tiktok', 'enabled', checked)}
                  data-testid="switch-platform-tiktok"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Reddit</p>
                    <p className="text-sm text-muted-foreground">Requires Reddit API application</p>
                    {socialModule.platforms.reddit?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.reddit?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('reddit', 'enabled', checked)}
                  data-testid="switch-platform-reddit"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Image className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Pinterest</p>
                    <p className="text-sm text-muted-foreground">Requires Pinterest Business developer app</p>
                    {socialModule.platforms.pinterest?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.pinterest?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('pinterest', 'enabled', checked)}
                  data-testid="switch-platform-pinterest"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Snapchat</p>
                    <p className="text-sm text-muted-foreground">Requires Snap Kit developer access</p>
                    {socialModule.platforms.snapchat?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.snapchat?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('snapchat', 'enabled', checked)}
                  data-testid="switch-platform-snapchat"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Discord</p>
                    <p className="text-sm text-muted-foreground">Requires Discord Developer Portal bot/app</p>
                    {socialModule.platforms.discord?.enabled && (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={socialModule.platforms.discord?.enabled ?? false}
                  onCheckedChange={checked => updatePlatform('discord', 'enabled', checked)}
                  data-testid="switch-platform-discord"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Posting Configuration <InfoTooltip text="Controls how AI generates and publishes social content, including brand voice and approval workflow." /></CardTitle>
              <CardDescription>
                Configure how posts are created and published
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brand-voice">Brand Voice</Label>
                <Textarea
                  id="brand-voice"
                  value={socialModule.posting.defaultBrandVoice}
                  onChange={(e) => updatePosting('defaultBrandVoice', e.target.value)}
                  rows={3}
                  data-testid="input-brand-voice"
                />
                <p className="text-xs text-muted-foreground">
                  Describe your brand tone and voice for AI-generated content
                </p>
              </div>

              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <p className="font-medium">Require Approval</p>
                  <p className="text-sm text-muted-foreground">Posts must be approved before publishing</p>
                </div>
                <Switch
                  checked={socialModule.posting.requireApproval}
                  onCheckedChange={checked => updatePosting('requireApproval', checked)}
                  data-testid="switch-require-approval"
                />
              </div>
            </CardContent>
          </Card>

          {socialModule.tier === 'power' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Monitoring <InfoTooltip text="Track brand mentions and trends across platforms automatically. Available only on the Power tier." /></CardTitle>
                <CardDescription>
                  Configure social media monitoring and automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="trend-interval">Trend Check Interval (hours)</Label>
                  <Input
                    id="trend-interval"
                    type="number"
                    min={1}
                    max={168}
                    value={socialModule.monitoring.trendCheckInterval}
                    onChange={(e) => updateMonitoring('trendCheckInterval', parseInt(e.target.value, 10) || 24)}
                    data-testid="input-trend-check-interval"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-b">
                  <div>
                    <p className="font-medium">Mention Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when your brand is mentioned</p>
                  </div>
                  <Switch
                    checked={socialModule.monitoring.mentionAlerts}
                    onCheckedChange={checked => updateMonitoring('mentionAlerts', checked)}
                    data-testid="switch-mention-alerts"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Auto-Reply</p>
                    <p className="text-sm text-muted-foreground">Automatically respond to mentions using AI</p>
                  </div>
                  <Switch
                    checked={socialModule.monitoring.autoReply}
                    onCheckedChange={checked => updateMonitoring('autoReply', checked)}
                    data-testid="switch-auto-reply"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">API Health Checker <InfoTooltip text="Monitors whether social platform APIs are reachable and functioning, with alerts for repeated failures." /></CardTitle>
              <CardDescription>
                Monitor the health of social media API connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Enable Status Checker</p>
                  <p className="text-sm text-muted-foreground">Periodically check API connection health</p>
                </div>
                <Switch
                  checked={socialModule.statusChecker.enabled}
                  onCheckedChange={checked => updateStatusChecker('enabled', checked)}
                  data-testid="switch-status-checker"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Alert on Repeated Failures</p>
                  <p className="text-sm text-muted-foreground">Send alerts when API failures exceed the threshold</p>
                </div>
                <Switch
                  checked={socialModule.statusChecker.alertOnRepeatedFailures}
                  onCheckedChange={checked => updateStatusChecker('alertOnRepeatedFailures', checked)}
                  data-testid="switch-alert-failures"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failure-threshold">Failure Threshold</Label>
                <Input
                  id="failure-threshold"
                  type="number"
                  min={1}
                  max={50}
                  value={socialModule.statusChecker.failureThreshold}
                  onChange={(e) => updateStatusChecker('failureThreshold', parseInt(e.target.value, 10) || 3)}
                  data-testid="input-failure-threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Number of consecutive failures before triggering an alert
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end pt-6">
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={handleSave}
          testId="button-save-musesocial"
        />
      </div>
    </div>
  )
}
