import { config } from '../config.js';
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
  return new LocalStorageProvider(config.localStoragePath);
}
