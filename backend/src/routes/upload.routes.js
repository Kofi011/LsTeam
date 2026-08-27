import express from 'express';
import { upload, validateAudioDuration, cleanupTempFile } from '../middleware/upload.middleware.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { trialMiddleware, setTrialCookie, getTrialStateFromReq } from '../middleware/trial.middleware.js';
import { uploadRateLimiter } from '../middleware/rateLimit.middleware.js';
import { transcribeAudio, generateNotes } from '../services/ai.service.js';
import { query } from '../config/db.js';

const router = express.Router();

router.post(
  '/upload',
  uploadRateLimiter,
  optionalAuthenticate,
  trialMiddleware,
  upload.single('audio'),
  validateAudioDuration,
  async (req, res, next) => {
    try {
      const fileData = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        durationSec: req.fileDurationSec,
      };

      // 1. Call AI Pipeline to transcribe audio
      const { transcript, language, engine } = await transcribeAudio(req.file.path);

      // 2. Call AI Pipeline to generate structured study notes
      const notes = await generateNotes(transcript);

      // 3. Clean up temp uploaded audio file
      await cleanupTempFile(req.file.path);

      // If user is authenticated, auto-save to database
      if (req.user) {
        const title = notes.overview ? notes.overview.slice(0, 100) : req.file.originalname;

        const sql = `
          INSERT INTO lectures (
            user_id, title, overview, duration_sec, engine_used, language, file_name,
            transcript, key_concepts, main_arguments, important_terms, study_notes,
            key_takeaways, revision_questions, notes_markdown, tutor_history
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16::jsonb
          ) RETURNING *
        `;

        const values = [
          req.user.id,
          title,
          notes.overview || '',
          req.fileDurationSec || 0,
          engine,
          language,
          req.file.originalname,
          transcript,
          JSON.stringify(notes.key_concepts || []),
          JSON.stringify(notes.main_arguments || []),
          JSON.stringify(notes.important_terms || []),
          JSON.stringify(notes.study_notes || []),
          JSON.stringify(notes.key_takeaways || []),
          JSON.stringify(notes.revision_questions || []),
          notes.notes_markdown || '',
          JSON.stringify([]),
        ];

        const dbRes = await query(sql, values);

        return res.status(200).json({
          success: true,
          message: 'Lecture audio processed and auto-saved to your library.',
          file: fileData,
          lecture: dbRes.rows[0],
        });
      }

      // If unauthenticated, increment trial count
      const { trialsUsed } = getTrialStateFromReq(req);
      setTrialCookie(res, trialsUsed + 1);

      return res.status(200).json({
        success: true,
        message: 'Lecture audio processed successfully.',
        file: fileData,
        trialsUsed: trialsUsed + 1,
        result: {
          transcript,
          language,
          engine,
          notes,
        },
      });
    } catch (err) {
      if (req.file) {
        await cleanupTempFile(req.file.path);
      }
      next(err);
    }
  }
);

export default router;
