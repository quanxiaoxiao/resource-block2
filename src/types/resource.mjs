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
  info: {
    type: 'string',
  },
  dateTimeCreate: {
    type: 'number',
  },
  categories: {
    type: 'array',
    properties: ['.', { type: 'string' }],
  },
  dateTimeUpdate: {
    type: 'number',
  },
  mime: {
    type: 'string',
  },
  dateTimeAccess: ['record.dateTimeAccess', { type: 'number' }],
  size: ['block.size', { type: 'number' }],
  hash: ['block.sha256', { type: 'string' }],
  entry: {
    type: 'string',
  },
  category: {
    type: 'string',
  },
};
