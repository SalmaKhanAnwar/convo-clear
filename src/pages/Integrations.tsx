import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Users,
  Calendar,
  Bot
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Integration {
  id: string;
  platform: string;
  is_connected: boolean;
  connected_at?: string;
  connected_by?: string;
}

const Integrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('platform');

      if (error) throw error;
      
      if (data) {
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    // Simulate OAuth connection process
    toast({
      title: "Connecting...",
      description: `Redirecting to ${platform} authentication...`
    });

    // In a real app, this would redirect to OAuth flow
    setTimeout(() => {
      toast({
        title: "Connected Successfully",
        description: `${platform} integration is now active.`
      });
      
      // Update the integration status
      setIntegrations(prev => 
        prev.map(integration => 
          integration.platform === platform 
            ? { ...integration, is_connected: true, connected_at: new Date().toISOString() }
            : integration
        )
      );
    }, 2000);
  };

  const handleDisconnect = async (platform: string) => {
    try {
      // Update database
      await supabase
        .from('integrations')
        .update({ is_connected: false, connected_at: null })
        .eq('platform', platform);

      // Update local state
      setIntegrations(prev => 
        prev.map(integration => 
          integration.platform === platform 
            ? { ...integration, is_connected: false, connected_at: undefined }
            : integration
        )
      );

      toast({
        title: "Disconnected",
        description: `${platform} integration has been removed.`
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect integration.",
        variant: "destructive"
      });
    }
  };

  const platformData = {
    meet: {
      name: 'Google Meet',
      icon: '🟢',
      description: 'Real-time translation for Google Meet calls',
      features: ['Live captions', 'Meeting recordings', 'Calendar integration', 'Participant management'],
      setupTime: '2 minutes',
      permissions: ['Access meeting details', 'Join meetings as bot', 'Read calendar events']
    },
    teams: {
      name: 'Microsoft Teams',
      icon: '🔵',
      description: 'Enterprise translation for Microsoft Teams',
      features: ['Bot framework integration', 'Channel support', 'Meeting transcripts', 'Graph API access'],
      setupTime: '3 minutes',
      permissions: ['Join Teams meetings', 'Access user profile', 'Read organization directory']
    },
    zoom: {
      name: 'Zoom',
      icon: '🔷',
      description: 'Professional translation for Zoom meetings',
      features: ['SDK integration', 'Breakout room support', 'Cloud recording', 'Webhook events'],
      setupTime: '5 minutes',
      permissions: ['Access meeting data', 'Join as participant', 'Manage recordings']
    }
  };

  const getIntegrationStatus = (platform: string) => {
    const integration = integrations.find(i => i.platform === platform);
    return integration?.is_connected || false;
  };

  const connectedCount = integrations.filter(i => i.is_connected).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-display">Platform Integrations</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Connect your video platforms to enable real-time translation
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Platforms</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Platforms</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Setup Status</p>
                <p className="text-2xl font-bold">{Math.round((connectedCount / 3) * 100)}%</p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Alert */}
      {connectedCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect at least one platform to start creating translation sessions. 
            We recommend starting with your most frequently used video platform.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          {/* Platform Integration Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(platformData).map(([platform, data]) => {
              const isConnected = getIntegrationStatus(platform);
              const integration = integrations.find(i => i.platform === platform);
              
              return (
                <Card key={platform} className={`transition-all duration-200 ${isConnected ? 'border-green-200 bg-green-50/50' : 'hover:shadow-md'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{data.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{data.name}</CardTitle>
                          {isConnected && (
                            <Badge variant="default" className="mt-1">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Switch 
                        checked={isConnected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleConnect(platform);
                          } else {
                            handleDisconnect(platform);
                          }
                        }}
                      />
                    </div>
                    <CardDescription>{data.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {data.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Setup: {data.setupTime}</span>
                        </div>
                        {isConnected && integration?.connected_at && (
                          <span className="text-xs text-muted-foreground">
                            Connected {new Date(integration.connected_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isConnected ? (
                      <Button 
                        className="w-full"
                        onClick={() => handleConnect(platform)}
                      >
                        Connect {data.name}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Settings
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDisconnect(platform)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Custom Integration
              </CardTitle>
              <CardDescription>
                Need integration with another platform? We can build custom integrations for enterprise customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Request Custom Integration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure how integrations behave across your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-connect to meetings</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically join scheduled meetings with translation enabled
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Default language detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect source language in meetings
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Calendar integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Show translation bot availability in calendar
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Data Access</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Review what data each integration can access:
                  </p>
                  
                  {Object.entries(platformData).map(([platform, data]) => {
                    const isConnected = getIntegrationStatus(platform);
                    if (!isConnected) return null;
                    
                    return (
                      <div key={platform} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{data.icon}</span>
                          <span className="font-medium">{data.name}</span>
                          <Badge variant="outline">Connected</Badge>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {data.permissions.map((permission, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                              {permission}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Usage</CardTitle>
              <CardDescription>
                Track how often each platform is used for translations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(platformData).map(([platform, data]) => {
                  const isConnected = getIntegrationStatus(platform);
                  const usage = Math.floor(Math.random() * 100); // Mock usage data
                  
                  return (
                    <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{data.icon}</span>
                        <div>
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isConnected ? `${usage} minutes this month` : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{isConnected ? usage : '0'}</p>
                        <p className="text-xs text-muted-foreground">minutes</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrations;