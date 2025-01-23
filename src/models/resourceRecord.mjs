import mongoose from 'mongoose';

const { Schema } = mongoose;

const resourceRecordSchema = new Schema({
  resource: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Resource',
    index: true,
  },
  block: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Block',
    index: true,
  },
  userAgent: {
    type: String,
  },
  remoteAddress: {
    type: String,
  },
  countRead: {
    type: Number,
    default: 0,
  },
  dateTimeCreate: {
    type: Number,
    index: true,
  },
  dateTimeAccess: {
    type: Number,
    index: true,
  },
  dateTimeStore: {
    type: Number,
    index: true,
  },
  info: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
});

export default resourceRecordSchema;
