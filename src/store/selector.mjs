import { isValidObjectId } from '@quanxiaoxiao/mongo';
import store from './store.mjs';

const { getState } = store;

export const selectRouteMatchList = () => {
  const state = getState();
  const { routeMatchList } = state;
  return routeMatchList;
};

export const selectEntry = (_id) => {
  if (!_id) {
    return null;
  }
  const { entryList } = getState();
  const entry = _id.toString();
  if (isValidObjectId(entry)) {
    return entryList.find((d) => d._id.toString() === entry);
  }
  return entryList.find((d) => d.alias === entry);
};
