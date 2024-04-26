import mongoose from 'mongoose';

const { Schema } = mongoose;

export default new Schema({
  sha256: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  timeCreate: {
    type: Number,
    default: Date.now,
  },
  timeUpdate: {
    type: Number,
    default: Date.now,
  },
  linkCount: {
    type: Number,
    default: 1,
    index: true,
  },
  size: {
    type: Number,
  },
});
