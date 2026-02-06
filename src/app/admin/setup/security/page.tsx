'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield } from 'lucide-react'

export default function SecurityPage() {
  const { settings, saving, saved, handleSave, updateSecurity } = useSetupSettingsContext()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Security
          </CardTitle>
          <CardDescription>
            Configure security settings for user authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable MFA</p>
              <p className="text-sm text-muted-foreground">Allow users to enable multi-factor authentication</p>
            </div>
            <Switch
              checked={settings.security?.mfaEnabled ?? false}
              onCheckedChange={checked => updateSecurity('mfaEnabled', checked)}
              data-testid="switch-mfa-enabled"
            />
          </div>

          {settings.security?.mfaEnabled && (
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Require MFA</p>
                <p className="text-sm text-muted-foreground">Require all users to set up MFA</p>
              </div>
              <Switch
                checked={settings.security?.mfaRequired ?? false}
                onCheckedChange={checked => updateSecurity('mfaRequired', checked)}
                data-testid="switch-mfa-required"
              />
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Enable CAPTCHA</p>
              <p className="text-sm text-muted-foreground">Show CAPTCHA challenge on login and signup forms</p>
            </div>
            <Switch
              checked={settings.security?.captchaEnabled ?? false}
              onCheckedChange={checked => updateSecurity('captchaEnabled', checked)}
              data-testid="switch-captcha-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Requirements</CardTitle>
          <CardDescription>
            Define password policies for user accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password-min-length">Minimum Length</Label>
            <Input
              id="password-min-length"
              type="number"
              min="6"
              max="128"
              value={settings.security?.passwordMinLength ?? 8}
              onChange={(e) => updateSecurity('passwordMinLength', parseInt(e.target.value, 10))}
              data-testid="input-password-min-length"
            />
            <p className="text-xs text-muted-foreground">
              Minimum password length (6-128 characters)
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-b">
            <div>
              <p className="font-medium">Require Uppercase Letters</p>
              <p className="text-sm text-muted-foreground">Passwords must contain at least one uppercase letter</p>
            </div>
            <Switch
              checked={settings.security?.passwordRequireUppercase ?? false}
              onCheckedChange={checked => updateSecurity('passwordRequireUppercase', checked)}
              data-testid="switch-password-require-uppercase"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Require Numbers</p>
              <p className="text-sm text-muted-foreground">Passwords must contain at least one number</p>
            </div>
            <Switch
              checked={settings.security?.passwordRequireNumbers ?? false}
              onCheckedChange={checked => updateSecurity('passwordRequireNumbers', checked)}
              data-testid="switch-password-require-numbers"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Require Special Characters</p>
              <p className="text-sm text-muted-foreground">Passwords must contain special characters (!@#$%^&*)</p>
            </div>
            <Switch
              checked={settings.security?.passwordRequireSpecial ?? false}
              onCheckedChange={checked => updateSecurity('passwordRequireSpecial', checked)}
              data-testid="switch-password-require-special"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Configure user session and timeout settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout</Label>
            <Input
              id="session-timeout"
              type="number"
              min="0"
              value={settings.security?.sessionTimeoutMinutes ?? 0}
              onChange={(e) => updateSecurity('sessionTimeoutMinutes', parseInt(e.target.value, 10))}
              data-testid="input-session-timeout"
            />
            <p className="text-xs text-muted-foreground">
              Minutes of inactivity before automatic logout. Set to 0 for no timeout.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Data Rights</CardTitle>
          <CardDescription>
            Configure user data access and deletion policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Allow Data Export</p>
              <p className="text-sm text-muted-foreground">Users can download a copy of their personal data from their profile</p>
            </div>
            <Switch
              checked={settings.security?.dataExportEnabled ?? true}
              onCheckedChange={checked => updateSecurity('dataExportEnabled', checked)}
              data-testid="switch-data-export-enabled"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Allow Account Deletion</p>
              <p className="text-sm text-muted-foreground">Users can request account deletion from their profile</p>
            </div>
            <Switch
              checked={settings.security?.accountDeletionEnabled ?? true}
              onCheckedChange={checked => updateSecurity('accountDeletionEnabled', checked)}
              data-testid="switch-account-deletion-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <SaveButton
        saving={saving}
        saved={saved}
        onClick={handleSave}
        testId="button-save-security"
      />
    </div>
  )
}
