import mongoose from 'mongoose';

const { Schema } = mongoose;

export default new Schema({
  sha256: {
    type: String,
    required: true,
    unique: true,
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
  },
  size: {
    type: Number,
  },
});
