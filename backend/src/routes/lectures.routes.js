import express from 'express';
import {
  createLecture,
  getLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  appendTutorHistory,
} from '../controllers/lectures.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All lecture routes require authentication
router.use(authenticate);

router.post('/', createLecture);
router.get('/', getLectures);
router.get('/:id', getLectureById);
router.put('/:id', updateLecture);
router.delete('/:id', deleteLecture);
router.post('/:id/tutor', appendTutorHistory);

export default router;
