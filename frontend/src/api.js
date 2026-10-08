const BASE = '/api';

export async function fetchImages() {
  const res = await fetch(`${BASE}/images`);
  if (!res.ok) throw new Error('Failed to load images');
  const data = await res.json();
  return data.images;
}

export async function uploadPhotos(files) {
  const form = new FormData();
  for (const file of files) {
    form.append('photos', file);
  }
  const res = await fetch(`${BASE}/images`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data.uploads;
}

export function previewUrl(imageId) {
  return `${BASE}/images/${imageId}/preview`;
}
