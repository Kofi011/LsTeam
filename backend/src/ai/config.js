/**
 * AI Pipeline Configuration
 *
 * All tunable parameters for the transcription routing,
 * LLM prompting, and pipeline behavior.
 *
 * @module ai/config
 */

export const AI_CONFIG = {
  // -----------------------------------------------------------------------
  // ASR Routing Thresholds
  // -----------------------------------------------------------------------
  routing: {
    /**
     * Minimum avg_logprob for Whisper to be considered high-confidence.
     * Values closer to 0 = higher confidence.
     * Below this threshold → route to Griot.
     */
    minAvgLogprob: -0.5,

    /**
     * Maximum no_speech_prob for Whisper to be considered reliable.
     * Above this threshold → too much silence/noise → route to Griot.
     */
    maxNoSpeechProb: 0.3,

    /**
     * Languages where Whisper performs well.
     * Others get routed to Griot.
     */
    whisperPreferredLanguages: ["en", "english"],
  },

  // -----------------------------------------------------------------------
  // Whisper (Groq API)
  // -----------------------------------------------------------------------
  whisper: {
    model: "whisper-large-v3-turbo",
    responseFormat: "verbose_json",
    maxRetries: 2,
    retryDelayMs: 1000,
  },

  // -----------------------------------------------------------------------
  // Griot Sidecar
  // -----------------------------------------------------------------------
  griot: {
    baseUrl: process.env.GRIOT_SIDECAR_URL || "http://localhost:8001",
    healthTimeoutMs: 5000,
    transcribeTimeoutMs: 120000,
  },

  // -----------------------------------------------------------------------
  // LLM Notes Generation
  // -----------------------------------------------------------------------
  notes: {
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    maxTokens: 8192,
    maxRetries: 1,
  },

  // -----------------------------------------------------------------------
  // AI Tutor
  // -----------------------------------------------------------------------
  tutor: {
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    maxTokens: 2048,
    maxHistoryMessages: 20,
  },

  // -----------------------------------------------------------------------
  // Audio Constraints
  // -----------------------------------------------------------------------
  audio: {
    maxDurationSec: 600, // 10 minutes
    maxFileSizeBytes: 15 * 1024 * 1024, // 15 MB
    supportedFormats: [".mp3", ".wav", ".m4a"],
    supportedMimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mp4",
      "audio/x-m4a",
    ],
  },
};
