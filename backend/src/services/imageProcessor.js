import sharp from 'sharp';
import { config, ALLOWED_MIME } from '../config.js';
import { ImageModel } from '../models/Image.js';
import { createStorageProvider } from '../storage/index.js';
import { measureSharpness } from './blur.js';
import { analyzeFaces } from './faceDetection.js';
import { computePerceptualHash, hammingDistance } from './phash.js';

const storage = createStorageProvider();

function reason(code, message) {
  return { code, message };
}

export async function normalizeToJpeg(buffer, mimeType) {
  let pipeline = sharp(buffer, { failOn: 'none' });
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    pipeline = sharp(buffer).heif ? pipeline : sharp(buffer);
  }
  return pipeline
    .rotate()
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function processImageDocument(imageId) {
  const doc = await ImageModel.findOne({ imageId });
  if (!doc) return;

  doc.status = 'processing';
  await doc.save();

  const rejectionReasons = [];

  try {
    let buffer = await storage.getBuffer(doc.storageKey);
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    const mimeType = doc.mimeType;

    if (!ALLOWED_MIME.has(mimeType)) {
      rejectionReasons.push(
        reason('INVALID_FORMAT', 'Only JPG, PNG, and HEIC formats are allowed.'),
      );
    }

    if (doc.fileSize < config.validation.minFileBytes) {
      rejectionReasons.push(
        reason('FILE_TOO_SMALL', `File must be at least ${config.validation.minFileBytes} bytes.`),
      );
    }

    const width = meta.width || 0;
    const height = meta.height || 0;
    doc.width = width;
    doc.height = height;

    if (width < config.validation.minWidth || height < config.validation.minHeight) {
      rejectionReasons.push(
        reason(
          'RESOLUTION_TOO_LOW',
          `Minimum resolution is ${config.validation.minWidth}×${config.validation.minHeight}px.`,
        ),
      );
    }

    let workBuffer = buffer;
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      workBuffer = await normalizeToJpeg(buffer, mimeType);
    } else if (mimeType === 'image/png') {
      workBuffer = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
    } else {
      workBuffer = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
    }

    const phash = await computePerceptualHash(workBuffer);
    doc.perceptualHash = phash;

    const similar = await ImageModel.find({
      imageId: { $ne: imageId },
      perceptualHash: { $exists: true, $ne: null },
      status: { $in: ['accepted', 'processing', 'pending'] },
    })
      .select('perceptualHash imageId')
      .limit(200)
      .lean();

    for (const other of similar) {
      const dist = hammingDistance(phash, other.perceptualHash);
      if (dist <= config.validation.maxSimilarityHamming) {
        rejectionReasons.push(
          reason('TOO_SIMILAR', 'This photo is too similar to one you already uploaded.'),
        );
        break;
      }
    }

    const { variance } = await measureSharpness(workBuffer);
    if (variance < config.validation.blurThreshold) {
      rejectionReasons.push(reason('BLURRY', 'Image appears too blurry.'));
    }

    if (!config.skipFaceDetection) {
      try {
        const face = await analyzeFaces(workBuffer);
        if (face.faceCount === 0) {
          rejectionReasons.push(reason('NO_FACE', 'No face detected in the image.'));
        } else if (face.faceCount > 1) {
          rejectionReasons.push(reason('MULTIPLE_FACES', 'Only one face per photo is allowed.'));
        } else if (face.largestFaceAreaRatio < config.validation.minFaceAreaRatio) {
          rejectionReasons.push(reason('FACE_TOO_SMALL', 'Detected face is too small in the frame.'));
        }
      } catch (faceErr) {
        console.warn('Face detection failed:', faceErr.message);
        rejectionReasons.push(
          reason('FACE_DETECTION_FAILED', 'Could not analyze faces for this image.'),
        );
      }
    }

    const processedKey = `processed/${imageId}.jpg`;
    await storage.putObject(processedKey, workBuffer, 'image/jpeg');
    doc.processedStorageKey = processedKey;
    doc.processedMimeType = 'image/jpeg';

    if (rejectionReasons.length > 0) {
      doc.status = 'rejected';
      doc.rejectionReasons = rejectionReasons;
    } else {
      doc.status = 'accepted';
      doc.rejectionReasons = [];
    }

    await doc.save();
  } catch (err) {
    console.error('Processing failed', imageId, err);
    doc.status = 'rejected';
    doc.rejectionReasons = [
      reason('PROCESSING_ERROR', err.message || 'Failed to process image.'),
    ];
    await doc.save();
  }
}

export function queueProcessing(imageId) {
  setImmediate(() => {
    processImageDocument(imageId).catch((e) =>
      console.error('Async processing error', imageId, e),
    );
  });
}

export { storage };
