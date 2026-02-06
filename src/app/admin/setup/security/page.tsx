'use client'

import { useSetupSettingsContext } from '@/hooks/use-setup-settings-context'
import { SaveButton } from '../components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield, Database, RefreshCw, Bell } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backups
          </CardTitle>
          <CardDescription>
            Configure automated database backup schedule (managed by Supabase)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Backup Notifications</p>
              <p className="text-sm text-muted-foreground">Get notified about backup status via email</p>
            </div>
            <Switch
              checked={settings.security?.backupEnabled ?? false}
              onCheckedChange={checked => updateSecurity('backupEnabled', checked)}
              data-testid="switch-backup-enabled"
            />
          </div>

          {settings.security?.backupEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Select
                  value={settings.security?.backupFrequency ?? 'daily'}
                  onValueChange={(value) => updateSecurity('backupFrequency', value as 'daily' | 'weekly' | 'monthly')}
                >
                  <SelectTrigger id="backup-frequency" data-testid="select-backup-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-retention">Retention Period (days)</Label>
                <Input
                  id="backup-retention"
                  type="number"
                  min="7"
                  max="365"
                  value={settings.security?.backupRetentionDays ?? 30}
                  onChange={(e) => updateSecurity('backupRetentionDays', parseInt(e.target.value, 10))}
                  data-testid="input-backup-retention"
                />
                <p className="text-xs text-muted-foreground">
                  How long to retain backups (7-365 days). Supabase Pro plans include daily backups with 7-day retention by default.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            API Token Rotation
          </CardTitle>
          <CardDescription>
            Configure automatic rotation of API tokens and secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Token Rotation</p>
              <p className="text-sm text-muted-foreground">Automatically rotate API tokens on a schedule</p>
            </div>
            <Switch
              checked={settings.security?.tokenRotationEnabled ?? false}
              onCheckedChange={checked => updateSecurity('tokenRotationEnabled', checked)}
              data-testid="switch-token-rotation-enabled"
            />
          </div>

          {settings.security?.tokenRotationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="token-rotation-interval">Rotation Interval (days)</Label>
              <Input
                id="token-rotation-interval"
                type="number"
                min="1"
                max="365"
                value={settings.security?.tokenRotationIntervalDays ?? 90}
                onChange={(e) => updateSecurity('tokenRotationIntervalDays', parseInt(e.target.value, 10))}
                data-testid="input-token-rotation-interval"
              />
              <p className="text-xs text-muted-foreground">
                How often to rotate webhook secrets and API tokens (default: 90 days)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Metrics Alerts
          </CardTitle>
          <CardDescription>
            Get notified when key metrics cross thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Metric Alerts</p>
              <p className="text-sm text-muted-foreground">Send email alerts when KPIs exceed thresholds</p>
            </div>
            <Switch
              checked={settings.security?.alertsEnabled ?? false}
              onCheckedChange={checked => updateSecurity('alertsEnabled', checked)}
              data-testid="switch-alerts-enabled"
            />
          </div>

          {settings.security?.alertsEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="alert-email">Alert Recipient Email</Label>
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={settings.security?.alertRecipientEmail ?? ''}
                  onChange={(e) => updateSecurity('alertRecipientEmail', e.target.value)}
                  data-testid="input-alert-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="churn-threshold">Churn Rate Threshold (%)</Label>
                <Input
                  id="churn-threshold"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.security?.alertChurnThreshold ?? 5}
                  onChange={(e) => updateSecurity('alertChurnThreshold', parseFloat(e.target.value))}
                  data-testid="input-churn-threshold"
                />
                <p className="text-xs text-muted-foreground">Alert when monthly churn exceeds this percentage</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-monthly-users">Minimum Monthly New Users</Label>
                <Input
                  id="min-monthly-users"
                  type="number"
                  min="0"
                  value={settings.security?.alertMinMonthlyUsers ?? 10}
                  onChange={(e) => updateSecurity('alertMinMonthlyUsers', parseInt(e.target.value, 10))}
                  data-testid="input-min-monthly-users"
                />
                <p className="text-xs text-muted-foreground">Alert when new signups fall below this number</p>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-b">
                <div>
                  <p className="font-medium">Weekly Report</p>
                  <p className="text-sm text-muted-foreground">Email a weekly metrics summary</p>
                </div>
                <Switch
                  checked={settings.security?.weeklyReportEnabled ?? false}
                  onCheckedChange={checked => updateSecurity('weeklyReportEnabled', checked)}
                  data-testid="switch-weekly-report"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Monthly Report</p>
                  <p className="text-sm text-muted-foreground">Email a monthly metrics summary</p>
                </div>
                <Switch
                  checked={settings.security?.monthlyReportEnabled ?? false}
                  onCheckedChange={checked => updateSecurity('monthlyReportEnabled', checked)}
                  data-testid="switch-monthly-report"
                />
              </div>
            </>
          )}
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
