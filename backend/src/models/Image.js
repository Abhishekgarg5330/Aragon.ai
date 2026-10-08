import mongoose from 'mongoose';

const rejectionReasonSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const imageSchema = new mongoose.Schema(
  {
    imageId: { type: String, required: true, unique: true, index: true },
    originalFilename: { type: String, required: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReasons: { type: [rejectionReasonSchema], default: [] },
    width: Number,
    height: Number,
    fileSize: Number,
    perceptualHash: { type: String, index: true },
    processedStorageKey: String,
    processedMimeType: String,
  },
  { timestamps: true },
);

imageSchema.index({ status: 1, createdAt: -1 });

export const ImageModel = mongoose.model('Image', imageSchema);
