import { Storage } from '@google-cloud/storage';
import { StorageProvider } from './StorageProvider.js';

export class GcsStorageProvider extends StorageProvider {
  /** @param {{ bucket: string, projectId?: string, keyFilename?: string }} options */
  constructor({ bucket, projectId, keyFilename }) {
    super();
    this.bucketName = bucket;
    this.storage = new Storage({
      projectId: projectId || undefined,
      keyFilename: keyFilename || undefined,
    });
  }

  #file(storageKey) {
    return this.storage.bucket(this.bucketName).file(storageKey);
  }

  async getBuffer(storageKey) {
    const [buffer] = await this.#file(storageKey).download();
    return buffer;
  }

  async putObject(storageKey, buffer, contentType) {
    await this.#file(storageKey).save(buffer, {
      contentType,
      resumable: false,
    });
    return { storageKey };
  }

  async deleteObject(storageKey) {
    await this.#file(storageKey).delete({ ignoreNotFound: true });
  }

  async getReadableUrl(storageKey, expiresInSeconds = 3600) {
    const [url] = await this.#file(storageKey).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return url;
  }
}
