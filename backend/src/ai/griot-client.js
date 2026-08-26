/**
 * Griot Sidecar HTTP Client
 *
 * Communicates with the Griot Nano 1 FastAPI sidecar
 * for African-accented / multilingual speech transcription.
 *
 * @module ai/griot-client
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const GRIOT_BASE_URL =
  process.env.GRIOT_SIDECAR_URL || "http://localhost:8001";
const HEALTH_TIMEOUT_MS = 5000;
const TRANSCRIBE_TIMEOUT_MS = 120000; // 2 minutes

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const GriotErrorCodes = {
  UNREACHABLE: "GRIOT_UNREACHABLE",
  HEALTH_FAILED: "GRIOT_HEALTH_FAILED",
  TRANSCRIPTION_FAILED: "GRIOT_TRANSCRIPTION_FAILED",
  TIMEOUT: "GRIOT_TIMEOUT",
  FILE_NOT_FOUND: "GRIOT_FILE_NOT_FOUND",
};

export class GriotError extends Error {
  constructor(code, message, statusCode = 503) {
    super(message);
    this.name = "GriotError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

/**
 * Check if the Griot sidecar is healthy and the model is loaded.
 *
 * @returns {Promise<object>} Health status from sidecar
 * @throws {GriotError} If sidecar is unreachable or unhealthy
 */
export async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const response = await fetch(`${GRIOT_BASE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new GriotError(
        GriotErrorCodes.HEALTH_FAILED,
        `Griot health check returned ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.model_loaded) {
      throw new GriotError(
        GriotErrorCodes.HEALTH_FAILED,
        `Griot model not loaded: ${data.model_error || "unknown error"}`
      );
    }

    return data;
  } catch (err) {
    if (err instanceof GriotError) throw err;

    throw new GriotError(
      GriotErrorCodes.UNREACHABLE,
      `Griot sidecar unreachable at ${GRIOT_BASE_URL}: ${err.message}`
    );
  }
}

// ---------------------------------------------------------------------------
// Check if sidecar is available (non-throwing)
// ---------------------------------------------------------------------------

/**
 * Returns true if the Griot sidecar is reachable and model is loaded.
 * Non-throwing — returns false on any error.
 */
export async function isAvailable() {
  try {
    await checkHealth();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Transcription via Griot
// ---------------------------------------------------------------------------

/**
 * Transcribe an audio file using the Griot Nano 1 sidecar.
 *
 * @param {string} filePath - Absolute path to the audio file
 * @returns {Promise<object>} Normalized transcription result
 *
 * @example
 * const result = await transcribeWithGriot("/path/to/lecture.mp3");
 * // {
 * //   transcript: "Today we'll discuss...",
 * //   language: "auto",
 * //   engine: "griot-nano-1",
 * //   duration_sec: 123.4,
 * //   inference_time_sec: 2.1
 * // }
 */
export async function transcribeWithGriot(filePath) {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new GriotError(
      GriotErrorCodes.FILE_NOT_FOUND,
      `Audio file not found: ${filePath}`,
      400
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      TRANSCRIBE_TIMEOUT_MS
    );

    // Build multipart form data
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append("file", blob, fileName);

    const response = await fetch(`${GRIOT_BASE_URL}/transcribe`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GriotError(
        GriotErrorCodes.TRANSCRIPTION_FAILED,
        `Griot transcription failed (${response.status}): ${errorData.detail?.message || errorData.message || "Unknown error"}`,
        response.status
      );
    }

    const data = await response.json();

    // Normalize to standard shape
    return {
      transcript: data.transcript || "",
      language: data.language || "auto",
      engine: "griot-nano-1",
      duration_sec: data.duration_sec || null,
      inference_time_sec: data.inference_time_sec || null,
    };
  } catch (err) {
    if (err instanceof GriotError) throw err;

    if (err.name === "AbortError") {
      throw new GriotError(
        GriotErrorCodes.TIMEOUT,
        `Griot transcription timed out after ${TRANSCRIBE_TIMEOUT_MS / 1000}s`
      );
    }

    throw new GriotError(
      GriotErrorCodes.UNREACHABLE,
      `Griot sidecar error: ${err.message}`
    );
  }
}
