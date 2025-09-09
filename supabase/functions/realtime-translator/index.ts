import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  console.log('[REALTIME-TRANSLATOR] WebSocket connection established');

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let botSessionId: string | null = null;
  let openAISocket: WebSocket | null = null;
  let audioQueue: AudioBuffer[] = [];
  let isProcessing = false;

  interface AudioBuffer {
    data: string;
    timestamp: number;
    sequenceNumber: number;
  }

  socket.onopen = () => {
    console.log('[REALTIME-TRANSLATOR] Client WebSocket opened');
    socket.send(JSON.stringify({ 
      type: 'connected', 
      message: 'MeetingLingo Realtime Translator ready' 
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[REALTIME-TRANSLATOR] Received message type: ${data.type}`);

      switch (data.type) {
        case 'initialize':
          await initializeSession(data);
          break;

        case 'audio_chunk':
          await handleAudioChunk(data);
          break;

        case 'text_message':
          await handleTextMessage(data);
          break;

        case 'update_languages':
          await updateLanguages(data);
          break;

        case 'stop':
          await stopSession();
          break;

        default:
          console.log(`[REALTIME-TRANSLATOR] Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('[REALTIME-TRANSLATOR] Message processing error:', error);
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  };

  socket.onerror = (error) => {
    console.error('[REALTIME-TRANSLATOR] WebSocket error:', error);
  };

  socket.onclose = async () => {
    console.log('[REALTIME-TRANSLATOR] Client WebSocket closed');
    await cleanup();
  };

  async function initializeSession(data: any) {
    botSessionId = data.botSessionId;
    
    // Get bot session details
    const { data: botSession, error: sessionError } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('id', botSessionId)
      .single();

    if (sessionError || !botSession) {
      throw new Error('Bot session not found');
    }

    console.log(`[REALTIME-TRANSLATOR] Initializing session for ${botSession.platform}`);

    // Connect to OpenAI Realtime API
    await connectToOpenAI(botSession);

    // Update bot session status
    await supabase
      .from('bot_sessions')
      .update({ 
        status: 'active',
        audio_processing_active: true 
      })
      .eq('id', botSessionId);

    socket.send(JSON.stringify({ 
      type: 'initialized', 
      botSessionId,
      status: 'active'
    }));
  }

  async function connectToOpenAI(botSession: any) {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create OpenAI Realtime WebSocket connection
    openAISocket = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
      { headers: { 'Authorization': `Bearer ${openaiApiKey}` } }
    );

    openAISocket.onopen = () => {
      console.log('[REALTIME-TRANSLATOR] Connected to OpenAI');
      
      // Configure session for real-time translation
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: `You are MeetingLingo, a real-time meeting translator. 
            Translate speech from ${botSession.source_language} to ${botSession.target_language}.
            Maintain the speaker's tone, intent, and meaning. 
            Provide only the translation without commentary.
            Be natural and conversational in your translations.`,
          voice: botSession.voice_id || 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          tools: [
            {
              type: 'function',
              name: 'log_translation',
              description: 'Log the translation for analytics',
              parameters: {
                type: 'object',
                properties: {
                  original_text: { type: 'string' },
                  translated_text: { type: 'string' },
                  confidence: { type: 'number' }
                },
                required: ['original_text', 'translated_text']
              }
            }
          ],
          tool_choice: 'auto',
          temperature: 0.3,
          max_response_output_tokens: 'inf'
        }
      };

      openAISocket?.send(JSON.stringify(sessionConfig));
    };

    openAISocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await handleOpenAIResponse(data);
    };

    openAISocket.onerror = (error) => {
      console.error('[REALTIME-TRANSLATOR] OpenAI WebSocket error:', error);
      socket.send(JSON.stringify({ 
        type: 'ai_error', 
        message: 'OpenAI connection error' 
      }));
    };

    openAISocket.onclose = () => {
      console.log('[REALTIME-TRANSLATOR] OpenAI WebSocket closed');
    };
  }

  async function handleOpenAIResponse(data: any) {
    console.log(`[REALTIME-TRANSLATOR] OpenAI response: ${data.type}`);

    switch (data.type) {
      case 'session.created':
        console.log('[REALTIME-TRANSLATOR] OpenAI session created');
        socket.send(JSON.stringify({ 
          type: 'ai_connected',
          message: 'AI translator ready'
        }));
        break;

      case 'response.audio.delta':
        // Forward translated audio to client
        socket.send(JSON.stringify({
          type: 'translated_audio_delta',
          audio: data.delta
        }));
        break;

      case 'response.audio_transcript.delta':
        // Forward transcript delta
        socket.send(JSON.stringify({
          type: 'transcript_delta',
          text: data.delta
        }));
        break;

      case 'response.audio.done':
        socket.send(JSON.stringify({
          type: 'translation_complete'
        }));
        break;

      case 'response.function_call_arguments.done':
        // Log translation for analytics
        if (data.name === 'log_translation') {
          const args = JSON.parse(data.arguments);
          await logTranslation(args);
        }
        break;

      case 'error':
        console.error('[REALTIME-TRANSLATOR] OpenAI error:', data);
        socket.send(JSON.stringify({
          type: 'translation_error',
          error: data.error?.message || 'Translation error'
        }));
        break;

      default:
        // Forward other events to client for debugging
        socket.send(JSON.stringify({
          type: 'ai_event',
          event: data
        }));
    }
  }

  async function handleAudioChunk(data: any) {
    if (!openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
      console.error('[REALTIME-TRANSLATOR] OpenAI not connected');
      return;
    }

    // Add to audio queue
    audioQueue.push({
      data: data.audioData,
      timestamp: Date.now(),
      sequenceNumber: data.sequenceNumber || 0
    });

    // Process queue
    if (!isProcessing) {
      await processAudioQueue();
    }
  }

  async function processAudioQueue() {
    if (isProcessing || audioQueue.length === 0) return;
    
    isProcessing = true;

    while (audioQueue.length > 0) {
      const chunk = audioQueue.shift()!;
      
      try {
        // Store audio chunk for analytics
        await supabase
          .from('audio_chunks')
          .insert({
            bot_session_id: botSessionId,
            chunk_sequence: chunk.sequenceNumber,
            audio_data: chunk.data,
            language: 'detected', // Will be updated by OpenAI
            duration_ms: 1000, // Estimate
            processing_status: 'processing'
          });

        // Send to OpenAI for real-time processing
        const audioEvent = {
          type: 'input_audio_buffer.append',
          audio: chunk.data
        };

        openAISocket?.send(JSON.stringify(audioEvent));

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));

      } catch (error) {
        console.error('[REALTIME-TRANSLATOR] Error processing audio chunk:', error);
      }
    }

    isProcessing = false;
  }

  async function handleTextMessage(data: any) {
    if (!openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
      throw new Error('OpenAI not connected');
    }

    // Send text message for translation
    const textEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: data.text
          }
        ]
      }
    };

    openAISocket.send(JSON.stringify(textEvent));
    openAISocket.send(JSON.stringify({ type: 'response.create' }));
  }

  async function updateLanguages(data: any) {
    if (!botSessionId) return;

    // Update bot session languages
    await supabase
      .from('bot_sessions')
      .update({
        source_language: data.sourceLanguage,
        target_language: data.targetLanguage
      })
      .eq('id', botSessionId);

    // Update OpenAI session instructions
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      const updateEvent = {
        type: 'session.update',
        session: {
          instructions: `You are MeetingLingo, a real-time meeting translator. 
            Translate speech from ${data.sourceLanguage} to ${data.targetLanguage}.
            Maintain the speaker's tone, intent, and meaning. 
            Provide only the translation without commentary.
            Be natural and conversational in your translations.`
        }
      };

      openAISocket.send(JSON.stringify(updateEvent));
    }

    socket.send(JSON.stringify({
      type: 'languages_updated',
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage
    }));
  }

  async function logTranslation(args: any) {
    if (!botSessionId) return;

    try {
      await supabase
        .from('translation_logs')
        .insert({
          bot_session_id: botSessionId,
          source_text: args.original_text,
          translated_text: args.translated_text,
          source_language: 'auto-detected',
          target_language: 'configured',
          confidence_score: args.confidence || 0.95,
          processing_time_ms: 100, // Real-time estimate
          model_used: 'gpt-4o-realtime'
        });
    } catch (error) {
      console.error('[REALTIME-TRANSLATOR] Error logging translation:', error);
    }
  }

  async function stopSession() {
    await cleanup();
    socket.send(JSON.stringify({
      type: 'session_stopped',
      message: 'Translation session ended'
    }));
  }

  async function cleanup() {
    if (openAISocket) {
      openAISocket.close();
      openAISocket = null;
    }

    if (botSessionId) {
      await supabase
        .from('bot_sessions')
        .update({ 
          status: 'disconnected',
          audio_processing_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', botSessionId);
    }

    audioQueue = [];
    isProcessing = false;
  }

  return response;
});