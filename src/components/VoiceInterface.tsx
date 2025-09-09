import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceInterfaceProps {
  instructions?: string;
  voice?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  onTranscript?: (text: string) => void;
  onTranslation?: (text: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  instructions = "You are MeetingLingo, a professional real-time translator",
  voice = 'alloy',
  sourceLanguage = 'English',
  targetLanguage = 'Spanish',
  onTranscript,
  onTranslation,
  onSpeakingChange
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('[VOICE-INTERFACE] Received event:', event.type);
    
    switch (event.type) {
      case 'session.created':
        console.log('[VOICE-INTERFACE] Session created');
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        const transcriptText = event.transcript || '';
        setTranscript(transcriptText);
        onTranscript?.(transcriptText);
        break;
        
      case 'response.audio.delta':
        setIsSpeaking(true);
        onSpeakingChange?.(true);
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        break;
        
      case 'response.audio_transcript.delta':
        const deltaText = event.delta || '';
        setTranslation(prev => prev + deltaText);
        onTranslation?.(deltaText);
        break;
        
      case 'response.audio_transcript.done':
        // Translation complete - log the full translation
        console.log('[VOICE-INTERFACE] Translation complete:', translation);
        break;
        
      case 'error':
        console.error('[VOICE-INTERFACE] OpenAI error:', event.error);
        toast({
          title: "Translation Error",
          description: event.error?.message || 'An error occurred during translation',
          variant: "destructive",
        });
        break;
        
      default:
        console.log('[VOICE-INTERFACE] Unhandled event:', event.type);
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      
      const translationInstructions = `${instructions}
        
        You are translating from ${sourceLanguage} to ${targetLanguage}.
        When you hear speech in ${sourceLanguage}, respond with a natural, conversational translation in ${targetLanguage}.
        Maintain the speaker's tone and intent. Be concise and accurate.
        Only provide the translation - no explanations or commentary.`;

      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(translationInstructions, voice);
      
      setIsConnected(true);
      setTranscript('');
      setTranslation('');
      
      toast({
        title: "Voice Translator Ready",
        description: `Translating ${sourceLanguage} → ${targetLanguage}`,
      });
    } catch (error) {
      console.error('Error starting voice interface:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to start voice translator',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setTranscript('');
    setTranslation('');
    onSpeakingChange?.(false);
    
    toast({
      title: "Translation Ended",
      description: "Voice translator disconnected",
    });
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Voice Translator</h3>
          <p className="text-sm text-muted-foreground">
            {sourceLanguage} → {targetLanguage}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isListening && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Mic className="w-3 h-3 mr-1" />
              Listening
            </Badge>
          )}
          
          {isSpeaking && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Volume2 className="w-3 h-3 mr-1" />
              Speaking
            </Badge>
          )}
          
          {isConnected && !isListening && !isSpeaking && (
            <Badge variant="outline">
              Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      {transcript && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Original ({sourceLanguage}):
          </p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* Live Translation */}
      {translation && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-primary mb-1">
            Translation ({targetLanguage}):
          </p>
          <p className="text-sm">{translation}</p>
        </div>
      )}

      {/* Control Button */}
      <div className="flex justify-center pt-2">
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Translator
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={endConversation}
            variant="secondary"
            className="min-w-[140px]"
          >
            <MicOff className="w-4 h-4 mr-2" />
            Stop Translator
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VoiceInterface;