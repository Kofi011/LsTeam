/**
 * AI Academic Tutor Module
 *
 * Provides grounded Q&A over a lecture transcript.
 * The tutor ONLY answers from the transcript content —
 * refuses questions not covered by the material.
 *
 * @module ai/tutor
 */

import Groq from "groq-sdk";

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------
let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey) {
      throw new TutorError(
        TutorErrorCodes.API_KEY_MISSING,
        "GROQ_API_KEY or LLM_API_KEY is not set."
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TUTOR_MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 2048;
const MAX_HISTORY_MESSAGES = 20; // Keep last N messages for context

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const TutorErrorCodes = {
  API_KEY_MISSING: "TUTOR_API_KEY_MISSING",
  EMPTY_MESSAGE: "TUTOR_EMPTY_MESSAGE",
  EMPTY_TRANSCRIPT: "TUTOR_EMPTY_TRANSCRIPT",
  LLM_ERROR: "TUTOR_LLM_ERROR",
  RATE_LIMITED: "TUTOR_RATE_LIMITED",
};

export class TutorError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = "TutorError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(transcript) {
  return `You are an AI Academic Tutor for a university student. Your ONLY knowledge source is the lecture transcript provided below. Follow these rules strictly:

RULES:
1. ONLY answer questions using information from the transcript below.
2. If a question is NOT covered by the transcript, politely say: "I'm sorry, but that topic isn't covered in this lecture. I can only help with material from the transcript."
3. Do NOT make up facts, examples, or information not present in the transcript.
4. Be concise, clear, and helpful — like a knowledgeable study buddy.
5. Use the conversation history to maintain context across multiple questions.
6. If the student asks you to explain something from the lecture, provide a clear explanation using only the transcript content.
7. You may rephrase or reorganize the transcript content for clarity, but do not add external knowledge.

LECTURE TRANSCRIPT:
---
${transcript}
---

Answer the student's questions based ONLY on the transcript above.`;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Chat with the AI Academic Tutor.
 *
 * @param {object} params
 * @param {string} params.message - The student's question
 * @param {string} params.transcript - The lecture transcript
 * @param {Array<object>} [params.history] - Previous conversation messages
 *   Each entry: { role: "user"|"assistant", content: "..." }
 * @returns {Promise<object>} Tutor response: { reply: string }
 *
 * @example
 * const result = await chat({
 *   message: "What is photosynthesis?",
 *   transcript: "Today we'll discuss photosynthesis...",
 *   history: []
 * });
 * // { reply: "According to the lecture, photosynthesis is..." }
 */
export async function chat({ message, transcript, history = [] }) {
  // Validate inputs
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new TutorError(
      TutorErrorCodes.EMPTY_MESSAGE,
      "Please enter a question.",
      400
    );
  }

  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    throw new TutorError(
      TutorErrorCodes.EMPTY_TRANSCRIPT,
      "No transcript available for tutoring.",
      400
    );
  }

  const client = getGroqClient();

  // Build messages array
  const messages = [
    { role: "system", content: buildSystemPrompt(transcript) },
  ];

  // Add conversation history (trimmed to last N messages)
  if (Array.isArray(history) && history.length > 0) {
    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
    for (const msg of trimmedHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: msg.content || "",
        });
      }
    }
  }

  // Add current message
  messages.push({ role: "user", content: message.trim() });

  try {
    console.log(`[tutor] Processing question: "${message.slice(0, 80)}..."`);

    const completion = await client.chat.completions.create({
      model: TUTOR_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: MAX_TOKENS,
    });

    const reply = completion.choices?.[0]?.message?.content;

    if (!reply) {
      throw new TutorError(
        TutorErrorCodes.LLM_ERROR,
        "Tutor returned empty response."
      );
    }

    console.log("[tutor] Response generated.");

    return { reply: reply.trim() };
  } catch (err) {
    if (err instanceof TutorError) throw err;

    if (err.status === 429) {
      throw new TutorError(
        TutorErrorCodes.RATE_LIMITED,
        "Tutor rate limit exceeded. Please try again in a moment.",
        429
      );
    }

    throw new TutorError(
      TutorErrorCodes.LLM_ERROR,
      `Tutor error: ${err.message}`,
      err.status || 500
    );
  }
}
