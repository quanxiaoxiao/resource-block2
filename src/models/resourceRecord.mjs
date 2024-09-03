import mongoose from 'mongoose';

const { Schema } = mongoose;

export default new Schema({
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
  dateTimeCreate: {
    type: Number,
    index: true,
  },
  dateTimeAccess: {
    type: Number,
    index: true,
  },
  dateTimeComplete: {
    type: Number,
    index: true,
  },
});
