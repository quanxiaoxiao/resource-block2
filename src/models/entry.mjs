import mongoose from 'mongoose';

const { Schema } = mongoose;

const entrySchema = new Schema({
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
  readOnly: {
    type: Boolean,
    default: false,
    index: true,
  },
  dateTimeCreate: {
    type: Number,
    default: Date.now,
  },
  description: {
    type: String,
    default: '',
  },
  invalidAt: {
    type: Number,
    index: true,
  },
});

export default entrySchema;
