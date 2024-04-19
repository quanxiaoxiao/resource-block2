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
  hash: ['block.sha256', { type: 'string' }],
  entry: {
    type: 'string',
  },
  category: {
    type: 'string',
  },
};
