'use client'

import { useState, useMemo } from 'react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Shield, ChevronDown, ChevronRight, Eye, EyeOff, Cookie, AlertTriangle, Info } from 'lucide-react'

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    let processed = content
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 dark:text-primary-400 underline" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, '<br />')
    return `<p class="my-2">${processed}</p>`
  }, [content])

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  )
}

interface LegalPageConfig {
  key: string
  dateKey: string
  label: string
  core?: boolean
  toggleKey?: string
}

const legalPages: LegalPageConfig[] = [
  { key: 'termsOfService', dateKey: 'termsLastUpdated', label: 'Terms of Service', core: true },
  { key: 'privacyPolicy', dateKey: 'privacyLastUpdated', label: 'Privacy Policy', core: true },
  { key: 'acceptableUse', dateKey: 'acceptableUseLastUpdated', label: 'Acceptable Use Policy', toggleKey: 'acceptableUseEnabled' },
  { key: 'cookiePolicy', dateKey: 'cookiePolicyLastUpdated', label: 'Cookie Policy', toggleKey: 'cookiePolicyEnabled' },
  { key: 'accessibilityStatement', dateKey: 'accessibilityLastUpdated', label: 'Accessibility Statement', toggleKey: 'accessibilityEnabled' },
  { key: 'dmcaPolicy', dateKey: 'dmcaLastUpdated', label: 'DMCA Policy', toggleKey: 'dmcaEnabled' },
  { key: 'dataHandling', dateKey: 'dataHandlingLastUpdated', label: 'Data Handling Policy', toggleKey: 'dataHandlingEnabled' },
  { key: 'aiDataUsage', dateKey: 'aiDataUsageLastUpdated', label: 'AI Data Usage Policy', toggleKey: 'aiDataUsageEnabled' },
  { key: 'securityPolicy', dateKey: 'securityPolicyLastUpdated', label: 'Security Policy', toggleKey: 'securityPolicyEnabled' },
]

