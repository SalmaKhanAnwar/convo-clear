import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Globe, 
  Mic, 
  Video, 
  Settings, 
  Users,
  Clock,
  Shield,
  Volume2,
  Subtitles,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface LanguagePair {
  from: string;
  to: string;
  fromName: string;
  toName: string;
}

const NewMeeting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Meeting basic info
  const [meetingTitle, setMeetingTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [description, setDescription] = useState('');
  
  // Language settings
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([
    { from: 'en', to: 'es', fromName: 'English', toName: 'Spanish' }
  ]);
  
  // Bot configuration
  const [audioQuality, setAudioQuality] = useState('balanced');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [audioOutput, setAudioOutput] = useState(true);
  const [speakerDiarization, setSpeakerDiarization] = useState(true);
  const [autoLanguageDetection, setAutoLanguageDetection] = useState(false);
  
  // Privacy settings
  const [recordMeeting, setRecordMeeting] = useState(false);
  const [saveTranscript, setSaveTranscript] = useState(true);
  const [endToEndEncryption, setEndToEndEncryption] = useState(false);
  
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
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  const platforms = [
    { value: 'meet', label: 'Google Meet', icon: '🟢' },
    { value: 'teams', label: 'Microsoft Teams', icon: '🔵' },
    { value: 'zoom', label: 'Zoom', icon: '🔷' }
  ];

  const addLanguagePair = () => {
    setLanguagePairs([...languagePairs, { from: 'en', to: 'es', fromName: 'English', toName: 'Spanish' }]);
  };

  const removeLanguagePair = (index: number) => {
    setLanguagePairs(languagePairs.filter((_, i) => i !== index));
  };

  const updateLanguagePair = (index: number, field: 'from' | 'to', value: string) => {
    const language = supportedLanguages.find(lang => lang.code === value);
    const updatedPairs = [...languagePairs];
    updatedPairs[index] = {
      ...updatedPairs[index],
      [field]: value,
      [field + 'Name']: language?.name || value
    };
    setLanguagePairs(updatedPairs);
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !platform) {
      toast({
        title: "Missing Information",
        description: "Please provide a meeting title and select a platform.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get user's team first
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (teamError || !teamData) {
        throw new Error('Unable to find team information');
      }

      // Create meeting record
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: meetingTitle,
          platform: platform,
          meeting_url: meetingUrl,
          languages_used: languagePairs.flatMap(pair => [pair.fromName, pair.toName]),
          status: 'scheduled',
          host_id: user?.id || '',
          team_id: teamData.id,
          participant_count: 0
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      toast({
        title: "Meeting Created",
        description: "Your translation session has been set up successfully."
      });

      navigate(`/dashboard/meetings/${meetingData.id}/live`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/meetings')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meetings
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-display">New Translation Session</h1>
          <p className="text-muted-foreground">Set up real-time translation for your meeting</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Meeting Details
                  </CardTitle>
                  <CardDescription>
                    Basic information about your translation session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Product Demo with Spanish Team"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meeting platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <span>{p.icon}</span>
                              <span>{p.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">Meeting URL (Optional)</Label>
                    <Input
                      id="url"
                      placeholder="https://meet.google.com/..."
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional notes about this meeting..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="languages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Language Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up translation language pairs for your meeting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto Language Detection</Label>
                    <Switch 
                      checked={autoLanguageDetection}
                      onCheckedChange={setAutoLanguageDetection}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Language Pairs</Label>
                    {languagePairs.map((pair, index) => (
                      <div key={index} className="flex items-center gap-2 p-4 border rounded-lg">
                        <Select 
                          value={pair.from} 
                          onValueChange={(value) => updateLanguagePair(index, 'from', value)}
                        >
                          <SelectTrigger className="flex-1">
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
                        <span className="text-muted-foreground">→</span>
                        <Select 
                          value={pair.to} 
                          onValueChange={(value) => updateLanguagePair(index, 'to', value)}
                        >
                          <SelectTrigger className="flex-1">
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
                        {languagePairs.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeLanguagePair(index)}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      onClick={addLanguagePair}
                      className="w-full"
                    >
                      + Add Language Pair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audio" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Audio Settings
                  </CardTitle>
                  <CardDescription>
                    Configure translation audio quality and output
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Audio Quality</Label>
                    <Select value={audioQuality} onValueChange={setAudioQuality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low_latency">Low Latency (Faster)</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="high_accuracy">High Accuracy (Slower)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Subtitles className="w-4 h-4" />
                          Show Subtitles
                        </Label>
                        <p className="text-sm text-muted-foreground">Display translated text on screen</p>
                      </div>
                      <Switch checked={showSubtitles} onCheckedChange={setShowSubtitles} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4" />
                          Audio Output
                        </Label>
                        <p className="text-sm text-muted-foreground">Play translated speech audio</p>
                      </div>
                      <Switch checked={audioOutput} onCheckedChange={setAudioOutput} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Speaker Identification
                        </Label>
                        <p className="text-sm text-muted-foreground">Identify different speakers</p>
                      </div>
                      <Switch checked={speakerDiarization} onCheckedChange={setSpeakerDiarization} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Recording
                  </CardTitle>
                  <CardDescription>
                    Control data recording and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Record Meeting</Label>
                      <p className="text-sm text-muted-foreground">Save audio recording of the meeting</p>
                    </div>
                    <Switch checked={recordMeeting} onCheckedChange={setRecordMeeting} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Save Transcript</Label>
                      <p className="text-sm text-muted-foreground">Keep text transcript for future reference</p>
                    </div>
                    <Switch checked={saveTranscript} onCheckedChange={setSaveTranscript} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>End-to-End Encryption</Label>
                      <p className="text-sm text-muted-foreground">Extra security for sensitive meetings</p>
                    </div>
                    <Switch checked={endToEndEncryption} onCheckedChange={setEndToEndEncryption} />
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Data Retention</h4>
                    <p className="text-sm text-muted-foreground">
                      Meeting data will be automatically deleted after 30 days unless specified otherwise.
                      You can export transcripts and recordings at any time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetingTitle && (
                <div>
                  <Label className="text-xs text-muted-foreground">MEETING</Label>
                  <p className="font-medium">{meetingTitle}</p>
                </div>
              )}

              {platform && (
                <div>
                  <Label className="text-xs text-muted-foreground">PLATFORM</Label>
                  <div className="flex items-center gap-2">
                    <span>{platforms.find(p => p.value === platform)?.icon}</span>
                    <span className="font-medium">{platforms.find(p => p.value === platform)?.label}</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">LANGUAGES</Label>
                <div className="space-y-1">
                  {languagePairs.map((pair, index) => (
                    <Badge key={index} variant="secondary" className="mr-1">
                      {pair.fromName} → {pair.toName}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">FEATURES</Label>
                <div className="space-y-1">
                  {showSubtitles && <Badge variant="outline">Subtitles</Badge>}
                  {audioOutput && <Badge variant="outline">Audio Output</Badge>}
                  {speakerDiarization && <Badge variant="outline">Speaker ID</Badge>}
                  {recordMeeting && <Badge variant="outline">Recording</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Translation Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI bot will join your meeting to provide real-time translation. 
                The bot appears as "MeetingLingo Translator" to all participants.
              </p>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">ESTIMATED SETUP TIME</p>
                <p className="font-medium">~30 seconds</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="btn-hero w-full" 
            onClick={handleCreateMeeting}
            disabled={loading || !meetingTitle || !platform}
          >
            {loading ? 'Creating...' : 'Start Translation Session'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewMeeting;