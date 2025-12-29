import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield, Save } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

interface OrganizationSettings {
  id: number;
  name: string;
  settings: {
    allowSignups?: boolean;
    maintenanceMode?: boolean;
    supportEmail?: string;
    requireEmailVerification?: boolean;
    enableGoogleAuth?: boolean;
    [key: string]: unknown;
  };
}

const settingsSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  allowSignups: z.boolean(),
  maintenanceMode: z.boolean(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  requireEmailVerification: z.boolean(),
  enableGoogleAuth: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: orgSettings, isLoading } = useQuery<OrganizationSettings>({
    queryKey: ["/api/admin/settings"],
    enabled: isAdmin,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      allowSignups: true,
      maintenanceMode: false,
      supportEmail: "",
      requireEmailVerification: true,
      enableGoogleAuth: true,
    },
    values: orgSettings ? {
      name: orgSettings.name,
      allowSignups: orgSettings.settings?.allowSignups ?? true,
      maintenanceMode: orgSettings.settings?.maintenanceMode ?? false,
      supportEmail: orgSettings.settings?.supportEmail ?? "",
      requireEmailVerification: orgSettings.settings?.requireEmailVerification ?? true,
      enableGoogleAuth: orgSettings.settings?.enableGoogleAuth ?? true,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      return apiRequest("PUT", "/api/admin/settings", {
        name: values.name,
        settings: {
          allowSignups: values.allowSignups,
          maintenanceMode: values.maintenanceMode,
          supportEmail: values.supportEmail,
          requireEmailVerification: values.requireEmailVerification,
          enableGoogleAuth: values.enableGoogleAuth,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin access to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-settings-page">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" data-testid="link-back-to-admin">
          <Button variant="ghost" size="icon" data-testid="button-back-to-admin">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure application settings</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            <Card data-testid="card-general-settings">
              <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Basic application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="My SaaS App"
                          data-testid="input-org-name"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="support@example.com"
                          data-testid="input-support-email"
                        />
                      </FormControl>
                      <FormDescription>
                        Users will contact this email for support
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card data-testid="card-feature-toggles">
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>Enable or disable application features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="allowSignups"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div>
                        <FormLabel>Allow New Signups</FormLabel>
                        <FormDescription>
                          When disabled, only existing users can sign in
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-allow-signups"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenanceMode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div>
                        <FormLabel>Maintenance Mode</FormLabel>
                        <FormDescription>
                          Show a maintenance message to all users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-maintenance-mode"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requireEmailVerification"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div>
                        <FormLabel>Require Email Verification</FormLabel>
                        <FormDescription>
                          Users must verify their email before accessing the app
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-require-email-verification"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableGoogleAuth"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <div>
                        <FormLabel>Enable Google Sign-In</FormLabel>
                        <FormDescription>
                          Allow users to sign in with their Google account
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-enable-google-auth"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