export default function CompliancePage() {
  const { settings, saving, saved, handleSave, updateCompliance, updateLegal } = useSetupSettingsContext()
  const [expandedPage, setExpandedPage] = useState<string | null>(null)
  const [previewPages, setPreviewPages] = useState<Record<string, boolean>>({})

  function togglePreview(key: string) {
    setPreviewPages(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function isPageEnabled(page: typeof legalPages[number]): boolean {
    if (page.core) return true
    if (!page.toggleKey) return false
    return settings.compliance?.[page.toggleKey as keyof typeof settings.compliance] as boolean ?? false
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Pages <InfoTooltip text="Legal pages protect your business and build user trust. Terms and Privacy Policy are always enabled." />
          </CardTitle>
          <CardDescription>
            Toggle optional legal and compliance pages. Terms of Service and Privacy Policy are always enabled as core pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Acceptable Use Policy</p>
              <p className="text-sm text-muted-foreground">Define acceptable behavior and usage rules</p>
            </div>
            <Switch
              checked={settings.compliance?.acceptableUseEnabled ?? false}
              onCheckedChange={checked => updateCompliance('acceptableUseEnabled', checked)}
              data-testid="switch-acceptable-use-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Cookie Policy</p>
              <p className="text-sm text-muted-foreground">Explain how cookies are used on your site</p>
            </div>
            <Switch
              checked={settings.compliance?.cookiePolicyEnabled ?? false}
              onCheckedChange={checked => updateCompliance('cookiePolicyEnabled', checked)}
              data-testid="switch-cookie-policy-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Accessibility Statement</p>
              <p className="text-sm text-muted-foreground">Declare your commitment to web accessibility</p>
            </div>
            <Switch
              checked={settings.compliance?.accessibilityEnabled ?? false}
              onCheckedChange={checked => updateCompliance('accessibilityEnabled', checked)}
              data-testid="switch-accessibility-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">DMCA Policy</p>
              <p className="text-sm text-muted-foreground">Copyright infringement notice and takedown procedures</p>
            </div>
            <Switch
              checked={settings.compliance?.dmcaEnabled ?? false}
              onCheckedChange={checked => updateCompliance('dmcaEnabled', checked)}
              data-testid="switch-dmca-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Data Handling Policy</p>
              <p className="text-sm text-muted-foreground">Describe how user data is processed and stored</p>
            </div>
            <Switch
              checked={settings.compliance?.dataHandlingEnabled ?? false}
              onCheckedChange={checked => updateCompliance('dataHandlingEnabled', checked)}
              data-testid="switch-data-handling-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">AI Data Usage Policy</p>
              <p className="text-sm text-muted-foreground">Explain how AI features use and process data</p>
            </div>
            <Switch
              checked={settings.compliance?.aiDataUsageEnabled ?? false}
              onCheckedChange={checked => updateCompliance('aiDataUsageEnabled', checked)}
              data-testid="switch-ai-data-usage-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Security Policy</p>
              <p className="text-sm text-muted-foreground">Outline your security practices and vulnerability reporting</p>
            </div>
            <Switch
              checked={settings.compliance?.securityPolicyEnabled ?? false}
              onCheckedChange={checked => updateCompliance('securityPolicyEnabled', checked)}
              data-testid="switch-security-policy-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Consent Banner <InfoTooltip text="Required by GDPR and similar privacy laws for EU visitors. Lets users choose which cookies to accept." />
          </CardTitle>
          <CardDescription>
            Configure the cookie consent banner shown to visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Cookie Consent</p>
              <p className="text-sm text-muted-foreground">Show a cookie consent banner to visitors</p>
            </div>
            <Switch
              checked={settings.compliance?.cookieConsentEnabled ?? false}
              onCheckedChange={checked => updateCompliance('cookieConsentEnabled', checked)}
              data-testid="switch-cookie-consent-enabled"
            />
          </div>

          {settings.compliance?.cookieConsentEnabled && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cookie-consent-text">Consent Banner Text</Label>
                <Input
                  id="cookie-consent-text"
                  value={settings.compliance?.cookieConsentText ?? 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.'}
                  onChange={e => updateCompliance('cookieConsentText', e.target.value)}
                  data-testid="input-cookie-consent-text"
                />
              </div>

              <div className="space-y-4">
                <Label>Cookie Categories</Label>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Necessary</p>
                    <p className="text-sm text-muted-foreground">Essential cookies required for the site to function</p>
                  </div>
                  <Switch
                    checked={true}
                    disabled
                    data-testid="switch-cookie-necessary"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-muted-foreground">Cookies used to track site usage and performance</p>
                  </div>
                  <Switch
                    checked={settings.compliance?.cookieConsentCategories?.analytics ?? false}
                    onCheckedChange={checked => updateCompliance('cookieConsentCategories', {
                      ...(settings.compliance?.cookieConsentCategories ?? { necessary: true, analytics: false, marketing: false }),
                      analytics: checked,
                    })}
                    data-testid="switch-cookie-analytics"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Marketing</p>
                    <p className="text-sm text-muted-foreground">Cookies used for targeted advertising</p>
                  </div>
                  <Switch
                    checked={settings.compliance?.cookieConsentCategories?.marketing ?? false}
                    onCheckedChange={checked => updateCompliance('cookieConsentCategories', {
                      ...(settings.compliance?.cookieConsentCategories ?? { necessary: true, analytics: false, marketing: false }),
                      marketing: checked,
                    })}
                    data-testid="switch-cookie-marketing"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Edit Legal Pages <InfoTooltip text="Customize your legal documents with Markdown formatting. Use placeholders for dynamic values." /></CardTitle>
          <CardDescription>
            Edit the content for each legal page. Click a page name to expand its editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 rounded-md bg-muted p-3 mb-4">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Use {'{appName}'} and {'{supportEmail}'} as placeholders — they will be replaced with your app name and support email automatically.
            </p>
          </div>

          {legalPages.map(page => {
            const isExpanded = expandedPage === page.key
            const isEnabled = isPageEnabled(page)
            const showPreview = previewPages[page.key] ?? false
            const contentValue = (settings.pages?.legal as unknown as Record<string, string>)?.[page.key] ?? ''
            const dateValue = (settings.pages?.legal as unknown as Record<string, string>)?.[page.dateKey] ?? ''

            return (
              <div key={page.key} className="border rounded-md">
                <button
                  type="button"
                  className="flex items-center justify-between gap-2 w-full p-4 text-left"
                  onClick={() => setExpandedPage(isExpanded ? null : page.key)}
                  data-testid={`button-expand-${page.key}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <span className="font-medium">{page.label}</span>
                    {page.core && (
                      <span className="text-xs text-muted-foreground">(always enabled)</span>
                    )}
                    {!page.core && !isEnabled && (
                      <span className="text-xs text-muted-foreground">(disabled)</span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`date-${page.key}`}>Last Updated</Label>
                      <Input
                        id={`date-${page.key}`}
                        type="date"
                        value={dateValue}
                        onChange={e => updateLegal(page.dateKey as any, e.target.value)}
                        data-testid={`input-date-${page.key}`}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label htmlFor={`content-${page.key}`}>Content (Markdown)</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePreview(page.key)}
                        data-testid={`button-preview-${page.key}`}
                      >
                        {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showPreview ? 'Hide Preview' : 'Preview'}
                      </Button>
                    </div>

                    {showPreview ? (
                      <div className="border rounded-md p-4" data-testid={`preview-${page.key}`}>
                        <MarkdownPreview content={contentValue} />
                      </div>
                    ) : (
                      <Textarea
                        id={`content-${page.key}`}
                        rows={12}
                        value={contentValue}
                        onChange={e => updateLegal(page.key as any, e.target.value)}
                        data-testid={`textarea-${page.key}`}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 rounded-md bg-muted p-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          These are starter templates. Consult a legal professional to customize them for your specific needs.
        </p>
      </div>

      <SaveButton
        saving={saving}
        saved={saved}
        onClick={handleSave}
        testId="button-save-compliance"
      />
    </div>
  )
}
