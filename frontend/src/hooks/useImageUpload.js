import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchImages, uploadPhotos } from '../api.js';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);
const ALLOWED_EXT = /\.(jpe?g|png|heic|heif)$/i;

export function validateFilesClient(files) {
  const valid = [];
  const rejected = [];
  for (const file of files) {
    const typeOk =
      ALLOWED_TYPES.has(file.type) ||
      (file.type === '' && ALLOWED_EXT.test(file.name));
    if (!typeOk) {
      rejected.push({
        name: file.name,
        reason: 'Only PNG, JPG, and HEIC are allowed.',
      });
      continue;
    }
    valid.push(file);
  }
  return { valid, rejected };
}

export function useImageUpload() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [clientErrors, setClientErrors] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    const list = await fetchImages();
    setImages(list);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const hasPending = useMemo(
    () => images.some((i) => i.status === 'pending' || i.status === 'processing'),
    [images],
  );

  useEffect(() => {
    if (!hasPending) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return undefined;
    }
    pollRef.current = setInterval(() => {
      refresh().catch(() => {});
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasPending, refresh]);

  const upload = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const { valid, rejected } = validateFilesClient(files);
    setClientErrors(rejected);
    setUploadError(null);

    if (!valid.length) return;

    setUploading(true);
    try {
      await uploadPhotos(valid);
      await refresh();
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  }, [refresh]);

  const accepted = useMemo(
    () => images.filter((i) => i.status === 'accepted'),
    [images],
  );
  const rejected = useMemo(
    () => images.filter((i) => i.status === 'rejected'),
    [images],
  );
  const inProgress = useMemo(
    () => images.filter((i) => i.status === 'pending' || i.status === 'processing'),
    [images],
  );

  return {
    images,
    accepted,
    rejected,
    inProgress,
    uploading,
    clientErrors,
    uploadError,
    upload,
    refresh,
  };
}
