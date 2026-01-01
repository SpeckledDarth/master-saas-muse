import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing';
  tier: 'free' | 'pro' | 'team';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  status: 'free',
  tier: 'free',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      console.log('[useSubscription] Fetching subscription, user:', user?.id);
      
      if (!user) {
        console.log('[useSubscription] No user, returning default free subscription');
        setSubscription(DEFAULT_SUBSCRIPTION);
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useSubscription] Calling /api/subscription for user:', user.id);
        const response = await fetch('/api/subscription', {
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }

        const data: SubscriptionInfo = await response.json();
        console.log('[useSubscription] Received subscription data:', data);
        setSubscription(data);
      } catch (err) {
        console.error('[useSubscription] Error fetching subscription:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setSubscription(DEFAULT_SUBSCRIPTION);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  return { subscription, isLoading, error };
}

export function isActiveSubscription(status: SubscriptionInfo['status']): boolean {
  return status === 'active' || status === 'trialing';
}

export function getTierDisplay(tier: SubscriptionInfo['tier']) {
  const tierConfig = {
    free: { name: 'Free', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' },
    pro: { name: 'Pro', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
    team: { name: 'Team', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
  };
  return tierConfig[tier];
}

export function getStatusDisplay(status: SubscriptionInfo['status']) {
  const statusConfig = {
    free: { label: 'Free Plan', variant: 'secondary' as const },
    active: { label: 'Active', variant: 'default' as const },
    canceled: { label: 'Canceled', variant: 'destructive' as const },
    past_due: { label: 'Past Due', variant: 'destructive' as const },
    trialing: { label: 'Trial', variant: 'outline' as const },
  };
  return statusConfig[status];
}
