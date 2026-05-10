/**
 * 🛰️ Sovereign Model Registry
 * Purpose: Centralized mapping of specialized AI models to their respective providers/endpoints.
 */

export const ModelRegistry = {
  text_to_image: [
    { id: 'black-forest-labs/flux-pro', provider: 'replicate', version: 'v1' },
    { id: 'midjourney-v6', provider: 'api', version: 'latest' }
  ],
  video_generation: [
    { id: 'google/veo-1', provider: 'vertex_ai', version: '2026' },
    { id: 'openai/sora', provider: 'openai', version: 'preview' }
  ],
  audio_synthesis: [
    { id: 'eleven_v3', provider: 'elevenlabs', version: 'v3' },
    { id: 'eleven_turbo_v2_5', provider: 'elevenlabs', version: 'v2.5' },
    { id: 'eleven_multilingual_v2', provider: 'elevenlabs', version: 'v2' },
    { id: 'elevenlabs_music_v1', provider: 'elevenlabs', version: 'v1' },
    { id: 'elevenlabs_sfx_v1', provider: 'elevenlabs', version: 'v1' },
    { id: 'suno-v3.5', provider: 'suno', version: 'v3.5' }
  ],
};
