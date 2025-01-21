import { getState } from '../../store/store.mjs';

export default () => {
  const { entryList } = getState();
  return [...entryList].sort((a, b) => {
    if (a.order === b.order) {
      return 0;
    }
    if (a.order > b.order) {
      return -1;
    }
    return 1;
  });
};
