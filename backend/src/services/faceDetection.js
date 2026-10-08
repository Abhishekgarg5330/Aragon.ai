import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';

let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = blazeface.load();
  }
  return modelPromise;
}

async function bufferToInputTensor(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = new Uint8Array(data);
  return tf.tensor3d(rgba, [info.height, info.width, 4]);
}

/**
 * @returns {Promise<{ faceCount: number, largestFaceAreaRatio: number }>}
 */
export async function analyzeFaces(imageBuffer) {
  const model = await loadModel();
  const tensor = await bufferToInputTensor(imageBuffer);
  try {
    const predictions = await model.estimateFaces(tensor, false);
    const [height, width] = tensor.shape;
    const imgArea = width * height;
    let largest = 0;
    for (const face of predictions) {
      let boxArea = 0;
      if (face.topLeft && face.bottomRight) {
        const w = Math.abs(face.bottomRight[0] - face.topLeft[0]);
        const h = Math.abs(face.bottomRight[1] - face.topLeft[1]);
        boxArea = w * h;
      } else if (Array.isArray(face.box) && face.box.length >= 4) {
        boxArea = face.box[2] * face.box[3];
      }
      if (boxArea > largest) largest = boxArea;
    }
    return {
      faceCount: predictions.length,
      largestFaceAreaRatio: imgArea > 0 ? largest / imgArea : 0,
    };
  } finally {
    tensor.dispose();
  }
}
