'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { defaultSettings } from '@/types/settings'

export default function PagesSetupPage() {
  const { settings, saving, saved, handleSave, updateAbout, updateContact, updateLegal, updatePricingPage, updateFAQPage, updateCustomPage, addTeamMember, updateTeamMember, removeTeamMember } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">About Page <InfoTooltip text="Tell your company's story and introduce your team. Builds trust and connection with potential customers." /></CardTitle>
          <CardDescription>
            Configure the content for your About Us page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            label="Hero Image"
            value={settings.pages?.about?.heroImageUrl}
            onChange={(url) => updateAbout('heroImageUrl', url)}
            bucket="branding"
            folder="heroes"
            aspectRatio="21/9"
            testId="about-hero-image"
          />
          <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.about?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
            <div className="space-y-2">
              <Label className="text-xs">Horizontal: {settings.pages?.about?.heroImagePositionX ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.about?.heroImagePositionX ?? 50}
                onChange={e => updateAbout('heroImagePositionX', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.about?.heroImageUrl}
                data-testid="input-about-hero-position-x"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Vertical: {settings.pages?.about?.heroImagePositionY ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.about?.heroImagePositionY ?? 50}
                onChange={e => updateAbout('heroImagePositionY', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.about?.heroImageUrl}
                data-testid="input-about-hero-position-y"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.pages?.about?.headline ?? ''}
                onChange={e => updateAbout('headline', e.target.value)}
                placeholder="About Us"
                data-testid="input-about-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={settings.pages?.about?.subheadline ?? ''}
                onChange={e => updateAbout('subheadline', e.target.value)}
                placeholder="Learn more about our mission"
                data-testid="input-about-subheadline"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Our Story</Label>
            <Textarea
              value={settings.pages?.about?.story ?? ''}
              onChange={e => updateAbout('story', e.target.value)}
              placeholder="Tell your company's story..."
              rows={4}
              data-testid="input-about-story"
            />
          </div>
          <div className="space-y-2">
            <Label>Mission Statement</Label>
            <Textarea
              value={settings.pages?.about?.mission ?? ''}
              onChange={e => updateAbout('mission', e.target.value)}
              placeholder="Your company's mission..."
              rows={3}
              data-testid="input-about-mission"
            />
          </div>
          <div className="space-y-2">
            <Label>Values (one per line)</Label>
            <Textarea
              value={(settings.pages?.about?.values ?? []).join('\n')}
              onChange={e => updateAbout('values', e.target.value.split('\n').filter(v => v.trim()))}
              onBlur={e => updateAbout('values', e.target.value.split('\n').filter(v => v.trim()))}
              placeholder="Innovation&#10;Customer Focus&#10;Integrity"
              rows={4}
              data-testid="input-about-values"
            />
          </div>
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="font-medium">Show Team Section</p>
              <p className="text-sm text-muted-foreground">Display team members on the About page</p>
            </div>
            <Switch
              checked={settings.pages?.about?.showTeam ?? false}
              onCheckedChange={checked => updateAbout('showTeam', checked)}
              data-testid="switch-show-team"
            />
          </div>
          {settings.pages?.about?.showTeam && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label>Team Members</Label>
                <Button size="sm" variant="outline" onClick={addTeamMember} data-testid="button-add-team-member">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              </div>
              {(settings.pages?.about?.team ?? []).map(member => (
                <div key={member.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{member.name || 'New Member'}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeTeamMember(member.id)} data-testid={`button-remove-member-${member.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={member.name}
                        onChange={e => updateTeamMember(member.id, 'name', e.target.value)}
                        placeholder="John Doe"
                        data-testid={`input-member-name-${member.id}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Role</Label>
                      <Input
                        value={member.role}
                        onChange={e => updateTeamMember(member.id, 'role', e.target.value)}
                        placeholder="CEO"
                        data-testid={`input-member-role-${member.id}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bio</Label>
                    <Textarea
                      value={member.bio}
                      onChange={e => updateTeamMember(member.id, 'bio', e.target.value)}
                      placeholder="Short bio..."
                      rows={2}
                      data-testid={`input-member-bio-${member.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <ImageUpload
                      label="Photo"
                      value={member.imageUrl}
                      onChange={(url) => updateTeamMember(member.id, 'imageUrl', url)}
                      bucket="branding"
                      folder="team"
                      aspectRatio="1/1"
                      testId={`member-photo-${member.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Contact Page <InfoTooltip text="How customers can reach you — form, email, phone, and address. Essential for building trust." /></CardTitle>
          <CardDescription>
            Configure contact information and form settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            label="Hero Image"
            value={settings.pages?.contact?.heroImageUrl}
            onChange={(url) => updateContact('heroImageUrl', url)}
            bucket="branding"
            folder="heroes"
            aspectRatio="21/9"
            testId="contact-hero-image"
          />
          <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.contact?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
            <div className="space-y-2">
              <Label className="text-xs">Horizontal: {settings.pages?.contact?.heroImagePositionX ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.contact?.heroImagePositionX ?? 50}
                onChange={e => updateContact('heroImagePositionX', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.contact?.heroImageUrl}
                data-testid="input-contact-hero-position-x"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Vertical: {settings.pages?.contact?.heroImagePositionY ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.contact?.heroImagePositionY ?? 50}
                onChange={e => updateContact('heroImagePositionY', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.contact?.heroImageUrl}
                data-testid="input-contact-hero-position-y"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.pages?.contact?.headline ?? ''}
                onChange={e => updateContact('headline', e.target.value)}
                placeholder="Contact Us"
                data-testid="input-contact-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={settings.pages?.contact?.subheadline ?? ''}
                onChange={e => updateContact('subheadline', e.target.value)}
                placeholder="We'd love to hear from you"
                data-testid="input-contact-subheadline"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={settings.pages?.contact?.email ?? ''}
                onChange={e => updateContact('email', e.target.value)}
                placeholder="support@example.com"
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={settings.pages?.contact?.phone ?? ''}
                onChange={e => updateContact('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                data-testid="input-contact-phone"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={settings.pages?.contact?.address ?? ''}
              onChange={e => updateContact('address', e.target.value)}
              placeholder="123 Main Street&#10;City, State 12345"
              rows={2}
              data-testid="input-contact-address"
            />
          </div>
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="font-medium">Show Contact Form</p>
              <p className="text-sm text-muted-foreground">Display a contact form for visitors</p>
            </div>
            <Switch
              checked={settings.pages?.contact?.showContactForm ?? true}
              onCheckedChange={checked => updateContact('showContactForm', checked)}
              data-testid="switch-show-contact-form"
            />
          </div>
          <div className="space-y-2">
            <Label>Form Success Message</Label>
            <Input
              value={settings.pages?.contact?.formSuccessMessage ?? ''}
              onChange={e => updateContact('formSuccessMessage', e.target.value)}
              placeholder="Thank you! We'll get back to you soon."
              data-testid="input-contact-success-message"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Terms of Service <InfoTooltip text="Legal agreement between you and your users. Required for most app stores and payment processors." /></CardTitle>
          <CardDescription>
            Edit your Terms of Service content (supports Markdown)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Last Updated Date</Label>
            <Input
              type="date"
              value={settings.pages?.legal?.termsLastUpdated ?? ''}
              onChange={e => updateLegal('termsLastUpdated', e.target.value)}
              data-testid="input-terms-date"
            />
          </div>
          <div className="space-y-2">
            <Label>Terms of Service Content (Markdown)</Label>
            <Textarea
              value={settings.pages?.legal?.termsOfService ?? ''}
              onChange={e => updateLegal('termsOfService', e.target.value)}
              placeholder="# Terms of Service&#10;&#10;## 1. Introduction..."
              rows={12}
              className="font-mono text-sm"
              data-testid="input-terms-content"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Privacy Policy <InfoTooltip text="Explains what data you collect and how you use it. Required by GDPR, CCPA, and most privacy laws." /></CardTitle>
          <CardDescription>
            Edit your Privacy Policy content (supports Markdown)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Last Updated Date</Label>
            <Input
              type="date"
              value={settings.pages?.legal?.privacyLastUpdated ?? ''}
              onChange={e => updateLegal('privacyLastUpdated', e.target.value)}
              data-testid="input-privacy-date"
            />
          </div>
          <div className="space-y-2">
            <Label>Privacy Policy Content (Markdown)</Label>
            <Textarea
              value={settings.pages?.legal?.privacyPolicy ?? ''}
              onChange={e => updateLegal('privacyPolicy', e.target.value)}
              placeholder="# Privacy Policy&#10;&#10;## 1. Information We Collect..."
              rows={12}
              className="font-mono text-sm"
              data-testid="input-privacy-content"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Pricing Page <InfoTooltip text="Controls how your pricing page header appears to visitors. Plans are managed in Stripe." /></CardTitle>
          <CardDescription>
            Configure the appearance of your pricing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            label="Hero Image"
            value={settings.pages?.pricing?.heroImageUrl}
            onChange={(url) => updatePricingPage('heroImageUrl', url)}
            bucket="branding"
            folder="heroes"
            aspectRatio="21/9"
            testId="pricing-hero-image"
          />
          <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.pricing?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
            <div className="space-y-2">
              <Label className="text-xs">Horizontal: {settings.pages?.pricing?.heroImagePositionX ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.pricing?.heroImagePositionX ?? 50}
                onChange={e => updatePricingPage('heroImagePositionX', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.pricing?.heroImageUrl}
                data-testid="input-pricing-hero-position-x"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Vertical: {settings.pages?.pricing?.heroImagePositionY ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.pricing?.heroImagePositionY ?? 50}
                onChange={e => updatePricingPage('heroImagePositionY', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.pricing?.heroImageUrl}
                data-testid="input-pricing-hero-position-y"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.pages?.pricing?.headline ?? ''}
                onChange={e => updatePricingPage('headline', e.target.value)}
                placeholder="Simple, Transparent Pricing"
                data-testid="input-pricing-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={settings.pages?.pricing?.subheadline ?? ''}
                onChange={e => updatePricingPage('subheadline', e.target.value)}
                placeholder="Choose the plan that works for you"
                data-testid="input-pricing-subheadline"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">FAQ Page <InfoTooltip text="Standalone FAQ page with its own URL. Separate from the homepage FAQ section configured in Content." /></CardTitle>
          <CardDescription>
            Configure the appearance of your FAQ page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            label="Hero Image"
            value={settings.pages?.faq?.heroImageUrl}
            onChange={(url) => updateFAQPage('heroImageUrl', url)}
            bucket="branding"
            folder="heroes"
            aspectRatio="21/9"
            testId="faq-hero-image"
          />
          <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${settings.pages?.faq?.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
            <div className="space-y-2">
              <Label className="text-xs">Horizontal: {settings.pages?.faq?.heroImagePositionX ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.faq?.heroImagePositionX ?? 50}
                onChange={e => updateFAQPage('heroImagePositionX', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.faq?.heroImageUrl}
                data-testid="input-faq-hero-position-x"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Vertical: {settings.pages?.faq?.heroImagePositionY ?? 50}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.pages?.faq?.heroImagePositionY ?? 50}
                onChange={e => updateFAQPage('heroImagePositionY', parseInt(e.target.value))}
                className="w-full cursor-pointer"
                disabled={!settings.pages?.faq?.heroImageUrl}
                data-testid="input-faq-hero-position-y"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={settings.pages?.faq?.headline ?? ''}
                onChange={e => updateFAQPage('headline', e.target.value)}
                placeholder="Frequently Asked Questions"
                data-testid="input-faq-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={settings.pages?.faq?.subheadline ?? ''}
                onChange={e => updateFAQPage('subheadline', e.target.value)}
                placeholder="Find answers to common questions"
                data-testid="input-faq-subheadline"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Custom Pages <InfoTooltip text="Create up to 4 additional marketing pages with custom names and URLs, editable with Markdown." /></CardTitle>
          <CardDescription>
            Configure up to 4 additional marketing pages with custom names
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(settings.pages?.customPages ?? defaultSettings.pages.customPages).map((page, index) => (
            <div key={page.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Page {index + 1}: {page.name || 'Untitled'}</span>
                <Switch
                  checked={page.enabled}
                  onCheckedChange={checked => updateCustomPage(page.id, 'enabled', checked)}
                  data-testid={`switch-custom-page-${page.id}`}
                />
              </div>
              {page.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Page Name (appears in menu)</Label>
                      <Input
                        value={page.name}
                        onChange={e => updateCustomPage(page.id, 'name', e.target.value)}
                        placeholder="Features"
                        data-testid={`input-custom-page-name-${page.id}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">URL Slug</Label>
                      <Input
                        value={page.slug}
                        onChange={e => updateCustomPage(page.id, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="features"
                        data-testid={`input-custom-page-slug-${page.id}`}
                      />
                    </div>
                  </div>
                  <ImageUpload
                    label="Hero Image"
                    value={page.heroImageUrl}
                    onChange={(url) => updateCustomPage(page.id, 'heroImageUrl', url)}
                    bucket="branding"
                    folder="heroes"
                    aspectRatio="21/9"
                    testId={`custom-page-hero-${page.id}`}
                  />
                  <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg ${page.heroImageUrl ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}>
                    <div className="space-y-2">
                      <Label className="text-xs">Horizontal: {page.heroImagePositionX ?? 50}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={page.heroImagePositionX ?? 50}
                        onChange={e => updateCustomPage(page.id, 'heroImagePositionX', parseInt(e.target.value))}
                        className="w-full cursor-pointer"
                        disabled={!page.heroImageUrl}
                        data-testid={`input-custom-page-hero-position-x-${page.id}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Vertical: {page.heroImagePositionY ?? 50}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={page.heroImagePositionY ?? 50}
                        onChange={e => updateCustomPage(page.id, 'heroImagePositionY', parseInt(e.target.value))}
                        className="w-full cursor-pointer"
                        disabled={!page.heroImageUrl}
                        data-testid={`input-custom-page-hero-position-y-${page.id}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Headline</Label>
                      <Input
                        value={page.headline}
                        onChange={e => updateCustomPage(page.id, 'headline', e.target.value)}
                        placeholder="Our Features"
                        data-testid={`input-custom-page-headline-${page.id}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Subheadline</Label>
                      <Input
                        value={page.subheadline}
                        onChange={e => updateCustomPage(page.id, 'subheadline', e.target.value)}
                        placeholder="Discover what makes us different"
                        data-testid={`input-custom-page-subheadline-${page.id}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Page Content (Markdown supported)</Label>
                    <Textarea
                      value={page.content ?? ''}
                      onChange={e => updateCustomPage(page.id, 'content', e.target.value)}
                      placeholder="Write your page content here. You can use Markdown for formatting..."
                      rows={8}
                      className="font-mono text-sm"
                      data-testid={`input-custom-page-content-${page.id}`}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={handleSave}
          testId="button-save-pages"
        />
      </div>
    </div>
  )
}
