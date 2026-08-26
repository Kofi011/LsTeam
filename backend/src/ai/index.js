/**
 * AI Pipeline — Public API
 *
 * This barrel module exposes the three core services that the backend
 * developer imports to integrate the AI pipeline with the Express routes.
 *
 * Usage:
 *   import { transcribe, generateNotes, chat } from "./ai/index.js";
 *
 *   // 1. Transcribe audio
 *   const { transcript, language, engine } = await transcribe(filePath);
 *
 *   // 2. Generate study notes
 *   const notes = await generateNotes(transcript);
 *
 *   // 3. AI Tutor chat
 *   const { reply } = await chat({ message, transcript, history });
 *
 * @module ai
 */

// Core pipeline functions
export { transcribe } from "./router.js";
export { generateNotes } from "./notes.js";
export { chat } from "./tutor.js";

// Configuration (for backend to inspect/override)
export { AI_CONFIG } from "./config.js";

// Individual engines (for advanced use / testing)
export { transcribeWithWhisper, WhisperError, WhisperErrorCodes } from "./whisper.js";
export {
  transcribeWithGriot,
  checkHealth as checkGriotHealth,
  isAvailable as isGriotAvailable,
  GriotError,
  GriotErrorCodes,
} from "./griot-client.js";
export { NotesError, NotesErrorCodes } from "./notes.js";
export { TutorError, TutorErrorCodes } from "./tutor.js";
export { RouterError, RouterErrorCodes } from "./router.js";
