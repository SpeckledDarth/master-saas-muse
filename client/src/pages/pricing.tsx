import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useLocation } from 'wouter';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    tier: 'free' as const,
    icon: Sparkles,
    features: [
      '1 project',
      '1 team member',
      'Basic features',
      'Community support',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professionals and growing teams',
    tier: 'pro' as const,
    icon: Crown,
    features: [
      '10 projects',
      '5 team members',
      'Advanced analytics',
      'Priority support',
      'API access',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    description: 'For larger organizations',
    tier: 'team' as const,
    icon: Users,
    features: [
      'Unlimited projects',
      'Unlimited team members',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom branding',
      'Dedicated account manager',
    ],
    cta: 'Upgrade to Team',
    popular: false,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [, setLocation] = useLocation();

  const currentTier = subscription?.tier || 'free';

  const handleSelectPlan = (tier: 'free' | 'pro' | 'team') => {
    if (!user) {
      setLocation('/auth/signup');
      return;
    }
    if (tier === currentTier) return;
    window.open('https://master-saas-muse-u7ga.vercel.app/pricing', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4" data-testid="text-pricing-title">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.tier === currentTier;
            
            return (
              <Card 
                key={plan.name}
                className={`relative border-border/50 shadow-lg ${plan.popular ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-plan-${plan.tier}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan.tier)}
                    data-testid={`button-select-${plan.tier}`}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p>All plans include a 14-day free trial. No credit card required.</p>
        </div>
      </main>
    </div>
  );
}
