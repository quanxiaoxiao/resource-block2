export default {
  _id: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
  description: {
    type: 'string',
  },
  timeCreate: {
    type: 'number',
  },
  timeUpdate: {
    type: 'number',
  },
  mine: {
    type: 'string',
  },
  size: ['block.size', { type: 'number' }],
  entry: {
    type: 'string',
  },
  hash: ['block.sha256', { type: 'string' }],
  category: {
    type: 'string',
  },
};
