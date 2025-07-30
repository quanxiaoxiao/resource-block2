import { getValue } from '../../store/store.mjs';

export default () => {
  const entryList = getValue('entryList');
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
