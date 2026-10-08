import { config } from '../config.js';
import { GcsStorageProvider } from './GcsStorageProvider.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { S3StorageProvider } from './S3StorageProvider.js';

/** @returns {import('./StorageProvider.js').StorageProvider} */
export function createStorageProvider() {
  const kind = (config.storageProvider || 'local').toLowerCase();
  if (kind === 's3') {
    if (!config.aws.bucket) {
      throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');
    }
    return new S3StorageProvider(config.aws);
  }
  if (kind === 'gcs') {
    if (!config.gcs.bucket) {
      throw new Error('GCS_BUCKET is required when STORAGE_PROVIDER=gcs');
    }
    return new GcsStorageProvider(config.gcs);
  }
  return new LocalStorageProvider(config.localStoragePath);
}
