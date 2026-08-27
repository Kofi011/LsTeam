import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import authRoutes from './routes/auth.routes.js';
import trialRoutes from './routes/trial.routes.js';
import lecturesRoutes from './routes/lectures.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET || 'super_secret_session_key_lecturescribe_2026';

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || origin === allowedOrigin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(cookieParser(SESSION_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', trialRoutes);
app.use('/api', uploadRoutes);
app.use('/api/lectures', lecturesRoutes);
app.use('/api', chatRoutes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
