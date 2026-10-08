import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image_uploads',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  localStoragePath: process.env.LOCAL_STORAGE_PATH || './uploads',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
  },
  skipFaceDetection: process.env.SKIP_FACE_DETECTION === 'true',
  validation: {
    minWidth: Number(process.env.MIN_WIDTH) || 400,
    minHeight: Number(process.env.MIN_HEIGHT) || 400,
    minFileBytes: Number(process.env.MIN_FILE_BYTES) || 10240,
    maxSimilarityHamming: Number(process.env.MAX_SIMILARITY_HAMMING) || 8,
    minFaceAreaRatio: Number(process.env.MIN_FACE_AREA_RATIO) || 0.02,
    blurThreshold: Number(process.env.BLUR_THRESHOLD) || 100,
  },
};

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

export const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);
