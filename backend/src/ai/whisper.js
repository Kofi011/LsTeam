/**
 * Groq Whisper Transcription Module
 *
 * Sends audio files to Groq's Whisper API (whisper-large-v3-turbo)
 * with verbose_json response format for confidence metrics.
 *
 * @module ai/whisper
 */

import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------
let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to your .env file."
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const WHISPER_MODEL = "whisper-large-v3-turbo";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const WhisperErrorCodes = {
  API_KEY_MISSING: "WHISPER_API_KEY_MISSING",
  FILE_NOT_FOUND: "WHISPER_FILE_NOT_FOUND",
  RATE_LIMITED: "WHISPER_RATE_LIMITED",
  TIMEOUT: "WHISPER_TIMEOUT",
  INVALID_AUDIO: "WHISPER_INVALID_AUDIO",
  API_ERROR: "WHISPER_API_ERROR",
};

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------
export class WhisperError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = "WhisperError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Transcription with Whisper
// ---------------------------------------------------------------------------

/**
 * Transcribe an audio file using Groq Whisper API.
 *
 * @param {string} filePath - Absolute path to the audio file
 * @param {object} [options] - Optional configuration
 * @param {string} [options.language] - Force language (e.g., "en"). Auto-detect if omitted.
 * @param {string} [options.prompt] - Optional prompt to guide transcription
 * @returns {Promise<object>} Normalized transcription result
 *
 * @example
 * const result = await transcribeWithWhisper("/path/to/lecture.mp3");
 * // {
 * //   transcript: "Today we'll discuss...",
 * //   language: "en",
 * //   engine: "whisper",
 * //   metadata: {
 * //     model: "whisper-large-v3-turbo",
 * //     duration: 360.5,
 * //     segments: [...],
 * //     avgLogprob: -0.21,
 * //     noSpeechProb: 0.02
 * //   }
 * // }
 */
export async function transcribeWithWhisper(filePath, options = {}) {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new WhisperError(
      WhisperErrorCodes.FILE_NOT_FOUND,
      `Audio file not found: ${filePath}`,
      400
    );
  }

  const client = getGroqClient();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const transcription = await client.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: WHISPER_MODEL,
        response_format: "verbose_json",
        ...(options.language && { language: options.language }),
        ...(options.prompt && { prompt: options.prompt }),
      });

      // Extract per-segment confidence metrics
      const segments = transcription.segments || [];
      const avgLogprob = computeAvgMetric(segments, "avg_logprob");
      const noSpeechProb = computeAvgMetric(segments, "no_speech_prob");

      return {
        transcript: transcription.text || "",
        language: transcription.language || "unknown",
        engine: "whisper",
        metadata: {
          model: WHISPER_MODEL,
          duration: transcription.duration || null,
          segments: segments.map((s) => ({
            start: s.start,
            end: s.end,
            text: s.text,
            avg_logprob: s.avg_logprob,
            no_speech_prob: s.no_speech_prob,
          })),
          avgLogprob,
          noSpeechProb,
        },
      };
    } catch (err) {
      lastError = err;

      // Rate limited — retry with exponential backoff
      if (err.status === 429) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[whisper] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
          );
          await sleep(delay);
          continue;
        }
        throw new WhisperError(
          WhisperErrorCodes.RATE_LIMITED,
          "Groq API rate limit exceeded. Please try again later.",
          429
        );
      }

      // Timeout
      if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
        throw new WhisperError(
          WhisperErrorCodes.TIMEOUT,
          "Whisper API request timed out.",
          504
        );
      }

      // Invalid audio / bad request
      if (err.status === 400) {
        throw new WhisperError(
          WhisperErrorCodes.INVALID_AUDIO,
          `Invalid audio file: ${err.message}`,
          400
        );
      }

      // Other API errors
      throw new WhisperError(
        WhisperErrorCodes.API_ERROR,
        `Whisper API error: ${err.message}`,
        err.status || 500
      );
    }
  }

  // Should not reach here, but just in case
  throw new WhisperError(
    WhisperErrorCodes.API_ERROR,
    `Whisper transcription failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
    500
  );
}

// ---------------------------------------------------------------------------
// Sample transcription (for routing decisions)
// ---------------------------------------------------------------------------

/**
 * Quick-transcribe a short audio sample to evaluate confidence.
 * Used by the ASR router to decide between Whisper and Griot.
 *
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<object>} Sample transcription with confidence metrics
 */
export async function sampleTranscribe(filePath) {
  // Same as full transcription — Whisper handles the full file.
  // The router will extract a sample before calling this if needed.
  return transcribeWithWhisper(filePath);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the weighted average of a metric across segments.
 */
function computeAvgMetric(segments, metricKey) {
  if (!segments || segments.length === 0) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const seg of segments) {
    const value = seg[metricKey];
    if (value == null) continue;
    const duration = (seg.end || 0) - (seg.start || 0);
    const weight = Math.max(duration, 0.01); // Avoid zero-weight
    weightedSum += value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 1000) / 1000 : null;
}
