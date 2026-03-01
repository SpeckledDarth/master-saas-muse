'use client'

import { DSCard as Card, DSCardContent as CardContent, DSCardDescription as CardDescription, DSCardHeader as CardHeader, DSCardTitle as CardTitle } from '@/components/ui/ds-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Check } from 'lucide-react'
import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton, InfoTooltip } from '../components'

export default function SocialPage() {
  const { settings, saving, saved, handleSave, updateSocial } = useSetupSettingsContext()

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Social Links <InfoTooltip text="Displayed in your site footer. Helps with SEO and lets visitors find your brand across platforms." /></CardTitle>
          <CardDescription>
            Add links to your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-[var(--content-density-gap,1rem)]">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              value={settings.social.twitter}
              onChange={e => updateSocial('twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              data-testid="input-twitter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={settings.social.linkedin}
              onChange={e => updateSocial('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
              data-testid="input-linkedin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={settings.social.github}
              onChange={e => updateSocial('github', e.target.value)}
              placeholder="https://github.com/yourorg"
              data-testid="input-github"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={settings.social.website}
              onChange={e => updateSocial('website', e.target.value)}
              placeholder="https://yourcompany.com"
              data-testid="input-website"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <SaveButton 
          saving={saving}
          saved={saved}
          onClick={handleSave}
          testId="button-save-social"
        />
      </div>
    </div>
  )
}
