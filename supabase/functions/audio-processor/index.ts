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

interface AudioChunk {
  botSessionId: string;
  audioData: string; // base64 encoded
  language: string;
  sequenceNumber: number;
  durationMs: number;
}

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  console.log('[AUDIO-PROCESSOR] WebSocket connection established');

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let botSessionId: string | null = null;
  let audioQueue: AudioChunk[] = [];
  let processing = false;

  socket.onopen = () => {
    console.log('[AUDIO-PROCESSOR] WebSocket opened');
    socket.send(JSON.stringify({ type: 'connected', message: 'Audio processor ready' }));
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[AUDIO-PROCESSOR] Received message type: ${data.type}`);

      switch (data.type) {
        case 'initialize':
          botSessionId = data.botSessionId;
          console.log(`[AUDIO-PROCESSOR] Initialized for bot session: ${botSessionId}`);
          
          // Update bot session status
          await supabase
            .from('bot_sessions')
            .update({ 
              status: 'active',
              audio_processing_active: true 
            })
            .eq('id', botSessionId);
          
          socket.send(JSON.stringify({ type: 'initialized', botSessionId }));
          break;

        case 'audio_chunk':
          if (!botSessionId) {
            socket.send(JSON.stringify({ type: 'error', message: 'Bot session not initialized' }));
            return;
          }

          const audioChunk: AudioChunk = {
            botSessionId,
            audioData: data.audioData,
            language: data.language,
            sequenceNumber: data.sequenceNumber,
            durationMs: data.durationMs
          };

          audioQueue.push(audioChunk);
          
          // Process queue if not already processing
          if (!processing) {
            processAudioQueue(socket);
          }
          break;

        case 'stop':
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
          socket.close();
          break;

        default:
          console.log(`[AUDIO-PROCESSOR] Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('[AUDIO-PROCESSOR] Message processing error:', error);
      socket.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  };

  socket.onerror = (error) => {
    console.error('[AUDIO-PROCESSOR] WebSocket error:', error);
  };

  socket.onclose = async () => {
    console.log('[AUDIO-PROCESSOR] WebSocket closed');
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
  };

  async function processAudioQueue(socket: WebSocket) {
    if (processing || audioQueue.length === 0) return;
    
    processing = true;
    console.log(`[AUDIO-PROCESSOR] Processing ${audioQueue.length} audio chunks`);

    while (audioQueue.length > 0) {
      const chunk = audioQueue.shift()!;
      
      try {
        // Store audio chunk in database
        const { data: audioRecord, error: insertError } = await supabase
          .from('audio_chunks')
          .insert({
            bot_session_id: chunk.botSessionId,
            chunk_sequence: chunk.sequenceNumber,
            audio_data: chunk.audioData,
            language: chunk.language,
            duration_ms: chunk.durationMs,
            processing_status: 'processing'
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to store audio chunk: ${insertError.message}`);
        }

        // Process the audio chunk through STT -> Translation -> TTS pipeline
        const result = await processAudioChunk(chunk);
        
        // Update audio record with results
        await supabase
          .from('audio_chunks')
          .update({
            transcription: result.transcription,
            translation: result.translation,
            translated_audio_data: result.translatedAudioData,
            processing_status: 'completed'
          })
          .eq('id', audioRecord.id);

        // Log translation for analytics
        if (result.transcription && result.translation) {
          await supabase
            .from('translation_logs')
            .insert({
              bot_session_id: chunk.botSessionId,
              source_text: result.transcription,
              translated_text: result.translation,
              source_language: chunk.language,
              target_language: result.targetLanguage,
              confidence_score: result.confidence,
              processing_time_ms: result.processingTime,
              model_used: result.modelUsed
            });
        }

        // Send translated audio back to meeting
        if (result.translatedAudioData) {
          socket.send(JSON.stringify({
            type: 'translated_audio',
            sequenceNumber: chunk.sequenceNumber,
            audioData: result.translatedAudioData,
            transcription: result.transcription,
            translation: result.translation,
            targetLanguage: result.targetLanguage
          }));
        }

      } catch (error) {
        console.error(`[AUDIO-PROCESSOR] Error processing chunk ${chunk.sequenceNumber}:`, error);
        
        // Update audio record with error
        await supabase
          .from('audio_chunks')
          .update({
            processing_status: 'error'
          })
          .eq('bot_session_id', chunk.botSessionId)
          .eq('chunk_sequence', chunk.sequenceNumber);

        socket.send(JSON.stringify({
          type: 'processing_error',
          sequenceNumber: chunk.sequenceNumber,
          error: error.message
        }));
      }
    }

    processing = false;
  }

  return response;
});

async function processAudioChunk(chunk: AudioChunk) {
  const startTime = Date.now();
  
  // Get bot session details
  const { data: botSession, error: sessionError } = await supabase
    .from('bot_sessions')
    .select('target_language, voice_id')
    .eq('id', chunk.botSessionId)
    .single();

  if (sessionError || !botSession) {
    throw new Error('Bot session not found');
  }

  console.log(`[AUDIO-PROCESSOR] Processing chunk ${chunk.sequenceNumber} - ${chunk.language} -> ${botSession.target_language}`);

  // Step 1: Speech-to-Text using OpenAI Whisper
  const transcription = await speechToText(chunk.audioData);
  
  if (!transcription.trim()) {
    console.log(`[AUDIO-PROCESSOR] No speech detected in chunk ${chunk.sequenceNumber}`);
    return {
      transcription: '',
      translation: '',
      translatedAudioData: null,
      targetLanguage: botSession.target_language,
      confidence: 0,
      processingTime: Date.now() - startTime,
      modelUsed: 'whisper-1'
    };
  }

  // Step 2: Translation using GPT-4o-mini
  const translation = await translateText(transcription, chunk.language, botSession.target_language);
  
  // Step 3: Text-to-Speech using OpenAI TTS
  const translatedAudioData = await textToSpeech(translation, botSession.voice_id);

  const processingTime = Date.now() - startTime;
  console.log(`[AUDIO-PROCESSOR] Completed chunk ${chunk.sequenceNumber} in ${processingTime}ms`);

  return {
    transcription,
    translation,
    translatedAudioData,
    targetLanguage: botSession.target_language,
    confidence: 0.95, // Default confidence score
    processingTime,
    modelUsed: 'gpt-4o-mini'
  };
}

async function speechToText(audioData: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Convert base64 to blob
  const binaryString = atob(audioData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const audioBlob = new Blob([bytes], { type: 'audio/webm' });
  
  // Prepare form data for Whisper API
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  return await response.text();
}

async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional real-time meeting translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Maintain the speaker's tone and intent. Provide only the translation without any additional commentary.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Translation API error: ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
}

async function textToSpeech(text: string, voiceId: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voiceId,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS API error: ${error}`);
  }

  // Convert audio buffer to base64
  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  );

  return base64Audio;
}