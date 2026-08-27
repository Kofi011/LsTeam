import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_lecturescribe_2026';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authenticate = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required. No auth token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const optionalAuthenticate = (req, res, next) => {
  const token = req.cookies?.auth_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token in optional auth
    }
  }
  next();
};
