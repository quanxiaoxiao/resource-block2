import mongoose from 'mongoose';

const { Schema } = mongoose;

export default new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  alias: {
    type: String,
    default: '',
    trim: true,
    index: true,
  },
  order: {
    type: Number,
  },
  timeCreate: {
    type: Number,
    default: Date.now,
  },
  description: {
    type: String,
    default: '',
  },
  invalid: {
    type: Boolean,
    index: true,
    default: false,
  },
  timeInvalid: {
    index: true,
    type: Date,
  },
});
