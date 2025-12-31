import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, ExternalLink, Loader2, Crown, Users, Sparkles, Briefcase, UsersIcon } from 'lucide-react';
import { useSubscription, getTierDisplay, getStatusDisplay } from '@/hooks/use-subscription';
import { useLocation } from 'wouter';

const tierIcons = {
  free: Sparkles,
  pro: Crown,
  team: Users,
};

const tierLimits = {
  free: { projects: 1, teamMembers: 1 },
  pro: { projects: 10, teamMembers: 5 },
  team: { projects: -1, teamMembers: -1 },
};

export default function BillingPage() {
  const { subscription, isLoading } = useSubscription();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-billing" />
          </div>
        </main>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Unable to load subscription information.</p>
              <Button onClick={() => window.location.reload()} className="mt-4" data-testid="button-retry">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const tierInfo = getTierDisplay(subscription.tier);
  const statusInfo = getStatusDisplay(subscription.status);
  const TierIcon = tierIcons[subscription.tier];
  const limits = tierLimits[subscription.tier];

  const currentProjects = 0;
  const currentTeamMembers = 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" data-testid="text-billing-title">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
        </div>

        <div className="space-y-6">
          <Card data-testid="card-subscription-status">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tierInfo.color}`}>
                    <TierIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{tierInfo.name} Plan</CardTitle>
                    <CardDescription>Your current subscription</CardDescription>
                  </div>
                </div>
                <Badge variant={statusInfo.variant} data-testid="badge-subscription-status">
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.status !== 'free' && subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between gap-4 py-3 border-t flex-wrap">
                  <div>
                    <p className="text-sm font-medium">
                      {subscription.cancelAtPeriodEnd ? 'Access ends on' : 'Next billing date'}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-billing-date">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Canceling
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2 flex-wrap">
                {subscription.status === 'free' ? (
                  <Button onClick={() => setLocation('/pricing')} data-testid="button-upgrade">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.open('https://master-saas-muse-u7ga.vercel.app/billing', '_blank')}
                    data-testid="button-manage-billing"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
                {subscription.status !== 'free' && (
                  <Button variant="outline" onClick={() => setLocation('/pricing')} data-testid="button-view-plans">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-usage">
            <CardHeader>
              <CardTitle className="text-lg">Usage</CardTitle>
              <CardDescription>Your current usage against plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Projects</span>
                  </div>
                  <span className="text-sm text-muted-foreground" data-testid="text-projects-usage">
                    {currentProjects} / {limits.projects === -1 ? 'Unlimited' : limits.projects}
                  </span>
                </div>
                {limits.projects !== -1 && (
                  <Progress value={(currentProjects / limits.projects) * 100} className="h-2" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Team Members</span>
                  </div>
                  <span className="text-sm text-muted-foreground" data-testid="text-team-usage">
                    {currentTeamMembers} / {limits.teamMembers === -1 ? 'Unlimited' : limits.teamMembers}
                  </span>
                </div>
                {limits.teamMembers !== -1 && (
                  <Progress value={(currentTeamMembers / limits.teamMembers) * 100} className="h-2" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-billing-help">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you have questions about your subscription or need assistance with billing, 
                please contact our support team.
              </p>
              <Button variant="outline" size="sm" data-testid="button-contact-support">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
