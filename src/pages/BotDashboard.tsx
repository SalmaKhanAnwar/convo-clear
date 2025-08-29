import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import BotController from '@/components/BotController';
import { supabase } from '@/integrations/supabase/client';
import { Link, Video, Users, Clock, Activity } from 'lucide-react';

interface ActiveBotSession {
  id: string;
  meeting_id: string;
  status: string;
  platform: string;
  meeting_url: string;
  source_language: string;
  target_language: string;
  audio_processing_active: boolean;
  started_at: string;
  meetings: {
    title: string;
  } | null;
}

const BotDashboard = () => {
  const { toast } = useToast();
  const [meetingUrl, setMeetingUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'zoom' | 'meet' | 'teams'>('zoom');
  const [activeBotSessions, setActiveBotSessions] = useState<ActiveBotSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchActiveBotSessions();
    
    // Poll for active sessions every 10 seconds
    const interval = setInterval(fetchActiveBotSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBotSessions = async () => {
    try {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('team_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userRole) return;

      const { data: sessions, error } = await supabase
        .from('bot_sessions')
        .select(`
          *,
          meetings (
            title
          )
        `)
        .eq('team_id', userRole.team_id)
        .in('status', ['initializing', 'connecting', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActiveBotSessions((sessions || []).map((session: any) => ({
        ...session,
        meetings: session.meetings?.[0] || null
      })));
    } catch (error) {
      console.error('Failed to fetch bot sessions:', error);
    }
  };

  const detectPlatform = (url: string): 'zoom' | 'meet' | 'teams' | null => {
    if (url.includes('zoom.us')) return 'zoom';
    if (url.includes('meet.google.com')) return 'meet';
    if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams';
    return null;
  };

  const handleUrlChange = (url: string) => {
    setMeetingUrl(url);
    const detectedPlatform = detectPlatform(url);
    if (detectedPlatform) {
      setSelectedPlatform(detectedPlatform);
    }
  };

  const handleBotStarted = (botSessionId: string) => {
    fetchActiveBotSessions();
    setMeetingUrl('');
    toast({
      title: "Bot Started",
      description: "MeetingLingo bot is now active in your meeting",
    });
  };

  const handleBotStopped = () => {
    fetchActiveBotSessions();
    toast({
      title: "Bot Stopped",
      description: "Translation bot has been stopped",
    });
  };

  const stopBotSession = async (botSessionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bot-status', {
        method: 'POST',
        body: new URLSearchParams({
          botSessionId,
          action: 'stop'
        }).toString()
      });

      if (error) throw error;

      if (data.success) {
        fetchActiveBotSessions();
        toast({
          title: "Bot Stopped",
          description: "Translation bot has been stopped",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to stop bot',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      initializing: { variant: 'secondary' as const, text: 'Initializing' },
      connecting: { variant: 'secondary' as const, text: 'Connecting' },
      active: { variant: 'default' as const, text: 'Active' },
      disconnected: { variant: 'outline' as const, text: 'Disconnected' },
      error: { variant: 'destructive' as const, text: 'Error' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot Dashboard</h1>
          <p className="text-muted-foreground">
            Start and manage your real-time translation bots
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {activeBotSessions.length} Active Sessions
        </Badge>
      </div>

      <Tabs defaultValue="new-session" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new-session">New Session</TabsTrigger>
          <TabsTrigger value="active-sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="new-session" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Start New Translation Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Meeting URL</label>
                <Input
                  placeholder="Paste your Zoom, Google Meet, or Teams meeting URL..."
                  value={meetingUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={selectedPlatform} onValueChange={(value: 'zoom' | 'meet' | 'teams') => setSelectedPlatform(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {meetingUrl && (
                <BotController
                  meetingUrl={meetingUrl}
                  platform={selectedPlatform}
                  onBotStarted={handleBotStarted}
                  onBotStopped={handleBotStopped}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-sessions" className="space-y-6">
          {activeBotSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Active Sessions</h3>
                <p className="text-muted-foreground text-center">
                  Start a new translation session to see active bots here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeBotSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{session.meetings?.title}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span className="capitalize">{session.platform}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(session.started_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{session.source_language} ↔ {session.target_language}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.audio_processing_active && (
                          <Badge variant="secondary" className="text-xs">
                            Processing Audio
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopBotSession(session.id)}
                          disabled={isLoading}
                        >
                          Stop Bot
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BotDashboard;