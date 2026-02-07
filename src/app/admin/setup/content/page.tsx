'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { MiniSaveButton, SaveButton, IconComponent, iconOptions, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'

export default function ContentPage() {
  const {
    settings,
    saving,
    saved,
    handleSave,
    setSettings,
    updateContent,
    updateCTA,
    addFeatureCard,
    updateFeatureCard,
    removeFeatureCard,
    addTestimonial,
    updateTestimonial,
    removeTestimonial,
    addFAQItem,
    updateFAQItem,
    removeFAQItem,
  } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-300">Quick Tips for Homepage Sections</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <p><strong>Enable/Disable:</strong> Use the toggle switch on each section card to show or hide it on your homepage.</p>
          <p><strong>Section Order:</strong> Sections appear on the homepage in this order: Hero → Logo Marquee → Metrics → Features → Testimonials → Process Steps → Customer Stories → Image+Text Blocks → FAQ → CTA.</p>
          <p><strong>Backgrounds:</strong> Scroll down to "Section Backgrounds" to customize each section's look (transparent, muted, gradient, or mesh).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Features Section <InfoTooltip text="Highlight your product's key selling points on the homepage. Each card shows an icon, title, and description." /></CardTitle>
              <CardDescription>Highlight what makes your product special</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-features" />
              <Switch
                checked={settings.content?.featuresEnabled ?? true}
                onCheckedChange={checked => updateContent('featuresEnabled', checked)}
                data-testid="switch-features-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section Headline</Label>
              <Input
                value={settings.content?.featuresHeadline ?? ''}
                onChange={e => updateContent('featuresHeadline', e.target.value)}
                placeholder="Everything you need"
                data-testid="input-features-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subheadline</Label>
              <Input
                value={settings.content?.featuresSubheadline ?? ''}
                onChange={e => updateContent('featuresSubheadline', e.target.value)}
                placeholder="Powerful features to help you build faster"
                data-testid="input-features-subheadline"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Feature Cards</Label>
              <Button size="sm" variant="outline" onClick={addFeatureCard} data-testid="button-add-feature">
                <Plus className="h-4 w-4 mr-1" /> Add Feature
              </Button>
            </div>
            
            {(settings.content?.featureCards ?? []).map((card, index) => (
              <div key={card.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feature {index + 1}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => removeFeatureCard(card.id)}
                    aria-label="Remove feature"
                    data-testid={`button-remove-feature-${card.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Icon</Label>
                    <Select
                      value={card.icon}
                      onValueChange={value => updateFeatureCard(card.id, 'icon', value)}
                    >
                      <SelectTrigger data-testid={`select-feature-icon-${card.id}`}>
                        <div className="flex items-center gap-2">
                          <IconComponent name={card.icon} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent name={opt.value} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={card.title}
                      onChange={e => updateFeatureCard(card.id, 'title', e.target.value)}
                      placeholder="Feature title"
                      data-testid={`input-feature-title-${card.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={card.description}
                      onChange={e => updateFeatureCard(card.id, 'description', e.target.value)}
                      placeholder="Feature description"
                      data-testid={`input-feature-desc-${card.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Testimonials <InfoTooltip text="Social proof from real customers builds trust and improves conversion rates." /></CardTitle>
              <CardDescription>Show what customers say about your product</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-testimonials" />
              <Switch
                checked={settings.content?.testimonialsEnabled ?? true}
                onCheckedChange={checked => updateContent('testimonialsEnabled', checked)}
                data-testid="switch-testimonials-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section Headline</Label>
              <Input
                value={settings.content?.testimonialsHeadline ?? ''}
                onChange={e => updateContent('testimonialsHeadline', e.target.value)}
                placeholder="What our customers say"
                data-testid="input-testimonials-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Display Style</Label>
              <Select
                value={settings.content?.testimonialStyle ?? 'cards'}
                onValueChange={value => updateContent('testimonialStyle', value as 'cards' | 'carousel')}
              >
                <SelectTrigger data-testid="select-testimonial-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Grid Cards</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Customer Testimonials</Label>
              <Button size="sm" variant="outline" onClick={addTestimonial} data-testid="button-add-testimonial">
                <Plus className="h-4 w-4 mr-1" /> Add Testimonial
              </Button>
            </div>
            
            {(settings.content?.testimonials ?? []).map((t, index) => (
              <div key={t.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Testimonial {index + 1}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => removeTestimonial(t.id)}
                    aria-label="Remove testimonial"
                    data-testid={`button-remove-testimonial-${t.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={t.name}
                      onChange={e => updateTestimonial(t.id, 'name', e.target.value)}
                      placeholder="Customer name"
                      data-testid={`input-testimonial-name-${t.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Input
                      value={t.role}
                      onChange={e => updateTestimonial(t.id, 'role', e.target.value)}
                      placeholder="CEO, Developer, etc."
                      data-testid={`input-testimonial-role-${t.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={t.company}
                      onChange={e => updateTestimonial(t.id, 'company', e.target.value)}
                      placeholder="Company name"
                      data-testid={`input-testimonial-company-${t.id}`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quote</Label>
                  <Textarea
                    value={t.quote}
                    onChange={e => updateTestimonial(t.id, 'quote', e.target.value)}
                    placeholder="Their testimonial..."
                    rows={2}
                    data-testid={`input-testimonial-quote-${t.id}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">FAQ Section <InfoTooltip text="Answers common questions to reduce support tickets and help visitors make purchase decisions." /></CardTitle>
              <CardDescription>Answer common questions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-faq" />
              <Switch
                checked={settings.content?.faqEnabled ?? true}
                onCheckedChange={checked => updateContent('faqEnabled', checked)}
                data-testid="switch-faq-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Section Headline</Label>
            <Input
              value={settings.content?.faqHeadline ?? ''}
              onChange={e => updateContent('faqHeadline', e.target.value)}
              placeholder="Frequently asked questions"
              data-testid="input-faq-headline"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>FAQ Items</Label>
              <Button size="sm" variant="outline" onClick={addFAQItem} data-testid="button-add-faq">
                <Plus className="h-4 w-4 mr-1" /> Add FAQ
              </Button>
            </div>
            
            {(settings.content?.faqItems ?? []).map((faq, index) => (
              <div key={faq.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FAQ {index + 1}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => removeFAQItem(faq.id)}
                    aria-label="Remove FAQ"
                    data-testid={`button-remove-faq-${faq.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Question</Label>
                    <Input
                      value={faq.question}
                      onChange={e => updateFAQItem(faq.id, 'question', e.target.value)}
                      placeholder="How do I...?"
                      data-testid={`input-faq-question-${faq.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Answer</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={e => updateFAQItem(faq.id, 'answer', e.target.value)}
                      placeholder="The answer is..."
                      rows={2}
                      data-testid={`input-faq-answer-${faq.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Call to Action <InfoTooltip text="The final prompt encouraging visitors to sign up. A strong CTA can significantly boost conversions." /></CardTitle>
              <CardDescription>Final prompt to get users to sign up</CardDescription>
            </div>
            <Switch
              checked={settings.content?.ctaEnabled ?? true}
              onCheckedChange={checked => updateContent('ctaEnabled', checked)}
              data-testid="switch-cta-enabled"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.content?.cta?.headline ?? ''}
                onChange={e => updateCTA('headline', e.target.value)}
                placeholder="Ready to get started?"
                data-testid="input-cta-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={settings.content?.cta?.description ?? ''}
                onChange={e => updateCTA('description', e.target.value)}
                placeholder="Join thousands of satisfied customers"
                data-testid="input-cta-description"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={settings.content?.cta?.buttonText ?? ''}
                onChange={e => updateCTA('buttonText', e.target.value)}
                placeholder="Start Free Trial"
                data-testid="input-cta-button-text"
              />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input
                value={settings.content?.cta?.buttonLink ?? ''}
                onChange={e => updateCTA('buttonLink', e.target.value)}
                placeholder="/signup"
                data-testid="input-cta-button-link"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Trusted By / Logo Marquee <InfoTooltip text="Scrolling logos of trusted companies add credibility and social proof to your landing page." /></CardTitle>
              <CardDescription>Show scrolling logos of companies that trust you</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-logo-marquee" />
              <Switch
                checked={settings.content?.trustedByEnabled ?? false}
                onCheckedChange={checked => updateContent('trustedByEnabled', checked)}
                data-testid="switch-trusted-by-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Section Headline</Label>
            <Input
              value={settings.content?.trustedByHeadline ?? ''}
              onChange={e => updateContent('trustedByHeadline', e.target.value)}
              placeholder="Trusted by industry leaders"
              data-testid="input-trusted-by-headline"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Trusted Logos</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const logos = settings.content?.trustedLogos || []
                  updateContent('trustedLogos', [
                    ...logos,
                    { id: `logo-${Date.now()}`, name: 'New Company', imageUrl: '' }
                  ])
                }}
                data-testid="button-add-logo"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Logo
              </Button>
            </div>
            
            <div className="space-y-3">
              {(settings.content?.trustedLogos || []).map((logo, index) => (
                <div key={logo.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Logo {index + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const logos = (settings.content?.trustedLogos || []).filter((_, i) => i !== index)
                        updateContent('trustedLogos', logos)
                      }}
                      data-testid={`button-delete-logo-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={logo.name}
                    onChange={e => {
                      const logos = [...(settings.content?.trustedLogos || [])]
                      logos[index] = { ...logos[index], name: e.target.value }
                      updateContent('trustedLogos', logos)
                    }}
                    placeholder="Company name"
                    data-testid={`input-logo-name-${index}`}
                  />
                  <ImageUpload
                    label="Logo Image"
                    value={logo.imageUrl || null}
                    onChange={url => {
                      const logos = [...(settings.content?.trustedLogos || [])]
                      logos[index] = { ...logos[index], imageUrl: url || undefined }
                      updateContent('trustedLogos', logos)
                    }}
                    bucket="branding"
                    folder="logos"
                    aspectRatio="3/1"
                    testId={`logo-image-${index}`}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Horizontal Position: {logo.imagePositionX ?? 50}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={logo.imagePositionX ?? 50}
                        onChange={e => {
                          const logos = [...(settings.content?.trustedLogos || [])]
                          logos[index] = { ...logos[index], imagePositionX: parseInt(e.target.value) }
                          updateContent('trustedLogos', logos)
                        }}
                        className="cursor-pointer"
                        data-testid={`input-logo-positionx-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Vertical Position: {logo.imagePositionY ?? 50}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={logo.imagePositionY ?? 50}
                        onChange={e => {
                          const logos = [...(settings.content?.trustedLogos || [])]
                          logos[index] = { ...logos[index], imagePositionY: parseInt(e.target.value) }
                          updateContent('trustedLogos', logos)
                        }}
                        className="cursor-pointer"
                        data-testid={`input-logo-positiony-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(settings.content?.trustedLogos?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No logos added yet. Click "Add Logo" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Metrics / Counters <InfoTooltip text="Animated number counters that highlight key achievements like users, revenue, or uptime." /></CardTitle>
              <CardDescription>Show animated metric counters (e.g., "10,000+ Customers")</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-metrics" />
              <Switch
                checked={settings.content?.metricsEnabled ?? false}
                onCheckedChange={checked => updateContent('metricsEnabled', checked)}
                data-testid="switch-metrics-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Section Headline (optional)</Label>
            <Input
              value={settings.content?.metricsHeadline ?? ''}
              onChange={e => updateContent('metricsHeadline', e.target.value)}
              placeholder="Results that speak for themselves"
              data-testid="input-metrics-headline"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Metrics</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const metrics = settings.content?.metrics || []
                  updateContent('metrics', [
                    ...metrics,
                    { id: `metric-${Date.now()}`, value: 100, suffix: '+', label: 'New Metric' }
                  ])
                }}
                data-testid="button-add-metric"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Metric
              </Button>
            </div>
            
            <div className="space-y-4">
              {(settings.content?.metrics || []).map((metric, index) => (
                <div key={metric.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Metric {index + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const metrics = (settings.content?.metrics || []).filter((_, i) => i !== index)
                        updateContent('metrics', metrics)
                      }}
                      data-testid={`button-delete-metric-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      value={metric.prefix || ''}
                      onChange={e => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], prefix: e.target.value }
                        updateContent('metrics', metrics)
                      }}
                      placeholder="Prefix ($)"
                      className="text-center"
                      data-testid={`input-metric-prefix-${index}`}
                    />
                    <Input
                      type="number"
                      value={metric.value}
                      onChange={e => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], value: parseInt(e.target.value) || 0 }
                        updateContent('metrics', metrics)
                      }}
                      placeholder="Value"
                      data-testid={`input-metric-value-${index}`}
                    />
                    <Input
                      value={metric.suffix || ''}
                      onChange={e => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], suffix: e.target.value }
                        updateContent('metrics', metrics)
                      }}
                      placeholder="Suffix (+, %, K)"
                      className="text-center"
                      data-testid={`input-metric-suffix-${index}`}
                    />
                    <Input
                      value={metric.label}
                      onChange={e => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], label: e.target.value }
                        updateContent('metrics', metrics)
                      }}
                      placeholder="Label"
                      data-testid={`input-metric-label-${index}`}
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <ImageUpload
                      label="Icon Image (optional)"
                      value={metric.iconUrl || null}
                      onChange={url => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], iconUrl: url || undefined }
                        updateContent('metrics', metrics)
                      }}
                      bucket="branding"
                      folder="icons"
                      aspectRatio="1/1"
                      testId={`metric-icon-${index}`}
                    />
                    {metric.iconUrl && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Horizontal: {metric.iconPositionX ?? 50}%</Label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={metric.iconPositionX ?? 50}
                            onChange={e => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], iconPositionX: parseInt(e.target.value) }
                              updateContent('metrics', metrics)
                            }}
                            className="cursor-pointer"
                            data-testid={`input-metric-iconx-${index}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Vertical: {metric.iconPositionY ?? 50}%</Label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={metric.iconPositionY ?? 50}
                            onChange={e => {
                              const metrics = [...(settings.content?.metrics || [])]
                              metrics[index] = { ...metrics[index], iconPositionY: parseInt(e.target.value) }
                              updateContent('metrics', metrics)
                            }}
                            className="cursor-pointer"
                            data-testid={`input-metric-icony-${index}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {(settings.content?.metrics?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No metrics added yet. Click "Add Metric" to get started.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Example: Prefix "$", Value "10", Suffix "M+", Label "Revenue" → displays as "$10M+ Revenue"
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">How It Works / Process Steps <InfoTooltip text="A numbered step-by-step guide that shows visitors how to get started with your product." /></CardTitle>
              <CardDescription>Show step-by-step process visualization</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-process" />
              <Switch
                checked={settings.content?.processEnabled ?? false}
                onCheckedChange={checked => updateContent('processEnabled', checked)}
                data-testid="switch-process-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section Headline</Label>
              <Input
                value={settings.content?.processHeadline ?? ''}
                onChange={e => updateContent('processHeadline', e.target.value)}
                placeholder="How it works"
                data-testid="input-process-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Subheadline</Label>
              <Input
                value={settings.content?.processSubheadline ?? ''}
                onChange={e => updateContent('processSubheadline', e.target.value)}
                placeholder="Get started in just a few simple steps"
                data-testid="input-process-subheadline"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Process Steps</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const steps = settings.content?.processSteps || []
                  updateContent('processSteps', [
                    ...steps,
                    { id: `step-${Date.now()}`, number: steps.length + 1, title: 'New Step', description: 'Step description' }
                  ])
                }}
                data-testid="button-add-step"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Step
              </Button>
            </div>
            
            <div className="space-y-3">
              {(settings.content?.processSteps || []).map((step, index) => (
                <div key={step.id} className="flex gap-3 items-start p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        value={step.number}
                        onChange={e => {
                          const steps = [...(settings.content?.processSteps || [])]
                          steps[index] = { ...steps[index], number: parseInt(e.target.value) || 1 }
                          updateContent('processSteps', steps)
                        }}
                        placeholder="#"
                        className="w-16"
                        data-testid={`input-step-number-${index}`}
                      />
                      <Input
                        value={step.title}
                        onChange={e => {
                          const steps = [...(settings.content?.processSteps || [])]
                          steps[index] = { ...steps[index], title: e.target.value }
                          updateContent('processSteps', steps)
                        }}
                        placeholder="Step title"
                        className="col-span-3"
                        data-testid={`input-step-title-${index}`}
                      />
                    </div>
                    <Input
                      value={step.description}
                      onChange={e => {
                        const steps = [...(settings.content?.processSteps || [])]
                        steps[index] = { ...steps[index], description: e.target.value }
                        updateContent('processSteps', steps)
                      }}
                      placeholder="Step description"
                      data-testid={`input-step-description-${index}`}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const steps = (settings.content?.processSteps || []).filter((_, i) => i !== index)
                      updateContent('processSteps', steps)
                    }}
                    data-testid={`button-delete-step-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            {(settings.content?.processSteps?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No steps added yet. Click "Add Step" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Image + Text Blocks <InfoTooltip text="Alternating image and text sections for storytelling. Great for showcasing features in detail." /></CardTitle>
              <CardDescription>Alternating image and text sections (like GitBook/TheWone)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-image-text" />
              <Switch
                checked={settings.content?.imageTextEnabled ?? false}
                onCheckedChange={checked => updateContent('imageTextEnabled', checked)}
                data-testid="switch-image-text-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Content Blocks</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const blocks = settings.content?.imageTextBlocks || []
                  updateContent('imageTextBlocks', [
                    ...blocks,
                    { 
                      id: `block-${Date.now()}`, 
                      headline: 'New Section', 
                      description: 'Add your description here', 
                      imageUrl: '', 
                      imagePosition: blocks.length % 2 === 0 ? 'left' : 'right'
                    }
                  ])
                }}
                data-testid="button-add-image-text-block"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Block
              </Button>
            </div>
            
            <div className="space-y-4">
              {(settings.content?.imageTextBlocks || []).map((block, index) => (
                <div key={block.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Block {index + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const blocks = (settings.content?.imageTextBlocks || []).filter((_, i) => i !== index)
                        updateContent('imageTextBlocks', blocks)
                      }}
                      data-testid={`button-delete-image-text-block-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Headline</Label>
                      <Input
                        value={block.headline}
                        onChange={e => {
                          const blocks = [...(settings.content?.imageTextBlocks || [])]
                          blocks[index] = { ...blocks[index], headline: e.target.value }
                          updateContent('imageTextBlocks', blocks)
                        }}
                        placeholder="Section headline"
                        data-testid={`input-block-headline-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Image Position</Label>
                      <Select
                        value={block.imagePosition}
                        onValueChange={value => {
                          const blocks = [...(settings.content?.imageTextBlocks || [])]
                          blocks[index] = { ...blocks[index], imagePosition: value as 'left' | 'right' }
                          updateContent('imageTextBlocks', blocks)
                        }}
                      >
                        <SelectTrigger data-testid={`select-block-position-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Image on Left</SelectItem>
                          <SelectItem value="right">Image on Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={block.description}
                      onChange={e => {
                        const blocks = [...(settings.content?.imageTextBlocks || [])]
                        blocks[index] = { ...blocks[index], description: e.target.value }
                        updateContent('imageTextBlocks', blocks)
                      }}
                      placeholder="Section description"
                      rows={2}
                      data-testid={`input-block-description-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <ImageUpload
                      label="Section Image"
                      value={block.imageUrl || null}
                      onChange={url => {
                        const blocks = [...(settings.content?.imageTextBlocks || [])]
                        blocks[index] = { ...blocks[index], imageUrl: url || '' }
                        updateContent('imageTextBlocks', blocks)
                      }}
                      bucket="branding"
                      folder="content"
                      aspectRatio="4/3"
                      testId={`block-image-${index}`}
                    />
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Horizontal: {block.imagePositionX ?? 50}%</Label>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={block.imagePositionX ?? 50}
                          onChange={e => {
                            const blocks = [...(settings.content?.imageTextBlocks || [])]
                            blocks[index] = { ...blocks[index], imagePositionX: parseInt(e.target.value) }
                            updateContent('imageTextBlocks', blocks)
                          }}
                          className="cursor-pointer"
                          data-testid={`input-block-positionx-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Vertical: {block.imagePositionY ?? 50}%</Label>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={block.imagePositionY ?? 50}
                          onChange={e => {
                            const blocks = [...(settings.content?.imageTextBlocks || [])]
                            blocks[index] = { ...blocks[index], imagePositionY: parseInt(e.target.value) }
                            updateContent('imageTextBlocks', blocks)
                          }}
                          className="cursor-pointer"
                          data-testid={`input-block-positiony-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Button Text (optional)</Label>
                      <Input
                        value={block.buttonText || ''}
                        onChange={e => {
                          const blocks = [...(settings.content?.imageTextBlocks || [])]
                          blocks[index] = { ...blocks[index], buttonText: e.target.value }
                          updateContent('imageTextBlocks', blocks)
                        }}
                        placeholder="Learn More"
                        data-testid={`input-block-button-text-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Button Link (optional)</Label>
                      <Input
                        value={block.buttonLink || ''}
                        onChange={e => {
                          const blocks = [...(settings.content?.imageTextBlocks || [])]
                          blocks[index] = { ...blocks[index], buttonLink: e.target.value }
                          updateContent('imageTextBlocks', blocks)
                        }}
                        placeholder="/features"
                        data-testid={`input-block-button-link-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(settings.content?.imageTextBlocks?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No blocks added yet. Click "Add Block" to create alternating image/text sections.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Customer Stories <InfoTooltip text="In-depth success stories with photos, quotes, and company details. More detailed than testimonials." /></CardTitle>
              <CardDescription>Showcase customer success stories with photos and quotes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-customer-stories" />
              <Switch
                checked={settings.content?.customerStoriesEnabled ?? false}
                onCheckedChange={checked => updateContent('customerStoriesEnabled', checked)}
                data-testid="switch-customer-stories-enabled"
              />
            </div>
          </div>
        </CardHeader>
        {(settings.content?.customerStoriesEnabled ?? false) && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Section Headline</Label>
              <Input
                value={settings.content?.customerStoriesHeadline ?? ''}
                onChange={e => updateContent('customerStoriesHeadline', e.target.value)}
                placeholder="Customer Stories"
                data-testid="input-customer-stories-headline"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Stories</Label>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const stories = [...(settings.content?.customerStories || [])]
                  stories.push({
                    id: `story-${Date.now()}`,
                    companyName: '',
                    companyLogoUrl: '',
                    personName: '',
                    personRole: '',
                    personPhotoUrl: '',
                    quote: '',
                    storyUrl: '',
                    backgroundImageUrl: '',
                  })
                  updateContent('customerStories', stories)
                }}
                data-testid="button-add-customer-story"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Story
              </Button>
            </div>

            <div className="space-y-4">
              {(settings.content?.customerStories || []).map((story, index) => (
                <div key={story.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Story {index + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const stories = (settings.content?.customerStories || []).filter((_, i) => i !== index)
                        updateContent('customerStories', stories)
                      }}
                      data-testid={`button-delete-story-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Company Name</Label>
                      <Input
                        value={story.companyName}
                        onChange={e => {
                          const stories = [...(settings.content?.customerStories || [])]
                          stories[index] = { ...stories[index], companyName: e.target.value }
                          updateContent('customerStories', stories)
                        }}
                        placeholder="Acme Inc"
                        data-testid={`input-story-company-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Company Logo URL</Label>
                      <Input
                        value={story.companyLogoUrl || ''}
                        onChange={e => {
                          const stories = [...(settings.content?.customerStories || [])]
                          stories[index] = { ...stories[index], companyLogoUrl: e.target.value }
                          updateContent('customerStories', stories)
                        }}
                        placeholder="https://..."
                        data-testid={`input-story-logo-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Person Name</Label>
                      <Input
                        value={story.personName || ''}
                        onChange={e => {
                          const stories = [...(settings.content?.customerStories || [])]
                          stories[index] = { ...stories[index], personName: e.target.value }
                          updateContent('customerStories', stories)
                        }}
                        placeholder="John Doe"
                        data-testid={`input-story-person-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Person Role</Label>
                      <Input
                        value={story.personRole || ''}
                        onChange={e => {
                          const stories = [...(settings.content?.customerStories || [])]
                          stories[index] = { ...stories[index], personRole: e.target.value }
                          updateContent('customerStories', stories)
                        }}
                        placeholder="CTO, Acme Inc"
                        data-testid={`input-story-role-${index}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Quote</Label>
                    <Textarea
                      value={story.quote || ''}
                      onChange={e => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], quote: e.target.value }
                        updateContent('customerStories', stories)
                      }}
                      placeholder="This product changed everything..."
                      rows={2}
                      data-testid={`input-story-quote-${index}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Person Photo URL</Label>
                      <Input
                        value={story.personPhotoUrl || ''}
                        onChange={e => {
                          const stories = [...(settings.content?.customerStories || [])]
                          stories[index] = { ...stories[index], personPhotoUrl: e.target.value }
                          updateContent('customerStories', stories)
                        }}
                        placeholder="https://..."
                        data-testid={`input-story-photo-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Background Image URL</Label>
                      <Input
                        value={story.backgroundImageUrl || ''}
                        onChange={e => {
                          const stories = [...(settings.content?.customerStories || [])]
                          stories[index] = { ...stories[index], backgroundImageUrl: e.target.value }
                          updateContent('customerStories', stories)
                        }}
                        placeholder="https://..."
                        data-testid={`input-story-bg-${index}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Story Link (optional)</Label>
                    <Input
                      value={story.storyUrl || ''}
                      onChange={e => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], storyUrl: e.target.value }
                        updateContent('customerStories', stories)
                      }}
                      placeholder="/customers/acme"
                      data-testid={`input-story-url-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Section Backgrounds <InfoTooltip text="Customize the visual style of each homepage section. Use contrast to draw attention to key areas." /></CardTitle>
              <CardDescription>Customize background styles for each section</CardDescription>
            </div>
            <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-backgrounds" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Features Section</Label>
              <Select
                value={settings.content?.sectionBackgrounds?.features ?? 'muted'}
                onValueChange={value => {
                  const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                  sectionBackgrounds.features = value as 'default' | 'muted' | 'gradient'
                  updateContent('sectionBackgrounds', sectionBackgrounds)
                }}
              >
                <SelectTrigger data-testid="select-bg-features">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (transparent)</SelectItem>
                  <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                  <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                  <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Testimonials Section</Label>
              <Select
                value={settings.content?.sectionBackgrounds?.testimonials ?? 'default'}
                onValueChange={value => {
                  const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                  sectionBackgrounds.testimonials = value as 'default' | 'muted' | 'gradient' | 'mesh'
                  updateContent('sectionBackgrounds', sectionBackgrounds)
                }}
              >
                <SelectTrigger data-testid="select-bg-testimonials">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (transparent)</SelectItem>
                  <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                  <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                  <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>FAQ Section</Label>
              <Select
                value={settings.content?.sectionBackgrounds?.faq ?? 'muted'}
                onValueChange={value => {
                  const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                  sectionBackgrounds.faq = value as 'default' | 'muted' | 'gradient' | 'mesh'
                  updateContent('sectionBackgrounds', sectionBackgrounds)
                }}
              >
                <SelectTrigger data-testid="select-bg-faq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (transparent)</SelectItem>
                  <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                  <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                  <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CTA Section</Label>
              <Select
                value={settings.content?.sectionBackgrounds?.cta ?? 'default'}
                onValueChange={value => {
                  const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                  sectionBackgrounds.cta = value as 'default' | 'muted' | 'gradient' | 'mesh'
                  updateContent('sectionBackgrounds', sectionBackgrounds)
                }}
              >
                <SelectTrigger data-testid="select-bg-cta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (transparent)</SelectItem>
                  <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                  <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                  <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer Stories Section</Label>
              <Select
                value={settings.content?.sectionBackgrounds?.customerStories ?? 'default'}
                onValueChange={value => {
                  const sectionBackgrounds = { ...(settings.content?.sectionBackgrounds || {}) }
                  sectionBackgrounds.customerStories = value as 'default' | 'muted' | 'gradient' | 'mesh'
                  updateContent('sectionBackgrounds', sectionBackgrounds)
                }}
              >
                <SelectTrigger data-testid="select-bg-customer-stories">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (transparent)</SelectItem>
                  <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                  <SelectItem value="gradient">Gradient (primary/accent)</SelectItem>
                  <SelectItem value="mesh">Mesh Gradient (modern blur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-content" />
      </div>
    </div>
  )
}
