import dotenv from 'dotenv';
import app from './app.js';
import { runMigrations } from './db/migrate.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Run database migrations on startup if DB is connected
    try {
      await runMigrations();
    } catch (dbErr) {
      console.warn('⚠️ Warning: Database migration on startup skipped or failed:', dbErr.message);
      console.warn('⚠️ Server will still start. Ensure PostgreSQL is running and DATABASE_URL is configured correctly.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 LectureScribe Backend Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
