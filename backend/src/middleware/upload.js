import multer from 'multer';
import path from 'path';
import { ALLOWED_EXT, ALLOWED_MIME } from '../config.js';

const MAX_FILE_SIZE = 120 * 1024 * 1024;

function extname(name) {
  return path.extname(name || '').toLowerCase();
}

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 20 },
  fileFilter(_req, file, cb) {
    const ext = extname(file.originalname);
    const mime = (file.mimetype || '').toLowerCase();
    const mimeOk =
      ALLOWED_MIME.has(mime) ||
      mime === 'application/octet-stream' && ALLOWED_EXT.has(ext);
    const extOk = ALLOWED_EXT.has(ext);
    if (mimeOk && extOk) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type. Only PNG, JPG, and HEIC are allowed.'));
  },
});

export function normalizeMime(file) {
  const ext = extname(file.originalname);
  if (ext === '.png') return 'image/png';
  if (ext === '.heic' || ext === '.heif') return 'image/heic';
  return 'image/jpeg';
}
