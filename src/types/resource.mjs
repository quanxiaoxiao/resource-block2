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
  dateTimeCreate: {
    type: 'number',
  },
  timeUpdate: {
    type: 'number',
  },
  mime: {
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
