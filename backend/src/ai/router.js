/**
 * Intelligent ASR Router
 *
 * Routes audio files to the optimal transcription engine:
 *   - Whisper (Groq API) for clear English audio
 *   - Griot Nano 1 for accented/multilingual speech
 *
 * Routing logic:
 *   1. Send audio to Whisper with verbose_json
 *   2. Evaluate: language, avg_logprob, no_speech_prob
 *   3. High-confidence English → use Whisper result directly
 *   4. Low confidence / non-English → re-transcribe with Griot
 *   5. Griot unavailable → fall back to Whisper with warning
 *
 * @module ai/router
 */

import { transcribeWithWhisper, WhisperError } from "./whisper.js";
import {
  transcribeWithGriot,
  isAvailable as isGriotAvailable,
  GriotError,
} from "./griot-client.js";

// ---------------------------------------------------------------------------
// Routing thresholds (tunable)
// ---------------------------------------------------------------------------
const ROUTING_CONFIG = {
  // Whisper confidence thresholds
  // avg_logprob closer to 0 = higher confidence; below this = low confidence
  MIN_AVG_LOGPROB: -0.5,

  // no_speech_prob above this = too much silence/noise
  MAX_NO_SPEECH_PROB: 0.3,

  // Languages that Whisper handles well — route to Whisper
  WHISPER_PREFERRED_LANGUAGES: new Set(["en", "english"]),
};

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const RouterErrorCodes = {
  BOTH_ENGINES_FAILED: "ROUTER_BOTH_ENGINES_FAILED",
  NO_TRANSCRIPT: "ROUTER_NO_TRANSCRIPT",
};

export class RouterError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = "RouterError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Routing decision
// ---------------------------------------------------------------------------

/**
 * Evaluate Whisper's transcription metrics and decide whether to use it
 * or route to Griot.
 *
 * @param {object} whisperResult - Result from transcribeWithWhisper()
 * @returns {{ useWhisper: boolean, reason: string }}
 */
function evaluateConfidence(whisperResult) {
  const { language, metadata } = whisperResult;
  const { avgLogprob, noSpeechProb } = metadata || {};

  // Check language
  const lang = (language || "").toLowerCase();
  const isPreferredLang = ROUTING_CONFIG.WHISPER_PREFERRED_LANGUAGES.has(lang);

  // Check confidence metrics
  const hasGoodLogprob =
    avgLogprob !== null && avgLogprob > ROUTING_CONFIG.MIN_AVG_LOGPROB;
  const hasLowSilence =
    noSpeechProb !== null && noSpeechProb < ROUTING_CONFIG.MAX_NO_SPEECH_PROB;

  // If metrics are unavailable, default to Whisper for English
  if (avgLogprob === null || noSpeechProb === null) {
    if (isPreferredLang) {
      return {
        useWhisper: true,
        reason: "Preferred language detected; metrics unavailable, defaulting to Whisper",
      };
    }
    return {
      useWhisper: false,
      reason: `Non-preferred language (${lang}); metrics unavailable, routing to Griot`,
    };
  }

  // High confidence English
  if (isPreferredLang && hasGoodLogprob && hasLowSilence) {
    return {
      useWhisper: true,
      reason: `High-confidence English (logprob=${avgLogprob}, silence=${noSpeechProb})`,
    };
  }

  // Low confidence or non-English
  const reasons = [];
  if (!isPreferredLang) reasons.push(`language=${lang}`);
  if (!hasGoodLogprob) reasons.push(`low_logprob=${avgLogprob}`);
  if (!hasLowSilence) reasons.push(`high_silence=${noSpeechProb}`);

  return {
    useWhisper: false,
    reason: `Routing to Griot: ${reasons.join(", ")}`,
  };
}

// ---------------------------------------------------------------------------
// Main transcribe function
// ---------------------------------------------------------------------------

/**
 * Transcribe an audio file using the optimal ASR engine.
 *
 * This is the primary export — the backend calls this function.
 *
 * @param {string} filePath - Absolute path to the audio file
 * @returns {Promise<object>} Normalized result:
 *   {
 *     transcript: string,
 *     language: string,
 *     engine: "whisper" | "griot-nano-1",
 *     routing: { decision: string, reason: string },
 *     warning?: string
 *   }
 */
export async function transcribe(filePath) {
  console.log(`[router] Transcribing: ${filePath}`);

  // Step 1: Try Whisper first for confidence evaluation
  let whisperResult;
  try {
    whisperResult = await transcribeWithWhisper(filePath);
  } catch (err) {
    // If Whisper fails entirely, try Griot as fallback
    console.warn(`[router] Whisper failed: ${err.message}. Trying Griot...`);

    if (await isGriotAvailable()) {
      try {
        const griotResult = await transcribeWithGriot(filePath);
        return {
          ...griotResult,
          routing: {
            decision: "griot",
            reason: "Whisper failed, fell back to Griot",
          },
          warning: `Whisper engine failed: ${err.message}`,
        };
      } catch (griotErr) {
        throw new RouterError(
          RouterErrorCodes.BOTH_ENGINES_FAILED,
          `Both engines failed. Whisper: ${err.message}. Griot: ${griotErr.message}`
        );
      }
    }

    // Re-throw original Whisper error if Griot isn't available
    throw err;
  }

  // Step 2: Evaluate Whisper confidence
  const { useWhisper, reason } = evaluateConfidence(whisperResult);
  console.log(`[router] Routing decision: ${reason}`);

  // Step 3: If Whisper is good enough, use it
  if (useWhisper) {
    return {
      transcript: whisperResult.transcript,
      language: whisperResult.language,
      engine: "whisper",
      routing: {
        decision: "whisper",
        reason,
      },
    };
  }

  // Step 4: Route to Griot for better results
  const griotAvailable = await isGriotAvailable();

  if (griotAvailable) {
    try {
      const griotResult = await transcribeWithGriot(filePath);
      console.log("[router] Griot transcription complete.");

      return {
        transcript: griotResult.transcript,
        language: griotResult.language,
        engine: "griot-nano-1",
        routing: {
          decision: "griot",
          reason,
        },
      };
    } catch (griotErr) {
      // Griot failed — fall back to Whisper result
      console.warn(
        `[router] Griot failed (${griotErr.message}), falling back to Whisper result.`
      );

      return {
        transcript: whisperResult.transcript,
        language: whisperResult.language,
        engine: "whisper",
        routing: {
          decision: "whisper-fallback",
          reason: `Griot preferred but failed: ${griotErr.message}`,
        },
        warning: `Griot engine failed, used Whisper fallback: ${griotErr.message}`,
      };
    }
  }

  // Step 5: Griot not available — use Whisper with warning
  console.warn("[router] Griot unavailable, using Whisper result with warning.");

  return {
    transcript: whisperResult.transcript,
    language: whisperResult.language,
    engine: "whisper",
    routing: {
      decision: "whisper-fallback",
      reason: "Griot sidecar unreachable, used Whisper fallback",
    },
    warning: "Griot sidecar is not available. Transcription used Whisper only.",
  };
}
