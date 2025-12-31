import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, getTierDisplay, getStatusDisplay } from '@/hooks/use-subscription';
import { Crown, Sparkles, Users, Loader2, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';

const tierIcons = {
  free: Sparkles,
  pro: Crown,
  team: Users,
};

export function SubscriptionCard() {
  const { subscription, isLoading } = useSubscription();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" data-testid="loader-subscription" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const tierInfo = getTierDisplay(subscription.tier);
  const statusInfo = getStatusDisplay(subscription.status);
  const TierIcon = tierIcons[subscription.tier];

  return (
    <Card className="border-border/50 shadow-lg" data-testid="card-subscription">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tierInfo.color}`}>
              <TierIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{tierInfo.name} Plan</CardTitle>
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
          </div>
        )}

        <div className="flex gap-3 pt-2 flex-wrap">
          {subscription.status === 'free' ? (
            <Button 
              onClick={() => setLocation('/pricing')} 
              data-testid="button-upgrade"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setLocation('/billing')}
              data-testid="button-manage-billing"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
