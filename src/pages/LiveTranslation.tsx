import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Mic, 
  MicOff,
  Settings,
  Users,
  Globe,
  Activity,
  AlertCircle,
  Download,
  PhoneOff,
  Subtitles,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Meeting {
  id: string;
  title: string;
  platform: string;
  languages_used: string[];
  status: string;
  participant_count: number;
}

interface TranslationMessage {
  id: string;
  speaker: string;
  original: string;
  translated: string;
  language: string;
  timestamp: Date;
  confidence: number;
}

interface Participant {
  id: string;
  name: string;
  language: string;
  isActive: boolean;
  audioLevel: number;
}

const LiveTranslation = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Meeting data
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  
  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  
  // Audio controls
  const [volume, setVolume] = useState([80]);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Real-time stats
  const [latency, setLatency] = useState(150); // ms
  const [accuracy, setAccuracy] = useState(92); // %
  const [uptime, setUptime] = useState(0); // seconds

  useEffect(() => {
    if (meetingId) {
      fetchMeetingData();
      connectToMeeting();
    }
  }, [meetingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMeetingData = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) throw error;
      setMeeting(data);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast({
        title: "Error",
        description: "Failed to load meeting data.",
        variant: "destructive"
      });
    }
  };

  const connectToMeeting = async () => {
    // Simulate connection process
    setIsConnected(true);
    
    // Mock participants
    setParticipants([
      { id: '1', name: 'John Smith', language: 'English', isActive: false, audioLevel: 0 },
      { id: '2', name: 'Maria García', language: 'Spanish', isActive: true, audioLevel: 65 },
      { id: '3', name: 'Pierre Dubois', language: 'French', isActive: false, audioLevel: 0 }
    ]);

    // Mock some initial messages
    setTimeout(() => {
      addTranslationMessage({
        speaker: 'Maria García',
        original: 'Hola, ¿podemos empezar la presentación?',
        translated: 'Hello, can we start the presentation?',
        language: 'es → en',
        confidence: 0.94
      });
    }, 2000);
  };

  const addTranslationMessage = (msg: Omit<TranslationMessage, 'id' | 'timestamp'>) => {
    const newMessage: TranslationMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const toggleTranslation = () => {
    setIsTranslating(!isTranslating);
    
    if (!isTranslating) {
      // Start translating
      toast({
        title: "Translation Started",
        description: "Real-time translation is now active."
      });
      
      // Simulate incoming translations
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance of new message
          const messages = [
            {
              speaker: 'John Smith',
              original: 'Thank you for joining today\'s meeting.',
              translated: 'Gracias por unirse a la reunión de hoy.',
              language: 'en → es',
              confidence: 0.96
            },
            {
              speaker: 'Maria García',
              original: '¿Tienen alguna pregunta sobre el proyecto?',
              translated: 'Do you have any questions about the project?',
              language: 'es → en',
              confidence: 0.91
            }
          ];
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          addTranslationMessage(randomMsg);
        }
      }, 5000);

      return () => clearInterval(interval);
    } else {
      toast({
        title: "Translation Paused",
        description: "Real-time translation has been paused."
      });
    }
  };

  const endMeeting = async () => {
    try {
      await supabase
        .from('meetings')
        .update({ status: 'completed', end_time: new Date().toISOString() })
        .eq('id', meetingId);

      toast({
        title: "Meeting Ended",
        description: "Translation session has been completed."
      });

      navigate('/dashboard/meetings');
    } catch (error) {
      console.error('Error ending meeting:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConnectionBadge = () => {
    const variants = {
      excellent: { color: 'bg-green-500', text: 'Excellent' },
      good: { color: 'bg-yellow-500', text: 'Good' },
      poor: { color: 'bg-red-500', text: 'Poor' }
    };
    const variant = variants[connectionQuality];
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${variant.color}`} />
        <span className="text-sm">{variant.text}</span>
      </div>
    );
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p>Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-semibold">{meeting.title}</h1>
              <p className="text-sm text-muted-foreground">
                {meeting.platform} • {participants.length} participants
              </p>
            </div>
            <Badge variant={isTranslating ? "default" : "secondary"}>
              {isTranslating ? 'Translating' : 'Paused'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {getConnectionBadge()}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>{latency}ms</span>
            </div>
            <Button variant="destructive" onClick={endMeeting}>
              <PhoneOff className="w-4 h-4 mr-2" />
              End Session
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Translation View */}
        <div className="flex-1 flex flex-col">
          {/* Translation Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Waiting for speech...</h3>
                  <p className="text-sm text-muted-foreground">
                    Start speaking to see real-time translations appear here
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {message.speaker}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {message.language}
                        </Badge>
                        <span className={`text-xs font-medium ${getConfidenceColor(message.confidence)}`}>
                          {Math.round(message.confidence * 100)}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <Card className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <strong>Original:</strong> {message.original}
                        </div>
                        <div className="text-base font-medium">
                          <strong>Translation:</strong> {message.translated}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="border-t bg-card p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={toggleTranslation}
                className={isTranslating ? 'bg-red-500 hover:bg-red-600' : 'btn-hero'}
              >
                {isTranslating ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause Translation
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Translation
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsRecording(!isRecording)}
                className={isRecording ? 'text-red-600' : ''}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                {isRecording ? 'Recording' : 'Record'}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-card">
          {/* Participants */}
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              Participants ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${participant.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">{participant.language}</p>
                    </div>
                  </div>
                  {participant.isActive && (
                    <div className="flex items-center gap-1">
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: `${Math.max(4, participant.audioLevel / 5)}px` }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: `${Math.max(4, (participant.audioLevel + 10) / 5)}px` }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: `${Math.max(4, (participant.audioLevel - 5) / 5)}px` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4" />
              Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="subtitles" className="text-sm">Show Subtitles</Label>
                <Switch 
                  id="subtitles"
                  checked={showSubtitles}
                  onCheckedChange={setShowSubtitles}
                />
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="p-4">
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" />
              Live Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Latency</span>
                <span className="text-sm font-medium">{latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm font-medium">{accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium">{Math.floor(uptime / 60)}m {uptime % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Messages</span>
                <span className="text-sm font-medium">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTranslation;