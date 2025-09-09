import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import VoiceInterface from '@/components/VoiceInterface';
import { MeetingBot } from '@/utils/RealtimeAudio';
import { 
  ArrowLeft, 
  Globe, 
  Mic, 
  Volume2, 
  Settings,
  Bot,
  Users,
  MessageSquare
} from 'lucide-react';

const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
  { id: 'echo', name: 'Echo', description: 'Calm, professional' },
  { id: 'shimmer', name: 'Shimmer', description: 'Warm, friendly' },
  { id: 'ash', name: 'Ash', description: 'Clear, articulate' },
  { id: 'ballad', name: 'Ballad', description: 'Smooth, conversational' },
  { id: 'coral', name: 'Coral', description: 'Bright, energetic' },
  { id: 'sage', name: 'Sage', description: 'Wise, measured' },
  { id: 'verse', name: 'Verse', description: 'Expressive, dynamic' }
];

const LANGUAGES = [
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
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' }
];

const LiveTranslation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Meeting Configuration
  const [meetingUrl, setMeetingUrl] = useState('');
  const [platform, setPlatform] = useState<'zoom' | 'meet' | 'teams'>('zoom');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  // Bot State
  const [botSessionId, setBotSessionId] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [meetingBot, setMeetingBot] = useState<MeetingBot | null>(null);

  // Live Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{
    id: string;
    original: string;
    translated: string;
    timestamp: Date;
    language: string;
  }>>([]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (meetingBot) {
        meetingBot.disconnect();
      }
    };
  }, [meetingBot]);

  const handleStartBot = async () => {
    if (!meetingUrl.trim()) {
      toast({
        title: "Meeting URL Required",
        description: "Please enter a meeting URL to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setBotStatus('connecting');
      
      // Create a meeting record first
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: `Live Translation Session - ${new Date().toLocaleString()}`,
          platform,
          meeting_url: meetingUrl,
          host_id: user?.id,
          team_id: user?.user_metadata?.team_id,
          status: 'live',
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (meetingError) {
        throw new Error(`Failed to create meeting: ${meetingError.message}`);
      }

      // Start the bot via bot-orchestrator
      const { data: botResult, error: botError } = await supabase.functions.invoke(
        'bot-orchestrator',
        {
          body: {
            meetingUrl,
            platform,
            sourceLanguage,
            targetLanguage,
            voiceId: selectedVoice,
            meetingId: meeting.id
          }
        }
      );

      if (botError) {
        throw new Error(`Failed to start bot: ${botError.message}`);
      }

      setBotSessionId(botResult.botSessionId);
      
      // Connect to the meeting bot WebSocket
      const bot = new MeetingBot(
        (message) => handleBotMessage(message),
        (error) => {
          console.error('Bot error:', error);
          setBotStatus('error');
          toast({
            title: "Bot Error",
            description: error,
            variant: "destructive",
          });
        }
      );

      await bot.connect(botResult.botSessionId);
      setMeetingBot(bot);
      setBotStatus('active');

      toast({
        title: "Bot Started",
        description: "MeetingLingo bot is now joining your meeting",
      });

    } catch (error) {
      console.error('Error starting bot:', error);
      setBotStatus('error');
      toast({
        title: "Failed to Start Bot",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleStopBot = async () => {
    try {
      if (meetingBot) {
        meetingBot.disconnect();
        setMeetingBot(null);
      }

      if (botSessionId) {
        await supabase.functions.invoke('bot-status', {
          body: { action: 'stop' }
        });
      }

      setBotStatus('idle');
      setBotSessionId(null);
      setIsTranslating(false);

      toast({
        title: "Bot Stopped",
        description: "MeetingLingo bot has left the meeting",
      });

    } catch (error) {
      console.error('Error stopping bot:', error);
      toast({
        title: "Error",
        description: "Failed to stop bot properly",
        variant: "destructive",
      });
    }
  };

  const handleBotMessage = (message: any) => {
    console.log('Bot message:', message.type);

    switch (message.type) {
      case 'initialized':
        setBotStatus('active');
        break;

      case 'ai_connected':
        setIsTranslating(true);
        break;

      case 'transcript_delta':
        // Handle live transcript updates
        break;

      case 'translated_audio_delta':
        // Audio is being played by the bot
        break;

      case 'translation_complete':
        // Add completed translation to transcripts
        if (message.transcription && message.translation) {
          const newTranscript = {
            id: Date.now().toString(),
            original: message.transcription,
            translated: message.translation,
            timestamp: new Date(),
            language: `${sourceLanguage} → ${targetLanguage}`
          };
          setTranscripts(prev => [newTranscript, ...prev].slice(0, 50)); // Keep last 50
        }
        break;

      case 'translation_error':
        toast({
          title: "Translation Error",
          description: message.error,
          variant: "destructive",
        });
        break;

      default:
        console.log('Unhandled bot message:', message.type);
    }
  };

  const handleLanguageSwap = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);

    // Update bot if active
    if (meetingBot && botStatus === 'active') {
      meetingBot.updateLanguages(targetLanguage, temp);
    }
  };

  const getSourceLanguageName = () => {
    return LANGUAGES.find(lang => lang.code === sourceLanguage)?.name || sourceLanguage;
  };

  const getTargetLanguageName = () => {
    return LANGUAGES.find(lang => lang.code === targetLanguage)?.name || targetLanguage;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold">Live Translation</h1>
          <p className="text-muted-foreground">
            Real-time meeting translation with MeetingLingo bot
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Meeting Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL</Label>
                <Input
                  id="meetingUrl"
                  placeholder="https://zoom.us/j/123456789"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  disabled={botStatus !== 'idle'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  value={platform} 
                  onValueChange={(value) => setPlatform(value as any)}
                  disabled={botStatus !== 'idle'}
                >
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

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select 
                    value={sourceLanguage} 
                    onValueChange={setSourceLanguage}
                    disabled={botStatus === 'connecting'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>To</Label>
                  <Select 
                    value={targetLanguage} 
                    onValueChange={setTargetLanguage}
                    disabled={botStatus === 'connecting'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLanguageSwap}
                className="w-full"
                disabled={botStatus === 'connecting'}
              >
                <Globe className="w-4 h-4 mr-2" />
                Swap Languages
              </Button>

              <div className="space-y-2">
                <Label>Voice</Label>
                <Select 
                  value={selectedVoice} 
                  onValueChange={setSelectedVoice}
                  disabled={botStatus === 'connecting'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div>
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {voice.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bot Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Bot Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    botStatus === 'active' ? 'default' : 
                    botStatus === 'connecting' ? 'secondary' : 
                    botStatus === 'error' ? 'destructive' : 
                    'outline'
                  }
                >
                  {botStatus === 'active' && '🟢'}
                  {botStatus === 'connecting' && '🟡'}
                  {botStatus === 'error' && '🔴'}
                  {botStatus === 'idle' && '⚪'}
                  {botStatus.charAt(0).toUpperCase() + botStatus.slice(1)}
                </Badge>
                
                {isTranslating && (
                  <Badge variant="secondary">
                    <Volume2 className="w-3 h-3 mr-1" />
                    Translating
                  </Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {botStatus === 'idle' && 'Ready to join meeting'}
                {botStatus === 'connecting' && 'Joining meeting...'}
                {botStatus === 'active' && `Translating ${getSourceLanguageName()} → ${getTargetLanguageName()}`}
                {botStatus === 'error' && 'Error occurred - check settings'}
              </div>

              {botStatus === 'idle' ? (
                <Button 
                  onClick={handleStartBot}
                  className="w-full"
                  disabled={!meetingUrl.trim()}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Start Bot
                </Button>
              ) : (
                <Button 
                  onClick={handleStopBot}
                  variant="destructive"
                  className="w-full"
                >
                  Stop Bot
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Interface for Testing */}
          {botStatus === 'idle' && (
            <VoiceInterface
              instructions={`Translate from ${getSourceLanguageName()} to ${getTargetLanguageName()}`}
              voice={selectedVoice}
              sourceLanguage={getSourceLanguageName()}
              targetLanguage={getTargetLanguageName()}
              onTranscript={(text) => console.log('Transcript:', text)}
              onTranslation={(text) => console.log('Translation:', text)}
            />
          )}

          {/* Live Translation Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Live Translation Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transcripts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {botStatus === 'active' 
                    ? 'Waiting for speech to translate...' 
                    : 'Start the bot to see live translations'
                  }
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {transcripts.map((transcript) => (
                    <div key={transcript.id} className="space-y-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{transcript.language}</span>
                        <span>{transcript.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          "{transcript.original}"
                        </p>
                        <p className="text-sm text-primary">
                          "{transcript.translated}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveTranslation;