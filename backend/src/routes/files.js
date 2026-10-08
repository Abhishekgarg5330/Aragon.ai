import express from 'express';
import { createStorageProvider } from '../storage/index.js';

const router = express.Router();
const storage = createStorageProvider();

/** Local storage only: serve blobs by storage key. */
router.get('/:storageKey(*)', async (req, res) => {
  if ((process.env.STORAGE_PROVIDER || 'local').toLowerCase() !== 'local') {
    res.status(404).json({ error: 'Not available for this storage provider' });
    return;
  }
  try {
    const key = decodeURIComponent(req.params.storageKey);
    const buffer = await storage.getBuffer(key);
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
