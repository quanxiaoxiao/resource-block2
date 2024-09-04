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
  sha256: ['block.sha256', {
    type: 'string',
  }],
};
