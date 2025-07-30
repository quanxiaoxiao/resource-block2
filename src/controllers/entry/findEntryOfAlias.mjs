import { getValue } from '../../store/store.mjs';

export default (alias) => {
  if (!alias || alias.trim() === '') {
    return null;
  }
  const entryList = getValue('entryList');
  return entryList.find((d) => d.alias === alias);
};
