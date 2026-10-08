import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import imagesRouter from './routes/images.js';
import filesRouter from './routes/files.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/images', imagesRouter);
app.use('/api/files', filesRouter);

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'File too large (max 120MB).' });
    return;
  }
  if (err.name === 'MulterError') {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  await mongoose.connect(config.mongodbUri);
  console.log('MongoDB connected');

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
