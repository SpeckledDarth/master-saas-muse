'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { MiniSaveButton, SaveButton, IconComponent, iconOptions, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Palette } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { FontPicker } from '@/components/admin/font-picker'
import Link from 'next/link'
import { Paintbrush } from 'lucide-react'

export default function BrandingPage() {
  const { settings, saving, saved, handleSave, setSettings, updateBranding, updateContent, addNavItem, updateNavItem, removeNavItem } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-300">Branding & Hero Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <p><strong>Hero Styles:</strong> Choose from 5 styles - Full Width Background (default), Split Layout, Video Background, Pattern/Texture, or Floating Mockup.</p>
          <p><strong>Animated Words:</strong> Add 2+ comma-separated words (e.g., "fast, secure, reliable") to create a cycling animation after your app name. Click outside the field to save.</p>
          <p><strong>Video Hero:</strong> Paste a YouTube embed URL, Vimeo URL, or direct .mp4 link. The video replaces the static image and plays automatically (muted, looping).</p>
          <p><strong>Announcement Bar:</strong> Scroll down to enable a top banner for promotions, product launches, or important updates.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Branding Settings <InfoTooltip text="Define your brand identity — name, colors, and logo. These appear across your app header, emails, and browser tabs." /></CardTitle>
          <CardDescription>
            Configure your app name, colors, and company information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={settings.branding.appName}
                onChange={e => updateBranding('appName', e.target.value)}
                placeholder="My SaaS"
                data-testid="input-app-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.branding.companyName}
                onChange={e => updateBranding('companyName', e.target.value)}
                placeholder="Your Company LLC"
                data-testid="input-company-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={settings.branding.tagline}
              onChange={e => updateBranding('tagline', e.target.value)}
              placeholder="Build something amazing"
              data-testid="input-tagline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.branding.supportEmail}
              onChange={e => updateBranding('supportEmail', e.target.value)}
              placeholder="support@example.com"
              data-testid="input-support-email"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <ImageUpload
              label="Logo (Light Mode)"
              value={settings.branding.logoUrl}
              onChange={url => updateBranding('logoUrl', url)}
              folder="logos"
              aspectRatio="1/1"
              testId="logo-upload"
            />
            <ImageUpload
              label="Logo (Dark Mode)"
              value={settings.branding.logoDarkUrl ?? null}
              onChange={url => updateBranding('logoDarkUrl', url)}
              folder="logos"
              aspectRatio="1/1"
              testId="logo-dark-upload"
            />
            <ImageUpload
              label="Icon (Mobile)"
              value={settings.branding.logoIconUrl ?? null}
              onChange={url => updateBranding('logoIconUrl', url)}
              folder="logos"
              aspectRatio="1/1"
              testId="logo-icon-upload"
            />
            <ImageUpload
              label="Hero Image"
              value={settings.branding.heroImageUrl}
              onChange={url => updateBranding('heroImageUrl', url)}
              folder="heroes"
              aspectRatio="16/9"
              testId="hero-upload"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Upload separate logos for light and dark modes. The icon is shown on mobile screens instead of the full wordmark. If only the light mode logo is set, it will be used for both.
          </p>

          {settings.branding.logoUrl && (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <p className="text-sm font-medium">Logo Size & Effects</p>
              <div className="space-y-2">
                <Label>Logo Height: {settings.branding.logoHeight ?? 40}px</Label>
                <Input
                  type="range"
                  min="20"
                  max="120"
                  value={settings.branding.logoHeight ?? 40}
                  onChange={e => updateBranding('logoHeight', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-logo-height"
                />
                <p className="text-xs text-muted-foreground">Aspect ratio is preserved automatically. Header adjusts to fit.</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={settings.branding.logoHoverEffect ?? true}
                  onCheckedChange={checked => updateBranding('logoHoverEffect', checked)}
                  data-testid="switch-logo-hover"
                />
                <Label>Logo Hover Effect (scale + glow on mouse over)</Label>
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <p className="text-sm font-medium">Header Animation</p>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.branding.brandNameAnimated ?? false}
                onCheckedChange={checked => updateBranding('brandNameAnimated', checked)}
                data-testid="switch-brand-animated"
              />
              <Label>Animated Header Reveal</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Adds a fade-in + slide-down effect to the header when visitors first load the page. Refresh to see the effect.
            </p>
            {!settings.branding.logoUrl && (
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={settings.branding.brandNameGradient ?? false}
                  onCheckedChange={checked => updateBranding('brandNameGradient', checked)}
                  data-testid="switch-brand-gradient"
                />
                <Label>Gradient Brand Name</Label>
                <span className="text-xs text-muted-foreground">(applies when no logo is uploaded)</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Hero Layout Style</Label>
            <Select
              value={settings.content?.heroStyle ?? 'fullWidth'}
              onValueChange={value => updateContent('heroStyle', value as 'fullWidth' | 'split' | 'video' | 'pattern' | 'floating' | 'collage')}
            >
              <SelectTrigger data-testid="select-hero-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullWidth">Full Width Background Image</SelectItem>
                <SelectItem value="split">Split Layout (Image + Text Side by Side)</SelectItem>
                <SelectItem value="video">Video Background</SelectItem>
                <SelectItem value="pattern">Pattern/Texture Overlay</SelectItem>
                <SelectItem value="floating">Gradient + Floating Mockup</SelectItem>
                <SelectItem value="collage">Photo Collage (Overlapping Images)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose how the hero section is displayed</p>
          </div>

          <div className="space-y-2">
            <Label>Hero Animated Words (optional)</Label>
            <Input
              defaultValue={(settings.content?.heroAnimatedWords || []).join(', ')}
              onBlur={e => {
                const words = e.target.value.split(',').map(w => w.trim()).filter(w => w)
                updateContent('heroAnimatedWords', words)
              }}
              placeholder="innovative, powerful, seamless"
              data-testid="input-hero-animated-words"
            />
            <p className="text-xs text-muted-foreground">
              Enter 2 or more comma-separated words to create cycling animation (e.g., "fast, secure, reliable"). 
              With only 1 word, it displays as static text. Click outside the field to save.
            </p>
          </div>

          {settings.content?.heroStyle === 'split' && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium">Split Hero Settings</p>
              <div className="space-y-2">
                <Label>Split Hero Image</Label>
                <Input
                  value={settings.content?.splitHeroImageUrl ?? ''}
                  onChange={e => updateContent('splitHeroImageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-split-hero-image-url"
                />
                <p className="text-xs text-muted-foreground">URL for the image in split hero layout</p>
              </div>
              <div className="space-y-2">
                <Label>Image Position</Label>
                <Select
                  value={settings.content?.splitHeroImagePosition ?? 'right'}
                  onValueChange={value => updateContent('splitHeroImagePosition', value as 'left' | 'right')}
                >
                  <SelectTrigger data-testid="select-split-hero-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Image on Right</SelectItem>
                    <SelectItem value="left">Image on Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Background Style</Label>
                <Select
                  value={settings.content?.splitHeroBackground ?? 'transparent'}
                  onValueChange={value => updateContent('splitHeroBackground', value as 'transparent' | 'muted' | 'gradient' | 'accent')}
                >
                  <SelectTrigger data-testid="select-split-hero-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">Transparent (inherits page background)</SelectItem>
                    <SelectItem value="muted">Muted (subtle gray)</SelectItem>
                    <SelectItem value="gradient">Gradient (primary to accent)</SelectItem>
                    <SelectItem value="accent">Accent (subtle accent color)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose a background to make the hero section stand out</p>
              </div>
              <div className="space-y-2">
                <Label>Spacing Between Text and Image: {settings.content?.splitHeroGap ?? 12}</Label>
                <Input
                  type="range"
                  min="0"
                  max="24"
                  value={settings.content?.splitHeroGap ?? 12}
                  onChange={e => updateContent('splitHeroGap', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-split-hero-gap"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the gap between text and image (0 = tight, 24 = very spaced out)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Image Height: {settings.content?.splitHeroImageHeight ?? 400}px</Label>
                <Input
                  type="range"
                  min="200"
                  max="700"
                  step="25"
                  value={settings.content?.splitHeroImageHeight ?? 400}
                  onChange={e => updateContent('splitHeroImageHeight', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-split-hero-image-height"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the image height (200px = small, 700px = large)
                </p>
              </div>
            </div>
          )}

          {settings.content?.heroStyle === 'video' && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium">Video Hero Settings</p>
              <p className="text-xs text-muted-foreground mb-2">
                The video replaces the static hero image and plays automatically in the background (muted, looping).
              </p>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input
                  value={settings.branding?.heroVideoUrl ?? ''}
                  onChange={e => updateBranding('heroVideoUrl', e.target.value)}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  data-testid="input-hero-video-url"
                />
                <p className="text-xs text-muted-foreground">
                  <strong>YouTube:</strong> Use embed URL format: https://www.youtube.com/embed/VIDEO_ID<br/>
                  <strong>Vimeo:</strong> Use player URL: https://player.vimeo.com/video/VIDEO_ID<br/>
                  <strong>Direct file:</strong> Paste a direct .mp4 or .webm URL from any hosting service
                </p>
              </div>
            </div>
          )}

          {settings.content?.heroStyle === 'pattern' && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium">Pattern/Texture Settings</p>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a seamless pattern or texture that tiles over the gradient background. PNG with transparency works best.
              </p>
              <ImageUpload
                label="Pattern Image"
                value={settings.branding?.heroPatternUrl ?? null}
                onChange={url => updateBranding('heroPatternUrl', url)}
                folder="patterns"
                aspectRatio="1/1"
                testId="pattern-upload"
              />
              <div className="space-y-2">
                <Label>Pattern Opacity: {settings.branding?.heroPatternOpacity ?? 20}%</Label>
                <Input
                  type="range"
                  min="5"
                  max="50"
                  value={settings.branding?.heroPatternOpacity ?? 20}
                  onChange={e => updateBranding('heroPatternOpacity', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-hero-pattern-opacity"
                />
                <p className="text-xs text-muted-foreground">
                  Lower values create a subtle texture, higher values make the pattern more visible.
                </p>
              </div>
            </div>
          )}

          {settings.content?.heroStyle === 'floating' && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium">Floating Mockup Settings</p>
              <div className="space-y-2">
                <Label>Product/Mockup Image URL</Label>
                <Input
                  value={settings.branding?.heroFloatingImageUrl ?? ''}
                  onChange={e => updateBranding('heroFloatingImageUrl', e.target.value)}
                  placeholder="https://example.com/product-mockup.png"
                  data-testid="input-hero-floating-image-url"
                />
                <p className="text-xs text-muted-foreground">
                  PNG with transparent background works best for the floating effect
                </p>
              </div>
              <div className="space-y-2">
                <Label>Spacing Between Text and Image: {settings.content?.floatingHeroGap ?? 8}</Label>
                <Input
                  type="range"
                  min="0"
                  max="24"
                  value={settings.content?.floatingHeroGap ?? 8}
                  onChange={e => updateContent('floatingHeroGap', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-floating-hero-gap"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the gap between the text content and the floating image (0 = tight, 24 = very spaced out)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Image Height: {settings.content?.floatingHeroImageHeight ?? 400}px</Label>
                <Input
                  type="range"
                  min="200"
                  max="700"
                  step="25"
                  value={settings.content?.floatingHeroImageHeight ?? 400}
                  onChange={e => updateContent('floatingHeroImageHeight', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-floating-hero-image-height"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the floating image height (200px = small, 700px = large)
                </p>
              </div>
            </div>
          )}

          {settings.content?.heroStyle === 'collage' && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium">Photo Collage Settings</p>
              <p className="text-xs text-muted-foreground">
                Add 3-5 image URLs. They will overlap on desktop and display as a 2x2 grid on mobile.
              </p>
              {(settings.content?.heroCollageImages ?? []).map((url, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={url}
                    onChange={e => {
                      const images = [...(settings.content?.heroCollageImages ?? [])]
                      images[index] = e.target.value
                      updateContent('heroCollageImages', images)
                    }}
                    placeholder={`Image URL ${index + 1}`}
                    data-testid={`input-collage-image-${index}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const images = (settings.content?.heroCollageImages ?? []).filter((_, i) => i !== index)
                      updateContent('heroCollageImages', images)
                    }}
                    data-testid={`button-remove-collage-image-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(settings.content?.heroCollageImages?.length ?? 0) < 5 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const images = [...(settings.content?.heroCollageImages ?? []), '']
                    updateContent('heroCollageImages', images)
                  }}
                  data-testid="button-add-collage-image"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Image
                </Button>
              )}
            </div>
          )}

          <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
            <p className="text-sm font-medium">Recommended Hero Image Specs</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Dimensions: <span className="font-medium text-foreground">1920 x 1080 pixels</span> (16:9 ratio)</li>
              <li>Minimum width: <span className="font-medium text-foreground">1280 pixels</span> for sharp display</li>
              <li>File size: Under <span className="font-medium text-foreground">500 KB</span> for fast loading</li>
              <li>Format: <span className="font-medium text-foreground">JPG</span> for photos, <span className="font-medium text-foreground">PNG</span> for graphics</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroSize">Hero Image Size</Label>
              <Select
                value={settings.branding.heroImageSize || 'cover'}
                onValueChange={value => updateBranding('heroImageSize', value)}
              >
                <SelectTrigger id="heroSize" data-testid="select-hero-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (fills area, may crop)</SelectItem>
                  <SelectItem value="contain">Contain (shows full image)</SelectItem>
                  <SelectItem value="auto">Auto (original size)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">How the image scales to fit</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heroPositionX">Horizontal Position: {settings.branding.heroImagePositionX ?? 50}%</Label>
                <Input
                  id="heroPositionX"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.branding.heroImagePositionX ?? 50}
                  onChange={e => updateBranding('heroImagePositionX', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-hero-position-x"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Left</span>
                  <span>Center</span>
                  <span>Right</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroPositionY">Vertical Position: {settings.branding.heroImagePositionY ?? 50}%</Label>
                <Input
                  id="heroPositionY"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.branding.heroImagePositionY ?? 50}
                  onChange={e => updateBranding('heroImagePositionY', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                  data-testid="input-hero-position-y"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Top</span>
                  <span>Center</span>
                  <span>Bottom</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Adjust where the focal point of your image is positioned (0% = left/top, 100% = right/bottom)</p>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md" style={{ backgroundColor: settings.branding.primaryColor }}>
              <Paintbrush className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Color Palette</p>
              <p className="text-xs text-muted-foreground">Pick your brand color and preview it across real UI components</p>
            </div>
          </div>
          <Link href="/admin/setup/palette">
            <Button variant="outline" size="sm" data-testid="link-palette-page">
              Open Palette Builder
            </Button>
          </Link>
        </CardContent>
      </Card>

      <FontPicker
        headingFont={settings.branding.headingFont || 'system'}
        bodyFont={settings.branding.bodyFont || 'system'}
        headingGradient={settings.branding.headingGradient ?? false}
        primaryColor={settings.branding.primaryColor}
        accentColor={settings.branding.accentColor}
        onHeadingFontChange={(font) => updateBranding('headingFont', font)}
        onBodyFontChange={(font) => updateBranding('bodyFont', font)}
        onHeadingGradientChange={(enabled) => updateBranding('headingGradient', enabled)}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Announcement Bar <InfoTooltip text="A top-of-page banner for promotions, product launches, or important updates. Visitors can dismiss it." /></CardTitle>
              <CardDescription>
                Display a top banner for promotions or announcements
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MiniSaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-announcement" />
              <Switch
                checked={settings.announcement?.enabled ?? false}
                onCheckedChange={checked => setSettings(prev => ({
                  ...prev,
                  announcement: { ...prev.announcement!, enabled: checked }
                }))}
                data-testid="switch-announcement-enabled"
              />
            </div>
          </div>
        </CardHeader>
        {settings.announcement?.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Announcement Text</Label>
              <Input
                value={settings.announcement?.text ?? ''}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  announcement: { ...prev.announcement!, text: e.target.value }
                }))}
                placeholder="Introducing our new feature!"
                data-testid="input-announcement-text"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link Text (optional)</Label>
                <Input
                  value={settings.announcement?.linkText ?? ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement!, linkText: e.target.value }
                  }))}
                  placeholder="Learn more"
                  data-testid="input-announcement-link-text"
                />
              </div>
              <div className="space-y-2">
                <Label>Link URL (optional)</Label>
                <Input
                  value={settings.announcement?.linkUrl ?? ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    announcement: { ...prev.announcement!, linkUrl: e.target.value }
                  }))}
                  placeholder="/features"
                  data-testid="input-announcement-link-url"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.announcement?.backgroundColor ?? '#7c3aed'}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, backgroundColor: e.target.value }
                    }))}
                    className="w-12 h-9 p-1"
                    data-testid="input-announcement-bg-color"
                  />
                  <Input
                    value={settings.announcement?.backgroundColor ?? '#7c3aed'}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, backgroundColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.announcement?.textColor ?? '#ffffff'}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, textColor: e.target.value }
                    }))}
                    className="w-12 h-9 p-1"
                    data-testid="input-announcement-text-color"
                  />
                  <Input
                    value={settings.announcement?.textColor ?? '#ffffff'}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement!, textColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.announcement?.dismissible ?? true}
                onCheckedChange={checked => setSettings(prev => ({
                  ...prev,
                  announcement: { ...prev.announcement!, dismissible: checked }
                }))}
                data-testid="switch-announcement-dismissible"
              />
              <Label>Allow users to dismiss</Label>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Navigation Menu <InfoTooltip text="Controls which links appear in the top navigation bar. Add badges to highlight new or upcoming features." /></CardTitle>
              <CardDescription>
                Configure which links appear in the top navigation bar of your website
              </CardDescription>
            </div>
            <Button onClick={addNavItem} size="sm" data-testid="button-add-nav-item">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>How it works:</strong> Each link you add here will appear in the header navigation bar. 
              Use the toggle to show/hide links. Add badges like "New" or "Beta" to highlight new features. 
              Common links include: Pricing, About, Contact, Blog, Features.
            </p>
          </div>
          <div className="space-y-3">
            {(settings.navigation?.items ?? []).map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={checked => updateNavItem(item.id, 'enabled', checked)}
                    data-testid={`switch-nav-${index}`}
                  />
                </div>
                <Input
                  value={item.label}
                  onChange={e => updateNavItem(item.id, 'label', e.target.value)}
                  placeholder="Link Label"
                  className="flex-1"
                  data-testid={`input-nav-label-${index}`}
                />
                <Input
                  value={item.href}
                  onChange={e => updateNavItem(item.id, 'href', e.target.value)}
                  placeholder="/path"
                  className="flex-1"
                  data-testid={`input-nav-href-${index}`}
                />
                <Select
                  value={item.badge || 'none'}
                  onValueChange={value => updateNavItem(item.id, 'badge', value === 'none' ? null : value)}
                >
                  <SelectTrigger className="w-28" data-testid={`select-nav-badge-${index}`}>
                    <SelectValue placeholder="Badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Badge</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="coming-soon">Soon</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNavItem(item.id)}
                  data-testid={`button-remove-nav-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(settings.navigation?.items ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No navigation links configured. Click "Add Link" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} testId="button-save-branding" />
      </div>
    </div>
  )
}
