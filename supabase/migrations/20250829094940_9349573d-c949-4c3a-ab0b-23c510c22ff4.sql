-- Create bot_sessions table to track meeting bot instances
CREATE TABLE public.bot_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  team_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'connecting', 'active', 'disconnected', 'error')),
  platform TEXT NOT NULL CHECK (platform IN ('zoom', 'meet', 'teams')),
  meeting_url TEXT NOT NULL,
  bot_participant_id TEXT,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'es',
  voice_id TEXT NOT NULL DEFAULT 'alloy',
  audio_processing_active BOOLEAN DEFAULT false,
  error_message TEXT,
  connection_quality JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view team bot sessions" 
ON public.bot_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.team_id = bot_sessions.team_id 
  AND user_roles.user_id = auth.uid()
));

CREATE POLICY "Edge functions can manage bot sessions" 
ON public.bot_sessions 
FOR ALL 
USING (true);

-- Create audio_chunks table for real-time audio processing
CREATE TABLE public.audio_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_session_id UUID NOT NULL REFERENCES public.bot_sessions(id) ON DELETE CASCADE,
  chunk_sequence INTEGER NOT NULL,
  audio_data BYTEA NOT NULL,
  language TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  transcription TEXT,
  translation TEXT,
  translated_audio_data BYTEA,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Edge functions can manage audio chunks" 
ON public.audio_chunks 
FOR ALL 
USING (true);

-- Create translation_logs table for audit and quality tracking
CREATE TABLE public.translation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_session_id UUID NOT NULL REFERENCES public.bot_sessions(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.translation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view team translation logs" 
ON public.translation_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN bot_sessions bs ON bs.team_id = ur.team_id
  WHERE bs.id = translation_logs.bot_session_id 
  AND ur.user_id = auth.uid()
));

CREATE POLICY "Edge functions can manage translation logs" 
ON public.translation_logs 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_bot_sessions_meeting_id ON public.bot_sessions(meeting_id);
CREATE INDEX idx_bot_sessions_team_id ON public.bot_sessions(team_id);
CREATE INDEX idx_bot_sessions_status ON public.bot_sessions(status);
CREATE INDEX idx_audio_chunks_session_id ON public.audio_chunks(bot_session_id);
CREATE INDEX idx_audio_chunks_sequence ON public.audio_chunks(bot_session_id, chunk_sequence);
CREATE INDEX idx_translation_logs_session_id ON public.translation_logs(bot_session_id);

-- Create trigger for updated_at
CREATE TRIGGER update_bot_sessions_updated_at
  BEFORE UPDATE ON public.bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add meeting_url and bot_session_id to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS bot_session_id UUID REFERENCES public.bot_sessions(id);

-- Create index for meetings bot session
CREATE INDEX IF NOT EXISTS idx_meetings_bot_session ON public.meetings(bot_session_id);