import mongoose from 'mongoose';

const { Schema } = mongoose;

export default new Schema({
  block: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Block',
    index: true,
  },
  mime: {
    type: String,
    index: true,
  },
  entry: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Entry',
    index: true,
  },
  category: {
    type: String,
    index: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  timeCreate: {
    type: Number,
    default: Date.now,
    index: true,
  },
  timeUpdate: {
    type: Number,
    default: Date.now,
    index: true,
  },
  timeAtFirstComplete: {
    type: Number,
    default: Date.now,
    index: true,
  },
  timeAccess: {
    type: Number,
    default: Date.now,
    index: true,
  },
  invalid: {
    type: Boolean,
    index: true,
    default: false,
  },
  timeInvalid: {
    type: Number,
    index: true,
  },
});
