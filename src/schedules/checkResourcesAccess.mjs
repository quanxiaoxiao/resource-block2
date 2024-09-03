import { Resource as ResourceModel } from '../models/index.mjs';
import store from '../store/store.mjs';

const { dispatch, getState } = store;

export default () => {
  setInterval(() => {
    const { streamOutputList } = getState();
    const remainList = [];
    const resourceTimeAccesses = {};
    const arr = [...streamOutputList].sort((a, b) => {
      if (a.timeEnd == null) {
        return 2;
      }
      if (b.timeEnd == null) {
        return -2;
      }
      if (a.timeEnd === b.timeEnd) {
        return 0;
      }
      if (a.timeEnd > b.timeEnd) {
        return -1;
      }
      return 1;
    });
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const resource = item.resource.toString();
      if (item.timeEnd == null) {
        if (resourceTimeAccesses[resource] != null) {
          delete resourceTimeAccesses[resource];
        }
        remainList.push(item);
      } else {
        if (resourceTimeAccesses[resource] == null || item.timeEnd > resourceTimeAccesses[resource]) {
          resourceTimeAccesses[resource] = item.timeEnd;
        }
      }
    }
    dispatch('streamOutputList', remainList);
    const resources = Object.keys(resourceTimeAccesses);
    if (resources.length > 0) {
      const updateList = [];
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        updateList.push({
          updateOne: {
            filter: {
              _id: resource,
            },
            update: {
              $set: {
                dateTimeAccess: resourceTimeAccesses[resource],
              },
            },
          },
        });
      }
      ResourceModel.bulkWrite(updateList)
        .then(
          () => {},
          () => {},
        );
    }
  }, 1000);
};
