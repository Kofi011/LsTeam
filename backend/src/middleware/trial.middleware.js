export const TRIAL_COOKIE_NAME = 'lecture_trial_session';
export const MAX_TRIALS = 3;

export const TRIAL_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const getTrialStateFromReq = (req) => {
  const session = req.signedCookies?.[TRIAL_COOKIE_NAME];
  let trialsUsed = 0;
  if (session && typeof session.trials_used === 'number') {
    trialsUsed = session.trials_used;
  }
  return { trialsUsed };
};

export const setTrialCookie = (res, trialsUsed) => {
  res.cookie(TRIAL_COOKIE_NAME, { trials_used: trialsUsed }, TRIAL_COOKIE_OPTIONS);
};

export const trialMiddleware = (req, res, next) => {
  // Authenticated users bypass trial limit
  if (req.user) {
    return next();
  }

  const { trialsUsed } = getTrialStateFromReq(req);

  if (trialsUsed >= MAX_TRIALS) {
    return res.status(403).json({
      success: false,
      error: 'TRIAL_EXHAUSTED',
      message: 'Free trial limit (3 uploads) reached. Please sign up or log in to upload more lectures.',
      trialsRemaining: 0,
      trialsUsed: MAX_TRIALS,
      maxTrials: MAX_TRIALS,
    });
  }

  req.trialsUsed = trialsUsed;
  next();
};
