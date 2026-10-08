/**
 * @typedef {Object} UploadResult
 * @property {string} storageKey - Provider-specific object key
 * @property {string} [url] - Optional public or signed URL
 */

/**
 * Swap implementations via STORAGE_PROVIDER without changing upload/validation code.
 * @interface
 */
export class StorageProvider {
  /** @param {string} storageKey */
  async getBuffer(storageKey) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} storageKey
   * @param {Buffer} buffer
   * @param {string} contentType
   * @returns {Promise<UploadResult>}
   */
  async putObject(storageKey, buffer, contentType) {
    throw new Error('Not implemented');
  }

  /** @param {string} storageKey */
  async deleteObject(storageKey) {
    throw new Error('Not implemented');
  }

  /** @param {string} storageKey @param {number} [expiresInSeconds] */
  async getReadableUrl(storageKey, expiresInSeconds = 3600) {
    throw new Error('Not implemented');
  }
}
