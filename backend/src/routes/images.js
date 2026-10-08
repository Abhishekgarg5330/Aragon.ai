import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ImageModel } from '../models/Image.js';
import { queueProcessing, storage } from '../services/imageProcessor.js';
import { normalizeMime, uploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const images = await ImageModel.find()
    .sort({ createdAt: -1 })
    .select('-__v')
    .lean();
  res.json({ images });
});

router.get('/:imageId/preview', async (req, res) => {
  const doc = await ImageModel.findOne({ imageId: req.params.imageId }).lean();
  if (!doc) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const key = doc.processedStorageKey || doc.storageKey;
  const contentType = doc.processedMimeType || doc.mimeType;

  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (provider === 's3' || provider === 'gcs') {
    const url = await storage.getReadableUrl(key);
    res.redirect(url);
    return;
  }

  const buffer = await storage.getBuffer(key);
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
});

router.get('/:imageId', async (req, res) => {
  const doc = await ImageModel.findOne({ imageId: req.params.imageId }).lean();
  if (!doc) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ image: doc });
});

router.post('/', uploadMiddleware.array('photos', 20), async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    res.status(400).json({ error: 'No files uploaded. Use field name "photos".' });
    return;
  }

  const created = [];

  for (const file of files) {
    const imageId = uuidv4();
    const mimeType = normalizeMime(file);
    const storageKey = `original/${imageId}${file.originalname.includes('.') ? file.originalname.slice(file.originalname.lastIndexOf('.')) : '.jpg'}`;

    await storage.putObject(storageKey, file.buffer, mimeType);

    const doc = await ImageModel.create({
      imageId,
      originalFilename: file.originalname,
      storageKey,
      mimeType,
      fileSize: file.size,
      status: 'pending',
    });

    queueProcessing(imageId);
    created.push(doc.toObject());
  }

  res.status(202).json({ uploads: created });
});

export default router;
