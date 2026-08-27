import express from 'express';
import { signup, login, logout, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
