-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'pro', 'team', 'enterprise')),
  subscription_id TEXT,
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  billing_cycle_start TIMESTAMPTZ,
  billing_cycle_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_used INTEGER DEFAULT 0,
  meetings_count INTEGER DEFAULT 0,
  languages_used TEXT[] DEFAULT '{}',
  platforms_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, date)
);

-- Create billing history table
CREATE TABLE public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount INTEGER, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  invoice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create enterprise features table
CREATE TABLE public.enterprise_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sso_enabled BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  dedicated_support BOOLEAN DEFAULT false,
  data_retention_days INTEGER DEFAULT 30,
  white_label BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
  FOR UPDATE USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can manage subscriptions" ON public.subscribers
  FOR ALL USING (true);

-- RLS policies for usage analytics  
CREATE POLICY "Team members can view team usage" ON public.usage_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.team_id = usage_analytics.team_id 
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Edge functions can manage usage" ON public.usage_analytics
  FOR ALL USING (true);

-- RLS policies for billing history
CREATE POLICY "Users can view their own billing history" ON public.billing_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Edge functions can manage billing" ON public.billing_history
  FOR ALL USING (true);

-- RLS policies for enterprise features
CREATE POLICY "Team members can view enterprise features" ON public.enterprise_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.team_id = enterprise_features.team_id 
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage enterprise features" ON public.enterprise_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.team_id = enterprise_features.team_id 
      AND user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add triggers for updated_at columns
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_analytics_updated_at
  BEFORE UPDATE ON public.usage_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_features_updated_at
  BEFORE UPDATE ON public.enterprise_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update teams table with subscription info
ALTER TABLE public.teams 
ADD COLUMN subscription_tier TEXT CHECK (subscription_tier IN ('trial', 'starter', 'pro', 'team', 'enterprise')) DEFAULT 'trial',
ADD COLUMN monthly_minutes_limit INTEGER DEFAULT 200,
ADD COLUMN users_limit INTEGER DEFAULT 1,
ADD COLUMN features JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX idx_subscribers_stripe_customer ON public.subscribers(stripe_customer_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_usage_analytics_team_date ON public.usage_analytics(team_id, date);
CREATE INDEX idx_billing_history_user ON public.billing_history(user_id);
CREATE INDEX idx_enterprise_features_team ON public.enterprise_features(team_id);