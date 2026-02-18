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
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { ColorInput } from '@/components/admin/color-input'

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

          <div className="flex items-center justify-between">
            <div>
              <Label>Grayscale Logos</Label>
              <p className="text-sm text-muted-foreground">Show logos in grayscale (color on hover). Turn off to always show full color.</p>
            </div>
            <Switch
              checked={settings.content?.logoMarqueeGrayscale !== false}
              onCheckedChange={checked => updateContent('logoMarqueeGrayscale', checked)}
              data-testid="switch-logo-marquee-grayscale"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo Height: {settings.content?.logoMarqueeHeight ?? 32}px</Label>
            <input
              type="range"
              min={20}
              max={80}
              step={4}
              value={settings.content?.logoMarqueeHeight ?? 32}
              onChange={e => updateContent('logoMarqueeHeight', parseInt(e.target.value))}
              className="w-full"
              data-testid="input-logo-marquee-height"
            />
            <p className="text-sm text-muted-foreground">Adjust the height of logos in the scrolling marquee</p>
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
                    positionX={logo.imagePositionX}
                    positionY={logo.imagePositionY}
                    onPositionXChange={x => {
                      const logos = [...(settings.content?.trustedLogos || [])]
                      logos[index] = { ...logos[index], imagePositionX: x }
                      updateContent('trustedLogos', logos)
                    }}
                    onPositionYChange={y => {
                      const logos = [...(settings.content?.trustedLogos || [])]
                      logos[index] = { ...logos[index], imagePositionY: y }
                      updateContent('trustedLogos', logos)
                    }}
                    testId={`logo-image-${index}`}
                  />
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
                    { id: `metric-${Date.now()}`, value: '100', suffix: '+', label: 'New Metric' }
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
                  <div className="space-y-2">
                    <div className="rounded-md bg-primary-50 dark:bg-primary-950 p-3 text-center mb-2" data-testid={`metric-preview-${index}`}>
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Preview</div>
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {metric.prefix || ''}{metric.value || '0'}{metric.suffix || ''}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                        {metric.label || 'Label'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Label (small text below the number)</Label>
                      <Input
                        value={metric.label}
                        onChange={e => {
                          const metrics = [...(settings.content?.metrics || [])]
                          metrics[index] = { ...metrics[index], label: e.target.value }
                          updateContent('metrics', metrics)
                        }}
                        placeholder="e.g. Happy Customers, Uptime, Support"
                        data-testid={`input-metric-label-${index}`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Number (the big value)</Label>
                        <Input
                          type="text"
                          value={metric.value}
                          onChange={e => {
                            const metrics = [...(settings.content?.metrics || [])]
                            metrics[index] = { ...metrics[index], value: e.target.value }
                            updateContent('metrics', metrics)
                          }}
                          placeholder="e.g. 340"
                          data-testid={`input-metric-value-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Suffix (after number)</Label>
                        <Input
                          value={metric.suffix || ''}
                          onChange={e => {
                            const metrics = [...(settings.content?.metrics || [])]
                            metrics[index] = { ...metrics[index], suffix: e.target.value }
                            updateContent('metrics', metrics)
                          }}
                          placeholder="e.g. +, %, K"
                          className="text-center"
                          data-testid={`input-metric-suffix-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Prefix (before number)</Label>
                        <Input
                          value={metric.prefix || ''}
                          onChange={e => {
                            const metrics = [...(settings.content?.metrics || [])]
                            metrics[index] = { ...metrics[index], prefix: e.target.value }
                            updateContent('metrics', metrics)
                          }}
                          placeholder="e.g. $"
                          className="text-center"
                          data-testid={`input-metric-prefix-${index}`}
                        />
                      </div>
                    </div>
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
                      positionX={metric.iconPositionX}
                      positionY={metric.iconPositionY}
                      onPositionXChange={x => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], iconPositionX: x }
                        updateContent('metrics', metrics)
                      }}
                      onPositionYChange={y => {
                        const metrics = [...(settings.content?.metrics || [])]
                        metrics[index] = { ...metrics[index], iconPositionY: y }
                        updateContent('metrics', metrics)
                      }}
                      testId={`metric-icon-${index}`}
                    />
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-400 text-white dark:text-black font-bold text-sm shrink-0">
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
                    positionX={block.imagePositionX}
                    positionY={block.imagePositionY}
                    onPositionXChange={x => {
                      const blocks = [...(settings.content?.imageTextBlocks || [])]
                      blocks[index] = { ...blocks[index], imagePositionX: x }
                      updateContent('imageTextBlocks', blocks)
                    }}
                    onPositionYChange={y => {
                      const blocks = [...(settings.content?.imageTextBlocks || [])]
                      blocks[index] = { ...blocks[index], imagePositionY: y }
                      updateContent('imageTextBlocks', blocks)
                    }}
                    testId={`block-image-${index}`}
                  />
                  
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
                    <ImageUpload
                      label="Person Photo"
                      variant="avatar"
                      value={story.personPhotoUrl || null}
                      onChange={url => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], personPhotoUrl: url || '' }
                        updateContent('customerStories', stories)
                      }}
                      bucket="branding"
                      folder="stories"
                      positionX={story.personPhotoPositionX}
                      positionY={story.personPhotoPositionY}
                      onPositionXChange={x => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], personPhotoPositionX: x }
                        updateContent('customerStories', stories)
                      }}
                      onPositionYChange={y => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], personPhotoPositionY: y }
                        updateContent('customerStories', stories)
                      }}
                      testId={`story-photo-${index}`}
                    />
                    <ImageUpload
                      label="Background Image"
                      value={story.backgroundImageUrl || null}
                      onChange={url => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], backgroundImageUrl: url || '' }
                        updateContent('customerStories', stories)
                      }}
                      bucket="branding"
                      folder="stories"
                      aspectRatio="16/9"
                      positionX={story.backgroundPositionX}
                      positionY={story.backgroundPositionY}
                      onPositionXChange={x => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], backgroundPositionX: x }
                        updateContent('customerStories', stories)
                      }}
                      onPositionYChange={y => {
                        const stories = [...(settings.content?.customerStories || [])]
                        stories[index] = { ...stories[index], backgroundPositionY: y }
                        updateContent('customerStories', stories)
                      }}
                      testId={`story-bg-${index}`}
                    />
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
              <CardTitle className="flex items-center gap-2">Founder Letter <InfoTooltip text="A personal letter from the founder builds emotional connection and trust with visitors." /></CardTitle>
              <CardDescription>Personal narrative section with portrait and optional signature</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-founder-letter" />
              <Switch
                checked={settings.content?.founderLetterEnabled ?? false}
                onCheckedChange={checked => updateContent('founderLetterEnabled', checked)}
                data-testid="switch-founder-letter-enabled"
              />
            </div>
          </div>
        </CardHeader>
        {(settings.content?.founderLetterEnabled ?? false) && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.content?.founderLetter?.headline ?? ''}
                onChange={e => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), headline: e.target.value })}
                placeholder="A Letter from Our Founder"
                data-testid="input-founder-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Letter Body</Label>
              <Textarea
                value={settings.content?.founderLetter?.body ?? ''}
                onChange={e => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), body: e.target.value })}
                placeholder="Write your personal message to visitors..."
                rows={6}
                data-testid="input-founder-body"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Founder Name</Label>
                <Input
                  value={settings.content?.founderLetter?.founderName ?? ''}
                  onChange={e => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), founderName: e.target.value })}
                  placeholder="Jane Smith"
                  data-testid="input-founder-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Founder Title</Label>
                <Input
                  value={settings.content?.founderLetter?.founderTitle ?? ''}
                  onChange={e => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), founderTitle: e.target.value })}
                  placeholder="CEO & Co-Founder"
                  data-testid="input-founder-title"
                />
              </div>
            </div>
            <ImageUpload
              label="Founder Portrait (optional)"
              value={settings.content?.founderLetter?.founderImageUrl || null}
              onChange={url => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), founderImageUrl: url || '' })}
              bucket="branding"
              folder="founder"
              aspectRatio="1/1"
              testId="founder-portrait"
            />
            <ImageUpload
              label="Signature Image (optional, PNG recommended)"
              value={settings.content?.founderLetter?.signatureImageUrl || null}
              onChange={url => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), signatureImageUrl: url || '' })}
              bucket="branding"
              folder="founder"
              aspectRatio="3/1"
              testId="founder-signature"
            />
            <ImageUpload
              label="Background Banner Image (optional)"
              value={settings.content?.founderLetter?.backgroundImageUrl || null}
              onChange={url => updateContent('founderLetter', { ...(settings.content?.founderLetter || { headline: '', body: '', founderName: '', founderTitle: '' }), backgroundImageUrl: url || '' })}
              bucket="branding"
              folder="founder"
              aspectRatio="21/9"
              testId="founder-background"
            />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Comparison Bars <InfoTooltip text="Animated horizontal bars that visually compare your product against alternatives or benchmarks." /></CardTitle>
              <CardDescription>Animated comparison visualization with highlighted items</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-comparison-bars" />
              <Switch
                checked={settings.content?.comparisonBarsEnabled ?? false}
                onCheckedChange={checked => updateContent('comparisonBarsEnabled', checked)}
                data-testid="switch-comparison-bars-enabled"
              />
            </div>
          </div>
        </CardHeader>
        {(settings.content?.comparisonBarsEnabled ?? false) && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={settings.content?.comparisonBars?.headline ?? ''}
                  onChange={e => updateContent('comparisonBars', { ...(settings.content?.comparisonBars || { headline: '', items: [] }), headline: e.target.value })}
                  placeholder="Why choose us?"
                  data-testid="input-comparison-headline"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline (optional)</Label>
                <Input
                  value={settings.content?.comparisonBars?.subheadline ?? ''}
                  onChange={e => updateContent('comparisonBars', { ...(settings.content?.comparisonBars || { headline: '', items: [] }), subheadline: e.target.value })}
                  placeholder="See how we stack up"
                  data-testid="input-comparison-subheadline"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Text (optional)</Label>
                <Input
                  value={settings.content?.comparisonBars?.ctaText ?? ''}
                  onChange={e => updateContent('comparisonBars', { ...(settings.content?.comparisonBars || { headline: '', items: [] }), ctaText: e.target.value })}
                  placeholder="Get Started"
                  data-testid="input-comparison-cta-text"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Button Link (optional)</Label>
                <Input
                  value={settings.content?.comparisonBars?.ctaLink ?? ''}
                  onChange={e => updateContent('comparisonBars', { ...(settings.content?.comparisonBars || { headline: '', items: [] }), ctaLink: e.target.value })}
                  placeholder="/signup"
                  data-testid="input-comparison-cta-link"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Comparison Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const current = settings.content?.comparisonBars || { headline: '', items: [] }
                    updateContent('comparisonBars', {
                      ...current,
                      items: [...current.items, { id: `bar-${Date.now()}`, label: '', value: '', barPercent: 50, highlighted: false }]
                    })
                  }}
                  data-testid="button-add-comparison-item"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {(settings.content?.comparisonBars?.items ?? []).map((item, index) => (
                <div key={item.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Highlighted</Label>
                      <Switch
                        checked={item.highlighted ?? false}
                        onCheckedChange={checked => {
                          const current = settings.content?.comparisonBars || { headline: '', items: [] }
                          const items = [...current.items]
                          items[index] = { ...items[index], highlighted: checked }
                          updateContent('comparisonBars', { ...current, items })
                        }}
                        data-testid={`switch-comparison-highlighted-${index}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const current = settings.content?.comparisonBars || { headline: '', items: [] }
                          updateContent('comparisonBars', { ...current, items: current.items.filter((_, i) => i !== index) })
                        }}
                        data-testid={`button-remove-comparison-item-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={item.label}
                      onChange={e => {
                        const current = settings.content?.comparisonBars || { headline: '', items: [] }
                        const items = [...current.items]
                        items[index] = { ...items[index], label: e.target.value }
                        updateContent('comparisonBars', { ...current, items })
                      }}
                      placeholder="Label (e.g., Speed)"
                      data-testid={`input-comparison-label-${index}`}
                    />
                    <Input
                      value={item.value}
                      onChange={e => {
                        const current = settings.content?.comparisonBars || { headline: '', items: [] }
                        const items = [...current.items]
                        items[index] = { ...items[index], value: e.target.value }
                        updateContent('comparisonBars', { ...current, items })
                      }}
                      placeholder="Value (e.g., 10x faster)"
                      data-testid={`input-comparison-value-${index}`}
                    />
                    <div className="space-y-1">
                      <Input
                        type="range"
                        min="5"
                        max="100"
                        value={item.barPercent}
                        onChange={e => {
                          const current = settings.content?.comparisonBars || { headline: '', items: [] }
                          const items = [...current.items]
                          items[index] = { ...items[index], barPercent: parseInt(e.target.value) }
                          updateContent('comparisonBars', { ...current, items })
                        }}
                        className="cursor-pointer"
                        data-testid={`input-comparison-percent-${index}`}
                      />
                      <span className="text-xs text-muted-foreground">{item.barPercent}%</span>
                    </div>
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
              <CardTitle className="flex items-center gap-2">Product Screenshot Showcase <InfoTooltip text="Display a prominent screenshot of your product layered over a background image or gradient." /></CardTitle>
              <CardDescription>Showcase your app with a featured screenshot</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-product-showcase" />
              <Switch
                checked={settings.content?.productShowcaseEnabled ?? false}
                onCheckedChange={checked => updateContent('productShowcaseEnabled', checked)}
                data-testid="switch-product-showcase-enabled"
              />
            </div>
          </div>
        </CardHeader>
        {(settings.content?.productShowcaseEnabled ?? false) && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={settings.content?.productShowcase?.headline ?? ''}
                  onChange={e => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), headline: e.target.value })}
                  placeholder="See it in action"
                  data-testid="input-showcase-headline"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline (optional)</Label>
                <Input
                  value={settings.content?.productShowcase?.subheadline ?? ''}
                  onChange={e => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), subheadline: e.target.value })}
                  placeholder="A clean, intuitive interface"
                  data-testid="input-showcase-subheadline"
                />
              </div>
            </div>
            <ImageUpload
              label="Screenshot"
              value={settings.content?.productShowcase?.screenshotUrl || null}
              onChange={url => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), screenshotUrl: url || '' })}
              bucket="branding"
              folder="showcase"
              aspectRatio="16/9"
              positionX={settings.content?.productShowcase?.screenshotPositionX}
              positionY={settings.content?.productShowcase?.screenshotPositionY}
              onPositionXChange={x => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), screenshotPositionX: x })}
              onPositionYChange={y => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), screenshotPositionY: y })}
              testId="showcase-screenshot"
            />
            <ImageUpload
              label="Background Image (optional)"
              value={settings.content?.productShowcase?.backgroundImageUrl || null}
              onChange={url => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), backgroundImageUrl: url || '' })}
              bucket="branding"
              folder="showcase"
              aspectRatio="21/9"
              positionX={settings.content?.productShowcase?.backgroundPositionX}
              positionY={settings.content?.productShowcase?.backgroundPositionY}
              onPositionXChange={x => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), backgroundPositionX: x })}
              onPositionYChange={y => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), backgroundPositionY: y })}
              testId="showcase-background"
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.content?.productShowcase?.backgroundGradient ?? true}
                onCheckedChange={checked => updateContent('productShowcase', { ...(settings.content?.productShowcase || { headline: '', screenshotUrl: '' }), backgroundGradient: checked })}
                data-testid="switch-showcase-gradient"
              />
              <Label>Use gradient background (when no background image)</Label>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Bottom Hero CTA <InfoTooltip text="A closing call-to-action section at the bottom of the page with the same visual weight as the top hero." /></CardTitle>
              <CardDescription>Closing hero section to drive conversions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-bottom-hero" />
              <Switch
                checked={settings.content?.bottomHeroCtaEnabled ?? false}
                onCheckedChange={checked => updateContent('bottomHeroCtaEnabled', checked)}
                data-testid="switch-bottom-hero-enabled"
              />
            </div>
          </div>
        </CardHeader>
        {(settings.content?.bottomHeroCtaEnabled ?? false) && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={settings.content?.bottomHeroCta?.headline ?? ''}
                  onChange={e => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), headline: e.target.value })}
                  placeholder="Ready to get started?"
                  data-testid="input-bottom-hero-headline"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input
                  value={settings.content?.bottomHeroCta?.subheadline ?? ''}
                  onChange={e => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), subheadline: e.target.value })}
                  placeholder="Join thousands of satisfied users"
                  data-testid="input-bottom-hero-subheadline"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tagline (optional, small text above headline)</Label>
              <Input
                value={settings.content?.bottomHeroCta?.tagline ?? ''}
                onChange={e => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), tagline: e.target.value })}
                placeholder="START YOUR JOURNEY"
                data-testid="input-bottom-hero-tagline"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={settings.content?.bottomHeroCta?.buttonText ?? ''}
                  onChange={e => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), buttonText: e.target.value })}
                  placeholder="Start Free Trial"
                  data-testid="input-bottom-hero-button-text"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={settings.content?.bottomHeroCta?.buttonLink ?? ''}
                  onChange={e => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), buttonLink: e.target.value })}
                  placeholder="/signup"
                  data-testid="input-bottom-hero-button-link"
                />
              </div>
            </div>
            <ImageUpload
              label="Background Image (optional)"
              value={settings.content?.bottomHeroCta?.backgroundImageUrl || null}
              onChange={url => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), backgroundImageUrl: url || '' })}
              bucket="branding"
              folder="cta"
              aspectRatio="21/9"
              positionX={settings.content?.bottomHeroCta?.backgroundPositionX}
              positionY={settings.content?.bottomHeroCta?.backgroundPositionY}
              onPositionXChange={x => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), backgroundPositionX: x })}
              onPositionYChange={y => updateContent('bottomHeroCta', { ...(settings.content?.bottomHeroCta || { headline: '', subheadline: '', buttonText: '', buttonLink: '' }), backgroundPositionY: y })}
              testId="bottom-hero-background"
            />
            <p className="text-xs text-muted-foreground">Uses a gradient wash to ensure text readability over the image</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Feature Sub-Pages <InfoTooltip text="Create dedicated pages for each major feature with their own URL, hero, and content blocks." /></CardTitle>
              <CardDescription>Dynamic feature detail pages at /features/[slug]</CardDescription>
            </div>
            <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-feature-subpages" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Feature Pages</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const pages = [...(settings.content?.featureSubPages || [])]
                pages.push({
                  id: `fp-${Date.now()}`,
                  slug: '',
                  title: 'New Feature',
                  navLabel: 'New Feature',
                  heroHeadline: '',
                  heroSubheadline: '',
                  blocks: [],
                })
                updateContent('featureSubPages', pages)
              }}
              data-testid="button-add-feature-page"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Feature Page
            </Button>
          </div>
          {(settings.content?.featureSubPages || []).map((page, index) => (
            <div key={page.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{page.title || `Feature Page ${index + 1}`}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const pages = (settings.content?.featureSubPages || []).filter((_, i) => i !== index)
                    updateContent('featureSubPages', pages)
                  }}
                  data-testid={`button-remove-feature-page-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">URL Slug</Label>
                  <Input
                    value={page.slug}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="sourcing"
                    data-testid={`input-feature-page-slug-${index}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Page Title</Label>
                  <Input
                    value={page.title}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], title: e.target.value }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="Smart Sourcing"
                    data-testid={`input-feature-page-title-${index}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nav Label</Label>
                  <Input
                    value={page.navLabel}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], navLabel: e.target.value }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="Sourcing"
                    data-testid={`input-feature-page-nav-${index}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hero Headline</Label>
                  <Input
                    value={page.heroHeadline}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], heroHeadline: e.target.value }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="Feature headline"
                    data-testid={`input-feature-page-hero-headline-${index}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hero Subheadline</Label>
                  <Input
                    value={page.heroSubheadline}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], heroSubheadline: e.target.value }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="Feature description"
                    data-testid={`input-feature-page-hero-sub-${index}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hero Image URL (optional)</Label>
                  <Input
                    value={page.heroImageUrl ?? ''}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], heroImageUrl: e.target.value }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="https://..."
                    data-testid={`input-feature-page-hero-image-${index}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hero Background URL (optional)</Label>
                  <Input
                    value={page.heroBackgroundImageUrl ?? ''}
                    onChange={e => {
                      const pages = [...(settings.content?.featureSubPages || [])]
                      pages[index] = { ...pages[index], heroBackgroundImageUrl: e.target.value }
                      updateContent('featureSubPages', pages)
                    }}
                    placeholder="https://..."
                    data-testid={`input-feature-page-hero-bg-${index}`}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Visit /features/{page.slug || '[slug]'} to see this page. Content blocks can be added via the Image + Text Blocks pattern.
              </p>
            </div>
          ))}
          {(settings.content?.featureSubPages?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No feature pages yet. Click "Add Feature Page" to create one.
            </p>
          )}
        </CardContent>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            Image Collage
            <Switch
              checked={settings.content?.imageCollageEnabled ?? false}
              onCheckedChange={v => updateContent('imageCollageEnabled', v)}
              data-testid="switch-image-collage"
            />
          </CardTitle>
          <CardDescription>Fan-style overlapping image layout with hover animations</CardDescription>
        </CardHeader>
        {settings.content?.imageCollageEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.content?.imageCollageHeadline || ''}
                onChange={e => updateContent('imageCollageHeadline', e.target.value)}
                placeholder="Our team in action"
                data-testid="input-image-collage-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={settings.content?.imageCollageSubheadline || ''}
                onChange={e => updateContent('imageCollageSubheadline', e.target.value)}
                placeholder="See what we're building together"
                data-testid="input-image-collage-subheadline"
              />
            </div>
            <div className="space-y-2">
              <Label>Images (up to 5)</Label>
              <p className="text-xs text-muted-foreground">Upload portrait-oriented images for the best effect. They will fan out with alternating rotations.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(settings.content?.imageCollageImages || []).map((url, i) => (
                  <div key={i} className="relative">
                    <ImageUpload
                      label={`Image ${i + 1}`}
                      value={url}
                      onChange={(newUrl) => {
                        if (newUrl) {
                          const images = [...(settings.content?.imageCollageImages || [])]
                          images[i] = newUrl
                          updateContent('imageCollageImages', images)
                        } else {
                          const images = (settings.content?.imageCollageImages || []).filter((_, idx) => idx !== i)
                          updateContent('imageCollageImages', images)
                        }
                      }}
                      folder="collage"
                      aspectRatio="3/4"
                      testId={`upload-collage-image-${i}`}
                    />
                  </div>
                ))}
                {(settings.content?.imageCollageImages?.length ?? 0) < 5 && (
                  <ImageUpload
                    label="Add Image"
                    value={null}
                    onChange={(url) => {
                      if (url) {
                        const images = [...(settings.content?.imageCollageImages || []), url]
                        updateContent('imageCollageImages', images)
                      }
                    }}
                    folder="collage"
                    aspectRatio="3/4"
                    testId="upload-collage-image-new"
                  />
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Section Order <InfoTooltip text="Control the order in which sections appear on your homepage. Use the arrows to move sections up or down." /></CardTitle>
          <CardDescription>Use the arrows to reorder how sections appear on your homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(() => {
            const allSections = [
              { id: 'trustedBy', label: 'Trusted By / Logo Marquee', desc: 'Partner logos' },
              { id: 'metrics', label: 'Metrics / Counters', desc: 'Animated number stats' },
              { id: 'features', label: 'Features', desc: `${(settings.content?.featureCards?.length ?? 0)} cards configured` },
              { id: 'testimonials', label: 'Testimonials', desc: `${(settings.content?.testimonials?.length ?? 0)} testimonials` },
              { id: 'productShowcase', label: 'Product Showcase', desc: 'App screenshot display' },
              { id: 'imageText', label: 'Image + Text Blocks', desc: `${(settings.content?.imageTextBlocks?.length ?? 0)} blocks` },
              { id: 'process', label: 'Process Steps', desc: 'How it works flow' },
              { id: 'customerStories', label: 'Customer Stories', desc: 'Case studies' },
              { id: 'imageCollage', label: 'Image Collage', desc: 'Fan-style photo layout' },
              { id: 'founderLetter', label: 'Founder Letter', desc: 'Personal narrative' },
              { id: 'comparisonBars', label: 'Comparison Bars', desc: 'Animated comparison' },
              { id: 'faq', label: 'FAQ', desc: `${(settings.content?.faqItems?.length ?? 0)} questions` },
              { id: 'cta', label: 'Call to Action', desc: 'Closing CTA section' },
              { id: 'bottomHeroCta', label: 'Bottom Hero CTA', desc: 'Full-width closing hero' },
            ]
            const defaultOrder = allSections.map(s => s.id)
            const storedOrder = settings.content?.sectionOrder?.length ? settings.content.sectionOrder : defaultOrder
            const missingSections = defaultOrder.filter(s => !storedOrder.includes(s))
            const currentOrder = [...storedOrder, ...missingSections]
            const orderedSections = currentOrder.map(id => allSections.find(s => s.id === id)).filter(Boolean) as typeof allSections

            const moveSection = (index: number, direction: 'up' | 'down') => {
              const newOrder = [...currentOrder]
              const targetIndex = direction === 'up' ? index - 1 : index + 1
              if (targetIndex < 0 || targetIndex >= newOrder.length) return
              ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
              updateContent('sectionOrder', newOrder)
            }

            return orderedSections.map((section, index) => (
              <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <span className="text-sm font-mono text-muted-foreground w-6 text-center">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveSection(index, 'up')}
                    data-testid={`button-section-up-${section.id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === orderedSections.length - 1}
                    onClick={() => moveSection(index, 'down')}
                    data-testid={`button-section-down-${section.id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Section Background Colors <InfoTooltip text="Override the background color for individual homepage sections. Leave empty to use the default theme background." /></CardTitle>
          <CardDescription>Customize background colors for each section individually</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'features', label: 'Features' },
              { key: 'testimonials', label: 'Testimonials' },
              { key: 'faq', label: 'FAQ' },
              { key: 'cta', label: 'Call to Action' },
              { key: 'customerStories', label: 'Customer Stories' },
              { key: 'founderLetter', label: 'Founder Letter' },
              { key: 'comparisonBars', label: 'Comparison Bars' },
              { key: 'productShowcase', label: 'Product Showcase' },
              { key: 'bottomHeroCta', label: 'Bottom Hero CTA' },
              { key: 'imageCollage', label: 'Image Collage' },
              { key: 'trustedBy', label: 'Logo Marquee' },
            ].map(({ key, label }) => (
              <ColorInput
                key={key}
                label={label}
                value={settings.content?.sectionColors?.[key as keyof typeof settings.content.sectionColors] || ''}
                onChange={hex => {
                  const current = settings.content?.sectionColors || {}
                  updateContent('sectionColors', { ...current, [key]: hex })
                }}
                onClear={() => {
                  const current = { ...settings.content?.sectionColors }
                  delete current[key as keyof typeof current]
                  updateContent('sectionColors', Object.keys(current).length ? current : undefined)
                }}
                placeholder="Default (theme)"
                testId={`input-section-color-${key}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-content" />
      </div>
    </div>
  )
}
