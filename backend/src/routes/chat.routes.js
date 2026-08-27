import express from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { chatRateLimiter } from '../middleware/rateLimit.middleware.js';
import { chatTutor } from '../services/ai.service.js';
import { query } from '../config/db.js';

const router = express.Router();

router.post('/chat', chatRateLimiter, optionalAuthenticate, async (req, res, next) => {
  try {
    const { message, transcript = '', history = [], lectureId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'MISSING_MESSAGE',
        message: 'A text message is required.',
      });
    }

    // Call AI Tutor service
    const { reply } = await chatTutor({ message, transcript, history });

    // If lectureId is provided and user is authenticated, save turn to DB tutor_history
    if (lectureId && req.user) {
      try {
        const fetchRes = await query('SELECT tutor_history FROM lectures WHERE id = $1 AND user_id = $2', [
          lectureId,
          req.user.id,
        ]);
        if (fetchRes.rows.length > 0) {
          const currentHistory = fetchRes.rows[0].tutor_history || [];
          const updatedHistory = [
            ...currentHistory,
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
          ];
          await query(
            'UPDATE lectures SET tutor_history = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
            [JSON.stringify(updatedHistory), lectureId, req.user.id]
          );
        }
      } catch (dbErr) {
        console.error('Failed to append tutor history:', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
