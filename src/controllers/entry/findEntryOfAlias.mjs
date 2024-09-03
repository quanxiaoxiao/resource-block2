import store from '../../store/store.mjs';

const { getState } = store;

export default (alias) => {
  if (!alias || alias.trim() === '') {
    return null;
  }
  return getState().entryList.find((d) => d.alias === alias);
};
