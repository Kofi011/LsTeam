import multer from 'multer';
import { cleanupTempFile } from './upload.middleware.js';

export const errorHandler = async (err, req, res, next) => {
  if (req.file) {
    await cleanupTempFile(req.file.path);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'FILE_SIZE_EXCEEDED',
        message: 'File size exceeds the maximum allowed limit of 15 MB.',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'MULTER_ERROR',
      message: err.message,
    });
  }

  if (err.code === 'INVALID_FILE_TYPE' || err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Only MP3, WAV, and M4A audio files are allowed.',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server.',
  });
};
