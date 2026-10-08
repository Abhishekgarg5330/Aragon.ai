import sharp from 'sharp';

/**
 * Laplacian variance proxy via sharp — higher = sharper.
 * Reject when below threshold.
 */
export async function measureSharpness(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data;
  let sum = 0;
  let sumSq = 0;
  const n = pixels.length;
  for (let i = 0; i < n; i += 1) {
    const v = pixels[i];
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return { variance, width: info.width, height: info.height };
}
