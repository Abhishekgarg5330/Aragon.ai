import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageProvider } from './StorageProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class LocalStorageProvider extends StorageProvider {
  constructor(basePath) {
    super();
    this.basePath = path.resolve(basePath);
  }

  async ensureDir() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  filePath(storageKey) {
    const safe = storageKey.replace(/\.\./g, '').replace(/^[/\\]+/, '');
    return path.join(this.basePath, safe);
  }

  async getBuffer(storageKey) {
    return fs.readFile(this.filePath(storageKey));
  }

  async putObject(storageKey, buffer, _contentType) {
    await this.ensureDir();
    const fp = this.filePath(storageKey);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, buffer);
    return { storageKey };
  }

  async deleteObject(storageKey) {
    try {
      await fs.unlink(this.filePath(storageKey));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async getReadableUrl(storageKey) {
    return `/api/files/${encodeURIComponent(storageKey)}`;
  }
}
