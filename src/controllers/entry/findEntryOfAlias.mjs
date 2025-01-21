import { getState } from '../../store/store.mjs';

export default (alias) => {
  if (!alias || alias.trim() === '') {
    return null;
  }
  return getState().entryList.find((d) => d.alias === alias);
};
