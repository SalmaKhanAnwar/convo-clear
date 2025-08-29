import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotRequest {
  meetingUrl: string;
  platform: 'zoom' | 'meet' | 'teams';
  sourceLanguage: string;
  targetLanguage: string;
  voiceId: string;
  meetingId: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[BOT-ORCHESTRATOR] Function started');
    
    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`[BOT-ORCHESTRATOR] User authenticated: ${user.id}`);

    const { meetingUrl, platform, sourceLanguage, targetLanguage, voiceId, meetingId }: BotRequest = await req.json();

    if (!meetingUrl || !platform || !sourceLanguage || !targetLanguage) {
      throw new Error('Missing required parameters');
    }

    // Get user's team
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole) {
      throw new Error('User team not found');
    }

    console.log(`[BOT-ORCHESTRATOR] Team ID: ${userRole.team_id}`);

    // Check team subscription and usage limits
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('subscription_tier, max_minutes, monthly_minutes_limit')
      .eq('id', userRole.team_id)
      .single();

    if (teamError || !team) {
      throw new Error('Team not found');
    }

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: usage } = await supabase
      .from('usage_analytics')
      .select('minutes_used')
      .eq('team_id', userRole.team_id)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-31`);

    const totalMinutesUsed = usage?.reduce((sum, record) => sum + (record.minutes_used || 0), 0) || 0;

    if (totalMinutesUsed >= team.monthly_minutes_limit) {
      throw new Error('Monthly minutes limit exceeded');
    }

    // Create bot session record
    const { data: botSession, error: sessionError } = await supabase
      .from('bot_sessions')
      .insert({
        meeting_id: meetingId,
        team_id: userRole.team_id,
        platform,
        meeting_url: meetingUrl,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        voice_id: voiceId,
        status: 'initializing'
      })
      .select()
      .single();

    if (sessionError || !botSession) {
      throw new Error('Failed to create bot session');
    }

    console.log(`[BOT-ORCHESTRATOR] Bot session created: ${botSession.id}`);

    // Initialize platform-specific bot based on platform
    let botResult;
    try {
      switch (platform) {
        case 'zoom':
          botResult = await initializeZoomBot(botSession);
          break;
        case 'meet':
          botResult = await initializeGoogleMeetBot(botSession);
          break;
        case 'teams':
          botResult = await initializeTeamsBot(botSession);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Update bot session with connection details
      await supabase
        .from('bot_sessions')
        .update({
          status: 'connecting',
          bot_participant_id: botResult.participantId,
          started_at: new Date().toISOString()
        })
        .eq('id', botSession.id);

      console.log(`[BOT-ORCHESTRATOR] Bot initialized for ${platform}`);

      return new Response(JSON.stringify({
        success: true,
        botSessionId: botSession.id,
        status: 'connecting',
        participantId: botResult.participantId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error(`[BOT-ORCHESTRATOR] Bot initialization failed:`, error);
      
      // Update session with error
      await supabase
        .from('bot_sessions')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', botSession.id);

      throw error;
    }

  } catch (error) {
    console.error('[BOT-ORCHESTRATOR] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function initializeZoomBot(botSession: any) {
  console.log(`[ZOOM-BOT] Initializing for meeting: ${botSession.meeting_url}`);
  
  const zoomSdkKey = Deno.env.get('ZOOM_SDK_KEY');
  const zoomSdkSecret = Deno.env.get('ZOOM_SDK_SECRET');
  
  if (!zoomSdkKey || !zoomSdkSecret) {
    throw new Error('Zoom SDK credentials not configured');
  }

  // Generate JWT for Zoom SDK
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: zoomSdkKey,
    exp: Math.floor(Date.now() / 1000) + 3600
  }));
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(zoomSdkSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${header}.${payload}`)
  );
  
  const jwt = `${header}.${payload}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  // Extract meeting ID from URL
  const meetingIdMatch = botSession.meeting_url.match(/\/j\/(\d+)/);
  if (!meetingIdMatch) {
    throw new Error('Invalid Zoom meeting URL');
  }
  
  const meetingId = meetingIdMatch[1];

  // Initialize bot connection (this would use Zoom's Bot SDK in production)
  // For now, we'll simulate the connection and return a participant ID
  console.log(`[ZOOM-BOT] Connecting to meeting ID: ${meetingId}`);
  
  // Start audio processing WebSocket connection
  const audioWsUrl = `wss://cnamodabnlhlzvluvoja.functions.supabase.co/audio-processor`;
  
  return {
    participantId: `zoom_bot_${botSession.id}`,
    meetingId,
    audioStreamUrl: audioWsUrl
  };
}

async function initializeGoogleMeetBot(botSession: any) {
  console.log(`[MEET-BOT] Initializing for meeting: ${botSession.meeting_url}`);
  
  const apiKey = Deno.env.get('GOOGLE_MEET_API_KEY');
  if (!apiKey) {
    throw new Error('Google Meet API key not configured');
  }

  // Extract meeting ID from URL
  const meetingIdMatch = botSession.meeting_url.match(/\/([a-z0-9-]+)(?:\?|$)/);
  if (!meetingIdMatch) {
    throw new Error('Invalid Google Meet URL');
  }
  
  const meetingId = meetingIdMatch[1];
  
  console.log(`[MEET-BOT] Connecting to meeting ID: ${meetingId}`);
  
  return {
    participantId: `meet_bot_${botSession.id}`,
    meetingId,
    audioStreamUrl: `wss://cnamodabnlhlzvluvoja.functions.supabase.co/audio-processor`
  };
}

async function initializeTeamsBot(botSession: any) {
  console.log(`[TEAMS-BOT] Initializing for meeting: ${botSession.meeting_url}`);
  
  const clientId = Deno.env.get('TEAMS_CLIENT_ID');
  const clientSecret = Deno.env.get('TEAMS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Teams credentials not configured');
  }

  // Extract meeting ID from URL
  const meetingIdMatch = botSession.meeting_url.match(/\/([a-f0-9-]+)/);
  if (!meetingIdMatch) {
    throw new Error('Invalid Teams meeting URL');
  }
  
  const meetingId = meetingIdMatch[1];
  
  console.log(`[TEAMS-BOT] Connecting to meeting ID: ${meetingId}`);
  
  return {
    participantId: `teams_bot_${botSession.id}`,
    meetingId,
    audioStreamUrl: `wss://cnamodabnlhlzvluvoja.functions.supabase.co/audio-processor`
  };
}