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
  timeCreate: {
    type: Number,
    index: true,
  },
  timeAccess: {
    type: Number,
    index: true,
  },
  timeAtComplete: {
    type: Number,
    index: true,
  },
});
