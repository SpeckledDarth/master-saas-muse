'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrganizationSettings {
  id: string;
  organization_name: string;
  support_email: string;
  allow_signups: boolean;
  maintenance_mode: boolean;
  require_email_verification: boolean;
  enable_google_signin: boolean;
}

export default function AdminSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        router.push('/profile');
        return;
      }

      const { data: settingsData } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('app_id', 'default')
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }

      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('organization_settings')
      .update({
        organization_name: settings.organization_name,
        support_email: settings.support_email,
        allow_signups: settings.allow_signups,
        maintenance_mode: settings.maintenance_mode,
        require_email_verification: settings.require_email_verification,
        enable_google_signin: settings.enable_google_signin,
      })
      .eq('app_id', 'default');

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'settings_updated',
        target_type: 'organization_settings',
        target_id: 'default',
        details: settings,
      });

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">No settings found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin" data-testid="link-back-admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-settings-title">Organization Settings</h1>
        <p className="text-muted-foreground">Configure your application settings and feature flags</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic organization information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={settings.organization_name}
                onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                data-testid="input-org-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                data-testid="input-support-email"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>Enable or disable application features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow New Signups</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to create accounts
                </p>
              </div>
              <Switch
                checked={settings.allow_signups}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_signups: checked })}
                data-testid="switch-allow-signups"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Show maintenance page to all non-admin users
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                data-testid="switch-maintenance-mode"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify their email before accessing the app
                </p>
              </div>
              <Switch
                checked={settings.require_email_verification}
                onCheckedChange={(checked) => setSettings({ ...settings, require_email_verification: checked })}
                data-testid="switch-require-verification"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Google Sign-In</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to sign in with Google
                </p>
              </div>
              <Switch
                checked={settings.enable_google_signin}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_google_signin: checked })}
                data-testid="switch-google-signin"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} data-testid="button-save-settings">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
