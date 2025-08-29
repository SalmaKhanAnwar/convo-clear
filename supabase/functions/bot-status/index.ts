import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[BOT-STATUS] Function started');
    
    const url = new URL(req.url);
    const botSessionId = url.searchParams.get('botSessionId');
    const action = url.searchParams.get('action');

    if (!botSessionId) {
      throw new Error('botSessionId parameter required');
    }

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

    // Get bot session with team verification
    const { data: botSession, error: sessionError } = await supabase
      .from('bot_sessions')
      .select(`
        *,
        meetings (
          title,
          platform
        )
      `)
      .eq('id', botSessionId)
      .single();

    if (sessionError || !botSession) {
      throw new Error('Bot session not found');
    }

    // Verify user has access to this team
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('team_id', botSession.team_id)
      .single();

    if (!userRole) {
      throw new Error('Access denied');
    }

    if (req.method === 'GET') {
      // Return bot status
      console.log(`[BOT-STATUS] Returning status for session: ${botSessionId}`);
      
      // Get recent translation logs
      const { data: recentTranslations } = await supabase
        .from('translation_logs')
        .select('*')
        .eq('bot_session_id', botSessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get connection quality metrics
      const connectionQuality = botSession.connection_quality || {};
      
      return new Response(JSON.stringify({
        botSessionId,
        status: botSession.status,
        platform: botSession.platform,
        sourceLanguage: botSession.source_language,
        targetLanguage: botSession.target_language,
        voiceId: botSession.voice_id,
        audioProcessingActive: botSession.audio_processing_active,
        errorMessage: botSession.error_message,
        startedAt: botSession.started_at,
        endedAt: botSession.ended_at,
        connectionQuality,
        recentTranslations: recentTranslations || [],
        meeting: botSession.meetings
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Handle bot actions
      console.log(`[BOT-STATUS] Handling action: ${action} for session: ${botSessionId}`);

      switch (action) {
        case 'stop':
          // Stop the bot session
          const { error: stopError } = await supabase
            .from('bot_sessions')
            .update({
              status: 'disconnected',
              audio_processing_active: false,
              ended_at: new Date().toISOString()
            })
            .eq('id', botSessionId);

          if (stopError) {
            throw new Error(`Failed to stop bot: ${stopError.message}`);
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Bot session stopped'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'restart':
          // Restart the bot session
          const { error: restartError } = await supabase
            .from('bot_sessions')
            .update({
              status: 'connecting',
              audio_processing_active: false,
              error_message: null
            })
            .eq('id', botSessionId);

          if (restartError) {
            throw new Error(`Failed to restart bot: ${restartError.message}`);
          }

          // Re-initialize bot connection
          // This would trigger the bot-orchestrator to reconnect
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Bot session restarting'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'update_languages':
          const { sourceLanguage, targetLanguage } = await req.json();
          
          if (!sourceLanguage || !targetLanguage) {
            throw new Error('Source and target languages required');
          }

          const { error: updateError } = await supabase
            .from('bot_sessions')
            .update({
              source_language: sourceLanguage,
              target_language: targetLanguage
            })
            .eq('id', botSessionId);

          if (updateError) {
            throw new Error(`Failed to update languages: ${updateError.message}`);
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Languages updated'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'update_voice':
          const { voiceId } = await req.json();
          
          if (!voiceId) {
            throw new Error('Voice ID required');
          }

          const { error: voiceError } = await supabase
            .from('bot_sessions')
            .update({
              voice_id: voiceId
            })
            .eq('id', botSessionId);

          if (voiceError) {
            throw new Error(`Failed to update voice: ${voiceError.message}`);
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Voice updated'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('[BOT-STATUS] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});