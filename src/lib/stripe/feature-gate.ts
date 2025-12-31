import { stripeService, SubscriptionInfo } from './service';

export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface FeatureLimits {
  maxProjects: number;
  maxTeamMembers: number;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasApiAccess: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    maxProjects: 1,
    maxTeamMembers: 1,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasCustomBranding: false,
    hasApiAccess: false,
  },
  pro: {
    maxProjects: 10,
    maxTeamMembers: 5,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasCustomBranding: false,
    hasApiAccess: true,
  },
  team: {
    maxProjects: -1,
    maxTeamMembers: -1,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasCustomBranding: true,
    hasApiAccess: true,
  },
};

export function getFeatureLimits(tier: SubscriptionTier): FeatureLimits {
  return TIER_LIMITS[tier];
}

export function canAccessFeature(tier: SubscriptionTier, feature: keyof FeatureLimits): boolean {
  const limits = TIER_LIMITS[tier];
  const value = limits[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  return value !== 0;
}

export function hasReachedLimit(
  tier: SubscriptionTier, 
  feature: 'maxProjects' | 'maxTeamMembers', 
  currentCount: number
): boolean {
  const limit = TIER_LIMITS[tier][feature];
  if (limit === -1) return false;
  return currentCount >= limit;
}

export function getRequiredTierForFeature(feature: keyof FeatureLimits): SubscriptionTier {
  if (TIER_LIMITS.free[feature]) return 'free';
  if (TIER_LIMITS.pro[feature]) return 'pro';
  return 'team';
}

export function isActiveSubscription(status: SubscriptionInfo['status']): boolean {
  return status === 'active' || status === 'trialing';
}

export async function checkUserAccess(
  userId: string,
  feature: keyof FeatureLimits
): Promise<{ hasAccess: boolean; userTier: SubscriptionTier; requiredTier: SubscriptionTier }> {
  const subscription = await stripeService.getSubscriptionInfo(userId);
  const userTier = isActiveSubscription(subscription.status) ? subscription.tier : 'free';
  const requiredTier = getRequiredTierForFeature(feature);
  
  const tierHierarchy: SubscriptionTier[] = ['free', 'pro', 'team'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  return {
    hasAccess: userTierIndex >= requiredTierIndex,
    userTier,
    requiredTier,
  };
}
