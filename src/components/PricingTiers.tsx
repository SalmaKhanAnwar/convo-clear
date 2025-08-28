import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Users, Building, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  minutes: string;
  users: string;
  support: string;
  retention: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 15,
    period: 'month',
    description: 'Perfect for individuals and small teams getting started with translation',
    minutes: '1,000 minutes',
    users: '1 user',
    support: 'Standard support',
    retention: '7-day recording retention',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Basic integrations (Meet, Teams, Zoom)',
      '30+ languages supported',
      'Real-time translation',
      'Basic transcription',
      'Email support',
      'Mobile app access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'month',
    description: 'Advanced features for growing teams and businesses',
    minutes: '5,000 minutes',
    users: '3 users',
    support: 'Priority support',
    retention: '30-day recording retention',
    icon: <Users className="w-6 h-6" />,
    popular: true,
    features: [
      'All Starter features',
      'Advanced integrations + webhooks',
      '60+ languages supported',
      'Custom glossaries',
      'Basic analytics dashboard',
      'API access',
      'Priority email support',
      'Phone support'
    ]
  },
  {
    id: 'team',
    name: 'Team',
    price: 179,
    period: 'month',
    description: 'Comprehensive solution for larger teams and departments',
    minutes: '25,000 minutes',
    users: '10 users',
    support: 'Dedicated account manager',
    retention: '90-day recording retention',
    icon: <Building className="w-6 h-6" />,
    features: [
      'All Pro features',
      'Advanced analytics & reporting',
      'SSO integration (beta)',
      'Custom branding',
      'Team management dashboard',
      'Advanced API access',
      'Dedicated account manager',
      'Phone & chat support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    period: 'Custom pricing',
    description: 'Tailored solution for enterprise organizations',
    minutes: 'Unlimited',
    users: 'Unlimited',
    support: 'White-glove onboarding',
    retention: 'Custom retention policies',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'All Team features',
      'Unlimited minutes & users',
      'On-premise deployment option',
      'Custom SLA agreements',
      'Advanced security features',
      'White-label options',
      'Custom integrations',
      '24/7 dedicated support'
    ]
  }
];

interface PricingTiersProps {
  currentTier?: string;
  onUpgrade?: (tier: string) => void;
}

export const PricingTiers = ({ currentTier, onUpgrade }: PricingTiersProps) => {
  const { user } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSelectPlan = async (tier: PricingTier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to select a plan",
        variant: "destructive",
      });
      return;
    }

    if (tier.id === 'enterprise') {
      // Handle enterprise contact flow
      window.open('mailto:sales@meetinglingo.com?subject=Enterprise%20Plan%20Inquiry', '_blank');
      return;
    }

    try {
      setLoadingTier(tier.id);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: tier.id },
      });

      if (error) throw error;

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
        
        if (onUpgrade) {
          onUpgrade(tier.id);
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const getButtonText = (tier: PricingTier) => {
    if (currentTier === tier.id) return 'Current Plan';
    if (tier.id === 'enterprise') return 'Contact Sales';
    if (loadingTier === tier.id) return 'Loading...';
    return 'Start Free Trial';
  };

  const isCurrentPlan = (tierId: string) => currentTier === tierId;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {pricingTiers.map((tier) => (
        <Card 
          key={tier.id} 
          className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
            tier.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
          } ${isCurrentPlan(tier.id) ? 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary' : ''}`}
        >
          {tier.popular && (
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                Most Popular
              </div>
            </div>
          )}
          
          {isCurrentPlan(tier.id) && (
            <div className="absolute top-0 left-0">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-xs font-medium rounded-br-lg">
                Current Plan
              </div>
            </div>
          )}

          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                {tier.icon}
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
            </div>
            
            <div className="space-y-1">
              {tier.price > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/{tier.period}</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">{tier.period}</div>
              )}
            </div>
            
            <CardDescription className="text-sm">
              {tier.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Minutes</div>
                <div className="text-sm font-semibold">{tier.minutes}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Users</div>
                <div className="text-sm font-semibold">{tier.users}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Support</div>
                <div className="text-sm font-semibold">{tier.support}</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action button */}
            <Button 
              className={`w-full ${
                tier.popular ? 'btn-hero' : ''
              } ${isCurrentPlan(tier.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              variant={tier.popular && !isCurrentPlan(tier.id) ? 'default' : 'outline'}
              onClick={() => handleSelectPlan(tier)}
              disabled={loadingTier === tier.id || isCurrentPlan(tier.id)}
            >
              {getButtonText(tier)}
            </Button>

            {/* Trial notice */}
            {tier.id !== 'enterprise' && !isCurrentPlan(tier.id) && (
              <p className="text-xs text-center text-muted-foreground">
                7-day free trial • No credit card required
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PricingTiers;