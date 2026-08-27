import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { COOKIE_OPTIONS } from '../middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_lecturescribe_2026';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
};

const isValidEmail = (email) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_IN_USE',
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password with bcrypt (rounds >= 10)
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [normalizedEmail, password_hash]
    );

    const user = newUser.rows[0];
    const token = generateToken(user);

    res.cookie('auth_token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fetch user
    const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    res.cookie('auth_token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie('auth_token', COOKIE_OPTIONS);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const me = (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
};
