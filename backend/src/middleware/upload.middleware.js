import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parseFile } from 'music-metadata';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.includes(mime);

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});

export const cleanupTempFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to clean up temp file ${filePath}:`, err.message);
    }
  }
};

export const validateAudioDuration = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'NO_FILE_UPLOADED',
      message: 'No file was uploaded in the request.',
    });
  }

  try {
    const metadata = await parseFile(req.file.path);
    const duration = metadata.format.duration;

    if (!duration) {
      await cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'INVALID_AUDIO_METADATA',
        message: 'Could not determine audio duration.',
      });
    }

    if (duration > 600) {
      await cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'FILE_DURATION_EXCEEDED',
        message: `Audio duration (${Math.round(duration)}s) exceeds the maximum limit of 10 minutes (600s).`,
      });
    }

    req.fileDurationSec = Math.round(duration);
    next();
  } catch (err) {
    await cleanupTempFile(req.file.path);
    return res.status(400).json({
      success: false,
      error: 'CORRUPTED_AUDIO_FILE',
      message: 'Failed to process audio metadata. File may be corrupted or invalid.',
    });
  }
};
