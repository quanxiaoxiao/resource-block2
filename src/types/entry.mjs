export default {
  _id: {
    type: 'string',
  },
  name: {
    type: 'string',
  },
  size: {
    type: 'number',
  },
  alias: {
    type: 'string',
  },
  readOnly: {
    type: 'boolean',
  },
  description: {
    type: 'string',
  },
  dateTimeCreate: {
    type: 'number',
    index: 1,
  },
};
