export default {
  _id: {
    type: 'string',
  },
  countRead: {
    type: 'number',
  },
  dateTimeCreate: {
    type: 'number',
  },
  dateTimeStore: {
    type: 'number',
  },
  dateTimeAccess: {
    type: 'number',
  },
  size: ['block.size', {
    type: 'number',
  }],
  userAgent: {
    type: 'string',
  },
  remoteAddress: {
    type: 'string',
  },
  hash: ['block.sha256', {
    type: 'string',
  }],
};
