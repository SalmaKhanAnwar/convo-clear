import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, RotateCcw, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface BotControllerProps {
  meetingUrl: string;
  platform: 'zoom' | 'meet' | 'teams';
  onBotStarted?: (botSessionId: string) => void;
  onBotStopped?: () => void;
}

interface BotSession {
  botSessionId: string;
  status: string;
  platform: string;
  sourceLanguage: string;
  targetLanguage: string;
  voiceId: string;
  audioProcessingActive: boolean;
  errorMessage?: string;
  startedAt?: string;
  endedAt?: string;
  connectionQuality?: any;
  recentTranslations?: any[];
}

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

const voices = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

const BotController: React.FC<BotControllerProps> = ({
  meetingUrl,
  platform,
  onBotStarted,
  onBotStopped
}) => {
  const { toast } = useToast();
  const [botSession, setBotSession] = useState<BotSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (botSession?.botSessionId) {
      // Poll for bot status updates
      interval = setInterval(async () => {
        await fetchBotStatus();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [botSession?.botSessionId]);

  const fetchBotStatus = async () => {
    if (!botSession?.botSessionId) return;

    try {
      const { data, error } = await supabase.functions.invoke('bot-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: new URLSearchParams({
          botSessionId: botSession.botSessionId
        }).toString()
      });

      if (error) throw error;

      setBotSession(data);
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
    }
  };

  const startBot = async () => {
    setIsLoading(true);
    
    try {
      // Get user's team first
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('team_id, user_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (roleError || !userRole) {
        throw new Error('User team not found');
      }

      // Create meeting record first
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Meeting Translation`,
          platform,
          meeting_url: meetingUrl,
          status: 'active',
          languages_used: [sourceLanguage, targetLanguage],
          host_id: userRole.user_id,
          team_id: userRole.team_id
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Start the bot
      const { data, error } = await supabase.functions.invoke('bot-orchestrator', {
        body: {
          meetingUrl,
          platform,
          sourceLanguage,
          targetLanguage,
          voiceId: selectedVoice,
          meetingId: meeting.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setBotSession({
          botSessionId: data.botSessionId,
          status: data.status,
          platform,
          sourceLanguage,
          targetLanguage,
          voiceId: selectedVoice,
          audioProcessingActive: false
        });

        onBotStarted?.(data.botSessionId);

        toast({
          title: "Bot Started",
          description: "MeetingLingo bot is joining the meeting...",
        });
      } else {
        throw new Error(data.error || 'Failed to start bot');
      }
    } catch (error: any) {
      console.error('Failed to start bot:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to start translation bot',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopBot = async () => {
    if (!botSession?.botSessionId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('bot-status', {
        method: 'POST',
        body: new URLSearchParams({
          botSessionId: botSession.botSessionId,
          action: 'stop'
        }).toString()
      });

      if (error) throw error;

      if (data.success) {
        setBotSession(null);
        onBotStopped?.();

        toast({
          title: "Bot Stopped",
          description: "Translation bot has left the meeting",
        });
      }
    } catch (error: any) {
      console.error('Failed to stop bot:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to stop translation bot',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restartBot = async () => {
    if (!botSession?.botSessionId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('bot-status', {
        method: 'POST',
        body: new URLSearchParams({
          botSessionId: botSession.botSessionId,
          action: 'restart'
        }).toString()
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Bot Restarting",
          description: "Translation bot is reconnecting...",
        });
        
        // Refresh status
        await fetchBotStatus();
      }
    } catch (error: any) {
      console.error('Failed to restart bot:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to restart translation bot',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLanguages = async () => {
    if (!botSession?.botSessionId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('bot-status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_languages',
          sourceLanguage,
          targetLanguage
        })
      });

      if (error) throw error;

      setBotSession(prev => prev ? {
        ...prev,
        sourceLanguage,
        targetLanguage
      } : null);

      toast({
        title: "Languages Updated",
        description: `Now translating ${sourceLanguage} ↔ ${targetLanguage}`,
      });
    } catch (error: any) {
      console.error('Failed to update languages:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update languages',
        variant: "destructive",
      });
    }
  };

  const updateVoice = async () => {
    if (!botSession?.botSessionId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('bot-status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_voice',
          voiceId: selectedVoice
        })
      });

      if (error) throw error;

      setBotSession(prev => prev ? {
        ...prev,
        voiceId: selectedVoice
      } : null);

      toast({
        title: "Voice Updated",
        description: `Voice changed to ${selectedVoice}`,
      });
    } catch (error: any) {
      console.error('Failed to update voice:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update voice',
        variant: "destructive",
      });
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          MeetingLingo Bot Controller
          {botSession && getStatusBadge(botSession.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bot Status */}
        {botSession && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Platform:</span>
              <span className="capitalize">{botSession.platform}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Translation:</span>
              <span>{botSession.sourceLanguage} ↔ {botSession.targetLanguage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Voice:</span>
              <span className="capitalize">{botSession.voiceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Audio Processing:</span>
              {botSession.audioProcessingActive ? (
                <Mic className="w-4 h-4 text-green-500" />
              ) : (
                <MicOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {botSession.errorMessage && (
              <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
                {botSession.errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Language Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Language</label>
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice</label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!botSession ? (
            <Button 
              onClick={startBot} 
              disabled={isLoading || !meetingUrl}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Translation Bot
            </Button>
          ) : (
            <>
              <Button 
                onClick={stopBot} 
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Bot
              </Button>
              <Button 
                onClick={restartBot} 
                disabled={isLoading}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </>
          )}
        </div>

        {/* Update Controls */}
        {botSession && (
          <div className="flex gap-2">
            <Button 
              onClick={updateLanguages} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Update Languages
            </Button>
            <Button 
              onClick={updateVoice} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Update Voice
            </Button>
          </div>
        )}

        {/* Recent Translations */}
        {botSession?.recentTranslations && botSession.recentTranslations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Translations</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {botSession.recentTranslations.map((translation: any, index: number) => (
                <div key={index} className="p-2 bg-muted rounded text-sm">
                  <div className="font-medium">{translation.source_text}</div>
                  <div className="text-muted-foreground">→ {translation.translated_text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BotController;