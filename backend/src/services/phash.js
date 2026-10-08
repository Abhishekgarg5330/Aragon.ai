import sharp from 'sharp';

/** 64-bit average hash as hex (16 chars). */
export async function computePerceptualHash(imageBuffer) {
  const raw = await sharp(imageBuffer)
    .greyscale()
    .resize(8, 8, { fit: 'fill' })
    .raw()
    .toBuffer();

  const pixels = [...raw];
  const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  let bits = '';
  for (const p of pixels) {
    bits += p >= avg ? '1' : '0';
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let dist = 0;
  for (let i = 0; i < hashA.length; i += 1) {
    const nibbleA = parseInt(hashA[i], 16);
    const nibbleB = parseInt(hashB[i], 16);
    let x = nibbleA ^ nibbleB;
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}
