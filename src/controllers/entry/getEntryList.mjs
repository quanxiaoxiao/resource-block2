import store from '../../store/store.mjs';

const { getState } = store;

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
