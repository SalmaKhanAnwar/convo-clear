import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import PricingTiers from '@/components/PricingTiers';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  Clock, 
  TrendingUp,
  Settings,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
}

interface UsageData {
  minutes_used: number;
  meetings_count: number;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  period_start: string;
  period_end: string;
  invoice_url: string | null;
  created_at: string;
}

const Billing = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData>({ minutes_used: 0, meetings_count: 0 });
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [team, setTeam] = useState<any>(null);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscription(data);
      
      // Fetch team data
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      
      if (teamData) {
        setTeam(teamData);
      }

      // Fetch current month usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { data: usageData } = await supabase
        .from('usage_analytics')
        .select('*')
        .eq('team_id', teamData?.id)
        .gte('date', `${currentMonth}-01`)
        .lt('date', `${currentMonth}-32`);

      if (usageData) {
        const totalUsage = usageData.reduce((acc, day) => ({
          minutes_used: acc.minutes_used + (day.minutes_used || 0),
          meetings_count: acc.meetings_count + (day.meetings_count || 0)
        }), { minutes_used: 0, meetings_count: 0 });
        
        setUsage(totalUsage);
      }

      // Fetch billing history
      const { data: historyData } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyData) {
        setBillingHistory(historyData);
      }

    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await fetchSubscriptionData();
    setRefreshing(false);
    toast({
      title: "Subscription Updated",
      description: "Your subscription status has been refreshed",
    });
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSubscriptionData().finally(() => setLoading(false));
  }, [user]);

  // Check for successful checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Subscription Activated!",
        description: "Your subscription has been successfully activated.",
      });
      // Refresh subscription data after successful checkout
      setTimeout(fetchSubscriptionData, 2000);
    }
    if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Checkout Canceled",
        description: "You can start your subscription anytime.",
        variant: "destructive",
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const getUsagePercentage = () => {
    if (!team?.monthly_minutes_limit || team.monthly_minutes_limit === -1) return 0;
    return Math.min(100, (usage.minutes_used / team.monthly_minutes_limit) * 100);
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing information</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefreshSubscription}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Current Subscription Status */}
      {subscription?.subscribed ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Active Subscription
                </CardTitle>
                <CardDescription>
                  You're currently on the {subscription.subscription_tier?.charAt(0).toUpperCase() + subscription.subscription_tier?.slice(1)} plan
                </CardDescription>
              </div>
              <Button onClick={handleManageSubscription} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Plan</div>
                  <div className="text-lg font-semibold capitalize">{subscription.subscription_tier} Plan</div>
                </div>
                {subscription.subscription_end && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Next Billing Date</div>
                    <div className="text-lg font-semibold">
                      {new Date(subscription.subscription_end).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Current Usage</div>
                  <div className="space-y-2 mt-1">
                    <div className="flex justify-between text-sm">
                      <span>Minutes Used</span>
                      <span>
                        {usage.minutes_used} / {team?.monthly_minutes_limit === -1 ? '∞' : team?.monthly_minutes_limit || 0}
                      </span>
                    </div>
                    {team?.monthly_minutes_limit !== -1 && (
                      <Progress value={getUsagePercentage()} className="h-2" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Meetings This Month</div>
                  <div className="text-lg font-semibold">{usage.meetings_count}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              No Active Subscription
            </CardTitle>
            <CardDescription className="text-orange-700">
              Choose a plan below to continue using MeetingLingo's premium features
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Usage Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minutes Used</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.minutes_used}</div>
            <p className="text-xs text-muted-foreground">
              This billing period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.meetings_count}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.subscribed ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription?.subscription_tier || 'No plan'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Your recent invoices and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingHistory.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()} • 
                      Billing period: {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  {invoice.invoice_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Pricing Plans */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-display mb-2">
            {subscription?.subscribed ? 'Upgrade Your Plan' : 'Choose Your Plan'}
          </h2>
          <p className="text-muted-foreground">
            {subscription?.subscribed 
              ? 'Upgrade to unlock more features and higher limits'
              : 'Start with a 7-day free trial, no credit card required'
            }
          </p>
        </div>
        
        <PricingTiers 
          currentTier={subscription?.subscription_tier || undefined}
          onUpgrade={() => {
            // Refresh after successful upgrade
            setTimeout(fetchSubscriptionData, 3000);
          }}
        />
      </div>

      {/* Trust Indicators */}
      <div className="grid md:grid-cols-3 gap-6 text-center">
        <div className="space-y-2">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <h3 className="font-semibold">7-Day Free Trial</h3>
          <p className="text-sm text-muted-foreground">
            Try all features risk-free
          </p>
        </div>
        <div className="space-y-2">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <h3 className="font-semibold">Cancel Anytime</h3>
          <p className="text-sm text-muted-foreground">
            No long-term contracts
          </p>
        </div>
        <div className="space-y-2">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <h3 className="font-semibold">SOC2 Compliant</h3>
          <p className="text-sm text-muted-foreground">
            Enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Billing;