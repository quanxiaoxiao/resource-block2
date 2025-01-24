import mongoose from 'mongoose';

const { Schema } = mongoose;

const resourceSchema = new Schema({
  block: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Block',
    index: true,
  },
  record: {
    type: Schema.Types.ObjectId,
    ref: 'ResourceRecord',
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
  dateTimeCreate: {
    type: Number,
    default: Date.now,
    index: true,
  },
  dateTimeUpdate: {
    type: Number,
    default: Date.now,
    index: true,
  },
  invalid: {
    type: Boolean,
    index: true,
    default: false,
  },
  dateTimeInvalid: {
    type: Number,
  },
});

export default resourceSchema;
