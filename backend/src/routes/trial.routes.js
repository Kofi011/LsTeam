import express from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { getTrialStateFromReq, MAX_TRIALS } from '../middleware/trial.middleware.js';

const router = express.Router();

router.get('/trial-status', optionalAuthenticate, (req, res) => {
  const isAuthenticated = Boolean(req.user);
  const { trialsUsed } = getTrialStateFromReq(req);
  const trialsRemaining = isAuthenticated ? Infinity : Math.max(0, MAX_TRIALS - trialsUsed);

  res.status(200).json({
    success: true,
    trialsRemaining,
    trialsUsed,
    maxTrials: MAX_TRIALS,
    isAuthenticated,
  });
});

export default router;
