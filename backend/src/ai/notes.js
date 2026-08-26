/**
 * LLM Notes Generation Module
 *
 * Takes a transcript and generates structured study notes using
 * Groq's LLM API (Llama / Qwen).
 *
 * Output fields:
 *   title, overview, study_notes, key_concepts, main_arguments,
 *   important_terms, key_takeaways, revision_questions, notes_markdown
 *
 * @module ai/notes
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
      throw new NotesError(
        NotesErrorCodes.API_KEY_MISSING,
        "GROQ_API_KEY or LLM_API_KEY is not set. Add one to your .env file."
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LLM_MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 1; // Retry once on malformed JSON
const MAX_TOKENS = 8192;

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const NotesErrorCodes = {
  API_KEY_MISSING: "NOTES_API_KEY_MISSING",
  EMPTY_TRANSCRIPT: "NOTES_EMPTY_TRANSCRIPT",
  LLM_ERROR: "NOTES_LLM_ERROR",
  MALFORMED_JSON: "NOTES_MALFORMED_JSON",
  MISSING_FIELDS: "NOTES_MISSING_FIELDS",
  RATE_LIMITED: "NOTES_RATE_LIMITED",
};

export class NotesError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = "NotesError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Required fields in the output
// ---------------------------------------------------------------------------
const REQUIRED_FIELDS = [
  "title",
  "overview",
  "study_notes",
  "key_concepts",
  "main_arguments",
  "important_terms",
  "key_takeaways",
  "revision_questions",
  "notes_markdown",
];

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an expert academic study-notes generator. Given a lecture transcript, produce structured study materials as a single valid JSON object.

RULES:
1. Output ONLY valid JSON — no markdown fences, no comments, no extra text.
2. Every field listed below MUST be present in your output.
3. Extract information ONLY from the provided transcript. Do not invent content.
4. Be thorough: capture all key ideas, but keep bullets concise.
5. The notes_markdown field should be a complete, well-formatted Markdown document.

OUTPUT SCHEMA:
{
  "title": "string — a concise, descriptive title for the lecture",
  "overview": "string — 2-3 sentence summary of the lecture",
  "study_notes": [
    {
      "heading": "string — section heading",
      "bullets": ["string — key point 1", "string — key point 2"]
    }
  ],
  "key_concepts": ["string — core concept 1", "string — core concept 2"],
  "main_arguments": ["string — main thesis or argument 1"],
  "important_terms": [
    {
      "term": "string — the term",
      "definition": "string — its definition from the lecture"
    }
  ],
  "key_takeaways": ["string — most important point 1"],
  "revision_questions": [
    {
      "question": "string — a self-test question",
      "answer": "string — the answer from the lecture"
    }
  ],
  "notes_markdown": "string — complete structured Markdown notes document"
}`;

// ---------------------------------------------------------------------------
// User prompt builder
// ---------------------------------------------------------------------------
function buildUserPrompt(transcript) {
  return `Generate comprehensive study notes from this lecture transcript:\n\n---\n\n${transcript}\n\n---\n\nRespond with ONLY the JSON object. No additional text.`;
}

/**
 * Stricter prompt used on retry when first attempt returned malformed JSON.
 */
function buildStrictUserPrompt(transcript) {
  return `IMPORTANT: Your previous response was not valid JSON. This time, output ONLY a valid JSON object with no extra text, no markdown code fences, no trailing commas, and no comments.

Generate comprehensive study notes from this lecture transcript:

---

${transcript}

---

Respond with ONLY the JSON object. Start with { and end with }. No other text.`;
}

// ---------------------------------------------------------------------------
// JSON parsing with cleanup
// ---------------------------------------------------------------------------
function parseJSON(text) {
  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Field validation
// ---------------------------------------------------------------------------
function validateFields(notes) {
  const missing = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in notes)) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new NotesError(
      NotesErrorCodes.MISSING_FIELDS,
      `Notes are missing required fields: ${missing.join(", ")}`,
      500
    );
  }

  // Type checks
  if (!Array.isArray(notes.study_notes))
    throw new NotesError(NotesErrorCodes.MISSING_FIELDS, "study_notes must be an array");
  if (!Array.isArray(notes.key_concepts))
    throw new NotesError(NotesErrorCodes.MISSING_FIELDS, "key_concepts must be an array");
  if (!Array.isArray(notes.main_arguments))
    throw new NotesError(NotesErrorCodes.MISSING_FIELDS, "main_arguments must be an array");
  if (!Array.isArray(notes.important_terms))
    throw new NotesError(NotesErrorCodes.MISSING_FIELDS, "important_terms must be an array");
  if (!Array.isArray(notes.key_takeaways))
    throw new NotesError(NotesErrorCodes.MISSING_FIELDS, "key_takeaways must be an array");
  if (!Array.isArray(notes.revision_questions))
    throw new NotesError(NotesErrorCodes.MISSING_FIELDS, "revision_questions must be an array");

  return notes;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Generate structured study notes from a transcript.
 *
 * @param {string} transcript - The lecture transcript text
 * @returns {Promise<object>} Structured notes object with all required fields
 *
 * @example
 * const notes = await generateNotes("Today we'll discuss photosynthesis...");
 * // {
 * //   title: "Introduction to Photosynthesis",
 * //   overview: "This lecture covers...",
 * //   study_notes: [{ heading: "...", bullets: [...] }],
 * //   key_concepts: ["photosynthesis", ...],
 * //   main_arguments: [...],
 * //   important_terms: [{ term: "chlorophyll", definition: "..." }],
 * //   key_takeaways: [...],
 * //   revision_questions: [{ question: "...", answer: "..." }],
 * //   notes_markdown: "# Photosynthesis\n\n..."
 * // }
 */
export async function generateNotes(transcript) {
  // Validate input
  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    throw new NotesError(
      NotesErrorCodes.EMPTY_TRANSCRIPT,
      "Cannot generate notes from an empty transcript.",
      400
    );
  }

  const client = getGroqClient();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isRetry = attempt > 0;
    const userPrompt = isRetry
      ? buildStrictUserPrompt(transcript)
      : buildUserPrompt(transcript);

    try {
      console.log(
        `[notes] Generating notes (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`
      );

      const completion = await client.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
      });

      const content = completion.choices?.[0]?.message?.content;

      if (!content) {
        throw new NotesError(
          NotesErrorCodes.LLM_ERROR,
          "LLM returned empty response"
        );
      }

      // Parse JSON
      let notes;
      try {
        notes = parseJSON(content);
      } catch (parseErr) {
        lastError = new NotesError(
          NotesErrorCodes.MALFORMED_JSON,
          `LLM returned invalid JSON: ${parseErr.message}`
        );
        console.warn(`[notes] Malformed JSON on attempt ${attempt + 1}: ${parseErr.message}`);

        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }

      // Validate required fields
      validateFields(notes);

      console.log("[notes] Notes generated successfully.");
      return notes;
    } catch (err) {
      if (err instanceof NotesError) {
        lastError = err;
        if (err.code === NotesErrorCodes.MALFORMED_JSON && attempt < MAX_RETRIES) {
          continue;
        }
        throw err;
      }

      // Rate limit
      if (err.status === 429) {
        throw new NotesError(
          NotesErrorCodes.RATE_LIMITED,
          "LLM rate limit exceeded. Please try again later.",
          429
        );
      }

      throw new NotesError(
        NotesErrorCodes.LLM_ERROR,
        `Notes generation failed: ${err.message}`,
        err.status || 500
      );
    }
  }

  throw (
    lastError ||
    new NotesError(NotesErrorCodes.LLM_ERROR, "Notes generation failed after all retries")
  );
}
