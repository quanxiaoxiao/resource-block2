import mongoose from 'mongoose';

const { Schema } = mongoose;

const blockSchema = new Schema({
  sha256: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  dateTimeCreate: {
    type: Number,
    default: Date.now,
  },
  dateTimeUpdate: {
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

export default blockSchema;
